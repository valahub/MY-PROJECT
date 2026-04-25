const { run } = require("../utils/exec");
const alert = require("./alert");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

// Application templates
const appTemplates = {
  wordpress: {
    name: "WordPress",
    type: "php",
    requires: ["php", "mysql"],
    installScript: installWordPress,
    port: 80
  },
  ghost: {
    name: "Ghost",
    type: "node",
    requires: ["node", "mysql"],
    installScript: installGhost,
    port: 2368
  },
  nodejs: {
    name: "Node.js App",
    type: "node",
    requires: ["node"],
    installScript: installNodeApp,
    port: 3000
  },
  laravel: {
    name: "Laravel",
    type: "php",
    requires: ["php", "mysql", "composer"],
    installScript: installLaravel,
    port: 80
  },
  static: {
    name: "Static Site",
    type: "static",
    requires: [],
    installScript: installStatic,
    port: 80
  },
  nextjs: {
    name: "Next.js",
    type: "node",
    requires: ["node", "npm"],
    installScript: installNextJS,
    port: 3000
  }
};

// Install queue
const installQueue = [];

// Installed apps
const installedApps = {};

// Rate limiting
const installRateLimit = {};

// Resource control
const MAX_PARALLEL_INSTALLS = 2;
let activeInstalls = 0;

// Install Application
async function installApplication(appType, domain, installPath, database = null, config = {}) {
  try {
    const jobId = crypto.randomBytes(16).toString("hex");
    
    // Validate domain
    const domainExists = await run(`dig +short ${domain}`);
    if (!domainExists.trim()) {
      throw new Error("Domain does not exist or does not point to this server");
    }
    
    // Validate path safety
    if (!installPath.startsWith("/var/www/")) {
      throw new Error("Install path must be under /var/www/");
    }
    
    // Check for existing app
    if (installedApps[domain]) {
      throw new Error("Application already exists on this domain");
    }
    
    // Rate limiting
    const now = Date.now();
    if (installRateLimit[domain] && now - installRateLimit[domain] < 30000) {
      throw new Error("Rate limit exceeded for this domain");
    }
    installRateLimit[domain] = now;
    
    // Resource control
    if (activeInstalls >= MAX_PARALLEL_INSTALLS) {
      // Queue the install
      installQueue.push({
        jobId,
        appType,
        domain,
        installPath,
        database,
        config,
        status: "queued",
        progress: 0,
        currentStep: "waiting for slot",
        logs: [],
        createdAt: new Date().toISOString()
      });
      
      logAppEvent("install_queued", `Install queued for ${appType} on ${domain}`);
      alert.info(`Install queued: ${appType} on ${domain}`);
      return { jobId, status: "queued" };
    }
    
    // Add to queue
    const job = {
      jobId,
      appType,
      domain,
      installPath,
      database,
      config,
      status: "installing",
      progress: 0,
      currentStep: "initializing",
      logs: [],
      createdAt: new Date().toISOString()
    };
    installQueue.push(job);
    activeInstalls++;
    
    // Start installation in background
    processInstall(job);
    
    logAppEvent("install_started", `Install started for ${appType} on ${domain}`);
    alert.info(`Install started: ${appType} on ${domain}`);
    
    return { jobId, status: "installing" };
  } catch (err) {
    logAppEvent("install_error", `Install failed to start: ${err}`);
    alert.warning(`Failed to start install: ${err}`);
    throw err;
  }
}

