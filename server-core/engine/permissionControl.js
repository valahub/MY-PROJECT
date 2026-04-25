const alert = require("./alert");

const roles = {
  owner: {
    permissions: ["full"],
    description: "Full access to all features"
  },
  dev: {
    permissions: ["view", "restart", "logs", "database"],
    description: "Limited access - can view, restart services, view logs, manage databases"
  },
  operator: {
    permissions: ["view", "logs"],
    description: "Monitor only - can view status and logs"
  }
};

const userRoles = {
  "admin": "owner",
  "developer": "dev",
  "support": "operator"
};

function hasPermission(userId, action) {
  const userRole = userRoles[userId] || "operator";
  const rolePermissions = roles[userRole].permissions;
  
  if (userRole === "owner") return true;
  
  return rolePermissions.includes(action);
}

function checkPermission(userId, action) {
  if (!hasPermission(userId, action)) {
    alert.warning(`Permission denied: User ${userId} attempted ${action}`);
    return false;
  }
  return true;
}

exports.hasPermission = hasPermission;
exports.checkPermission = checkPermission;
exports.getRoles = () => roles;
exports.getUserRole = (userId) => userRoles[userId] || "operator";
