module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY env var is not set in Vercel' });

  let rawBody = '';
  try {
    await new Promise((resolve, reject) => {
      req.on('data', chunk => rawBody += chunk.toString());
      req.on('end', resolve);
      req.on('error', reject);
    });
  } catch(e) {
    return res.status(500).json({ error: 'Failed reading request body: ' + e.message });
  }

  if (!rawBody) return res.status(400).json({ error: 'Empty request body' });

  let response;
  try {
    response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: rawBody
    });
  } catch(e) {
    return res.status(500).json({ error: 'Network error calling Anthropic: ' + e.message });
  }

  let data;
  try {
    data = await response.json();
  } catch(e) {
    return res.status(500).json({ error: 'Anthropic returned status ' + response.status + ' with non-JSON body' });
  }

  // Pass through Anthropic's exact status and body so we can see what went wrong
  return res.status(response.status).json(data);
};
