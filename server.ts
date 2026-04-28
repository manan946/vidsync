/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const port = 3000;

// Setup storage
const uploadDir = path.join(__dirname, 'uploads');
const outputDir = path.join(__dirname, 'output');

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

app.use(express.json());

// API: Upload Video
app.post('/api/upload', upload.single('video'), (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded.');
  res.json({
    id: req.file.filename,
    name: req.file.originalname,
    path: `/uploads/${req.file.filename}`
  });
});

// API: Merge Videos (Phase 1 logic as requested)
app.post('/api/merge', async (req, res) => {
  const { videoIds } = req.body; // Array of filenames in uploads folder
  
  if (!videoIds || videoIds.length < 2) {
    return res.status(400).send('Provide at least two videos to merge.');
  }

  const outputPath = path.join(outputDir, `merged-${Date.now()}.mp4`);
  const merger = ffmpeg();

  videoIds.forEach((id: string) => {
    merger.input(path.join(uploadDir, id));
  });

  merger
    .on('error', function(err) {
      console.log('An error occurred: ' + err.message);
      res.status(500).send(err.message);
    })
    .on('end', function() {
      console.log('Merging finished !');
      res.json({ 
        message: 'Merge successful', 
        path: `/output/${path.basename(outputPath)}` 
      });
    })
    .mergeToFile(outputPath, __dirname);
});

// Serve static files
app.use('/uploads', express.static(uploadDir));
app.use('/output', express.static(outputDir));
app.use(express.static(path.join(__dirname, 'dist')));

// SPA Fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

httpServer.listen(port, () => {
  console.log(`Vidsync Server running at http://localhost:${port}`);
});