// Process install
async function processInstall(job) {
  try {
    const template = appTemplates[job.appType];
    if (!template) {
      throw new Error("Invalid application type");
    }
    
    // Update progress
    job.currentStep = "creating directory";
    job.progress = 5;
    job.logs.push(`Creating directory: ${job.installPath}`);
    
    // Create directory
    await run(`mkdir -p ${job.installPath}`);
    await run(`chown -R www-data:www-data ${job.installPath}`);
    
    // Auto config - create database if not provided
    if (!job.database && template.requires.includes("mysql")) {
      job.currentStep = "creating database";
      job.progress = 10;
      job.logs.push("Creating database");
      
      const dbName = `app_${job.domain.replace(/\./g, "_")}`;
      const dbUser = `user_${dbName.substring(0, 16)}`;
      const dbPassword = crypto.randomBytes(16).toString("hex");
      
      await run(`mysql -u root -e "CREATE DATABASE ${dbName};"`);
      await run(`mysql -u root -e "CREATE USER '${dbUser}'@'localhost' IDENTIFIED BY '${dbPassword}';"`);
      await run(`mysql -u root -e "GRANT ALL PRIVILEGES ON ${dbName}.* TO '${dbUser}'@'localhost';"`);
      await run(`mysql -u root -e "FLUSH PRIVILEGES;"`);
      
      job.database = {
        name: dbName,
        user: dbUser,
        password: dbPassword,
        host: "localhost"
      };
    }
    
    // Run app-specific install script
    await template.installScript(job);
    
    // Configure nginx
    job.currentStep = "configuring nginx";
    job.progress = 80;
    job.logs.push("Configuring nginx");
    
    await configureNginx(job.domain, job.installPath, template.port);
    
    // Setup SSL if requested
    if (job.config.ssl) {
      job.currentStep = "setting up SSL";
      job.progress = 90;
      job.logs.push("Setting up SSL");
      
      try {
        await run(`certbot --nginx -d ${job.domain} --non-interactive --agree-tos --email ${job.config.email || "admin@${job.domain}"}`);
      } catch (err) {
        job.logs.push(`SSL setup failed (continuing without SSL): ${err}`);
      }
    }
    
    // Create .env if needed
    if (job.database) {
      job.currentStep = "creating .env";
      job.progress = 95;
      job.logs.push("Creating .env file");
      
      const envContent = `
DB_HOST=${job.database.host}
DB_NAME=${job.database.name}
DB_USER=${job.database.user}
DB_PASSWORD=${job.database.password}
APP_URL=https://${job.domain}
`;
      fs.writeFileSync(`${job.installPath}/.env`, envContent);
    }
    
    // Complete
    job.status = "completed";
    job.progress = 100;
    job.currentStep = "completed";
    job.logs.push("Installation completed successfully");
    
    // Add to installed apps
    installedApps[job.domain] = {
      appType: job.appType,
      domain: job.domain,
      installPath: job.installPath,
      database: job.database,
      port: template.port,
      installedAt: new Date().toISOString(),
      ssl: job.config.ssl || false
    };
    
    activeInstalls--;
    
    logAppEvent("install_completed", `Install completed for ${job.appType} on ${job.domain}`);
    alert.info(`Install completed: ${job.appType} on ${job.domain}`);
    
    // Process next in queue
    processQueue();
    
  } catch (err) {
    job.status = "failed";
    job.currentStep = "failed";
    job.logs.push(`Installation failed: ${err}`);
    job.error = err.message;
    
    activeInstalls--;
    
    // Cleanup partial install
    await cleanupFailedInstall(job);
    
    logAppEvent("install_failed", `Install failed for ${job.appType} on ${job.domain}: ${err}`);
    alert.warning(`Install failed: ${job.appType} on ${job.domain} - ${err}`);
    
    // Process next in queue
    processQueue();
  }
}

// Process queue
async function processQueue() {
  const queuedJobs = installQueue.filter(j => j.status === "queued");
  if (queuedJobs.length > 0 && activeInstalls < MAX_PARALLEL_INSTALLS) {
    const nextJob = queuedJobs[0];
    nextJob.status = "installing";
    activeInstalls++;
    processInstall(nextJob);
  }
}

// Configure Nginx
async function configureNginx(domain, installPath, port) {
  const nginxConfig = `
server {
    listen 80;
    server_name ${domain};
    root ${installPath};
    index index.php index.html;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \\.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
    }

    location ~ /\\.ht {
        deny all;
    }
}
`;
  
  const configPath = `/etc/nginx/sites-available/${domain}.conf`;
  fs.writeFileSync(configPath, nginxConfig);
  await run(`ln -sf ${configPath} /etc/nginx/sites-enabled/${domain}.conf`);
  await run("nginx -t");
  await run("systemctl reload nginx");
}

// App-specific install scripts
async function installWordPress(job) {
  job.currentStep = "downloading WordPress";
  job.progress = 20;
  job.logs.push("Downloading WordPress");
  
  await run(`wget -q https://wordpress.org/latest.tar.gz -O /tmp/wordpress.tar.gz`);
  await run(`tar -xzf /tmp/wordpress.tar.gz -C ${job.installPath} --strip-components=1`);
  
  job.currentStep = "configuring WordPress";
  job.progress = 40;
  job.logs.push("Configuring WordPress");
  
  const wpConfig = `<?php
define('DB_NAME', '${job.database.name}');
define('DB_USER', '${job.database.user}');
define('DB_PASSWORD', '${job.database.password}');
define('DB_HOST', '${job.database.host}');
define('WP_DEBUG', false);
`;
  fs.writeFileSync(`${job.installPath}/wp-config.php`, wpConfig);
  
  job.currentStep = "setting permissions";
  job.progress = 60;
  job.logs.push("Setting permissions");
  
  await run(`chown -R www-data:www-data ${job.installPath}`);
  await run(`chmod -R 755 ${job.installPath}`);
}

