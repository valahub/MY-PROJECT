const express = require('express');
const router = express.Router();
const settingsManager = require('../engine/settingsManager');

// Permission middleware
const checkPermission = (requiredRole) => {
  return (req, res, next) => {
    const userRole = req.headers['x-user-role'] || 'developer';
    
    const roleHierarchy = {
      'owner': 4,
      'admin': 3,
      'server_manager': 2.5,
      'developer': 2,
      'operator': 1,
      'deployer': 0
    };
    
    if (roleHierarchy[userRole] < roleHierarchy[requiredRole]) {
      return res.status(403).json({ 
        success: false, 
        message: 'Permission denied' 
      });
    }
    
    req.userRole = userRole;
    next();
  };
};

// POST /api/server/settings/php - Update PHP settings
router.post('/php', checkPermission('admin'), async (req, res) => {
  try {
    const result = await settingsManager.updatePHPSettings(req.body, req.userRole);
    res.json({ success: true, message: 'PHP settings updated', data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/server/settings/php/switch - Switch PHP version
router.post('/php/switch', checkPermission('admin'), async (req, res) => {
  try {
    const { version } = req.body;
    const result = await settingsManager.switchPHPVersion(version, req.userRole);
    res.json({ success: true, message: 'PHP version switched', data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/server/settings/nginx - Update Nginx settings
router.post('/nginx', checkPermission('admin'), async (req, res) => {
  try {
    const result = await settingsManager.updateNginxSettings(req.body, req.userRole);
    res.json({ success: true, message: 'Nginx settings updated', data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/server/settings/cron - Add cron job
router.post('/cron', checkPermission('admin'), async (req, res) => {
  try {
    const { cronExpression, command } = req.body;
    const result = await settingsManager.addCronJob(cronExpression, command, req.userRole);
    res.json({ success: true, message: 'Cron job added', data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/server/settings/cron - Delete cron job
router.delete('/cron', checkPermission('admin'), async (req, res) => {
  try {
    const { cronExpression, command } = req.body;
    const result = await settingsManager.deleteCronJob(cronExpression, command, req.userRole);
    res.json({ success: true, message: 'Cron job deleted', data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/server/settings/cron - List cron jobs
router.get('/cron', checkPermission('developer'), async (req, res) => {
  try {
    const jobs = await settingsManager.listCronJobs();
    res.json({ success: true, data: jobs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/server/settings/cron/run - Run cron job now
router.post('/cron/run', checkPermission('admin'), async (req, res) => {
  try {
    const { cronExpression, command } = req.body;
    const result = await settingsManager.runCronJobNow(cronExpression, command, req.userRole);
    res.json({ success: true, message: 'Cron job executed', data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/server/settings/scheduled-task - Create scheduled task
router.post('/scheduled-task', checkPermission('admin'), async (req, res) => {
  try {
    const { type, schedule } = req.body;
    const result = await settingsManager.createScheduledTask(type, schedule, req.userRole);
    res.json({ success: true, message: 'Scheduled task created', data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/server/settings/task/retry - Retry failed task
router.post('/task/retry', checkPermission('admin'), async (req, res) => {
  try {
    const { type } = req.body;
    const result = await settingsManager.retryFailedTask(type, req.userRole);
    res.json({ success: true, message: 'Task retried', data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/server/settings/ip/block - Block IP
router.post('/ip/block', checkPermission('admin'), async (req, res) => {
  try {
    const { ip, temporary, duration } = req.body;
    const result = await settingsManager.blockIP(ip, req.userRole, temporary, duration);
    res.json({ success: true, message: 'IP blocked', data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/server/settings/ip/unblock - Unblock IP
router.post('/ip/unblock', checkPermission('admin'), async (req, res) => {
  try {
    const { ip } = req.body;
    const result = await settingsManager.unblockIP(ip, req.userRole);
    res.json({ success: true, message: 'IP unblocked', data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/server/settings/ip/blocked - List blocked IPs
router.get('/ip/blocked', checkPermission('developer'), async (req, res) => {
  try {
    const ips = await settingsManager.listBlockedIPs();
    res.json({ success: true, data: ips });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/server/settings/mail - Update mail settings
router.post('/mail', checkPermission('admin'), async (req, res) => {
  try {
    const result = await settingsManager.updateMailSettings(req.body, req.userRole);
    res.json({ success: true, message: 'Mail settings updated', data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/server/settings/mail/test - Test mail
router.post('/mail/test', checkPermission('admin'), async (req, res) => {
  try {
    const { toEmail } = req.body;
    const result = await settingsManager.testMail(toEmail, req.userRole);
    res.json({ success: true, message: 'Test mail sent', data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/server/settings/dns/template - Apply DNS template
router.post('/dns/template', checkPermission('admin'), async (req, res) => {
  try {
    const { domain, templateName } = req.body;
    const result = await settingsManager.applyDNSTemplate(domain, templateName, req.userRole);
    res.json({ success: true, message: 'DNS template applied', data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/server/settings/dns/templates - Get DNS templates
router.get('/dns/templates', checkPermission('developer'), async (req, res) => {
  try {
    const templates = settingsManager.getDNSTemplates();
    res.json({ success: true, data: templates });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/server/settings/restart - Restart service
router.post('/restart', checkPermission('admin'), async (req, res) => {
  try {
    const { service } = req.body;
    const result = await settingsManager.restartService(service, req.userRole);
    res.json({ success: true, message: 'Service restarted', data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/server/settings/reboot - Reboot server
router.post('/reboot', checkPermission('admin'), async (req, res) => {
  try {
    const result = await settingsManager.rebootServer(req.userRole);
    res.json({ success: true, message: 'Server reboot initiated', data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/server/settings/restart/:id - Get restart status
router.get('/restart/:id', checkPermission('developer'), async (req, res) => {
  try {
    const { id } = req.params;
    const status = await settingsManager.getRestartStatus(id);
    res.json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/server/settings/restart/retry - Retry restart
router.post('/restart/retry', checkPermission('admin'), async (req, res) => {
  try {
    const { service } = req.body;
    const result = await settingsManager.retryRestart(service, req.userRole);
    res.json({ success: true, message: 'Restart retried', data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/server/settings/env - Update .env file
router.post('/env', checkPermission('admin'), async (req, res) => {
  try {
    const { key, value, envPath } = req.body;
    const result = await settingsManager.updateEnvFile(key, value, envPath, req.userRole);
    res.json({ success: true, message: 'Environment variable updated', data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/server/settings/cache/clear - Clear cache
router.post('/cache/clear', checkPermission('admin'), async (req, res) => {
  try {
    const { type } = req.body;
    const result = await settingsManager.clearCache(type, req.userRole);
    res.json({ success: true, message: 'Cache cleared', data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/server/settings/storage/clean - Clean storage
router.post('/storage/clean', checkPermission('admin'), async (req, res) => {
  try {
    const result = await settingsManager.cleanStorage(req.userRole);
    res.json({ success: true, message: 'Storage cleaned', data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/server/settings/backup/trigger - Trigger backup
router.post('/backup/trigger', checkPermission('admin'), async (req, res) => {
  try {
    const { path } = req.body;
    const result = await settingsManager.triggerBackup(path, req.userRole);
    res.json({ success: true, message: 'Backup triggered', data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/server/settings/backup/config - Update backup config
router.post('/backup/config', checkPermission('admin'), async (req, res) => {
  try {
    const result = await settingsManager.updateBackupConfig(req.body);
    res.json({ success: true, message: 'Backup config updated', data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/server/settings/backup/config - Get backup config
router.get('/backup/config', checkPermission('developer'), async (req, res) => {
  try {
    const config = settingsManager.getBackupConfig();
    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/server/settings/timezone - Set timezone
router.post('/timezone', checkPermission('admin'), async (req, res) => {
  try {
    const { timezone } = req.body;
    const result = await settingsManager.setTimezone(timezone);
    res.json({ success: true, message: 'Timezone set', data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/server/settings/locale - Set locale
router.post('/locale', checkPermission('admin'), async (req, res) => {
  try {
    const { locale } = req.body;
    const result = await settingsManager.setLocale(locale);
    res.json({ success: true, message: 'Locale set', data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/server/settings/service/start - Start service
router.post('/service/start', checkPermission('admin'), async (req, res) => {
  try {
    const { service } = req.body;
    const result = await settingsManager.startService(service);
    res.json({ success: true, message: 'Service started', data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/server/settings/service/stop - Stop service
router.post('/service/stop', checkPermission('admin'), async (req, res) => {
  try {
    const { service } = req.body;
    const result = await settingsManager.stopService(service);
    res.json({ success: true, message: 'Service stopped', data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/server/settings/service/:service/status - Get service status
router.get('/service/:service/status', checkPermission('developer'), async (req, res) => {
  try {
    const { service } = req.params;
    const status = await settingsManager.getServiceStatus(service);
    res.json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/server/settings/system/info - Get system info
router.get('/system/info', checkPermission('developer'), async (req, res) => {
  try {
    const info = await settingsManager.getSystemInfo();
    res.json({ success: true, data: info });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/server/settings/maintenance - Toggle maintenance mode
router.post('/maintenance', checkPermission('admin'), async (req, res) => {
  try {
    const { enabled, message } = req.body;
    const result = await settingsManager.toggleMaintenanceMode(enabled, message);
    res.json({ success: true, message: 'Maintenance mode toggled', data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/server/settings/maintenance - Get maintenance mode status
router.get('/maintenance', checkPermission('developer'), async (req, res) => {
  try {
    const status = settingsManager.getMaintenanceMode();
    res.json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/server/settings/permissions/fix - Fix permissions
router.post('/permissions/fix', checkPermission('admin'), async (req, res) => {
  try {
    const { path } = req.body;
    const result = await settingsManager.fixPermissions(path);
    res.json({ success: true, message: 'Permissions fixed', data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/server/settings/logs/rotation - Configure log rotation
router.post('/logs/rotation', checkPermission('admin'), async (req, res) => {
  try {
    const { days } = req.body;
    const result = await settingsManager.configureLogRotation(days);
    res.json({ success: true, message: 'Log rotation configured', data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/server/settings/logs - Get action logs
router.get('/logs', checkPermission('admin'), async (req, res) => {
  try {
    const { module, limit } = req.query;
    const logs = settingsManager.getActionLogs(module, parseInt(limit));
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
