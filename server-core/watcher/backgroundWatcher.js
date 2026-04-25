const { run } = require("../utils/exec");
const alert = require("../engine/alert");

async function checkCronHealth() {
  try {
    const cronStatus = await run("systemctl is-active cron");
    if (!cronStatus.includes("active")) {
      alert.warning("Cron service is not active");
      await run("systemctl start cron");
    } else {
      alert.info("Cron service is healthy");
    }
  } catch (err) {
    alert.warning(`Cron health check failed: ${err}`);
  }
}

async function scheduleBackup() {
  try {
    // Add backup cron job if not exists
    const cronJob = "0 2 * * * /root/backup-script.sh";
    await run(`(crontab -l 2>/dev/null | grep -q "backup-script.sh"; echo "$?") || (crontab -l 2>/dev/null; echo "${cronJob}") | crontab -`);
    alert.info("Backup scheduler configured");
  } catch (err) {
    alert.warning(`Failed to schedule backup: ${err}`);
  }
}

async function runLogRotation() {
  try {
    await run("logrotate -f /etc/logrotate.conf");
    alert.info("Log rotation completed");
  } catch (err) {
    alert.warning(`Log rotation failed: ${err}`);
  }
}

async function checkSystemUpdates() {
  try {
    const updates = await run("apt list --upgradable 2>/dev/null | wc -l");
    if (parseInt(updates.trim()) > 0) {
      alert.warning(`${updates.trim()} system updates available`);
    }
  } catch (err) {
    alert.warning(`System update check failed: ${err}`);
  }
}

exports.loop = async () => {
  await checkCronHealth();
  await scheduleBackup();
  await runLogRotation();
  await checkSystemUpdates();
};

exports.checkCronHealth = checkCronHealth;
exports.scheduleBackup = scheduleBackup;
exports.runLogRotation = runLogRotation;
