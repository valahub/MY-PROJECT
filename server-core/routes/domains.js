const express = require('express');
const router = express.Router();
const domainManager = require('../engine/domainManager');

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

// POST /api/server/domains/create - Create domain
router.post('/create', checkPermission('admin'), async (req, res) => {
  try {
    const { domain, sslEnabled, path } = req.body;
    const result = await domainManager.createDomain(domain, sslEnabled, path, req.userRole);
    res.json({ success: true, message: 'Domain created', data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/server/domains - List domains
router.get('/', checkPermission('developer'), async (req, res) => {
  try {
    const domains = await domainManager.listDomains();
    res.json({ success: true, data: domains });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/server/domains/:domain/status - Get domain status
router.get('/:domain/status', checkPermission('developer'), async (req, res) => {
  try {
    const { domain } = req.params;
    const status = await domainManager.checkDomainStatus(domain);
    res.json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/server/domains/ssl/issue - Issue SSL
router.post('/ssl/issue', checkPermission('admin'), async (req, res) => {
  try {
    const { domain } = req.body;
    const result = await domainManager.issueSSL(domain, req.userRole);
    res.json({ success: true, message: 'SSL issued', data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/server/domains/ssl/renew - Renew SSL
router.post('/ssl/renew', checkPermission('admin'), async (req, res) => {
  try {
    const { domain } = req.body;
    const result = await domainManager.renewSSL(domain, req.userRole);
    res.json({ success: true, message: 'SSL renewed', data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/server/domains/suspend - Suspend domain
router.post('/suspend', checkPermission('admin'), async (req, res) => {
  try {
    const { domain, reason } = req.body;
    const result = await domainManager.suspendDomain(domain, reason, req.userRole);
    res.json({ success: true, message: 'Domain suspended', data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/server/domains/activate - Activate domain
router.post('/activate', checkPermission('admin'), async (req, res) => {
  try {
    const { domain } = req.body;
    const result = await domainManager.activateDomain(domain, req.userRole);
    res.json({ success: true, message: 'Domain activated', data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/server/domains/:domain - Delete domain
router.delete('/:domain', checkPermission('admin'), async (req, res) => {
  try {
    const { domain } = req.params;
    const result = await domainManager.deleteDomain(domain, req.userRole);
    res.json({ success: true, message: 'Domain deleted', data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/server/domains/dns/add - Add DNS record
router.post('/dns/add', checkPermission('admin'), async (req, res) => {
  try {
    const { domain, type, name, value } = req.body;
    const result = await domainManager.addDNSRecord(domain, type, name, value, req.userRole);
    res.json({ success: true, message: 'DNS record added', data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/server/domains/dns/remove - Remove DNS record
router.post('/dns/remove', checkPermission('admin'), async (req, res) => {
  try {
    const { domain, type, name } = req.body;
    const result = await domainManager.removeDNSRecord(domain, type, name, req.userRole);
    res.json({ success: true, message: 'DNS record removed', data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/server/domains/:domain/dns - Get DNS records
router.get('/:domain/dns', checkPermission('developer'), async (req, res) => {
  try {
    const { domain } = req.params;
    const records = await domainManager.getDNSRecords(domain);
    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/server/domains/self-heal - Trigger self-heal
router.post('/self-heal', checkPermission('admin'), async (req, res) => {
  try {
    const { domain } = req.body;
    const result = await domainManager.selfHealDomain(domain, req.userRole);
    res.json({ success: true, message: 'Self-heal completed', data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
