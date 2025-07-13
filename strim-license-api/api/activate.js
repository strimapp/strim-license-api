import clientPromise from '../db';

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://admin.strim.my.id");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { key, device_id } = req.query;

    if (!key || !device_id) {
      return res.status(400).json({ valid: false, reason: "Key dan Device ID diperlukan" });
    }

    const client = await clientPromise;
    const db = client.db("strim");
    const license = await db.collection("licenses").findOne({ key });

    if (!license) {
      return res.status(404).json({ valid: false, reason: "Lisensi tidak ditemukan" });
    }

    if (license.activated) {
      if (license.device_id === device_id) {
        return res.status(200).json({ valid: true, expires_at: license.expires_at });
      } else {
        return res.status(403).json({ valid: false, reason: "Lisensi sudah digunakan di device lain" });
      }
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + license.duration_days * 24 * 60 * 60 * 1000);

    const result = await db.collection("licenses").updateOne(
      { key },
      {
        $set: {
          activated: true,
          device_id,
          activated_at: now,
          expires_at: expiresAt,
        },
      }
    );

    if (result.modifiedCount === 1) {
      return res.status(200).json({ valid: true, expires_at: expiresAt });
    } else {
      return res.status(500).json({ valid: false, reason: "Gagal mengaktivasi lisensi" });
    }
  } catch (err) {
    console.error("ACTIVATE ERROR:", err);
    return res.status(500).json({ error: true, message: err.message });
  }
}