async function installGhost(job) {
  job.currentStep = "installing Ghost CLI";
  job.progress = 20;
  job.logs.push("Installing Ghost CLI");
  
  await run(`npm install -g ghost-cli`);
  
  job.currentStep = "installing Ghost";
  job.progress = 40;
  job.logs.push("Installing Ghost");
  
  await run(`cd ${job.installPath} && ghost install local --dbhost ${job.database.host} --dbuser ${job.database.user} --dbpass ${job.database.password} --dbname ${job.database.name} --no-prompt`);
}

async function installNodeApp(job) {
  job.currentStep = "setting up Node.js app";
  job.progress = 20;
  job.logs.push("Setting up Node.js app");
  
  // Create basic package.json
  const packageJson = {
    name: job.domain,
    version: "1.0.0",
    scripts: {
      start: "node server.js"
    }
  };
  fs.writeFileSync(`${job.installPath}/package.json`, JSON.stringify(packageJson, null, 2));
  
  // Create basic server.js
  const serverJs = `
const http = require('http');
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end('<h1>Hello from ${job.domain}</h1>');
});
server.listen(${job.config.port || 3000}, () => {
  console.log('Server running on port ${job.config.port || 3000}');
});
`;
  fs.writeFileSync(`${job.installPath}/server.js`, serverJs);
  
  job.currentStep = "installing dependencies";
  job.progress = 40;
  job.logs.push("Installing dependencies");
  
  await run(`cd ${job.installPath} && npm install`);
  
  job.currentStep = "starting with PM2";
  job.progress = 60;
  job.logs.push("Starting with PM2");
  
  await run(`cd ${job.installPath} && pm2 start server.js --name ${job.domain}`);
}

async function installLaravel(job) {
  job.currentStep = "installing Composer";
  job.progress = 20;
  job.logs.push("Installing Laravel via Composer");
  
  await run(`composer create-project laravel/laravel ${job.installPath}`);
  
  job.currentStep = "configuring Laravel";
  job.progress = 40;
  job.logs.push("Configuring Laravel");
  
  const envPath = `${job.installPath}/.env`;
  let envContent = fs.readFileSync(envPath, "utf8");
  envContent = envContent.replace(/DB_HOST=.*/, `DB_HOST=${job.database.host}`);
  envContent = envContent.replace(/DB_DATABASE=.*/, `DB_DATABASE=${job.database.name}`);
  envContent = envContent.replace(/DB_USERNAME=.*/, `DB_USERNAME=${job.database.user}`);
  envContent = envContent.replace(/DB_PASSWORD=.*/, `DB_PASSWORD=${job.database.password}`);
  fs.writeFileSync(envPath, envContent);
  
  job.currentStep = "running migrations";
  job.progress = 60;
  job.logs.push("Running migrations");
  
  await run(`cd ${job.installPath} && php artisan key:generate`);
  await run(`cd ${job.installPath} && php artisan migrate --force`);
  
  job.currentStep = "setting permissions";
  job.progress = 70;
  job.logs.push("Setting permissions");
  
  await run(`chown -R www-data:www-data ${job.installPath}`);
  await run(`chmod -R 755 ${job.installPath}`);
  await run(`chmod -R 775 ${job.installPath}/storage`);
}

