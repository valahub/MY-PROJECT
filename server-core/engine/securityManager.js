const { run } = require("../utils/exec");
const alert = require("./alert");
const fs = require("fs");
const path = require("path");

// SSL Certificates storage
const sslCertificates = {};

// Firewall rules storage
const firewallRules = [];

// Security logs
const securityLogs = [];

// IP blacklist/whitelist
const ipBlacklist = [];
const ipWhitelist = [];

// Rate limiting storage
const rateLimits = {};

// SSL Management
async function issueSSL(domain, email) {
  try {
    // Check if domain points to server
    const domainIP = await run(`dig +short ${domain}`);
    const serverIP = await run(`curl -s ifconfig.me`);
    
    if (domainIP.trim() !== serverIP.trim()) {
      throw new Error("Domain does not point to this server IP");
    }
    
    // Issue SSL with certbot
    await run(`certbot --nginx -d ${domain} --non-interactive --agree-tos --email ${email}`);
    
    sslCertificates[domain] = {
      domain,
      email,
      issuedAt: new Date().toISOString(),
      status: "active",
      autoRenew: true
    };
    
    logSecurityEvent("ssl_issued", `SSL issued for ${domain}`);
    alert.info(`SSL issued for: ${domain}`);
    return sslCertificates[domain];
  } catch (err) {
    logSecurityEvent("ssl_error", `SSL issue failed for ${domain}: ${err}`);
    alert.warning(`Failed to issue SSL for ${domain}: ${err}`);
    throw err;
  }
}

async function renewSSL(domain) {
  try {
    await run(`certbot renew --cert-name ${domain} --non-interactive`);
    
    if (sslCertificates[domain]) {
      sslCertificates[domain].renewedAt = new Date().toISOString();
    }
    
    logSecurityEvent("ssl_renewed", `SSL renewed for ${domain}`);
    alert.info(`SSL renewed for: ${domain}`);
    return true;
  } catch (err) {
    logSecurityEvent("ssl_error", `SSL renew failed for ${domain}: ${err}`);
    alert.warning(`Failed to renew SSL for ${domain}: ${err}`);
    throw err;
  }
}

async function revokeSSL(domain) {
  try {
    await run(`certbot revoke --cert-path /etc/letsencrypt/live/${domain}/cert.pem --non-interactive`);
    await run(`certbot delete --cert-name ${domain} --non-interactive`);
    
    delete sslCertificates[domain];
    
    logSecurityEvent("ssl_revoked", `SSL revoked for ${domain}`);
    alert.warning(`SSL revoked for: ${domain}`);
    return true;
  } catch (err) {
    logSecurityEvent("ssl_error", `SSL revoke failed for ${domain}: ${err}`);
    alert.warning(`Failed to revoke SSL for ${domain}: ${err}`);
    throw err;
  }
}

async function getSSLStatus(domain) {
  try {
    const certPath = `/etc/letsencrypt/live/${domain}/cert.pem`;
    
    if (!fs.existsSync(certPath)) {
      return {
        domain,
        status: "not_issued",
        daysLeft: 0
      };
    }
    
    const expiryDate = await run(`openssl x509 -enddate -noout -in ${certPath} | cut -d= -f2`);
    const expiry = new Date(expiryDate.trim());
    const now = new Date();
    const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    
    let status = "active";
    if (daysLeft <= 0) {
      status = "expired";
    } else if (daysLeft <= 7) {
      status = "expiring_soon";
      alert.critical(`SSL expiring soon for ${domain}: ${daysLeft} days left`);
    }
    
    return {
      domain,
      status,
      daysLeft,
      expiryDate: expiry.toISOString()
    };
  } catch (err) {
    return {
      domain,
      status: "error",
      daysLeft: 0,
      error: err.message
    };
  }
}

