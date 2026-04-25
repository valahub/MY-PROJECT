const { run } = require("../utils/exec");
const alert = require("./alert");
const fs = require("fs");
const path = require("path");

// Domains storage
const domains = {};

// DNS records storage
const dnsRecords = {};

// Domain logs
const domainLogs = [];

// Rate limiting
const domainCreationRate = {};

// Validate domain format
function validateDomain(domain) {
  const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
  
  if (!domainRegex.test(domain)) {
    throw new Error("Invalid domain format");
  }
  
  // Block wildcard abuse
  if (domain.startsWith("*.")) {
    throw new Error("Wildcard domains are not allowed");
  }
  
  // Check for duplicates
  if (domains[domain]) {
    throw new Error("Domain already exists");
  }
  
  return true;
}

// Add Domain
async function addDomain(domainName, rootPath, server = "srv-prod-01", sslEnabled = false) {
  try {
    validateDomain(domainName);
    
    // Rate limiting
    const now = Date.now();
    if (domainCreationRate[domainName] && now - domainCreationRate[domainName] < 60000) {
      throw new Error("Rate limit exceeded for this domain");
    }
    domainCreationRate[domainName] = now;
    
    // Validate root path
    if (!rootPath.startsWith("/var/www/")) {
      throw new Error("Root path must be under /var/www/");
    }
    
    // Create directory
    await run(`mkdir -p ${rootPath}`);
    await run(`chown -R www-data:www-data ${rootPath}`);
    await run(`chmod -R 755 ${rootPath}`);
    
    // Create nginx config
    const nginxConfig = `
server {
    listen 80;
    server_name ${domainName};
    root ${rootPath};
    index index.php index.html index.htm;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \\.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
    }

    location ~ /\\.ht {
        deny all;
    }
}
`;
    
    const configPath = `/etc/nginx/sites-available/${domainName}.conf`;
    fs.writeFileSync(configPath, nginxConfig);
    await run(`ln -sf ${configPath} /etc/nginx/sites-enabled/${domainName}.conf`);
    await run("nginx -t");
    await run("systemctl reload nginx");
    
    // Store domain info
    domains[domainName] = {
      name: domainName,
      rootPath,
      server,
      sslEnabled,
      sslStatus: sslEnabled ? "pending" : "none",
      status: "active",
      createdAt: new Date().toISOString(),
      ip: await run("curl -s ifconfig.me").trim()
    };
    
    // Initialize DNS records
    dnsRecords[domainName] = {
      A: await run("curl -s ifconfig.me").trim(),
      CNAME: "",
      TXT: "",
      MX: `mail.${domainName}`
    };
    
    // Issue SSL if enabled
    if (sslEnabled) {
      await issueSSL(domainName);
    }
    
    logDomainEvent("domain_created", `Domain created: ${domainName}`);
    alert.info(`Domain created: ${domainName}`);
    
    return domains[domainName];
  } catch (err) {
    logDomainEvent("domain_error", `Domain creation failed for ${domainName}: ${err}`);
    alert.warning(`Failed to create domain: ${err}`);
    throw err;
  }
}

// Get Domains
async function getDomains() {
  try {
    const domainList = [];
    
    for (const domainName of Object.keys(domains)) {
      const domain = domains[domainName];
      const status = await getDomainStatus(domainName);
      
      domainList.push({
        ...domain,
        status: status.overall,
        sslStatus: domain.sslStatus,
        dns: dnsRecords[domainName] || {}
      });
    }
    
    return domainList;
  } catch (err) {
    alert.warning(`Failed to get domains: ${err}`);
    return [];
  }
}

