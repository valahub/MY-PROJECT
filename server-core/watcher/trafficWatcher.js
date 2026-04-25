const { run } = require("../utils/exec");
const alert = require("../engine/alert");

async function enableRateLimit() {
  try {
    // Add rate limiting to nginx
    const rateLimitConfig = `
limit_req_zone $binary_remote_addr zone=one:10m rate=10r/s;
limit_req zone=one burst=20 nodelay;
`;
    await run(`echo "${rateLimitConfig}" >> /etc/nginx/conf.d/rate-limit.conf`);
    await healer.restartService("nginx");
    alert.high("Rate limiting enabled due to traffic spike");
  } catch (err) {
    alert.warning(`Failed to enable rate limit: ${err}`);
  }
}

async function blockSuspiciousIP(ip) {
  try {
    await run(`fail2ban-client set nginx-noscript banip ${ip}`);
    await run(`iptables -A INPUT -s ${ip} -j DROP`);
    alert.high(`Blocked suspicious IP: ${ip}`);
  } catch (err) {
    alert.warning(`Failed to block IP ${ip}: ${err}`);
  }
}

async function checkTrafficSpike() {
  try {
    const connections = await run("netstat -an | grep :80 | wc -l");
    const connCount = parseInt(connections.trim());
    
    if (connCount > 1000) {
      alert.warning(`Traffic spike detected: ${connCount} connections`);
      await enableRateLimit();
    }
  } catch (err) {
    alert.warning(`Traffic check failed: ${err}`);
  }
}

async function detectAttack() {
  try {
    // Check for repeated failed requests from same IP
    const failedRequests = await run("tail -1000 /var/log/nginx/access.log | awk '{print $1}' | sort | uniq -c | sort -rn | head -5");
    const lines = failedRequests.split('\n');
    
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 2 && parseInt(parts[0]) > 50) {
        const ip = parts[1];
        await blockSuspiciousIP(ip);
      }
    }
  } catch (err) {
    alert.warning(`Attack detection failed: ${err}`);
  }
}

exports.loop = async () => {
  await checkTrafficSpike();
  await detectAttack();
};
