const priorities = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL"
};

exports.priorities = priorities;

exports.log = (msg, priority = priorities.LOW) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${priority}] ${msg}`);
};

exports.critical = (msg) => {
  this.log(msg, priorities.CRITICAL);
  // future: webhook / whatsapp / email
};

exports.warning = (msg) => {
  this.log(msg, priorities.MEDIUM);
};

exports.info = (msg) => {
  this.log(msg, priorities.LOW);
};

exports.high = (msg) => {
  this.log(msg, priorities.HIGH);
};
