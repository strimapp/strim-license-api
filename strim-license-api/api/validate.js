import clientPromise from '../db';

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://admin.strim.my.id");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { key, device_id, admin_token } = req.query;

    if (!key) return res.status(400).json({ valid: false, reason: 'Key tidak ditemukan' });

    const client = await clientPromise;
    const db = client.db('strim');
    const license = await db.collection('licenses').findOne({ key });

    if (!license) return res.status(200).json({ valid: false, reason: 'Key tidak ditemukan' });

    // ADMIN override
    if (admin_token && admin_token === process.env.ADMIN_TOKEN) {
      return res.status(200).json({ valid: true, expires_at: license.expires_at });
    }

    if (!license.activated) return res.status(200).json({ valid: false, reason: 'Belum diaktivasi' });

    if (!device_id || device_id !== license.device_id) {
      return res.status(200).json({ valid: false, reason: 'Device tidak cocok' });
    }

    const now = new Date();
    if (new Date(license.expires_at) < now) {
      return res.status(200).json({ valid: false, reason: 'Lisensi sudah expired' });
    }

    return res.status(200).json({ valid: true, expires_at: license.expires_at });
  } catch (err) {
    return res.status(500).json({ error: true, message: err.message });
  }
}
