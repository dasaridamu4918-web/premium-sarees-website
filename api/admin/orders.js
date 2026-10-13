// Vercel Serverless API Route: /api/admin/orders
const crypto = require('crypto');

function verifyAdminToken(req) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) return false;

  const token = authHeader.substring(7);
  const parts = token.split('.');
  if (parts.length !== 2) return false;

  try {
    const payloadStr = Buffer.from(parts[0], 'base64').toString('utf-8');
    const payload = JSON.parse(payloadStr);
    const jwtSecret = process.env.ADMIN_JWT_SECRET || 'dasari_heritage_luxury_sarees_secret_key_2026';

    const expectedHmac = crypto.createHmac('sha256', jwtSecret).update(payloadStr).digest('hex');
    if (expectedHmac !== parts[1]) return false;

    if (Date.now() > payload.exp) return false;
    return payload.role === 'admin';
  } catch (e) {
    return false;
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PATCH,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Verify Admin Authentication
  if (!verifyAdminToken(req)) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired admin session' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  // GET: Fetch all orders (with optional filters)
  if (req.method === 'GET') {
    const { status, search } = req.query;

    if (supabaseUrl && supabaseKey) {
      try {
        let endpoint = `${supabaseUrl}/rest/v1/orders?select=*&order=created_at.desc`;
        if (status && status !== 'All') {
          endpoint += `&order_status=eq.${encodeURIComponent(status)}`;
        }
        if (search) {
          const s = encodeURIComponent(`%${search}%`);
          endpoint += `&or=(id.ilike.${s},customer_name.ilike.${s},mobile_number.ilike.${s})`;
        }

        const response = await fetch(endpoint, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        });

        if (!response.ok) {
          const errText = await response.text();
          return res.status(500).json({ error: 'Database fetch error', details: errText });
        }

        const orders = await response.json();
        return res.status(200).json({ success: true, orders });
      } catch (err) {
        return res.status(500).json({ error: 'Failed to retrieve orders', message: err.message });
      }
    }

    // Default mock response when database env vars not yet configured
    return res.status(200).json({
      success: true,
      orders: [],
      note: 'Configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel to connect live database.'
    });
  }

  // PATCH: Update order status, payment status, tracking info
  if (req.method === 'PATCH') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { id, order_status, payment_status, notes, tracking_number, courier_name } = body;

      if (!id) {
        return res.status(400).json({ error: 'Order ID is required' });
      }

      const updates = {};
      if (order_status) updates.order_status = order_status;
      if (payment_status) updates.payment_status = payment_status;
      if (notes !== undefined) updates.notes = notes;
      if (tracking_number !== undefined) updates.tracking_number = tracking_number;
      if (courier_name !== undefined) updates.courier_name = courier_name;
      updates.updated_at = new Date().toISOString();

      if (supabaseUrl && supabaseKey) {
        // First, get the current order to record status change history
        let previousStatus = null;
        if (order_status) {
          try {
            const currentRes = await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${encodeURIComponent(id)}&select=order_status`, {
              headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
              }
            });
            const currentData = await currentRes.json();
            if (currentData && currentData.length > 0) {
              previousStatus = currentData[0].order_status;
            }
          } catch (e) {
            console.warn('Could not fetch current status for history:', e.message);
          }
        }

        // Update the order
        const response = await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${encodeURIComponent(id)}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(updates)
        });

        if (!response.ok) {
          const errText = await response.text();
          return res.status(500).json({ error: 'Database update failed', details: errText });
        }

        const updated = await response.json();

        // Insert status change history if order_status changed
        if (order_status && previousStatus && previousStatus !== order_status) {
          try {
            await fetch(`${supabaseUrl}/rest/v1/order_status_history`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
              },
              body: JSON.stringify({
                order_id: id,
                previous_status: previousStatus,
                new_status: order_status,
                changed_by: 'admin'
              })
            });
          } catch (histErr) {
            console.warn('Could not insert status history:', histErr.message);
          }
        }

        return res.status(200).json({ success: true, order: updated[0] });
      }

      return res.status(200).json({ success: true, order: { id, ...updates } });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to update order', message: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
