export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: 'No image provided' });

    // Strip data URI prefix if present
    const base64 = image.includes(',') ? image.split(',')[1] : image;

    // Upload to ImgBB server-side (no CORS issue here)
    const params = new URLSearchParams();
    params.append('key', '5be9d0db6a01d8e8dd63a2dda1d4671b');
    params.append('image', base64);

    const imgbbRes = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });

    const data = await imgbbRes.json();

    if (data.success && data.data?.url) {
      return res.status(200).json({ url: data.data.url });
    } else {
      return res.status(500).json({ error: 'ImgBB upload failed', detail: data });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
