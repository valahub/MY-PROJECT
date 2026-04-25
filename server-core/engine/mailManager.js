const { run } = require("../utils/exec");
const alert = require("./alert");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

// Mailboxes storage
const mailboxes = {};

// DNS records storage
const dnsRecords = {};

// Mail logs
const mailLogs = [];

// Rate limiting for mailbox creation
const mailboxCreationRate = {};

// Encryption for passwords
function encryptPassword(password) {
  const algorithm = "aes-256-cbc";
  const key = crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(password, "utf8", "hex");
  encrypted += cipher.final("hex");
  return {
    encrypted,
    key: key.toString("hex"),
    iv: iv.toString("hex")
  };
}

function decryptPassword(encrypted, keyHex, ivHex) {
  const algorithm = "aes-256-cbc";
  const key = Buffer.from(keyHex, "hex");
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

// Create Mailbox
async function createMailbox(email, password, quotaGB = 1) {
  try {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Invalid email format");
    }

    // Check for duplicate email
    if (mailboxes[email]) {
      throw new Error("Mailbox already exists");
    }

    // Rate limiting
    const now = Date.now();
    const domain = email.split('@')[1];
    if (mailboxCreationRate[domain] && now - mailboxCreationRate[domain] < 60000) {
      throw new Error("Rate limit exceeded for this domain");
    }
    mailboxCreationRate[domain] = now;

    // Extract username and domain
    const [username, domainName] = email.split('@');

    // Validate domain
    const domainIP = await run(`dig +short ${domainName}`);
    if (!domainIP.trim()) {
      throw new Error("Domain does not exist or does not point to this server");
    }

    // Create system user
    await run(`useradd -m -s /bin/bash ${username}`);
    await run(`echo "${username}:${password}" | chpasswd`);

    // Create mailbox directory
    await run(`mkdir -p /var/mail/${domainName}/${username}`);
    await run(`chown -R ${username}:${username} /var/mail/${domainName}/${username}`);
    await run(`chmod -R 700 /var/mail/${domainName}/${username}`);

    // Update Postfix virtual mailbox config
    const virtualMailboxPath = "/etc/postfix/virtual_mailbox_maps";
    let virtualMailbox = "";
    if (fs.existsSync(virtualMailboxPath)) {
      virtualMailbox = fs.readFileSync(virtualMailboxPath, "utf8");
    }
    virtualMailbox += `${email} ${domainName}/${username}/\n`;
    fs.writeFileSync(virtualMailboxPath, virtualMailbox);
    await run("postmap /etc/postfix/virtual_mailbox_maps");

    // Update Dovecot user config
    const dovecotUsersPath = "/etc/dovecot/users";
    let dovecotUsers = "";
    if (fs.existsSync(dovecotUsersPath)) {
      dovecotUsers = fs.readFileSync(dovecotUsersPath, "utf8");
    }
    dovecotUsers += `${email}:{PLAIN}${password}:${quotaGB * 1024 * 1024}::/var/mail/${domainName}/${username}\n`;
    fs.writeFileSync(dovecotUsersPath, dovecotUsers);

    // Encrypt and store password
    const encrypted = encryptPassword(password);

    mailboxes[email] = {
      email,
      passwordHash: crypto.createHash("sha256").update(password).digest("hex"),
      encryptedPassword: encrypted,
      quotaGB,
      usedQuotaGB: 0,
      forwardTo: null,
      createdAt: new Date().toISOString(),
      domain: domainName
    };

    // Reload Postfix and Dovecot
    await run("systemctl reload postfix");
    await run("systemctl reload dovecot");

    logMailEvent("mailbox_created", `Mailbox created: ${email}`);
    alert.info(`Mailbox created: ${email}`);
    return mailboxes[email];
  } catch (err) {
    logMailEvent("mailbox_error", `Mailbox creation failed for ${email}: ${err}`);
    alert.warning(`Failed to create mailbox: ${err}`);
    throw err;
  }
}

