const { run } = require("../utils/exec");
const alert = require("../engine/alert");

async function cleanupTempFiles() {
  try {
    await run("rm -rf /tmp/*");
    await run("rm -rf /var/tmp/*");
    alert.info("Cleaned temp files");
  } catch (err) {
    alert.warning(`Failed to clean temp files: ${err}`);
  }
}

async function cleanupOldLogs() {
  try {
    await run("rm -rf /var/log/*.gz");
    await run("rm -rf /var/log/*.1");
    await run("journalctl --vacuum-time=7d");
    alert.info("Cleaned old logs");
  } catch (err) {
    alert.warning(`Failed to clean old logs: ${err}`);
  }
}

async function cleanupPackageCache() {
  try {
    await run("apt-get clean");
    await run("apt-get autoremove -y");
    alert.info("Cleaned package cache");
  } catch (err) {
    alert.warning(`Failed to clean package cache: ${err}`);
  }
}

async function cleanupNginxCache() {
  try {
    await run("rm -rf /var/cache/nginx/*");
    alert.info("Cleaned nginx cache");
  } catch (err) {
    alert.warning(`Failed to clean nginx cache: ${err}`);
  }
}

async function rotateLogs() {
  try {
    await run("logrotate -f /etc/logrotate.conf");
    alert.info("Rotated logs");
  } catch (err) {
    alert.warning(`Failed to rotate logs: ${err}`);
  }
}

exports.loop = async () => {
  await cleanupTempFiles();
  await cleanupOldLogs();
  await cleanupNginxCache();
  await rotateLogs();
};

exports.cleanupTempFiles = cleanupTempFiles;
exports.cleanupOldLogs = cleanupOldLogs;
exports.cleanupPackageCache = cleanupPackageCache;
exports.rotateLogs = rotateLogs;
