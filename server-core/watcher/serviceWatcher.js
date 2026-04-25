const { run } = require("../utils/exec");
const healer = require("../engine/healer");
const alert = require("../engine/alert");

const services = ["nginx", "postgresql", "redis", "postfix", "dovecot", "php-fpm"];
const retryMap = {};
const criticalMap = {};
const serviceLogs = {};

async function checkService(service) {
  try {
    const res = await run(`systemctl is-active ${service}`);
    if (!res.includes("active")) {
      alert.warning(`${service} is not active`);
      retryMap[service] = (retryMap[service] || 0) + 1;
      
      await healer.restartService(service);
      
      if (retryMap[service] > 3) {
        criticalMap[service] = true;
        alert.critical(`${service} failed ${retryMap[service]} times - MARKED CRITICAL`);
      }
    } else {
      // Reset retry count if service is healthy
      if (retryMap[service] > 0) {
        alert.info(`${service} recovered after ${retryMap[service]} retries`);
        retryMap[service] = 0;
        criticalMap[service] = false;
      }
    }
  } catch (err) {
    alert.warning(`${service} check failed: ${err}`);
    retryMap[service] = (retryMap[service] || 0) + 1;
    await healer.restartService(service);
  }
}

async function getServiceLogs(service) {
  try {
    const logs = await run(`journalctl -u ${service} -n 50 --no-pager`);
    serviceLogs[service] = logs;
    return logs;
  } catch (err) {
    alert.warning(`Failed to get logs for ${service}: ${err}`);
    return "No logs available";
  }
}

async function enableService(service) {
  try {
    await run(`systemctl enable ${service}`);
    await run(`systemctl start ${service}`);
    alert.info(`Enabled and started ${service}`);
  } catch (err) {
    alert.warning(`Failed to enable ${service}: ${err}`);
  }
}

exports.loop = async () => {
  for (const s of services) {
    await checkService(s);
  }
};

exports.getStatus = () => {
  return {
    retryMap,
    criticalMap
  };
};

exports.getServiceLogs = getServiceLogs;
exports.enableService = enableService;
exports.startService = async (service) => {
  await run(`systemctl start ${service}`);
  alert.info(`Started ${service}`);
};
exports.stopService = async (service) => {
  await run(`systemctl stop ${service}`);
  alert.warning(`Stopped ${service}`);
};
exports.restartService = async (service) => {
  await healer.restartService(service);
};