// Get Mail List
async function getMailboxes() {
  try {
    // Get live data from system
    const systemMailboxes = [];
    
    for (const email of Object.keys(mailboxes)) {
      const mailbox = mailboxes[email];
      
      // Calculate used quota
      const mailboxPath = `/var/mail/${mailbox.domain}/${email.split('@')[0]}`;
      let usedQuotaGB = 0;
      try {
        const duOutput = await run(`du -s ${mailboxPath} 2>/dev/null | awk '{print $1}'`);
        usedQuotaGB = (parseInt(duOutput.trim()) / 1024 / 1024).toFixed(2);
      } catch (err) {
        // Path might not exist
      }
      
      systemMailboxes.push({
        email: mailbox.email,
        usedQuotaGB: parseFloat(usedQuotaGB),
        maxQuotaGB: mailbox.quotaGB,
        forwardTo: mailbox.forwardTo,
        createdAt: mailbox.createdAt
      });
    }
    
    return systemMailboxes;
  } catch (err) {
    alert.warning(`Failed to get mailboxes: ${err}`);
    return [];
  }
}

// Webmail Access
async function getWebmailToken(email) {
  try {
    if (!mailboxes[email]) {
      throw new Error("Mailbox not found");
    }
    
    // Generate token for webmail login
    const token = crypto.randomBytes(32).toString("hex");
    
    logMailEvent("webmail_access", `Webmail token generated for ${email}`);
    return {
      webmailUrl: `https://mail.${mailboxes[email].domain}`,
      token,
      expiresIn: 3600 // 1 hour
    };
  } catch (err) {
    alert.warning(`Failed to generate webmail token: ${err}`);
    throw err;
  }
}

// Edit Mailbox
async function editMailbox(email, updates) {
  try {
    if (!mailboxes[email]) {
      throw new Error("Mailbox not found");
    }

    const mailbox = mailboxes[email];

    if (updates.password) {
      const encrypted = encryptPassword(updates.password);
      mailbox.passwordHash = crypto.createHash("sha256").update(updates.password).digest("hex");
      mailbox.encryptedPassword = encrypted;
      
      // Update system password
      const username = email.split('@')[0];
      await run(`echo "${username}:${updates.password}" | chpasswd`);
      
      // Update Dovecot config
      const dovecotUsersPath = "/etc/dovecot/users";
      let dovecotUsers = fs.readFileSync(dovecotUsersPath, "utf8");
      dovecotUsers = dovecotUsers.replace(
        new RegExp(`^${email}:.*$`, "m"),
        `${email}:{PLAIN}${updates.password}:${mailbox.quotaGB * 1024 * 1024}::/var/mail/${mailbox.domain}/${username}`
      );
      fs.writeFileSync(dovecotUsersPath, dovecotUsers);
    }

    if (updates.quotaGB !== undefined) {
      mailbox.quotaGB = updates.quotaGB;
      
      // Update Dovecot quota
      const username = email.split('@')[0];
      const dovecotUsersPath = "/etc/dovecot/users";
      let dovecotUsers = fs.readFileSync(dovecotUsersPath, "utf8");
      dovecotUsers = dovecotUsers.replace(
        new RegExp(`^${email}:.*$`, "m"),
        `${email}:{PLAIN}${updates.password || mailbox.passwordHash}:${updates.quotaGB * 1024 * 1024}::/var/mail/${mailbox.domain}/${username}`
      );
      fs.writeFileSync(dovecotUsersPath, dovecotUsers);
    }

    if (updates.forwardTo !== undefined) {
      mailbox.forwardTo = updates.forwardTo;
      
      // Update Postfix virtual alias
      const virtualAliasPath = "/etc/postfix/virtual_alias_maps";
      let virtualAlias = "";
      if (fs.existsSync(virtualAliasPath)) {
        virtualAlias = fs.readFileSync(virtualAliasPath, "utf8");
      }
      
      // Remove old forwarding
      virtualAlias = virtualAlias.split('\n').filter(line => !line.startsWith(`${email}`)).join('\n');
      
      if (updates.forwardTo) {
        virtualAlias += `${email} ${updates.forwardTo}\n`;
      }
      
      fs.writeFileSync(virtualAliasPath, virtualAlias);
      await run("postmap /etc/postfix/virtual_alias_maps");
    }

    await run("systemctl reload postfix");
    await run("systemctl reload dovecot");

    logMailEvent("mailbox_edited", `Mailbox edited: ${email}`);
    alert.info(`Mailbox edited: ${email}`);
    return mailboxes[email];
  } catch (err) {
    logMailEvent("mailbox_error", `Mailbox edit failed for ${email}: ${err}`);
    alert.warning(`Failed to edit mailbox: ${err}`);
    throw err;
  }
}

