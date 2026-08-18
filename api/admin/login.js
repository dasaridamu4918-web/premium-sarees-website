// Vercel Serverless API Route: /api/admin/login
const crypto = require('crypto');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { password } = body;

    const expectedPassword = process.env.ADMIN_PASSWORD || 'dasari@admin2026';
    const jwtSecret = process.env.ADMIN_JWT_SECRET || 'dasari_heritage_luxury_sarees_secret_key_2026';

    if (!password || password !== expectedPassword) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    // Generate secure HMAC signature token valid for 24 hours
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
    const payload = JSON.stringify({ role: 'admin', exp: expiresAt });
    const hmac = crypto.createHmac('sha256', jwtSecret).update(payload).digest('hex');
    const token = Buffer.from(payload).toString('base64') + '.' + hmac;

    return res.status(200).json({
      success: true,
      token,
      expiresAt,
      message: 'Admin authentication successful'
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error during login', message: err.message });
  }
};
