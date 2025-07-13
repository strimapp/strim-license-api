import clientPromise from '../db';
console.log("🔒 ENV TOKEN:", process.env.ADMIN_TOKEN);
console.log("🔑 Query Token:", admin_token);
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://admin.strim.my.id");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { key, admin_token } = req.query;

    if (admin_token !== process.env.ADMIN_TOKEN) {
      return res.status(403).json({ error: true, message: 'Token tidak valid' });
    }

    const client = await clientPromise;
    const db = client.db('strim');
    const result = await db.collection('licenses').updateOne(
      { key },
      {
        $set: {
          activated: false,
          device_id: null,
          activated_at: null,
          expires_at: null
        }
      }
    );

    if (result.modifiedCount === 1) {
      return res.status(200).json({ success: true, message: `Lisensi ${key} berhasil di-reset.` });
    } else {
      return res.status(404).json({ error: true, message: 'License key tidak ditemukan atau tidak diubah' });
    }
  } catch (err) {
    return res.status(500).json({ error: true, message: err.message });
  }
}
