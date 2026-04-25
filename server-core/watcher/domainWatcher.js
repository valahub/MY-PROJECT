const axios = require("axios");
const healer = require("../engine/healer");
const alert = require("../engine/alert");
const fs = require("fs");

const domains = [
  "https://erpvala.com",
  "https://shop.erpvala.com",
  "https://api.erpvala.io",
  "https://staging.erpvala.dev",
  "https://old-portal.com"
];

const domainHealth = {};
const domainTraffic = {};

async function fixPermissions(domain) {
  try {
    const domainPath = `/var/www/${domain.replace("https://", "")}`;
    await healer.run(`chmod -R 755 ${domainPath}`);
    await healer.run(`chown -R www-data:www-data ${domainPath}`);
    alert.info(`Fixed permissions for ${domain}`);
  } catch (err) {
    alert.warning(`Failed to fix permissions for ${domain}: ${err}`);
  }
}

async function checkDNS(domain) {
  try {
    const domainName = domain.replace("https://", "");
    await healer.run(`dig +short MX ${domainName}`);
    await healer.run(`dig +short TXT ${domainName}`);
    alert.info(`DNS check passed for ${domain}`);
  } catch (err) {
    alert.warning(`DNS check failed for ${domain}: ${err}`);
  }
}

async function checkSSL(domain) {
  try {
    const domainName = domain.replace("https://", "");
    await healer.run(`certbot certificates --domain ${domainName}`);
    alert.info(`SSL check passed for ${domain}`);
  } catch (err) {
    alert.warning(`SSL check failed for ${domain}, attempting renewal`);
    await healer.run("certbot renew --quiet");
  }
}

async function createNginxVhost(domain, ip, rootPath) {
  try {
    const domainName = domain.replace("https://", "");
    const vhostConfig = `
server {
    listen 80;
    server_name ${domainName} www.${domainName};
    root ${rootPath};
    index index.html index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \\.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
    }
}
`;
    
    await healer.run(`echo "${vhostConfig}" > /etc/nginx/sites-available/${domainName}`);
    await healer.run(`ln -sf /etc/nginx/sites-available/${domainName} /etc/nginx/sites-enabled/`);
    await healer.restartService("nginx");
    alert.info(`Created nginx vhost for ${domain}`);
  } catch (err) {
    alert.warning(`Failed to create vhost for ${domain}: ${err}`);
  }
}

async function suspendDomain(domain) {
  try {
    const domainName = domain.replace("https://", "");
    await healer.run(`mv /etc/nginx/sites-enabled/${domainName} /etc/nginx/sites-available/${domainName}.disabled`);
    await healer.restartService("nginx");
    alert.warning(`Suspended ${domain}`);
  } catch (err) {
    alert.warning(`Failed to suspend ${domain}: ${err}`);
  }
}

async function unsuspendDomain(domain) {
  try {
    const domainName = domain.replace("https://", "");
    await healer.run(`mv /etc/nginx/sites-available/${domainName}.disabled /etc/nginx/sites-enabled/${domainName}`);
    await healer.restartService("nginx");
    alert.info(`Unsuspended ${domain}`);
  } catch (err) {
    alert.warning(`Failed to unsuspend ${domain}: ${err}`);
  }
}

async function checkDomainStatus(domain) {
  try {
    const res = await axios.get(domain, { timeout: 5000 });
    const responseTime = res.headers["x-response-time"] || 0;
    
    domainHealth[domain] = {
      status: "online",
      httpStatus: res.status,
      responseTime,
      lastCheck: new Date().toISOString()
    };
  } catch (err) {
    domainHealth[domain] = {
      status: "offline",
      httpStatus: 0,
      responseTime: 0,
      lastCheck: new Date().toISOString()
    };
    alert.warning(`${domain} is offline: ${err.message}`);
  }
}

async function checkSSLExpiry(domain) {
  try {
    const domainName = domain.replace("https://", "");
    const certInfo = await healer.run(`openssl x509 -enddate -noout -in /etc/letsencrypt/live/${domainName}/cert.pem`);
    const expiryDate = certInfo.match(/notAfter=(.*)/)[1];
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry <= 7) {
      alert.critical(`SSL for ${domain} expires in ${daysUntilExpiry} days - FORCE RENEW`);
      await healer.run(`certbot renew --force-renewal -d ${domainName}`);
    } else if (daysUntilExpiry <= 30) {
      alert.warning(`SSL for ${domain} expires in ${daysUntilExpiry} days`);
    }
    
    return daysUntilExpiry;
  } catch (err) {
    alert.warning(`SSL expiry check failed for ${domain}: ${err}`);
    return 0;
  }
}

