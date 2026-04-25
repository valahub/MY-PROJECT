const { run } = require("../utils/exec");
const healer = require("../engine/healer");
const alert = require("../engine/alert");

async function checkPostfix() {
  try {
    const status = await run("systemctl is-active postfix");
    if (!status.includes("active")) {
      alert.warning("Postfix is not active");
      await healer.restartService("postfix");
    }
  } catch (err) {
    alert.warning(`Postfix check failed: ${err}`);
    await healer.restartService("postfix");
  }
}

async function checkPort25() {
  try {
    await run("netstat -tuln | grep :25");
    alert.info("Port 25 is listening");
  } catch (err) {
    alert.warning("Port 25 is not listening");
    await healer.restartService("postfix");
  }
}

async function checkDNSMX(domain) {
  try {
    const mx = await run(`dig +short MX ${domain}`);
    if (!mx) {
      alert.warning(`MX record missing for ${domain}`);
    } else {
      alert.info(`MX record OK for ${domain}`);
    }
  } catch (err) {
    alert.warning(`DNS MX check failed: ${err}`);
  }
}

async function checkDNSSPF(domain) {
  try {
    const spf = await run(`dig +short TXT ${domain}`);
    if (!spf.includes("v=spf1")) {
      alert.warning(`SPF record missing for ${domain}`);
    } else {
      alert.info(`SPF record OK for ${domain}`);
    }
  } catch (err) {
    alert.warning(`DNS SPF check failed: ${err}`);
  }
}

async function checkMailQueue() {
  try {
    const queueSize = await run("mailq | grep -c 'Mail queue'");
    const count = parseInt(queueSize.trim());
    
    if (count > 20) {
      alert.warning(`Mail queue size: ${count}`);
      await healer.flushMailQueue();
    }
  } catch (err) {
    alert.warning(`Mail queue check failed: ${err}`);
  }
}

exports.loop = async () => {
  await checkPostfix();
  await checkPort25();
  await checkMailQueue();
  
  // Check DNS for mail domains
  const mailDomains = ["erpvala.com", "mail.erpvala.com"];
  for (const domain of mailDomains) {
    await checkDNSMX(domain);
    await checkDNSSPF(domain);
  }
};
