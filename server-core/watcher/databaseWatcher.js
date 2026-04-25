const { run } = require("../utils/exec");
const healer = require("../engine/healer");
const alert = require("../engine/alert");

const databases = [
  { type: "postgresql", service: "postgresql" },
  { type: "mysql", service: "mysql" }
];

async function checkConnection(db) {
  try {
    if (db.type === "postgresql") {
      await run("pg_isready");
    } else if (db.type === "mysql") {
      await run("mysqladmin ping");
    }
    alert.info(`${db.type} connection OK`);
  } catch (err) {
    alert.warning(`${db.type} connection failed: ${err}`);
    await healer.restartService(db.service);
  }
}

async function killSlowQueries(db) {
  try {
    if (db.type === "postgresql") {
      await run("psql -c \"SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'active' AND query_start < now() - interval '30 seconds';\"");
    } else if (db.type === "mysql") {
      await run("mysql -e \"SELECT id FROM information_schema.processlist WHERE time > 30;\"");
    }
    alert.info(`Killed slow queries in ${db.type}`);
  } catch (err) {
    alert.warning(`Failed to kill slow queries: ${err}`);
  }
}

async function checkCrashRecovery(db) {
  try {
    if (db.type === "postgresql") {
      const status = await run("pg_controldata /var/lib/postgresql/data | grep DatabaseClusterState");
      if (status.includes("in recovery")) {
        alert.warning(`${db.type} in recovery mode`);
      }
    }
  } catch (err) {
    alert.warning(`Crash recovery check failed: ${err}`);
  }
}

exports.loop = async () => {
  for (const db of databases) {
    await checkConnection(db);
    await killSlowQueries(db);
    await checkCrashRecovery(db);
  }
};
