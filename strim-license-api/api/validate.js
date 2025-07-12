const connectDB = require("../db");

module.exports = async (req, res) => {
  const { key, device_id } = req.query;
  if (!key || !device_id) return res.status(400).json({ valid: false });

  const db = await connectDB();
  const licenses = db.collection("licenses");

  const license = await licenses.findOne({ key });

  if (!license || !license.activated || license.device_id !== device_id)
    return res.status(403).json({ valid: false });

  const now = new Date();
  if (new Date(license.expires_at) < now)
    return res.status(403).json({ valid: false, reason: "Kadaluarsa" });

  const days_left = Math.ceil((new Date(license.expires_at) - now) / (1000 * 60 * 60 * 24));

  return res.json({ valid: true, expires_at: license.expires_at, days_left });
};