async function installStatic(job) {
  job.currentStep = "creating static site";
  job.progress = 20;
  job.logs.push("Creating static site");
  
  const indexHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>${job.domain}</title>
</head>
<body>
    <h1>Welcome to ${job.domain}</h1>
    <p>Your static site is live!</p>
</body>
</html>
`;
  fs.writeFileSync(`${job.installPath}/index.html`, indexHtml);
  
  job.currentStep = "setting permissions";
  job.progress = 60;
  job.logs.push("Setting permissions");
  
  await run(`chown -R www-data:www-data ${job.installPath}`);
  await run(`chmod -R 755 ${job.installPath}`);
}

async function installNextJS(job) {
  job.currentStep = "installing Next.js";
  job.progress = 20;
  job.logs.push("Installing Next.js");
  
  await run(`npx create-next-app@latest ${job.installPath} --typescript --tailwind --eslint --no-src-dir --app --no-import-alias --yes`);
  
  job.currentStep = "building";
  job.progress = 60;
  job.logs.push("Building Next.js app");
  
  await run(`cd ${job.installPath} && npm run build`);
  
  job.currentStep = "starting with PM2";
  job.progress = 70;
  job.logs.push("Starting with PM2");
  
  await run(`cd ${job.installPath} && pm2 start npm --name ${job.domain} -- start`);
}

// Get Install Queue
async function getInstallQueue() {
  return installQueue;
}

// Clear Completed
async function clearCompleted() {
  const beforeLength = installQueue.length;
  for (let i = installQueue.length - 1; i >= 0; i--) {
    if (installQueue[i].status === "completed") {
      installQueue.splice(i, 1);
    }
  }
  const cleared = beforeLength - installQueue.length;
  logAppEvent("queue_cleared", `Cleared ${cleared} completed jobs from queue`);
  alert.info(`Cleared ${cleared} completed jobs from queue`);
  return { cleared };
}

// Get Job Logs
async function getJobLogs(jobId) {
  const job = installQueue.find(j => j.jobId === jobId);
  if (!job) {
    throw new Error("Job not found");
  }
  return job.logs;
}

// Retry Failed Install
async function retryInstall(jobId) {
  const job = installQueue.find(j => j.jobId === jobId);
  if (!job) {
    throw new Error("Job not found");
  }
  
  if (job.status !== "failed") {
    throw new Error("Only failed jobs can be retried");
  }
  
  // Remove from queue
  const index = installQueue.indexOf(job);
  installQueue.splice(index, 1);
  
  // Retry install
  return await installApplication(job.appType, job.domain, job.installPath, job.database, job.config);
}

// Get Installed Apps
async function getInstalledApps() {
  return Object.values(installedApps);
}

// Cleanup Failed Install
async function cleanupFailedInstall(job) {
  try {
    if (fs.existsSync(job.installPath)) {
      await run(`rm -rf ${job.installPath}`);
    }
    
    // Remove nginx config
    const configPath = `/etc/nginx/sites-available/${job.domain}.conf`;
    if (fs.existsSync(configPath)) {
      await run(`rm -f ${configPath}`);
      await run(`rm -f /etc/nginx/sites-enabled/${job.domain}.conf`);
      await run("systemctl reload nginx");
    }
    
    // Remove database if created
    if (job.database && job.database.name.startsWith("app_")) {
      await run(`mysql -u root -e "DROP DATABASE IF EXISTS ${job.database.name};"`);
      await run(`mysql -u root -e "DROP USER IF EXISTS '${job.database.user}'@'localhost';"`);
    }
    
    job.logs.push("Cleanup completed");
  } catch (err) {
    job.logs.push(`Cleanup failed: ${err}`);
  }
}

// Delete App
async function deleteApp(domain) {
  try {
    if (!installedApps[domain]) {
      throw new Error("Application not found");
    }
    
    const app = installedApps[domain];
    
    // Stop service if running
    if (app.appType === "nodejs" || app.appType === "nextjs") {
      await run(`pm2 stop ${domain}`);
      await run(`pm2 delete ${domain}`);
    }
    
    // Remove files
    await run(`rm -rf ${app.installPath}`);
    
    // Remove nginx config
    const configPath = `/etc/nginx/sites-available/${domain}.conf`;
    if (fs.existsSync(configPath)) {
      await run(`rm -f ${configPath}`);
      await run(`rm -f /etc/nginx/sites-enabled/${domain}.conf`);
      await run("systemctl reload nginx");
    }
    
    // Remove database
    if (app.database) {
      await run(`mysql -u root -e "DROP DATABASE IF EXISTS ${app.database.name};"`);
      await run(`mysql -u root -e "DROP USER IF EXISTS '${app.database.user}'@'localhost';"`);
    }
    
    delete installedApps[domain];
    
    logAppEvent("app_deleted", `Application deleted: ${domain}`);
    alert.warning(`Application deleted: ${domain}`);
    return true;
  } catch (err) {
    logAppEvent("app_error", `App deletion failed for ${domain}: ${err}`);
    alert.warning(`Failed to delete app: ${err}`);
    throw err;
  }
}

// Logging
function logAppEvent(type, message) {
  const log = {
    type,
    message,
    timestamp: new Date().toISOString()
  };
  
  // Also add to job logs if applicable
  installQueue.forEach(job => {
    job.logs.push(`[${type}] ${message}`);
  });
}

// Get App Templates
async function getAppTemplates() {
  return Object.keys(appTemplates).map(key => ({
    key,
    name: appTemplates[key].name,
    type: appTemplates[key].type,
    requires: appTemplates[key].requires
  }));
}

// Exports
exports.installApplication = installApplication;
exports.getInstallQueue = getInstallQueue;
exports.clearCompleted = clearCompleted;
exports.getJobLogs = getJobLogs;
exports.retryInstall = retryInstall;
exports.getInstalledApps = getInstalledApps;
exports.deleteApp = deleteApp;
exports.getAppTemplates = getAppTemplates;
