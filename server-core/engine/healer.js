const { run } = require("../utils/exec");
const alert = require("./alert");

let retryMap = {};

exports.run = run;

exports.restartService = async (service) => {
  retryMap[service] = (retryMap[service] || 0) + 1;

  try {
    await run(`systemctl restart ${service}`);
    alert.info(`Restarted ${service} (attempt ${retryMap[service]})`);
  } catch (err) {
    alert.critical(`Failed to restart ${service}: ${err}`);
  }

  if (retryMap[service] > 3) {
    alert.critical(`${service} failed multiple times (${retryMap[service]} attempts)`);
  }
};

exports.reloadService = async (service) => {
  try {
    await run(`systemctl reload ${service}`);
    alert.info(`Reloaded ${service}`);
  } catch (err) {
    alert.warning(`Failed to reload ${service}: ${err}`);
  }
};

exports.clearNginxCache = async () => {
  try {
    await run("rm -rf /var/cache/nginx/*");
    alert.info("Cleared nginx cache");
  } catch (err) {
    alert.warning(`Failed to clear cache: ${err}`);
  }
};

exports.flushMailQueue = async () => {
  try {
    await run("postqueue -f");
    alert.info("Flushed mail queue");
  } catch (err) {
    alert.warning(`Failed to flush mail queue: ${err}`);
  }
};

exports.killStuckConnections = async (dbType) => {
  try {
    if (dbType === "postgresql") {
      await run("psql -c \"SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND state_change < now() - interval '5 minutes';\"");
    } else if (dbType === "mysql") {
      await run("mysql -e \"SHOW PROCESSLIST;\"");
    }
    alert.info(`Killed stuck ${dbType} connections`);
  } catch (err) {
    alert.warning(`Failed to kill connections: ${err}`);
  }
};
