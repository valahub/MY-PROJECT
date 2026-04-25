const os = require("os");
const { run } = require("../utils/exec");
const alert = require("../engine/alert");

const metricsHistory = {
  cpu: [],
  ram: [],
  disk: [],
  network: []
};

const MAX_HISTORY = 100;

async function getCPUMetrics() {
  const cpus = os.cpus();
  const loadAvg = os.loadavg();
  const cpuUsage = (loadAvg[0] / cpus.length) * 100;
  
  return {
    usage: Math.min(cpuUsage, 100),
    loadAverage: loadAvg,
    cores: cpus.length
  };
}

async function getRAMMetrics() {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const usage = (usedMem / totalMem) * 100;
  
  return {
    total: (totalMem / 1024 / 1024 / 1024).toFixed(2),
    used: (usedMem / 1024 / 1024 / 1024).toFixed(2),
    free: (freeMem / 1024 / 1024 / 1024).toFixed(2),
    usage: usage.toFixed(2)
  };
}

async function getDiskMetrics() {
  try {
    const diskInfo = await run("df -h / | tail -1");
    const parts = diskInfo.split(/\s+/);
    const total = parts[1];
    const used = parts[2];
    const available = parts[3];
    const usage = parseInt(parts[4]);
    
    return {
      total,
      used,
      available,
      usage
    };
  } catch (err) {
    alert.warning(`Disk metrics check failed: ${err}`);
    return { total: "0", used: "0", available: "0", usage: 0 };
  }
}

async function getNetworkMetrics() {
  try {
    const networkInfo = await run("cat /proc/net/dev | tail -2");
    const lines = networkInfo.split('\n');
    const eth0 = lines[0].split(/\s+/);
    
    return {
      interface: "eth0",
      rx: eth0[2],
      tx: eth0[10],
      connections: await run("netstat -an | grep ESTABLISHED | wc -l").then(r => parseInt(r.trim()))
    };
  } catch (err) {
    alert.warning(`Network metrics check failed: ${err}`);
    return { interface: "eth0", rx: "0", tx: "0", connections: 0 };
  }
}

async function updateHistory(type, data) {
  metricsHistory[type].push({
    ...data,
    timestamp: new Date().toISOString()
  });
  
  if (metricsHistory[type].length > MAX_HISTORY) {
    metricsHistory[type].shift();
  }
}

async function checkAlerts(cpu, ram, disk) {
  if (cpu.usage > 85) {
    alert.high(`CPU usage critical: ${cpu.usage.toFixed(2)}%`);
  }
  
  if (parseFloat(ram.usage) > 90) {
    alert.critical(`RAM usage critical: ${ram.usage}%`);
  }
  
  if (disk.usage > 90) {
    alert.critical(`Disk usage critical: ${disk.usage}%`);
  }
}

async function calculateHealthScore(cpu, ram, disk) {
  let score = 100;
  
  if (cpu.usage > 85) score -= 30;
  else if (cpu.usage > 70) score -= 10;
  
  if (parseFloat(ram.usage) > 90) score -= 30;
  else if (parseFloat(ram.usage) > 75) score -= 10;
  
  if (disk.usage > 90) score -= 30;
  else if (disk.usage > 80) score -= 10;
  
  if (score >= 80) return "GOOD";
  if (score >= 50) return "WARNING";
  return "CRITICAL";
}

exports.loop = async () => {
  const cpu = await getCPUMetrics();
  const ram = await getRAMMetrics();
  const disk = await getDiskMetrics();
  const network = await getNetworkMetrics();
  
  await updateHistory("cpu", cpu);
  await updateHistory("ram", ram);
  await updateHistory("disk", disk);
  await updateHistory("network", network);
  
  await checkAlerts(cpu, ram, disk);
  
  const healthScore = await calculateHealthScore(cpu, ram, disk);
  
  return {
    cpu,
    ram,
    disk,
    network,
    healthScore
  };
};

exports.getMetrics = async () => {
  return exports.loop();
};

exports.getHistory = () => metricsHistory;
exports.getHealthScore = calculateHealthScore;
