const express = require('express');
const router = express.Router();
const extensionManager = require('../engine/extensionManager');

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

// POST /api/server/extensions/install - Install extension
router.post('/install', checkPermission('admin'), async (req, res) => {
  try {
    const { extensionKey } = req.body;
    
    if (!extensionKey) {
      return res.status(400).json({
        success: false,
        message: 'Missing extensionKey'
      });
    }
    
    const result = await extensionManager.installExtension(extensionKey, req.userRole);
    
    res.json({
      success: true,
      message: 'Extension installation started',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET /api/server/extensions/list - List all extensions
router.get('/list', checkPermission('developer'), async (req, res) => {
  try {
    const extensions = await extensionManager.getExtensionList();
    
    res.json({
      success: true,
      data: extensions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET /api/server/extensions/:key/status - Get extension status
router.get('/:key/status', checkPermission('developer'), async (req, res) => {
  try {
    const { key } = req.params;
    const status = await extensionManager.getExtensionStatus(key);
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// POST /api/server/extensions/uninstall - Uninstall extension
router.post('/uninstall', checkPermission('admin'), async (req, res) => {
  try {
    const { extensionKey } = req.body;
    
    if (!extensionKey) {
      return res.status(400).json({
        success: false,
        message: 'Missing extensionKey'
      });
    }
    
    const result = await extensionManager.uninstallExtension(extensionKey, req.userRole);
    
    res.json({
      success: true,
      message: 'Extension uninstalled successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// POST /api/server/extensions/update - Update extension
router.post('/update', checkPermission('admin'), async (req, res) => {
  try {
    const { extensionKey } = req.body;
    
    if (!extensionKey) {
      return res.status(400).json({
        success: false,
        message: 'Missing extensionKey'
      });
    }
    
    const result = await extensionManager.updateExtension(extensionKey, req.userRole);
    
    res.json({
      success: true,
      message: 'Extension updated successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// POST /api/server/extensions/toggle - Enable/disable extension
router.post('/toggle', checkPermission('server_manager'), async (req, res) => {
  try {
    const { extensionKey, enabled } = req.body;
    
    if (!extensionKey || enabled === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing extensionKey or enabled'
      });
    }
    
    const result = await extensionManager.toggleExtension(extensionKey, enabled, req.userRole);
    
    res.json({
      success: true,
      message: `Extension ${enabled ? 'enabled' : 'disabled'} successfully`,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET /api/server/extensions/:key/logs - Get extension logs
router.get('/:key/logs', checkPermission('developer'), async (req, res) => {
  try {
    const { key } = req.params;
    const { limit = 100 } = req.query;
    
    const logs = await extensionManager.getExtensionLogs(key, parseInt(limit));
    
    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET /api/server/extensions/marketplace/sync - Sync marketplace
router.get('/marketplace/sync', checkPermission('developer'), async (req, res) => {
  try {
    const extensions = await extensionManager.syncMarketplace();
    
    res.json({
      success: true,
      data: extensions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET /api/server/extensions/:key/resource-usage - Get resource usage
router.get('/:key/resource-usage', checkPermission('developer'), async (req, res) => {
  try {
    const { key } = req.params;
    const usage = await extensionManager.getExtensionResourceUsage(key);
    
    res.json({
      success: true,
      data: usage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET /api/server/extensions/install/:installId/progress - Get install progress
router.get('/install/:installId/progress', checkPermission('developer'), async (req, res) => {
  try {
    const { installId } = req.params;
    const progress = await extensionManager.getInstallProgress(installId);
    
    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// POST /api/server/extensions/retry-install - Retry failed install
router.post('/retry-install', checkPermission('admin'), async (req, res) => {
  try {
    const { extensionKey } = req.body;
    
    if (!extensionKey) {
      return res.status(400).json({
        success: false,
        message: 'Missing extensionKey'
      });
    }
    
    const result = await extensionManager.retryInstall(extensionKey, req.userRole);
    
    res.json({
      success: true,
      message: 'Install retry started',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// POST /api/server/extensions/self-heal - Trigger self-heal
router.post('/self-heal', checkPermission('admin'), async (req, res) => {
  try {
    const broken = await extensionManager.autoDisableBrokenExtensions();
    const reinitialized = await extensionManager.reinitMissingServices();
    
    res.json({
      success: true,
      message: 'Self-heal completed',
      data: {
        disabled: broken,
        reinitialized
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Extension-specific manage routes
// Backup Manager
router.post('/backup/create', checkPermission('server_manager'), async (req, res) => {
  try {
    const { source, destination } = req.body;
    await extensionManager.createBackup(source, destination);
    res.json({ success: true, message: 'Backup created' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/backup/restore', checkPermission('server_manager'), async (req, res) => {
  try {
    const { backupFile, destination } = req.body;
    await extensionManager.restoreBackup(backupFile, destination);
    res.json({ success: true, message: 'Backup restored' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Git Deploy
router.post('/git/clone', checkPermission('server_manager'), async (req, res) => {
  try {
    const { repoUrl, destination, branch } = req.body;
    await extensionManager.cloneRepo(repoUrl, destination, branch);
    res.json({ success: true, message: 'Repository cloned' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/git/pull', checkPermission('server_manager'), async (req, res) => {
  try {
    const { destination } = req.body;
    await extensionManager.pullRepo(destination);
    res.json({ success: true, message: 'Repository pulled' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ImunifyAV
router.post('/imunify/scan', checkPermission('server_manager'), async (req, res) => {
  try {
    const { path } = req.body;
    await extensionManager.scanMalware(path);
    res.json({ success: true, message: 'Scan completed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/imunify/clean', checkPermission('server_manager'), async (req, res) => {
  try {
    const { path } = req.body;
    await extensionManager.cleanInfected(path);
    res.json({ success: true, message: 'Infected files cleaned' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Docker Manager
router.post('/docker/run', checkPermission('server_manager'), async (req, res) => {
  try {
    const { image, name } = req.body;
    await extensionManager.runContainer(image, name);
    res.json({ success: true, message: 'Container started' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/docker/stop', checkPermission('server_manager'), async (req, res) => {
  try {
    const { name } = req.body;
    await extensionManager.stopContainer(name);
    res.json({ success: true, message: 'Container stopped' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/docker/logs/:name', checkPermission('server_manager'), async (req, res) => {
  try {
    const { name } = req.params;
    const logs = await extensionManager.getContainerLogs(name);
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/docker/images', checkPermission('server_manager'), async (req, res) => {
  try {
    const images = await extensionManager.listImages();
    res.json({ success: true, data: images });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Node.js Toolkit
router.post('/nodejs/npm-install', checkPermission('server_manager'), async (req, res) => {
  try {
    const { path } = req.body;
    await extensionManager.npmInstall(path);
    res.json({ success: true, message: 'npm install completed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/nodejs/pm2-start', checkPermission('server_manager'), async (req, res) => {
  try {
    const { path, name } = req.body;
    await extensionManager.startAppWithPM2(path, name);
    res.json({ success: true, message: 'App started with PM2' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Let's Encrypt
router.post('/letsencrypt/issue', checkPermission('server_manager'), async (req, res) => {
  try {
    const { domain } = req.body;
    await extensionManager.issueSSL(domain);
    res.json({ success: true, message: 'SSL issued' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/letsencrypt/renew', checkPermission('server_manager'), async (req, res) => {
  try {
    await extensionManager.renewSSL();
    res.json({ success: true, message: 'SSL renewed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