// Get Domain Status
async function getDomainStatus(domainName) {
  try {
    if (!domains[domainName]) {
      throw new Error("Domain not found");
    }
    
    const domain = domains[domainName];
    const status = {
      dns: false,
      http: false,
      nginx: false,
      overall: "offline"
    };
    
    // Check DNS resolve
    try {
      const dnsIP = await run(`dig +short ${domainName}`);
      if (dnsIP.trim() === domain.ip) {
        status.dns = true;
      }
    } catch (err) {
      // DNS might not be configured
    }
    
    // Check HTTP response
    try {
      const httpStatus = await run(`curl -s -o /dev/null -w "%{http_code}" http://${domainName}`);
      if (httpStatus.trim() === "200" || httpStatus.trim() === "301" || httpStatus.trim() === "302") {
        status.http = true;
      }
    } catch (err) {
      // HTTP might not be responding
    }
    
    // Check nginx config
    try {
      const configPath = `/etc/nginx/sites-enabled/${domainName}.conf`;
      if (fs.existsSync(configPath)) {
        status.nginx = true;
      }
    } catch (err) {
      // Config might not exist
    }
    
    // Determine overall status
    if (status.dns && status.http && status.nginx) {
      status.overall = "online";
    } else if (status.nginx && !status.dns) {
      status.overall = "misconfigured";
    } else if (domain.status === "suspended") {
      status.overall = "suspended";
    }
    
    return status;
  } catch (err) {
    return {
      dns: false,
      http: false,
      nginx: false,
      overall: "error"
    };
  }
}

// Get DNS Records
async function getDNSRecords(domainName) {
  try {
    if (!dnsRecords[domainName]) {
      throw new Error("DNS records not found for domain");
    }
    
    return dnsRecords[domainName];
  } catch (err) {
    alert.warning(`Failed to get DNS records: ${err}`);
    throw err;
  }
}

// Update DNS Records
async function updateDNSRecords(domainName, records) {
  try {
    if (!domains[domainName]) {
      throw new Error("Domain not found");
    }
    
    dnsRecords[domainName] = {
      ...dnsRecords[domainName],
      ...records
    };
    
    // Apply DNS changes (this would typically update a DNS server)
    // For now, we just log and alert
    logDomainEvent("dns_updated", `DNS records updated for ${domainName}`);
    alert.info(`DNS records updated for ${domainName}`);
    
    return dnsRecords[domainName];
  } catch (err) {
    logDomainEvent("dns_error", `DNS update failed for ${domainName}: ${err}`);
    alert.warning(`Failed to update DNS records: ${err}`);
    throw err;
  }
}

// Issue SSL
async function issueSSL(domainName) {
  try {
    if (!domains[domainName]) {
      throw new Error("Domain not found");
    }
    
    const domain = domains[domainName];
    
    // Check if domain points to server
    const domainIP = await run(`dig +short ${domainName}`);
    const serverIP = await run("curl -s ifconfig.me");
    
    if (domainIP.trim() !== serverIP.trim()) {
      throw new Error("Domain does not point to this server IP");
    }
    
    // Issue SSL with certbot
    await run(`certbot --nginx -d ${domainName} --non-interactive --agree-tos --email admin@${domainName}`);
    
    // Update SSL status
    domain.sslEnabled = true;
    domain.sslStatus = "active";
    domain.sslIssuedAt = new Date().toISOString();
    domain.sslExpiry = await getSSLExpiry(domainName);
    
    logDomainEvent("ssl_issued", `SSL issued for ${domainName}`);
    alert.info(`SSL issued for ${domainName}`);
    
    return domain;
  } catch (err) {
    logDomainEvent("ssl_error", `SSL issue failed for ${domainName}: ${err}`);
    alert.warning(`Failed to issue SSL: ${err}`);
    throw err;
  }
}

// Get SSL Expiry
async function getSSLExpiry(domainName) {
  try {
    const certPath = `/etc/letsencrypt/live/${domainName}/cert.pem`;
    
    if (!fs.existsSync(certPath)) {
      return null;
    }
    
    const expiryDate = await run(`openssl x509 -enddate -noout -in ${certPath} | cut -d= -f2`);
    return expiryDate.trim();
  } catch (err) {
    return null;
  }
}

