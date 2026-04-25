const { run } = require("../utils/exec");
const alert = require("./alert");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

// Databases storage
const databases = {};

// Database users storage
const dbUsers = {};

// Database logs
const dbLogs = [];

// Backup storage
const backups = {};

// Create Database
async function createDatabase(dbName, engine, username, password, sizeLimitGB = null) {
  try {
    // Validate database name (prevent SQL injection)
    const dbNameRegex = /^[a-zA-Z0-9_]+$/;
    if (!dbNameRegex.test(dbName)) {
      throw new Error("Invalid database name. Only alphanumeric characters and underscores allowed");
    }
    
    // Check for duplicate
    if (databases[dbName]) {
      throw new Error("Database already exists");
    }
    
    // Validate username
    if (!dbNameRegex.test(username)) {
      throw new Error("Invalid username. Only alphanumeric characters and underscores allowed");
    }
    
    // Create database based on engine
    if (engine === "mysql") {
      await run(`mysql -u root -e "CREATE DATABASE \`${dbName}\`;"`);
      await run(`mysql -u root -e "CREATE USER '${username}'@'localhost' IDENTIFIED BY '${password}';"`);
      await run(`mysql -u root -e "GRANT ALL PRIVILEGES ON \`${dbName}\`.* TO '${username}'@'localhost';"`);
      await run(`mysql -u root -e "FLUSH PRIVILEGES;"`);
    } else if (engine === "postgres") {
      await run(`sudo -u postgres psql -c "CREATE DATABASE ${dbName};"`);
      await run(`sudo -u postgres psql -c "CREATE USER ${username} WITH PASSWORD '${password}';"`);
      await run(`sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${dbName} TO ${username};"`);
    } else if (engine === "redis") {
      // Redis doesn't have databases in the same way, but we can track it
      await run(`redis-cli SET ${dbName}:exists 1`);
    } else {
      throw new Error("Unsupported database engine");
    }
    
    // Store database info
    databases[dbName] = {
      name: dbName,
      engine,
      username,
      passwordHash: crypto.createHash("sha256").update(password).digest("hex"),
      sizeLimitGB,
      createdAt: new Date().toISOString(),
      users: [username]
    };
    
    // Store user info
    dbUsers[username] = {
      username,
      passwordHash: crypto.createHash("sha256").update(password).digest("hex"),
      databases: [dbName],
      createdAt: new Date().toISOString()
    };
    
    logDBEvent("db_created", `Database created: ${dbName} (${engine})`);
    alert.info(`Database created: ${dbName} (${engine})`);
    
    return databases[dbName];
  } catch (err) {
    logDBEvent("db_error", `Database creation failed for ${dbName}: ${err}`);
    alert.warning(`Failed to create database: ${err}`);
    throw err;
  }
}

// Get Database List
async function getDatabases() {
  try {
    const dbList = [];
    
    // Get MySQL databases
    try {
      const mysqlDBs = await run(`mysql -u root -e "SHOW DATABASES;" | grep -v "Database\\|information_schema\\|performance_schema\\|mysql"`);
      mysqlDBs.split('\n').filter(db => db.trim()).forEach(dbName => {
        if (!databases[dbName]) {
          databases[dbName] = {
            name: dbName.trim(),
            engine: "mysql",
            username: "root",
            createdAt: new Date().toISOString(),
            users: ["root"]
          };
        }
        dbList.push({ ...databases[dbName], engine: "mysql" });
      });
    } catch (err) {
      // MySQL might not be installed
    }
    
    // Get PostgreSQL databases
    try {
      const pgDBs = await run(`sudo -u postgres psql -c "\\l" | grep -v "Name\\|---\\|template0\\|template1\\|postgres" | awk '{print $1}'`);
      pgDBs.split('\n').filter(db => db.trim()).forEach(dbName => {
        if (!databases[dbName]) {
          databases[dbName] = {
            name: dbName.trim(),
            engine: "postgres",
            username: "postgres",
            createdAt: new Date().toISOString(),
            users: ["postgres"]
          };
        }
        dbList.push({ ...databases[dbName], engine: "postgres" });
      });
    } catch (err) {
      // PostgreSQL might not be installed
    }
    
    // Get Redis databases
    try {
      const redisDBs = await run(`redis-cli KEYS "*:exists"`);
      redisDBs.split('\n').filter(db => db.trim()).forEach(dbName => {
        const cleanName = dbName.replace(":exists", "");
        if (!databases[cleanName]) {
          databases[cleanName] = {
            name: cleanName,
            engine: "redis",
            username: "default",
            createdAt: new Date().toISOString(),
            users: ["default"]
          };
        }
        dbList.push({ ...databases[cleanName], engine: "redis" });
      });
    } catch (err) {
      // Redis might not be installed
    }
    
    // Calculate sizes for each database
    for (const db of dbList) {
      db.size = await calculateDatabaseSize(db.name, db.engine);
      db.userCount = db.users ? db.users.length : 1;
    }
    
    return dbList;
  } catch (err) {
    alert.warning(`Failed to get databases: ${err}`);
    return [];
  }
}

