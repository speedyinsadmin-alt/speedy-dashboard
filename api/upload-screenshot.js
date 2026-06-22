export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { image, filename } = req.body;
    if (!image) return res.status(400).json({ error: 'No image provided' });

    const FOLDER_ID = '1ukSTDkYP2AwfeWseFfUSkpEMExWro_CC';
    const SA_EMAIL = 'speedy-tickets-bot@speedy-tickets.iam.gserviceaccount.com';
    const RAW_KEY = process.env.GOOGLE_PRIVATE_KEY;

    if (!RAW_KEY) return res.status(500).json({ error: 'GOOGLE_PRIVATE_KEY not set' });

    const PRIVATE_KEY = RAW_KEY.replace(/\\n/g, '\n');

    // Build JWT header + payload
    const now = Math.floor(Date.now() / 1000);
    const jwtHeader = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const jwtPayload = Buffer.from(JSON.stringify({
      iss: SA_EMAIL,
      scope: 'https://www.googleapis.com/auth/drive.file',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    })).toString('base64url');

    const signingInput = `${jwtHeader}.${jwtPayload}`;

    // Sign using Node.js crypto
    const { createSign } = await import('crypto');
    const sign = createSign('RSA-SHA256');
    sign.update(signingInput);
    const signature = sign.sign(PRIVATE_KEY, 'base64url');
    const jwt = `${signingInput}.${signature}`;

    // Exchange JWT for access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt
      })
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return res.status(500).json({ error: 'Auth failed', detail: tokenData });
    }

    // Prepare image data
    const base64Data = image.includes(',') ? image.split(',')[1] : image;
    const mimeMatch = image.match(/data:([^;]+);/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
    const ext = mimeType.includes('jpeg') || mimeType.includes('jpg') ? 'jpg' : 'png';
    const fname = filename || `ticket-${Date.now()}.${ext}`;

    // Upload via multipart to Google Drive
    const boundary = 'speedy_upload_boundary';
    const metadata = JSON.stringify({ name: fname, parents: [FOLDER_ID] });
    const fileBytes = Buffer.from(base64Data, 'base64');

    const body = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`),
      fileBytes,
      Buffer.from(`\r\n--${boundary}--`)
    ]);

    const uploadRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
          'Content-Length': String(body.length)
        },
        body
      }
    );

    const uploadData = await uploadRes.json();
    if (!uploadData.id) {
      return res.status(500).json({ error: 'Drive upload failed', detail: uploadData });
    }

    // Make file publicly viewable
    await fetch(`https://www.googleapis.com/drive/v3/files/${uploadData.id}/permissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ role: 'reader', type: 'anyone' })
    });

    return res.status(200).json({
      url: `https://drive.google.com/file/d/${uploadData.id}/view`,
      name: uploadData.name
    });

  } catch (err) {
    console.error('Upload error:', err.message, err.stack);
    return res.status(500).json({ error: err.message });
  }
}