async function forceHTTPS(domain, enable) {
  try {
    const nginxConfigPath = `/etc/nginx/sites-available/${domain}.conf`;
    
    if (!fs.existsSync(nginxConfigPath)) {
      throw new Error("Nginx config not found for domain");
    }
    
    let config = fs.readFileSync(nginxConfigPath, "utf8");
    
    if (enable) {
      // Add HTTP to HTTPS redirect
      if (!config.includes("return 301 https")) {
        const redirectBlock = `
server {
    listen 80;
    server_name ${domain};
    return 301 https://$server_name$request_uri;
}
`;
        config = redirectBlock + config;
      }
    } else {
      // Remove HTTP to HTTPS redirect
      config = config.replace(/server\s*\{[^}]*listen\s*80[^}]*return\s*301[^}]*\}/g, "");
    }
    
    fs.writeFileSync(nginxConfigPath, config);
    await run("nginx -t");
    await run("systemctl reload nginx");
    
    logSecurityEvent("https_redirect", `HTTPS redirect ${enable ? 'enabled' : 'disabled'} for ${domain}`);
    alert.info(`HTTPS redirect ${enable ? 'enabled' : 'disabled'} for: ${domain}`);
    return true;
  } catch (err) {
    logSecurityEvent("https_error", `HTTPS redirect failed for ${domain}: ${err}`);
    alert.warning(`Failed to toggle HTTPS redirect for ${domain}: ${err}`);
    throw err;
  }
}

// Firewall Engine
async function addFirewallRule(action, port, protocol = "tcp", sourceIP = "any") {
  try {
    // Validate IP
    if (sourceIP !== "any" && !isValidIP(sourceIP)) {
      throw new Error("Invalid IP address");
    }
    
    // Check port conflict
    const existingRule = firewallRules.find(r => r.port === port && r.protocol === protocol);
    if (existingRule) {
      throw new Error("Rule already exists for this port");
    }
    
    if (action === "allow") {
      await run(`ufw allow ${protocol}/${port}`);
      if (sourceIP !== "any") {
        await run(`ufw allow from ${sourceIP} to any port ${port} proto ${protocol}`);
      }
    } else if (action === "deny") {
      await run(`ufw deny ${protocol}/${port}`);
      if (sourceIP !== "any") {
        await run(`ufw deny from ${sourceIP} to any port ${port} proto ${protocol}`);
      }
    }
    
    const rule = {
      id: Date.now(),
      action,
      port,
      protocol,
      sourceIP,
      enabled: true,
      createdAt: new Date().toISOString()
    };
    
    firewallRules.push(rule);
    
    logSecurityEvent("firewall_rule_added", `Firewall rule added: ${action} ${protocol}/${port} from ${sourceIP}`);
    alert.info(`Firewall rule added: ${action} ${protocol}/${port}`);
    return rule;
  } catch (err) {
    logSecurityEvent("firewall_error", `Firewall rule add failed: ${err}`);
    alert.warning(`Failed to add firewall rule: ${err}`);
    throw err;
  }
}

async function deleteFirewallRule(ruleId) {
  try {
    const ruleIndex = firewallRules.findIndex(r => r.id === ruleId);
    if (ruleIndex === -1) {
      throw new Error("Rule not found");
    }
    
    const rule = firewallRules[ruleIndex];
    
    if (rule.action === "allow") {
      await run(`ufw delete allow ${rule.protocol}/${rule.port}`);
    } else if (rule.action === "deny") {
      await run(`ufw delete deny ${rule.protocol}/${rule.port}`);
    }
    
    firewallRules.splice(ruleIndex, 1);
    
    logSecurityEvent("firewall_rule_deleted", `Firewall rule deleted: ${rule.action} ${rule.protocol}/${rule.port}`);
    alert.info(`Firewall rule deleted`);
    return true;
  } catch (err) {
    logSecurityEvent("firewall_error", `Firewall rule delete failed: ${err}`);
    alert.warning(`Failed to delete firewall rule: ${err}`);
    throw err;
  }
}

