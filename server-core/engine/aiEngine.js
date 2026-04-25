const alert = require("./alert");

const patterns = {
  serviceCrashes: {},
  memoryLeaks: {},
  heavyEndpoints: {}
};

exports.detectPattern = (type, key) => {
  if (!patterns[type][key]) {
    patterns[type][key] = { count: 0, firstSeen: Date.now() };
  }
  
  patterns[type][key].count++;
  const timeSinceFirst = Date.now() - patterns[type][key].firstSeen;
  
  // Pattern: repeated crash within 1 hour
  if (type === "serviceCrashes" && patterns[type][key].count > 3 && timeSinceFirst < 3600000) {
    alert.critical(`Pattern detected: ${key} crashed ${patterns[type][key].count} times in 1 hour - PERMANENT FIX NEEDED`);
    return "permanent_fix";
  }
  
  // Pattern: memory leak
  if (type === "memoryLeaks" && patterns[type][key].count > 5 && timeSinceFirst < 1800000) {
    alert.warning(`Pattern detected: Memory leak in ${key} - SCHEDULED RESTART CYCLE`);
    return "restart_cycle";
  }
  
  // Pattern: heavy endpoint
  if (type === "heavyEndpoints" && patterns[type][key].count > 10 && timeSinceFirst < 600000) {
    alert.warning(`Pattern detected: Heavy endpoint ${key} - THROTTLE API`);
    return "throttle_api";
  }
  
  return null;
};

exports.resetPattern = (type, key) => {
  if (patterns[type][key]) {
    delete patterns[type][key];
  }
};

exports.getPatterns = () => {
  return patterns;
};
