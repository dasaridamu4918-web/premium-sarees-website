// Vercel Serverless API Route: /api/orders
// Handles Customer Order Creation and Customer Order Lookup

module.exports = async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const {
        customer_name,
        mobile_number,
        email,
        address_line1,
        address_line2 = '',
        city,
        state,
        pincode,
        items,
        subtotal,
        delivery_charge = 0,
        final_total,
        notes = ''
      } = body;

      // Validation
      if (!customer_name || !mobile_number || !email || !address_line1 || !city || !state || !pincode) {
        return res.status(400).json({ error: 'Missing required customer delivery details' });
      }

      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Order must contain at least one saree product' });
      }

      // Generate Unique Order ID (e.g. DH20260001 to DH20269999)
      const currentYear = new Date().getFullYear();
      const randomSeq = Math.floor(1000 + Math.random() * 9000);
      const orderId = DH;

      const newOrder = {
        id: orderId,
        created_at: new Date().toISOString(),
        customer_name: customer_name.trim(),
        mobile_number: mobile_number.trim(),
        email: email.trim().toLowerCase(),
        address_line1: address_line1.trim(),
        address_line2: (address_line2 || '').trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        items,
        subtotal: Number(subtotal),
        delivery_charge: Number(delivery_charge),
        final_total: Number(final_total),
        payment_status: 'Payment Pending',
        order_status: 'Pending',
        notes: notes || ''
      };

      // If Supabase is configured in environment variables
      if (supabaseUrl && supabaseKey) {
        const response = await fetch(${supabaseUrl}/rest/v1/orders, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': Bearer ,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(newOrder)
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error('Supabase insert error:', errText);
          return res.status(500).json({ error: 'Failed to save order to database', details: errText });
        }

        const inserted = await response.json();
        return res.status(201).json({ success: true, order: inserted[0] || newOrder });
      }

      // Standalone response if database env vars not yet configured on local preview
      return res.status(201).json({
        success: true,
        order: newOrder,
        warning: 'Order generated successfully. Configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel to persist in Supabase.'
      });

    } catch (err) {
      console.error('Error processing order:', err);
      return res.status(500).json({ error: 'Internal server error processing order', message: err.message });
    }
  }

  // Customer order status lookup: GET /api/orders?id=DH20261234&phone=9876543210
  if (req.method === 'GET') {
    const { id, phone } = req.query;
    if (!id) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    if (supabaseUrl && supabaseKey) {
      try {
        let query = ${supabaseUrl}/rest/v1/orders?id=eq.;
        if (phone) {
          query += &mobile_number=eq.;
        }
        const response = await fetch(query, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': Bearer 
          }
        });
        const data = await response.json();
        if (!data || data.length === 0) {
          return res.status(404).json({ error: 'Order not found' });
        }
        return res.status(200).json({ success: true, order: data[0] });
      } catch (err) {
        return res.status(500).json({ error: 'Database lookup error', message: err.message });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Configure SUPABASE_URL in Vercel to query historical orders.'
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