// Calculate Database Size
async function calculateDatabaseSize(dbName, engine) {
  try {
    if (engine === "mysql") {
      const size = await run(`mysql -u root -e "SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size FROM information_schema.tables WHERE table_schema = '${dbName}';" | tail -1`);
      return `${size.trim()} MB`;
    } else if (engine === "postgres") {
      const size = await run(`sudo -u postgres psql -c "SELECT pg_size_pretty(pg_database_size('${dbName}'));" | tail -1`);
      return size.trim();
    } else if (engine === "redis") {
      const size = await run(`redis-cli MEMORY USAGE ${dbName}`);
      return size.trim() ? `${(parseInt(size.trim()) / 1024 / 1024).toFixed(2)} MB` : "0 MB";
    }
    return "Unknown";
  } catch (err) {
    return "Unknown";
  }
}

// Open Database
async function openDatabase(dbName) {
  try {
    if (!databases[dbName]) {
      throw new Error("Database not found");
    }
    
    const db = databases[dbName];
    let connectionUrl = "";
    
    if (db.engine === "mysql") {
      connectionUrl = `mysql://${db.username}:****@localhost:3306/${dbName}`;
    } else if (db.engine === "postgres") {
      connectionUrl = `postgresql://${db.username}:****@localhost:5432/${dbName}`;
    } else if (db.engine === "redis") {
      connectionUrl = `redis://localhost:6379/${dbName}`;
    }
    
    logDBEvent("db_opened", `Database opened: ${dbName}`);
    
    return {
      name: dbName,
      engine: db.engine,
      connectionUrl,
      webInterface: db.engine === "mysql" ? "http://localhost/phpmyadmin" : 
                      db.engine === "postgres" ? "http://localhost/pgadmin" : 
                      "redis-cli"
    };
  } catch (err) {
    logDBEvent("db_error", `Failed to open database ${dbName}: ${err}`);
    alert.warning(`Failed to open database: ${err}`);
    throw err;
  }
}

// Backup Database
async function backupDatabase(dbName) {
  try {
    if (!databases[dbName]) {
      throw new Error("Database not found");
    }
    
    const db = databases[dbName];
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupPath = `/var/backups/db/${dbName}-${timestamp}.sql`;
    
    // Ensure backup directory exists
    await run(`mkdir -p /var/backups/db`);
    
    if (db.engine === "mysql") {
      await run(`mysqldump -u root ${dbName} > ${backupPath}`);
    } else if (db.engine === "postgres") {
      await run(`sudo -u postgres pg_dump ${dbName} > ${backupPath}`);
    } else if (db.engine === "redis") {
      await run(`redis-cli --rdb ${backupPath.replace('.sql', '.rdb')}`);
    }
    
    // Get file size
    const stats = fs.statSync(backupPath);
    const fileSize = (stats.size / 1024 / 1024).toFixed(2);
    
    // Store backup info
    backups[`${dbName}-${timestamp}`] = {
      database: dbName,
      path: backupPath,
      size: `${fileSize} MB`,
      createdAt: new Date().toISOString()
    };
    
    logDBEvent("db_backup", `Database backed up: ${dbName} (${fileSize} MB)`);
    alert.info(`Database backed up: ${dbName} (${fileSize} MB)`);
    
    return backups[`${dbName}-${timestamp}`];
  } catch (err) {
    logDBEvent("db_error", `Backup failed for ${dbName}: ${err}`);
    alert.warning(`Failed to backup database: ${err}`);
    throw err;
  }
}

// Restore Database
async function restoreDatabase(dbName, backupFile) {
  try {
    if (!databases[dbName]) {
      throw new Error("Database not found");
    }
    
    const db = databases[dbName];
    
    if (db.engine === "mysql") {
      await run(`mysql -u root ${dbName} < ${backupFile}`);
    } else if (db.engine === "postgres") {
      await run(`sudo -u postgres psql ${dbName} < ${backupFile}`);
    } else if (db.engine === "redis") {
      await run(`redis-cli --rdb ${backupFile}`);
    }
    
    logDBEvent("db_restore", `Database restored: ${dbName} from ${backupFile}`);
    alert.info(`Database restored: ${dbName}`);
    
    return true;
  } catch (err) {
    logDBEvent("db_error", `Restore failed for ${dbName}: ${err}`);
    alert.warning(`Failed to restore database: ${err}`);
    throw err;
  }
}

