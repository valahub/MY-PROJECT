const { run } = require("../utils/exec");
const alert = require("../engine/alert");

exports.loop = async () => {
  try {
    await run("certbot renew --quiet");
    alert.info("SSL certificates renewed");
  } catch (err) {
    alert.warning(`SSL renewal failed: ${err}`);
  }
};
