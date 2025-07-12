const connectDB = require("../db");

module.exports = async (req, res) => {
  const { key, device_id } = req.query;
  console.log("🔑 Key diterima:", key);
  console.log("🖥️ Device ID:", device_id);

  if (!key || !device_id) {
    console.log("⛔ Key atau device_id tidak dikirim");
    return res.status(400).json({ valid: false });
  }

  const db = await connectDB();
  const licenses = db.collection("licenses");

  const license = await licenses.findOne({ key });

  console.log("📄 Data License dari DB:", license);

  if (!license) {
    console.log("❌ Lisensi tidak ditemukan");
    return res.status(404).json({ valid: false, reason: "Key tidak ditemukan" });
  }

  if (license.activated === true && license.device_id && license.device_id !== device_id) {
    console.log("⚠️ Sudah dipakai di device lain:", license.device_id);
    return res.status(403).json({ valid: false, reason: "Sudah dipakai di device lain" });
  }

  const now = new Date();

  if (license.activated === true && license.device_id === device_id) {
    console.log("✅ Sudah aktif di device yang sama");
    return res.json({ valid: true, expires_at: license.expires_at });
  }

  // Aktivasi pertama kali
  const expiresAt = new Date(now.getTime() + license.duration_days * 86400000);

  await licenses.updateOne({ key }, {
    $set: {
      activated: true,
      device_id,
      activated_at: now,
      expires_at: expiresAt
    }
  });

  console.log("✅ Aktivasi berhasil, expires_at:", expiresAt);
  return res.json({ valid: true, expires_at: expiresAt });
};
