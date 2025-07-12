const connectDB = require("../db");

module.exports = async (req, res) => {
  const { key } = req.query;
  if (!key) return res.status(400).json({ success: false, reason: "Key tidak diberikan" });

  const db = await connectDB();
  const licenses = db.collection("licenses");

  const license = await licenses.findOne({ key });
  if (!license) return res.status(404).json({ success: false, reason: "Lisensi tidak ditemukan" });

  await licenses.updateOne({ key }, {
    $set: {
      activated: false,
      device_id: null,
      activated_at: null,
      expires_at: null
    }
  });

  return res.json({ success: true, message: `Lisensi ${key} berhasil di-reset.` });
};
