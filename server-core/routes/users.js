const express = require('express');
const router = express.Router();
const userManager = require('../engine/userManager');

// Permission middleware
const checkPermission = (requiredRole) => {
  return (req, res, next) => {
    // In production, verify from session/token
    const userRole = req.headers['x-user-role'] || 'developer';
    
    const roleHierarchy = {
      'owner': 4,
      'admin': 3,
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

// POST /server/users/create - Create new user
router.post('/create', checkPermission('admin'), async (req, res) => {
  try {
    const { username, email, password, role, status = 'active' } = req.body;
    
    if (!username || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: username, email, password, role'
      });
    }
    
    const result = await userManager.createUser({
      username,
      email,
      password,
      role,
      status
    }, req.userRole);
    
    res.json({
      success: true,
      message: 'User created successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET /server/users - List all users
router.get('/', checkPermission('developer'), async (req, res) => {
  try {
    const { search, role, status, page = 1, limit = 50 } = req.query;
    
    const filters = {};
    if (search) filters.search = search;
    if (role) filters.role = role;
    if (status) filters.status = status;
    
    const result = await userManager.searchUsers(filters, parseInt(page), parseInt(limit));
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// PUT /server/users/update/:id - Update user
router.put('/update/:id', checkPermission('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, role, status } = req.body;
    
    const result = await userManager.updateUser(id, {
      username,
      email,
      role,
      status
    }, req.userRole);
    
    res.json({
      success: true,
      message: 'User updated successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// POST /server/users/suspend - Suspend user
router.post('/suspend', checkPermission('admin'), async (req, res) => {
  try {
    const { userId, reason } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Missing userId'
      });
    }
    
    const result = await userManager.suspendUser(userId, reason, req.userRole);
    
    res.json({
      success: true,
      message: 'User suspended successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// POST /server/users/activate - Activate user
router.post('/activate', checkPermission('admin'), async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Missing userId'
      });
    }
    
    const result = await userManager.activateUser(userId, req.userRole);
    
    res.json({
      success: true,
      message: 'User activated successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// POST /server/users/delete - Delete user (soft delete)
router.post('/delete', checkPermission('admin'), async (req, res) => {
  try {
    const { userId, hard = false } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Missing userId'
      });
    }
    
    const result = await userManager.deleteUser(userId, hard, req.userRole);
    
    res.json({
      success: true,
      message: hard ? 'User permanently deleted' : 'User deleted successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// POST /server/users/reset-password - Reset user password
router.post('/reset-password', checkPermission('admin'), async (req, res) => {
  try {
    const { userId, newPassword } = req.body;
    
    if (!userId || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Missing userId or newPassword'
      });
    }
    
    const result = await userManager.resetPassword(userId, newPassword, req.userRole);
    
    res.json({
      success: true,
      message: 'Password reset successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// POST /server/users/logout-all - Force logout all sessions
router.post('/logout-all', checkPermission('admin'), async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Missing userId'
      });
    }
    
    const result = await userManager.killAllSessions(userId, req.userRole);
    
    res.json({
      success: true,
      message: 'All sessions terminated successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// POST /server/users/logout-session - Kill specific session
router.post('/logout-session', checkPermission('admin'), async (req, res) => {
  try {
    const { userId, sessionId } = req.body;
    
    if (!userId || !sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Missing userId or sessionId'
      });
    }
    
    const result = await userManager.killSession(userId, sessionId, req.userRole);
    
    res.json({
      success: true,
      message: 'Session terminated successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET /server/users/sessions/:id - Get user sessions
router.get('/sessions/:id', checkPermission('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const sessions = await userManager.getActiveSessions(id);
    
    res.json({
      success: true,
      data: sessions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET /server/users/logs - Get audit logs
router.get('/logs', checkPermission('admin'), async (req, res) => {
  try {
    const { userId, action, limit = 100 } = req.query;
    
    const filters = {};
    if (userId) filters.userId = userId;
    if (action) filters.action = action;
    
    const logs = await userManager.getAuditLogs(filters, parseInt(limit));
    
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

// POST /server/users/invite - Invite user via email
router.post('/invite', checkPermission('admin'), async (req, res) => {
  try {
    const { email, role, expiresIn = 24 } = req.body;
    
    if (!email || !role) {
      return res.status(400).json({
        success: false,
        message: 'Missing email or role'
      });
    }
    
    const result = await userManager.inviteUser(email, role, expiresIn, req.userRole);
    
    res.json({
      success: true,
      message: 'Invite sent successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// POST /server/users/accept-invite - Accept invite
router.post('/accept-invite', async (req, res) => {
  try {
    const { token, username, password } = req.body;
    
    if (!token || !username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Missing token, username, or password'
      });
    }
    
    const result = await userManager.acceptInvite(token, username, password);
    
    res.json({
      success: true,
      message: 'Invite accepted successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET /server/users/role-usage - Get role usage count
router.get('/role-usage', checkPermission('admin'), async (req, res) => {
  try {
    const usage = await userManager.getRoleUsageCount();
    
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

// POST /server/users/bulk-suspend - Bulk suspend users
router.post('/bulk-suspend', checkPermission('admin'), async (req, res) => {
  try {
    const { userIds, reason } = req.body;
    
    if (!userIds || !Array.isArray(userIds)) {
      return res.status(400).json({
        success: false,
        message: 'Missing or invalid userIds array'
      });
    }
    
    const result = await userManager.bulkSuspendUsers(userIds, reason, req.userRole);
    
    res.json({
      success: true,
      message: 'Users suspended successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// POST /server/users/bulk-activate - Bulk activate users
router.post('/bulk-activate', checkPermission('admin'), async (req, res) => {
  try {
    const { userIds } = req.body;
    
    if (!userIds || !Array.isArray(userIds)) {
      return res.status(400).json({
        success: false,
        message: 'Missing or invalid userIds array'
      });
    }
    
    const result = await userManager.bulkActivateUsers(userIds, req.userRole);
    
    res.json({
      success: true,
      message: 'Users activated successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// POST /server/users/self-heal - Trigger self-heal
router.post('/self-heal', checkPermission('admin'), async (req, res) => {
  try {
    const { userId } = req.body;
    
    const result = await userManager.selfHealUser(userId, req.userRole);
    
    res.json({
      success: true,
      message: 'Self-heal completed',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// POST /server/users/login - User login
router.post('/login', async (req, res) => {
  try {
    const { username, password, deviceInfo, ipAddress } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Missing username or password'
      });
    }
    
    const result = await userManager.login(username, password, deviceInfo, ipAddress);
    
    res.json({
      success: true,
      message: 'Login successful',
      data: result
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message
    });
  }
});

// POST /server/users/logout - User logout
router.post('/logout', async (req, res) => {
  try {
    const { userId, sessionId } = req.body;
    
    if (!userId || !sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Missing userId or sessionId'
      });
    }
    
    const result = await userManager.logout(userId, sessionId);
    
    res.json({
      success: true,
      message: 'Logout successful',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
