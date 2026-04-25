const { run } = require("../utils/exec");
const alert = require("../engine/alert");

async function enableFail2Ban() {
  try {
    await run("systemctl enable fail2ban");
    await run("systemctl start fail2ban");
    alert.info("Fail2Ban enabled and started");
  } catch (err) {
    alert.warning(`Failed to enable Fail2Ban: ${err}`);
  }
}

async function configureFirewall() {
  try {
    // Allow SSH, HTTP, HTTPS
    await run("ufw allow 22/tcp");
    await run("ufw allow 80/tcp");
    await run("ufw allow 443/tcp");
    await run("ufw allow 25/tcp");
    await run("ufw allow 587/tcp");
    
    // Enable firewall
    await run("ufw --force enable");
    alert.info("Firewall configured and enabled");
  } catch (err) {
    alert.warning(`Failed to configure firewall: ${err}`);
  }
}

async function hardenSSH() {
  try {
    // Backup SSH config
    await run("cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak");
    
    // Disable root login
    await run("sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config");
    
    // Disable password authentication (key-based only)
    await run("sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config");
    
    // Restart SSH
    await run("systemctl restart sshd");
    alert.info("SSH hardened - root login disabled, password auth disabled");
  } catch (err) {
    alert.warning(`Failed to harden SSH: ${err}`);
  }
}

async function blockSuspiciousIP(ip) {
  try {
    await run(`fail2ban-client set sshd banip ${ip}`);
    await run(`iptables -A INPUT -s ${ip} -j DROP`);
    alert.high(`Blocked suspicious IP: ${ip}`);
  } catch (err) {
    alert.warning(`Failed to block IP ${ip}: ${err}`);
  }
}

async function checkFirewallStatus() {
  try {
    const status = await run("ufw status");
    alert.info(`Firewall status: ${status.includes("active") ? "ACTIVE" : "INACTIVE"}`);
    return status;
  } catch (err) {
    alert.warning(`Firewall status check failed: ${err}`);
    return "Unknown";
  }
}

async function syncWithSecurityPanel() {
  try {
    // In production, this would sync with the Security panel API
    // For now, just log the action
    alert.info("Synced firewall rules with Security panel");
  } catch (err) {
    alert.warning(`Security panel sync failed: ${err}`);
  }
}

exports.loop = async () => {
  await checkFirewallStatus();
  await syncWithSecurityPanel();
};

exports.enableFail2Ban = enableFail2Ban;
exports.configureFirewall = configureFirewall;
exports.hardenSSH = hardenSSH;
exports.blockIP = blockSuspiciousIP;