// Forwarding System
async function setForwarding(email, forwardTo) {
  try {
    if (!mailboxes[email]) {
      throw new Error("Mailbox not found");
    }

    await editMailbox(email, { forwardTo });
    
    logMailEvent("forwarding_set", `Forwarding set for ${email} -> ${forwardTo}`);
    alert.info(`Forwarding set: ${email} -> ${forwardTo}`);
    return true;
  } catch (err) {
    logMailEvent("forwarding_error", `Forwarding set failed for ${email}: ${err}`);
    alert.warning(`Failed to set forwarding: ${err}`);
    throw err;
  }
}

// Delete Mailbox
async function deleteMailbox(email) {
  try {
    if (!mailboxes[email]) {
      throw new Error("Mailbox not found");
    }

    const mailbox = mailboxes[email];
    const username = email.split('@')[0];

    // Remove system user
    await run(`userdel -r ${username}`);

    // Remove mailbox directory
    await run(`rm -rf /var/mail/${mailbox.domain}/${username}`);

    // Update Postfix virtual mailbox config
    const virtualMailboxPath = "/etc/postfix/virtual_mailbox_maps";
    let virtualMailbox = fs.readFileSync(virtualMailboxPath, "utf8");
    virtualMailbox = virtualMailbox.split('\n').filter(line => !line.startsWith(`${email}`)).join('\n');
    fs.writeFileSync(virtualMailboxPath, virtualMailbox);
    await run("postmap /etc/postfix/virtual_mailbox_maps");

    // Update Dovecot user config
    const dovecotUsersPath = "/etc/dovecot/users";
    let dovecotUsers = fs.readFileSync(dovecotUsersPath, "utf8");
    dovecotUsers = dovecotUsers.split('\n').filter(line => !line.startsWith(`${email}`)).join('\n');
    fs.writeFileSync(dovecotUsersPath, dovecotUsers);

    // Remove from storage
    delete mailboxes[email];

    await run("systemctl reload postfix");
    await run("systemctl reload dovecot");

    logMailEvent("mailbox_deleted", `Mailbox deleted: ${email}`);
    alert.warning(`Mailbox deleted: ${email}`);
    return true;
  } catch (err) {
    logMailEvent("mailbox_error", `Mailbox deletion failed for ${email}: ${err}`);
    alert.warning(`Failed to delete mailbox: ${err}`);
    throw err;
  }
}

// Quota Control
async function checkQuota(email) {
  try {
    if (!mailboxes[email]) {
      throw new Error("Mailbox not found");
    }

    const mailbox = mailboxes[email];
    const mailboxPath = `/var/mail/${mailbox.domain}/${email.split('@')[0]}`;
    
    const duOutput = await run(`du -s ${mailboxPath} 2>/dev/null | awk '{print $1}'`);
    const usedQuotaGB = (parseInt(duOutput.trim()) / 1024 / 1024).toFixed(2);
    
    const quotaPercentage = (usedQuotaGB / mailbox.quotaGB) * 100;
    
    if (quotaPercentage >= 90) {
      alert.critical(`Mailbox ${email} quota exceeded: ${usedQuotaGB}/${mailbox.quotaGB}GB`);
    }
    
    return {
      email,
      usedQuotaGB: parseFloat(usedQuotaGB),
      maxQuotaGB: mailbox.quotaGB,
      quotaPercentage: quotaPercentage.toFixed(2),
      exceeded: quotaPercentage >= 100
    };
  } catch (err) {
    alert.warning(`Failed to check quota: ${err}`);
    throw err;
  }
}

// DNS Records
async function getDNSRecords(domain) {
  try {
    const records = {
      MX: await run(`dig +short MX ${domain}`),
      SPF: await run(`dig +short TXT ${domain} | grep spf`),
      DKIM: await run(`dig +short TXT default._domainkey.${domain}`),
      DMARC: await run(`dig +short TXT _dmarc.${domain}`)
    };
    
    dnsRecords[domain] = records;
    
    return records;
  } catch (err) {
    alert.warning(`Failed to get DNS records: ${err}`);
    return {
      MX: "",
      SPF: "",
      DKIM: "",
      DMARC: ""
    };
  }
}

