const os = require("os");
const { run } = require("../utils/exec");
const alert = require("../engine/alert");

async function cleanupDisk() {
  try {
    await run("rm -rf /tmp/*");
    await run("rm -rf /var/log/*.gz");
    await run("journalctl --vacuum-time=7d");
    alert.info("Cleaned up temp files and old logs");
  } catch (err) {
    alert.warning(`Disk cleanup failed: ${err}`);
  }
}

async function restartLowPriorityService() {
  try {
    // Restart low-priority services to free memory
    await run("systemctl restart redis");
    alert.info("Restarted low-priority service (redis)");
  } catch (err) {
    alert.warning(`Failed to restart service: ${err}`);
  }
}

exports.loop = async () => {
  const load = os.loadavg()[0];
  const freeMem = os.freemem();
  const totalMem = os.totalmem();
  const memUsage = ((totalMem - freeMem) / totalMem) * 100;

  // Check disk usage
  try {
    const diskUsage = await run("df -h / | tail -1 | awk '{print $5}'");
    const diskPercent = parseInt(diskUsage.replace('%', ''));
    
    alert.info(`Load: ${load.toFixed(2)}, Memory: ${memUsage.toFixed(1)}%, Disk: ${diskPercent}%`);

    // CPU > 90%
    if (load > 2.5) {
      alert.warning(`High load detected: ${load.toFixed(2)}`);
      try {
        await run("pkill -f node");
        alert.info("Killed heavy node processes");
      } catch (err) {
        alert.warning(`Failed to kill processes: ${err}`);
      }
    }

    // RAM > 95%
    if (memUsage > 95) {
      alert.warning(`High memory usage: ${memUsage.toFixed(1)}%`);
      try {
        await run("sync && echo 3 > /proc/sys/vm/drop_caches");
        alert.info("Cleared system cache");
        await restartLowPriorityService();
      } catch (err) {
        alert.warning(`Failed to clear cache: ${err}`);
      }
    }

    // Disk > 90%
    if (diskPercent > 90) {
      alert.warning(`High disk usage: ${diskPercent}%`);
      await cleanupDisk();
    }
  } catch (err) {
    alert.warning(`Resource check failed: ${err}`);
  }
};