// Add Database User
async function addDatabaseUser(dbName, username, password) {
  try {
    if (!databases[dbName]) {
      throw new Error("Database not found");
    }
    
    const db = databases[dbName];
    
    if (db.engine === "mysql") {
      await run(`mysql -u root -e "CREATE USER '${username}'@'localhost' IDENTIFIED BY '${password}';"`);
      await run(`mysql -u root -e "GRANT ALL PRIVILEGES ON \`${dbName}\`.* TO '${username}'@'localhost';"`);
      await run(`mysql -u root -e "FLUSH PRIVILEGES;"`);
    } else if (db.engine === "postgres") {
      await run(`sudo -u postgres psql -c "CREATE USER ${username} WITH PASSWORD '${password}';"`);
      await run(`sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${dbName} TO ${username};"`);
    } else if (db.engine === "redis") {
      // Redis doesn't have users in the same way
      throw new Error("Redis does not support user management");
    }
    
    // Update storage
    if (!db.users) db.users = [];
    db.users.push(username);
    
    dbUsers[username] = {
      username,
      passwordHash: crypto.createHash("sha256").update(password).digest("hex"),
      databases: [dbName],
      createdAt: new Date().toISOString()
    };
    
    logDBEvent("db_user_added", `User added to database: ${username} -> ${dbName}`);
    alert.info(`User added to database: ${username} -> ${dbName}`);
    
    return dbUsers[username];
  } catch (err) {
    logDBEvent("db_error", `Failed to add user to ${dbName}: ${err}`);
    alert.warning(`Failed to add user: ${err}`);
    throw err;
  }
}

// Remove Database User
async function removeDatabaseUser(dbName, username) {
  try {
    if (!databases[dbName]) {
      throw new Error("Database not found");
    }
    
    const db = databases[dbName];
    
    if (db.engine === "mysql") {
      await run(`mysql -u root -e "REVOKE ALL PRIVILEGES ON \`${dbName}\`.* FROM '${username}'@'localhost';"`);
      await run(`mysql -u root -e "DROP USER '${username}'@'localhost';"`);
    } else if (db.engine === "postgres") {
      await run(`sudo -u postgres psql -c "REVOKE ALL PRIVILEGES ON DATABASE ${dbName} FROM ${username};"`);
      await run(`sudo -u postgres psql -c "DROP USER ${username};"`);
    } else if (db.engine === "redis") {
      throw new Error("Redis does not support user management");
    }
    
    // Update storage
    db.users = db.users.filter(u => u !== username);
    delete dbUsers[username];
    
    logDBEvent("db_user_removed", `User removed from database: ${username} -> ${dbName}`);
    alert.info(`User removed from database: ${username} -> ${dbName}`);
    
    return true;
  } catch (err) {
    logDBEvent("db_error", `Failed to remove user from ${dbName}: ${err}`);
    alert.warning(`Failed to remove user: ${err}`);
    throw err;
  }
}

// Update Database User Password
async function updateDatabaseUserPassword(username, newPassword) {
  try {
    if (!dbUsers[username]) {
      throw new Error("User not found");
    }
    
    // Find which databases this user has access to
    const userDBs = dbUsers[username].databases || [];
    
    for (const dbName of userDBs) {
      const db = databases[dbName];
      if (db.engine === "mysql") {
        await run(`mysql -u root -e "ALTER USER '${username}'@'localhost' IDENTIFIED BY '${newPassword}';"`);
      } else if (db.engine === "postgres") {
        await run(`sudo -u postgres psql -c "ALTER USER ${username} WITH PASSWORD '${newPassword}';"`);
      }
    }
    
    // Update storage
    dbUsers[username].passwordHash = crypto.createHash("sha256").update(newPassword).digest("hex");
    
    logDBEvent("db_password_updated", `Password updated for user: ${username}`);
    alert.info(`Password updated for user: ${username}`);
    
    return true;
  } catch (err) {
    logDBEvent("db_error", `Failed to update password for ${username}: ${err}`);
    alert.warning(`Failed to update password: ${err}`);
    throw err;
  }
}

