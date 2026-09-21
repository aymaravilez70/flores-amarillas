import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

function imageUploadPlugin() {
  return {
    name: 'image-upload-plugin',
    configureServer(server) {
      server.middlewares.use('/api/upload', (req, res) => {
        if (req.method === 'POST') {
          let chunks = [];
          req.on('data', chunk => chunks.push(chunk));
          req.on('end', () => {
            try {
              const body = JSON.parse(Buffer.concat(chunks).toString());
              const uploadsDir = path.resolve(__dirname, 'public/uploads');
              if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
              }

              const rawExt = body.filename ? path.extname(body.filename).toLowerCase() : '.jpg';
              const ext = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(rawExt) ? rawExt : '.jpg';
              const cleanName = `recuerdo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}${ext}`;
              const filePath = path.join(uploadsDir, cleanName);

              // Extraer base64
              const base64Data = body.base64.replace(/^data:image\/\w+;base64,/, '');
              fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ 
                success: true, 
                url: `/uploads/${cleanName}` 
              }));
            } catch (err) {
              console.error("Error subiendo imagen:", err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
        } else {
          res.statusCode = 405;
          res.end('Method Not Allowed');
        }
      });

      server.middlewares.use('/api/shorten', async (req, res) => {
        try {
          const parsedUrl = new URL(req.url, 'http://localhost');
          const longUrl = parsedUrl.searchParams.get('url');
          if (!longUrl) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: 'URL requerida' }));
          }

          const tinyRes = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`);
          const shortUrl = await tinyRes.text();
          res.setHeader('Content-Type', 'application/json');
          if (shortUrl && shortUrl.startsWith('http')) {
            res.end(JSON.stringify({ success: true, shortUrl: shortUrl.trim() }));
          } else {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'No se pudo acortar' }));
          }
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    }
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), imageUploadPlugin()],
  server: {
    port: 5174,
    host: true
  }
});
