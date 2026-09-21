// Vercel Serverless Function para subida de imágenes permanente y sin CORS

export default async function handler(req, res) {
  // Permitir CORS por si acaso
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    let body = req.body;
    if (!body) {
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      const raw = Buffer.concat(chunks).toString('utf-8');
      if (raw) {
        try {
          body = JSON.parse(raw);
        } catch (e) {}
      }
    } else if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {}
    }

    const { filename, base64 } = body || {};
    if (!base64) {
      return res.status(400).json({ error: 'No se envió ninguna imagen' });
    }

    // Limpiar prefijo data URL
    const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    const safeName = filename || `recuerdo_${Date.now()}.jpg`;

    // 1. Subida a Catbox (almacenamiento en la nube gratuito y permanente)
    try {
      const fd = new FormData();
      const blob = new Blob([buffer], { type: 'image/jpeg' });
      fd.append('reqtype', 'fileupload');
      fd.append('fileToUpload', blob, safeName);

      const catboxRes = await fetch('https://catbox.moe/user/api.php', {
        method: 'POST',
        body: fd
      });
      const catboxUrl = await catboxRes.text();
      if (catboxUrl && catboxUrl.trim().startsWith('http')) {
        return res.status(200).json({ 
          success: true, 
          url: catboxUrl.trim() 
        });
      }
    } catch (errCatbox) {
      console.warn("Catbox error:", errCatbox);
    }

    // 2. Fallback a Litterbox
    try {
      const fd = new FormData();
      const blob = new Blob([buffer], { type: 'image/jpeg' });
      fd.append('reqtype', 'fileupload');
      fd.append('time', '72h');
      fd.append('fileToUpload', blob, safeName);

      const litRes = await fetch('https://litterbox.catbox.moe/resources/internals/api.php', {
        method: 'POST',
        body: fd
      });
      const litUrl = await litRes.text();
      if (litUrl && litUrl.trim().startsWith('http')) {
        return res.status(200).json({ 
          success: true, 
          url: litUrl.trim() 
        });
      }
    } catch (errLit) {
      console.warn("Litterbox error:", errLit);
    }

    // 3. Fallback a Uguu
    try {
      const fd = new FormData();
      const blob = new Blob([buffer], { type: 'image/jpeg' });
      fd.append('files[]', blob, safeName);

      const uguuRes = await fetch('https://uguu.se/upload', {
        method: 'POST',
        body: fd
      });
      const uguuData = await uguuRes.json();
      if (uguuData.success && uguuData.files?.[0]?.url) {
        return res.status(200).json({ 
          success: true, 
          url: uguuData.files[0].url 
        });
      }
    } catch (errUguu) {
      console.warn("Uguu error:", errUguu);
    }

    return res.status(500).json({ error: 'No se pudo subir la imagen a la nube' });
  } catch (error) {
    console.error("Error en /api/upload:", error);
    return res.status(500).json({ error: error.message });
  }
}