async function generateDKIM(domain) {
  try {
    // Generate DKIM key
    await run(`openssl genrsa -out /etc/postfix/dkim/${domain}.private 2048`);
    await run(`openssl rsa -in /etc/postfix/dkim/${domain}.private -pubout -out /etc/postfix/dkim/${domain}.public`);
    
    const publicKey = await run(`cat /etc/postfix/dkim/${domain}.public`);
    
    // Add DKIM to DNS
    const dkimRecord = `default._domainkey.${domain} v=DKIM1; k=rsa; p=${publicKey.replace(/-----BEGIN PUBLIC KEY-----/g, "").replace(/-----END PUBLIC KEY-----/g, "").replace(/\n/g, "")}`;
    
    logMailEvent("dkim_generated", `DKIM generated for ${domain}`);
    alert.info(`DKIM generated for ${domain}`);
    
    return {
      privateKey: `/etc/postfix/dkim/${domain}.private`,
      publicKey: publicKey,
      dnsRecord: dkimRecord
    };
  } catch (err) {
    logMailEvent("dkim_error", `DKIM generation failed for ${domain}: ${err}`);
    alert.warning(`Failed to generate DKIM: ${err}`);
    throw err;
  }
}

// Mail Server Health
async function getMailServerHealth() {
  try {
    const postfixStatus = await run("systemctl is-active postfix");
    const dovecotStatus = await run("systemctl is-active dovecot");
    const queueSize = await run("postqueue -p | tail -1");
    
    return {
      postfix: {
        status: postfixStatus.trim(),
        running: postfixStatus.includes("active")
      },
      dovecot: {
        status: dovecotStatus.trim(),
        running: dovecotStatus.includes("active")
      },
      queue: {
        size: queueSize.trim(),
        count: parseInt(queueSize.match(/(\d+) request/)?.[1] || "0")
      }
    };
  } catch (err) {
    alert.warning(`Failed to get mail server health: ${err}`);
    return {
      postfix: { status: "error", running: false },
      dovecot: { status: "error", running: false },
      queue: { size: "error", count: 0 }
    };
  }
}

// Security
async function blockSpamAbuse(email) {
  try {
    if (!mailboxes[email]) {
      throw new Error("Mailbox not found");
    }
    
    // Block IP from mail logs
    const ip = await run(`grep ${email} /var/log/mail.log | tail -1 | awk '{print $7}'`);
    if (ip.trim()) {
      await run(`ufw deny from ${ip.trim()}`);
      alert.high(`Blocked spam abuse IP: ${ip.trim()}`);
    }
    
    return true;
  } catch (err) {
    alert.warning(`Failed to block spam abuse: ${err}`);
    throw err;
  }
}

// Auto Heal
async function autoHealMailServer() {
  try {
    const health = await getMailServerHealth();
    
    if (!health.postfix.running) {
      await run("systemctl start postfix");
      alert.critical("Postfix auto-restarted");
    }
    
    if (!health.dovecot.running) {
      await run("systemctl start dovecot");
      alert.critical("Dovecot auto-restarted");
    }
    
    if (health.queue.count > 100) {
      await run("postqueue -f");
      alert.warning("Mail queue flushed");
    }
    
    // Check DKIM for all domains
    for (const email of Object.keys(mailboxes)) {
      const domain = mailboxes[email].domain;
      const dkim = await run(`dig +short TXT default._domainkey.${domain}`);
      if (!dkim.trim()) {
        await generateDKIM(domain);
      }
    }
    
    logMailEvent("auto_heal", "Mail server auto-heal completed");
  } catch (err) {
    alert.warning(`Auto heal failed: ${err}`);
  }
}

// Logging
function logMailEvent(type, message) {
  mailLogs.push({
    type,
    message,
    timestamp: new Date().toISOString()
  });
  
  if (mailLogs.length > 1000) {
    mailLogs.shift();
  }
}

async function getMailLogs(limit = 100) {
  return mailLogs.slice(-limit).reverse();
}

// Edge Case Handling
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error("Invalid email format");
  }
  
  if (mailboxes[email]) {
    throw new Error("Email already exists");
  }
  
  return true;
}

// Exports
exports.createMailbox = createMailbox;
exports.getMailboxes = getMailboxes;
exports.getWebmailToken = getWebmailToken;
exports.editMailbox = editMailbox;
exports.setForwarding = setForwarding;
exports.deleteMailbox = deleteMailbox;
exports.checkQuota = checkQuota;
exports.getDNSRecords = getDNSRecords;
exports.generateDKIM = generateDKIM;
exports.getMailServerHealth = getMailServerHealth;
exports.blockSpamAbuse = blockSpamAbuse;
exports.autoHealMailServer = autoHealMailServer;
exports.getMailLogs = getMailLogs;
exports.validateEmail = validateEmail;