// Check SSL Status
async function checkSSLStatus(domainName) {
  try {
    if (!domains[domainName]) {
      throw new Error("Domain not found");
    }
    
    const domain = domains[domainName];
    
    if (!domain.sslEnabled) {
      return { status: "none", daysLeft: null };
    }
    
    const expiry = await getSSLExpiry(domainName);
    if (!expiry) {
      return { status: "error", daysLeft: null };
    }
    
    const expiryDate = new Date(expiry);
    const now = new Date();
    const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
    
    let status = "active";
    if (daysLeft <= 0) {
      status = "expired";
      alert.critical(`SSL expired for ${domainName}`);
    } else if (daysLeft <= 7) {
      status = "expiring";
      alert.critical(`SSL expiring soon for ${domainName}: ${daysLeft} days left`);
    }
    
    domain.sslStatus = status;
    domain.sslExpiry = expiry;
    
    return { status, daysLeft, expiry };
  } catch (err) {
    return { status: "error", daysLeft: null };
  }
}

// Suspend Domain
async function suspendDomain(domainName) {
  try {
    if (!domains[domainName]) {
      throw new Error("Domain not found");
    }
    
    const domain = domains[domainName];
    
    // Disable nginx config
    const configPath = `/etc/nginx/sites-enabled/${domainName}.conf`;
    if (fs.existsSync(configPath)) {
      await run(`mv ${configPath} ${configPath}.disabled`);
      await run("systemctl reload nginx");
    }
    
    domain.status = "suspended";
    
    logDomainEvent("domain_suspended", `Domain suspended: ${domainName}`);
    alert.warning(`Domain suspended: ${domainName}`);
    
    return domain;
  } catch (err) {
    logDomainEvent("domain_error", `Domain suspension failed for ${domainName}: ${err}`);
    alert.warning(`Failed to suspend domain: ${err}`);
    throw err;
  }
}

// Activate Domain
async function activateDomain(domainName) {
  try {
    if (!domains[domainName]) {
      throw new Error("Domain not found");
    }
    
    const domain = domains[domainName];
    
    // Enable nginx config
    const configPath = `/etc/nginx/sites-available/${domainName}.conf`;
    const disabledPath = `/etc/nginx/sites-enabled/${domainName}.conf.disabled`;
    
    if (fs.existsSync(disabledPath)) {
      await run(`mv ${disabledPath} /etc/nginx/sites-enabled/${domainName}.conf`);
    } else if (fs.existsSync(configPath)) {
      await run(`ln -sf ${configPath} /etc/nginx/sites-enabled/${domainName}.conf`);
    }
    
    await run("nginx -t");
    await run("systemctl reload nginx");
    
    domain.status = "active";
    
    logDomainEvent("domain_activated", `Domain activated: ${domainName}`);
    alert.info(`Domain activated: ${domainName}`);
    
    return domain;
  } catch (err) {
    logDomainEvent("domain_error", `Domain activation failed for ${domainName}: ${err}`);
    alert.warning(`Failed to activate domain: ${err}`);
    throw err;
  }
}

// Delete Domain
async function deleteDomain(domainName) {
  try {
    if (!domains[domainName]) {
      throw new Error("Domain not found");
    }
    
    const domain = domains[domainName];
    
    // Remove nginx config
    const configPath = `/etc/nginx/sites-available/${domainName}.conf`;
    const enabledPath = `/etc/nginx/sites-enabled/${domainName}.conf`;
    const disabledPath = `/etc/nginx/sites-enabled/${domainName}.conf.disabled`;
    
    if (fs.existsSync(configPath)) {
      await run(`rm -f ${configPath}`);
    }
    if (fs.existsSync(enabledPath)) {
      await run(`rm -f ${enabledPath}`);
    }
    if (fs.existsSync(disabledPath)) {
      await run(`rm -f ${disabledPath}`);
    }
    
    // Revoke SSL if exists
    if (domain.sslEnabled) {
      try {
        await run(`certbot delete --cert-name ${domainName} --non-interactive`);
      } catch (err) {
        // SSL might not exist
      }
    }
    
    await run("nginx -t");
    await run("systemctl reload nginx");
    
    // Remove from storage
    delete domains[domainName];
    delete dnsRecords[domainName];
    
    logDomainEvent("domain_deleted", `Domain deleted: ${domainName}`);
    alert.warning(`Domain deleted: ${domainName}`);
    
    return true;
  } catch (err) {
    logDomainEvent("domain_error", `Domain deletion failed for ${domainName}: ${err}`);
    alert.warning(`Failed to delete domain: ${err}`);
    throw err;
  }
}