async function toggleFirewallRule(ruleId, enabled) {
  try {
    const rule = firewallRules.find(r => r.id === ruleId);
    if (!rule) {
      throw new Error("Rule not found");
    }
    
    rule.enabled = enabled;
    
    if (enabled) {
      if (rule.action === "allow") {
        await run(`ufw allow ${rule.protocol}/${rule.port}`);
      } else {
        await run(`ufw deny ${rule.protocol}/${rule.port}`);
      }
    } else {
      if (rule.action === "allow") {
        await run(`ufw delete allow ${rule.protocol}/${rule.port}`);
      } else {
        await run(`ufw delete deny ${rule.protocol}/${rule.port}`);
      }
    }
    
    logSecurityEvent("firewall_rule_toggled", `Firewall rule ${enabled ? 'enabled' : 'disabled'}: ${rule.action} ${rule.protocol}/${rule.port}`);
    alert.info(`Firewall rule ${enabled ? 'enabled' : 'disabled'}`);
    return rule;
  } catch (err) {
    logSecurityEvent("firewall_error", `Firewall rule toggle failed: ${err}`);
    alert.warning(`Failed to toggle firewall rule: ${err}`);
    throw err;
  }
}

async function getFirewallRules() {
  try {
    const ufwStatus = await run("ufw status numbered");
    return {
      rules: firewallRules,
      ufwStatus: ufwStatus
    };
  } catch (err) {
    return {
      rules: firewallRules,
      ufwStatus: "Error getting status"
    };
  }
}

// Security Hardening
async function enableFail2Ban() {
  try {
    await run("systemctl enable fail2ban");
    await run("systemctl start fail2ban");
    
    logSecurityEvent("fail2ban_enabled", "Fail2Ban enabled and started");
    alert.info("Fail2Ban enabled");
    return true;
  } catch (err) {
    logSecurityEvent("fail2ban_error", `Fail2Ban enable failed: ${err}`);
    alert.warning(`Failed to enable Fail2Ban: ${err}`);
    throw err;
  }
}