// Delete Database
async function deleteDatabase(dbName) {
  try {
    if (!databases[dbName]) {
      throw new Error("Database not found");
    }
    
    const db = databases[dbName];
    
    if (db.engine === "mysql") {
      await run(`mysql -u root -e "DROP DATABASE IF EXISTS \`${dbName}\`;"`);
    } else if (db.engine === "postgres") {
      await run(`sudo -u postgres psql -c "DROP DATABASE IF EXISTS ${dbName};"`);
    } else if (db.engine === "redis") {
      await run(`redis-cli DEL ${dbName}:exists`);
    }
    
    // Remove users associated with this database
    if (db.users) {
      for (const username of db.users) {
        if (dbUsers[username] && dbUsers[username].databases.length === 1) {
          delete dbUsers[username];
        }
      }
    }
    
    delete databases[dbName];
    
    logDBEvent("db_deleted", `Database deleted: ${dbName}`);
    alert.warning(`Database deleted: ${dbName}`);
    
    return true;
  } catch (err) {
    logDBEvent("db_error", `Failed to delete database ${dbName}: ${err}`);
    alert.warning(`Failed to delete database: ${err}`);
    throw err;
  }
}

// Get Database Users
async function getDatabaseUsers(dbName) {
  try {
    if (!databases[dbName]) {
      throw new Error("Database not found");
    }
    
    const db = databases[dbName];
    const users = [];
    
    if (db.engine === "mysql") {
      const userList = await run(`mysql -u root -e "SELECT user FROM mysql.db WHERE db='${dbName}';" | grep -v "user"`);
      userList.split('\n').filter(u => u.trim()).forEach(username => {
        users.push({ username: username.trim(), engine: "mysql" });
      });
    } else if (db.engine === "postgres") {
      const userList = await run(`sudo -u postgres psql -c "SELECT usename FROM pg_user WHERE usesysid IN (SELECT usesysid FROM pg_shard WHERE shdbid = (SELECT oid FROM pg_database WHERE datname='${dbName}'));" | grep -v "usename\\|---"`);
      userList.split('\n').filter(u => u.trim()).forEach(username => {
        users.push({ username: username.trim(), engine: "postgres" });
      });
    } else if (db.engine === "redis") {
      users.push({ username: "default", engine: "redis" });
    }
    
    return users;
  } catch (err) {
    alert.warning(`Failed to get database users: ${err}`);
    return [];
  }
}

// Get Backups
async function getBackups(dbName = null) {
  try {
    const backupList = [];
    
    for (const key of Object.keys(backups)) {
      if (!dbName || backups[key].database === dbName) {
        backupList.push(backups[key]);
      }
    }
    
    return backupList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (err) {
    alert.warning(`Failed to get backups: ${err}`);
    return [];
  }
}

// Auto Heal
async function autoHealDatabase(dbName) {
  try {
    if (!databases[dbName]) {
      throw new Error("Database not found");
    }
    
    const db = databases[dbName];
    let service = "";
    
    if (db.engine === "mysql") {
      service = "mysql";
    } else if (db.engine === "postgres") {
      service = "postgresql";
    } else if (db.engine === "redis") {
      service = "redis";
    }
    
    // Check if service is running
    const status = await run(`systemctl is-active ${service}`);
    
    if (!status.includes("active")) {
      await run(`systemctl start ${service}`);
      alert.critical(`${service} auto-restarted for ${dbName}`);
    }
    
    logDBEvent("db_auto_heal", `Auto heal completed for ${dbName}`);
  } catch (err) {
    logDBEvent("db_error", `Auto heal failed for ${dbName}: ${err}`);
    alert.warning(`Auto heal failed: ${err}`);
  }
}

// Logging
function logDBEvent(type, message) {
  dbLogs.push({
    type,
    message,
    timestamp: new Date().toISOString()
  });
  
  if (dbLogs.length > 1000) {
    dbLogs.shift();
  }
}

async function getDBLogs(limit = 100) {
  return dbLogs.slice(-limit).reverse();
}

// Edge Case Handling
async function checkDatabaseLock(dbName) {
  try {
    if (databases[dbName] && databases[dbName].engine === "mysql") {
      const locks = await run(`mysql -u root -e "SHOW OPEN TABLES FROM \`${dbName}\` WHERE In_use > 0;"`);
      return locks.trim().length > 0;
    }
    return false;
  } catch (err) {
    return false;
  }
}

// Exports
exports.createDatabase = createDatabase;
exports.getDatabases = getDatabases;
exports.openDatabase = openDatabase;
exports.backupDatabase = backupDatabase;
exports.restoreDatabase = restoreDatabase;
exports.addDatabaseUser = addDatabaseUser;
exports.removeDatabaseUser = removeDatabaseUser;
exports.updateDatabaseUserPassword = updateDatabaseUserPassword;
exports.deleteDatabase = deleteDatabase;
exports.getDatabaseUsers = getDatabaseUsers;
exports.getBackups = getBackups;
exports.autoHealDatabase = autoHealDatabase;
exports.getDBLogs = getDBLogs;
exports.checkDatabaseLock = checkDatabaseLock;