// Auto Heal System
async function autoHealDomains() {
  try {
    for (const domainName of Object.keys(domains)) {
      const domain = domains[domainName];
      
      // Check SSL expiry and auto renew
      if (domain.sslEnabled) {
        const sslStatus = await checkSSLStatus(domainName);
        if (sslStatus.status === "expiring" || sslStatus.status === "expired") {
          try {
            await run(`certbot renew --cert-name ${domainName} --non-interactive`);
            logDomainEvent("ssl_renewed", `SSL auto-renewed for ${domainName}`);
            alert.info(`SSL auto-renewed for ${domainName}`);
          } catch (err) {
            logDomainEvent("ssl_error", `SSL auto-renew failed for ${domainName}: ${err}`);
          }
        }
      }
      
      // Check DNS mismatch
      const status = await getDomainStatus(domainName);
      if (status.overall === "misconfigured") {
        alert.critical(`DNS mismatch detected for ${domainName}`);
      }
      
      // Check nginx and reload if needed
      if (!status.nginx && domain.status === "active") {
        try {
          const configPath = `/etc/nginx/sites-available/${domainName}.conf`;
          if (fs.existsSync(configPath)) {
            await run(`ln -sf ${configPath} /etc/nginx/sites-enabled/${domainName}.conf`);
            await run("nginx -t");
            await run("systemctl reload nginx");
            logDomainEvent("nginx_reloaded", `Nginx reloaded for ${domainName}`);
          }
        } catch (err) {
          logDomainEvent("nginx_error", `Nginx reload failed for ${domainName}: ${err}`);
        }
      }
    }
  } catch (err) {
    alert.warning(`Auto heal failed: ${err}`);
  }
}

// Logging
function logDomainEvent(type, message) {
  domainLogs.push({
    type,
    message,
    timestamp: new Date().toISOString()
  });
  
  if (domainLogs.length > 1000) {
    domainLogs.shift();
  }
}

async function getDomainLogs(limit = 100) {
  return domainLogs.slice(-limit).reverse();
}

// Get Domain Info
async function getDomainInfo(domainName) {
  try {
    if (!domains[domainName]) {
      throw new Error("Domain not found");
    }
    
    const domain = domains[domainName];
    const status = await getDomainStatus(domainName);
    const sslStatus = await checkSSLStatus(domainName);
    
    return {
      ...domain,
      status: status.overall,
      sslStatus: sslStatus.status,
      sslDaysLeft: sslStatus.daysLeft,
      dns: dnsRecords[domainName] || {}
    };
  } catch (err) {
    alert.warning(`Failed to get domain info: ${err}`);
    throw err;
  }
}

// Exports
exports.addDomain = addDomain;
exports.getDomains = getDomains;
exports.getDomainStatus = getDomainStatus;
exports.getDNSRecords = getDNSRecords;
exports.updateDNSRecords = updateDNSRecords;
exports.issueSSL = issueSSL;
exports.checkSSLStatus = checkSSLStatus;
exports.suspendDomain = suspendDomain;
exports.activateDomain = activateDomain;
exports.deleteDomain = deleteDomain;
exports.autoHealDomains = autoHealDomains;
exports.getDomainLogs = getDomainLogs;
exports.getDomainInfo = getDomainInfo;
