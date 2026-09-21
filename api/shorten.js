// Vercel Serverless Function para acortar enlaces con TinyURL sin bloqueos de CORS

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    let longUrl = req.query?.url;
    if (!longUrl && req.body) {
      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch (e) {}
      }
      longUrl = body?.url;
    }

    if (!longUrl) {
      return res.status(400).json({ error: 'Falta la URL a acortar' });
    }

    const tinyRes = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`);
    const shortUrl = await tinyRes.text();

    if (shortUrl && shortUrl.trim().startsWith('http')) {
      return res.status(200).json({
        success: true,
        shortUrl: shortUrl.trim()
      });
    }

    return res.status(500).json({ error: 'No se pudo generar el enlace corto' });
  } catch (error) {
    console.error("Error en /api/shorten:", error);
    return res.status(500).json({ error: error.message });
  }
}
