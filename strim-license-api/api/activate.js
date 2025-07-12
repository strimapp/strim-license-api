const connectDB = require("../db");

module.exports = async (req, res) => {
  const { key, device_id } = req.query;
  if (!key || !device_id) return res.status(400).json({ valid: false });

  const db = await connectDB();
  const licenses = db.collection("licenses");

  const license = await licenses.findOne({ key });

  if (!license) return res.status(404).json({ valid: false, reason: "Key tidak ditemukan" });

  // ❗ Perbaikan penting di sini:
  if (license.activated === true && license.device_id && license.device_id !== device_id)
    return res.status(403).json({ valid: false, reason: "Sudah dipakai di device lain" });

  const now = new Date();

  // Jika sudah aktif di device yang sama
  if (license.activated === true && license.device_id === device_id)
    return res.json({ valid: true, expires_at: license.expires_at });

  // Pertama kali aktivasi
  const expiresAt = new Date(now.getTime() + license.duration_days * 86400000);

  await licenses.updateOne({ key }, {
    $set: {
      activated: true,
      device_id,
      activated_at: now,
      expires_at: expiresAt
    }
  });

  return res.json({ valid: true, expires_at: expiresAt });
};