async function calculateHealthScore(domain) {
  const health = domainHealth[domain];
  if (!health) return 0;
  
  let score = 100;
  
  if (health.status !== "online") score -= 50;
  if (health.httpStatus !== 200) score -= 30;
  if (health.responseTime > 1000) score -= 20;
  
  const sslDays = await checkSSLExpiry(domain);
  if (sslDays < 7) score -= 30;
  else if (sslDays < 30) score -= 10;
  
  return Math.max(0, score);
}

async function trackTraffic(domain) {
  try {
    const domainName = domain.replace("https://", "");
    const accessLog = await healer.run(`tail -100 /var/log/nginx/${domainName}-access.log`);
    const lines = accessLog.split('\n').filter(l => l.trim());
    
    domainTraffic[domain] = {
      requests: lines.length,
      bandwidth: lines.reduce((acc, line) => acc + (parseInt(line.split(' ')[9]) || 0), 0),
      lastUpdate: new Date().toISOString()
    };
  } catch (err) {
    // Log file might not exist yet
  }
}

async function getDomainErrors(domain) {
  try {
    const domainName = domain.replace("https://", "");
    const errorLog = await healer.run(`tail -50 /var/log/nginx/${domainName}-error.log`);
    return errorLog;
  } catch (err) {
    return "No errors logged";
  }
}

async function setupRedirect(domain, type) {
  try {
    const domainName = domain.replace("https://", "");
    let redirectConfig = "";
    
    if (type === "http-to-https") {
      redirectConfig = `
server {
    listen 80;
    server_name ${domainName} www.${domainName};
    return 301 https://$server_name$request_uri;
}
`;
    } else if (type === "www-to-non-www") {
      redirectConfig = `
server {
    listen 443 ssl;
    server_name www.${domainName};
    return 301 https://${domainName}$request_uri;
}
`;
    }
    
    await healer.run(`echo "${redirectConfig}" > /etc/nginx/sites-available/${domainName}-redirect`);
    await healer.run(`ln -sf /etc/nginx/sites-available/${domainName}-redirect /etc/nginx/sites-enabled/`);
    await healer.restartService("nginx");
    alert.info(`Setup ${type} redirect for ${domain}`);
  } catch (err) {
    alert.warning(`Failed to setup redirect for ${domain}: ${err}`);
  }
}

async function createSubdomain(domain, subdomain) {
  try {
    const subdomainName = `${subdomain}.${domain.replace("https://", "")}`;
    const rootPath = `/var/www/${subdomainName}`;
    
    await healer.run(`mkdir -p ${rootPath}`);
    await createNginxVhost(`https://${subdomainName}`, "192.168.1.1", rootPath);
    alert.info(`Created subdomain ${subdomainName}`);
  } catch (err) {
    alert.warning(`Failed to create subdomain: ${err}`);
  }
}

exports.loop = async () => {
  for (const d of domains) {
    await checkDomainStatus(d);
    await checkSSLExpiry(d);
    await trackTraffic(d);
    
    try {
      const res = await axios.get(d, { timeout: 5000 });
      if (res.status !== 200) {
        throw new Error(`Status ${res.status}`);
      }
    } catch (err) {
      alert.warning(`Domain ${d} is down: ${err.message}`);
      
      // Try reload nginx first
      await healer.restartService("nginx");
      
      // Fix permissions
      await fixPermissions(d);
      
      // Check DNS
      await checkDNS(d);
      
      // Check SSL
      await checkSSL(d);
    }
  }
};

exports.addDomain = async (domain, ip, rootPath) => {
  await createNginxVhost(domain, ip, rootPath);
  await fixPermissions(domain);
  await checkDNS(domain);
  await checkSSL(domain);
};

exports.suspendDomain = suspendDomain;
exports.unsuspendDomain = unsuspendDomain;
exports.setupRedirect = setupRedirect;
exports.createSubdomain = createSubdomain;
exports.getDomainHealth = () => domainHealth;
exports.getDomainTraffic = () => domainTraffic;
exports.getDomainErrors = getDomainErrors;
exports.calculateHealthScore = calculateHealthScore;
