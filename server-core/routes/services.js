const express = require('express');
const router = express.Router();
const serviceManager = require('../engine/serviceManager');

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

// GET /api/server/services - List all services
router.get('/', checkPermission('developer'), async (req, res) => {
  try {
    const services = await serviceManager.listServices();
    res.json({ success: true, data: services });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/server/services/:service/status - Get service status
router.get('/:service/status', checkPermission('developer'), async (req, res) => {
  try {
    const { service } = req.params;
    const status = await serviceManager.getServiceStatus(service);
    res.json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/server/services/start - Start service
router.post('/start', checkPermission('admin'), async (req, res) => {
  try {
    const { service } = req.body;
    const result = await serviceManager.startService(service, req.userRole);
    res.json({ success: true, message: 'Service started', data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/server/services/stop - Stop service
router.post('/stop', checkPermission('admin'), async (req, res) => {
  try {
    const { service } = req.body;
    const result = await serviceManager.stopService(service, req.userRole);
    res.json({ success: true, message: 'Service stopped', data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/server/services/restart - Restart service
router.post('/restart', checkPermission('admin'), async (req, res) => {
  try {
    const { service } = req.body;
    const result = await serviceManager.restartService(service, req.userRole);
    res.json({ success: true, message: 'Service restarted', data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/server/services/enable - Enable service
router.post('/enable', checkPermission('admin'), async (req, res) => {
  try {
    const { service } = req.body;
    const result = await serviceManager.enableService(service, req.userRole);
    res.json({ success: true, message: 'Service enabled', data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/server/services/disable - Disable service
router.post('/disable', checkPermission('admin'), async (req, res) => {
  try {
    const { service } = req.body;
    const result = await serviceManager.disableService(service, req.userRole);
    res.json({ success: true, message: 'Service disabled', data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/server/services/:service/logs - Get service logs
router.get('/:service/logs', checkPermission('developer'), async (req, res) => {
  try {
    const { service } = req.params;
    const { lines = 100 } = req.query;
    const logs = await serviceManager.getServiceLogs(service, parseInt(lines));
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/server/services/metrics - Get service metrics
router.get('/metrics', checkPermission('developer'), async (req, res) => {
  try {
    const metrics = await serviceManager.getServiceMetrics();
    res.json({ success: true, data: metrics });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/server/services/self-heal - Trigger self-heal
router.post('/self-heal', checkPermission('admin'), async (req, res) => {
  try {
    const { service } = req.body;
    const result = await serviceManager.selfHealService(service, req.userRole);
    res.json({ success: true, message: 'Self-heal completed', data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/server/services/bulk-restart - Bulk restart services
router.post('/bulk-restart', checkPermission('admin'), async (req, res) => {
  try {
    const { services } = req.body;
    const result = await serviceManager.bulkRestartServices(services, req.userRole);
    res.json({ success: true, message: 'Services restarted', data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