async function disableRootLogin() {
  try {
    const sshdConfig = "/etc/ssh/sshd_config";
    let config = fs.readFileSync(sshdConfig, "utf8");
    
    config = config.replace(/#?PermitRootLogin .*/, "PermitRootLogin no");
    
    fs.writeFileSync(sshdConfig, config);
    await run("systemctl restart sshd");
    
    logSecurityEvent("ssh_hardened", "Root login disabled");
    alert.info("Root login disabled");
    return true;
  } catch (err) {
    logSecurityEvent("ssh_error", `SSH hardening failed: ${err}`);
    alert.warning(`Failed to disable root login: ${err}`);
    throw err;
  }
}

async function changeSSHPort(port) {
  try {
    if (port < 1 || port > 65535) {
      throw new Error("Invalid port number");
    }
    
    const sshdConfig = "/etc/ssh/sshd_config";
    let config = fs.readFileSync(sshdConfig, "utf8");
    
    config = config.replace(/#?Port .*/, `Port ${port}`);
    
    fs.writeFileSync(sshdConfig, config);
    await run("systemctl restart sshd");
    
    // Update firewall
    await run(`ufw allow ${port}/tcp`);
    
    logSecurityEvent("ssh_port_changed", `SSH port changed to ${port}`);
    alert.info(`SSH port changed to: ${port}`);
    return true;
  } catch (err) {
    logSecurityEvent("ssh_error", `SSH port change failed: ${err}`);
    alert.warning(`Failed to change SSH port: ${err}`);
    throw err;
  }
}

// DDOS / Rate Limit
async function setRateLimit(ip, requestsPerMinute = 60) {
  try {
    if (!isValidIP(ip)) {
      throw new Error("Invalid IP address");
    }
    
    rateLimits[ip] = {
      requestsPerMinute,
      requests: [],
      blocked: false
    };
    
    // Add nginx rate limit rule
    const rateLimitConfig = `
limit_req_zone $binary_remote_addr zone=${ip.replace(/\./g, "_")}:10m rate=${requestsPerMinute}r/m;
`;
    
    const nginxConfig = "/etc/nginx/conf.d/rate-limit.conf";
    if (fs.existsSync(nginxConfig)) {
      let config = fs.readFileSync(nginxConfig, "utf8");
      if (!config.includes(ip.replace(/\./g, "_"))) {
        config += rateLimitConfig;
        fs.writeFileSync(nginxConfig, config);
      }
    } else {
      fs.writeFileSync(nginxConfig, rateLimitConfig);
    }
    
    await run("nginx -t");
    await run("systemctl reload nginx");
    
    logSecurityEvent("rate_limit_set", `Rate limit set for ${ip}: ${requestsPerMinute}/min`);
    alert.info(`Rate limit set for ${ip}: ${requestsPerMinute}/min`);
    return true;
  } catch (err) {
    logSecurityEvent("rate_limit_error", `Rate limit set failed: ${err}`);
    alert.warning(`Failed to set rate limit: ${err}`);
    throw err;
  }
}

async function blockSuspiciousIP(ip) {
  try {
    if (!isValidIP(ip)) {
      throw new Error("Invalid IP address");
    }
    
    await run(`ufw deny from ${ip}`);
    await run(`iptables -A INPUT -s ${ip} -j DROP`);
    
    ipBlacklist.push({
      ip,
      blockedAt: new Date().toISOString(),
      reason: "suspicious_activity"
    });
    
    logSecurityEvent("ip_blocked", `Suspicious IP blocked: ${ip}`);
    alert.high(`Suspicious IP blocked: ${ip}`);
    return true;
  } catch (err) {
    logSecurityEvent("ip_block_error", `IP block failed: ${err}`);
    alert.warning(`Failed to block IP: ${err}`);
    throw err;
  }
}

// IP Blacklist/Whitelist
async function addToBlacklist(ip, reason = "manual") {
  try {
    if (!isValidIP(ip)) {
      throw new Error("Invalid IP address");
    }
    
    await run(`ufw deny from ${ip}`);
    
    ipBlacklist.push({
      ip,
      blockedAt: new Date().toISOString(),
      reason
    });
    
    logSecurityEvent("blacklist_added", `IP added to blacklist: ${ip}`);
    alert.info(`IP added to blacklist: ${ip}`);
    return true;
  } catch (err) {
    logSecurityEvent("blacklist_error", `Blacklist add failed: ${err}`);
    alert.warning(`Failed to add to blacklist: ${err}`);
    throw err;
  }
}

async function addToWhitelist(ip) {
  try {
    if (!isValidIP(ip)) {
      throw new Error("Invalid IP address");
    }
    
    await run(`ufw allow from ${ip}`);
    
    ipWhitelist.push({
      ip,
      addedAt: new Date().toISOString()
    });
    
    logSecurityEvent("whitelist_added", `IP added to whitelist: ${ip}`);
    alert.info(`IP added to whitelist: ${ip}`);
    return true;
  } catch (err) {
    logSecurityEvent("whitelist_error", `Whitelist add failed: ${err}`);
    alert.warning(`Failed to add to whitelist: ${err}`);
    throw err;
  }
}

async function removeFromBlacklist(ip) {
  try {
    await run(`ufw delete deny from ${ip}`);
    
    const index = ipBlacklist.findIndex(i => i.ip === ip);
    if (index !== -1) {
      ipBlacklist.splice(index, 1);
    }
    
    logSecurityEvent("blacklist_removed", `IP removed from blacklist: ${ip}`);
    alert.info(`IP removed from blacklist: ${ip}`);
    return true;
  } catch (err) {
    logSecurityEvent("blacklist_error", `Blacklist remove failed: ${err}`);
    alert.warning(`Failed to remove from blacklist: ${err}`);
    throw err;
  }
}

// Port Security
async function getOpenPorts() {
  try {
    const openPorts = await run("netstat -tuln | grep LISTEN | awk '{print $4}' | awk -F: '{print $2}' | sort -u");
    return openPorts.split('\n').filter(p => p.trim()).map(p => parseInt(p.trim()));
  } catch (err) {
    return [];
  }
}

async function closePort(port) {
  try {
    await run(`ufw deny ${port}/tcp`);
    await run(`ufw deny ${port}/udp`);
    
    logSecurityEvent("port_closed", `Port closed: ${port}`);
    alert.info(`Port closed: ${port}`);
    return true;
  } catch (err) {
    logSecurityEvent("port_error", `Port close failed: ${err}`);
    alert.warning(`Failed to close port: ${err}`);
    throw err;
  }
}

async function openPort(port) {
  try {
    await run(`ufw allow ${port}/tcp`);
    
    logSecurityEvent("port_opened", `Port opened: ${port}`);
    alert.info(`Port opened: ${port}`);
    return true;
  } catch (err) {
    logSecurityEvent("port_error", `Port open failed: ${err}`);
    alert.warning(`Failed to open port: ${err}`);
    throw err;
  }
}

// Security Logging
function logSecurityEvent(type, message) {
  securityLogs.push({
    type,
    message,
    timestamp: new Date().toISOString()
  });
  
  // Keep only last 1000 logs
  if (securityLogs.length > 1000) {
    securityLogs.shift();
  }
}

async function getSecurityLogs(limit = 100) {
  return securityLogs.slice(-limit).reverse();
}

// Auto Alert System
async function checkSSLExpiry() {
  for (const domain of Object.keys(sslCertificates)) {
    const status = await getSSLStatus(domain);
    if (status.daysLeft <= 7 && status.daysLeft > 0) {
      alert.critical(`SSL expiring soon for ${domain}: ${status.daysLeft} days left`);
    } else if (status.daysLeft <= 0) {
      alert.critical(`SSL expired for ${domain}`);
    }
  }
}

async function checkFailedLogins() {
  try {
    const failedLogins = await run("grep 'Failed password' /var/log/auth.log | tail -10");
    const failedCount = failedLogins.split('\n').filter(l => l.trim()).length;
    
    if (failedCount > 5) {
      alert.critical(`High number of failed login attempts: ${failedCount}`);
    }
  } catch (err) {
    // Log file might not exist
  }
}

async function checkUnusualTraffic() {
  try {
    const connections = await run("netstat -an | grep ESTABLISHED | wc -l");
    const connCount = parseInt(connections.trim());
    
    if (connCount > 1000) {
      alert.critical(`Unusual traffic detected: ${connCount} connections`);
    }
  } catch (err) {
    // Command might fail
  }
}

// Helper functions
function isValidIP(ip) {
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipRegex.test(ip);
}

// Exports
exports.issueSSL = issueSSL;
exports.renewSSL = renewSSL;
exports.revokeSSL = revokeSSL;
exports.getSSLStatus = getSSLStatus;
exports.forceHTTPS = forceHTTPS;
exports.addFirewallRule = addFirewallRule;
exports.deleteFirewallRule = deleteFirewallRule;
exports.toggleFirewallRule = toggleFirewallRule;
exports.getFirewallRules = getFirewallRules;
exports.enableFail2Ban = enableFail2Ban;
exports.disableRootLogin = disableRootLogin;
exports.changeSSHPort = changeSSHPort;
exports.setRateLimit = setRateLimit;
exports.blockSuspiciousIP = blockSuspiciousIP;
exports.addToBlacklist = addToBlacklist;
exports.addToWhitelist = addToWhitelist;
exports.removeFromBlacklist = removeFromBlacklist;
exports.getOpenPorts = getOpenPorts;
exports.closePort = closePort;
exports.openPort = openPort;
exports.getSecurityLogs = getSecurityLogs;
exports.checkSSLExpiry = checkSSLExpiry;
exports.checkFailedLogins = checkFailedLogins;
exports.checkUnusualTraffic = checkUnusualTraffic;
exports.getIPBlacklist = () => ipBlacklist;
exports.getIPWhitelist = () => ipWhitelist;
exports.getSSLCertificates = () => sslCertificates;
