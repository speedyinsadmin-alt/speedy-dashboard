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
    const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');

    // Build JWT for Google OAuth
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'RS256', typ: 'JWT' };
    const payload = {
      iss: SA_EMAIL,
      scope: 'https://www.googleapis.com/auth/drive.file',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    };

    const b64 = obj => Buffer.from(JSON.stringify(obj)).toString('base64url');
    const sigInput = `${b64(header)}.${b64(payload)}`;

    // Sign with RS256 using Web Crypto
    const keyData = PRIVATE_KEY
      .replace('-----BEGIN PRIVATE KEY-----', '')
      .replace('-----END PRIVATE KEY-----', '')
      .replace(/\s/g, '');
    const keyBuffer = Buffer.from(keyData, 'base64');

    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8', keyBuffer,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false, ['sign']
    );

    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      Buffer.from(sigInput)
    );

    const jwt = `${sigInput}.${Buffer.from(signature).toString('base64url')}`;

    // Get access token
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

    // Strip data URI prefix
    const base64Data = image.includes(',') ? image.split(',')[1] : image;
    const mimeMatch = image.match(/data:([^;]+);/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
    const ext = mimeType.split('/')[1] || 'png';
    const fname = filename || `ticket-${Date.now()}.${ext}`;

    // Upload to Google Drive (multipart)
    const boundary = '-------speedy_boundary';
    const metadata = JSON.stringify({ name: fname, parents: [FOLDER_ID] });
    const fileBuffer = Buffer.from(base64Data, 'base64');

    const body = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`),
      Buffer.from(`--${boundary}\r\nContent-Type: ${mimeType}\r\nContent-Transfer-Encoding: base64\r\n\r\n`),
      Buffer.from(base64Data),
      Buffer.from(`\r\n--${boundary}--`)
    ]);

    const uploadRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
          'Content-Length': body.length
        },
        body
      }
    );

    const uploadData = await uploadRes.json();

    if (uploadData.id) {
      // Make file publicly readable so link works for Saif
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
    } else {
      return res.status(500).json({ error: 'Upload failed', detail: uploadData });
    }

  } catch (err) {
    return res.status(500).json({ error: err.message, stack: err.stack });
  }
}
