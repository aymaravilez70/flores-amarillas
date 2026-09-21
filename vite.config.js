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
