require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// ---- Serve static HTML from /public ----
app.use(express.static(path.join(__dirname, 'public')));

// ---- Cloudinary config ----
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ---- SQLite setup ----
const db = new sqlite3.Database('./items.db', (err) => {
  if (err) {
    console.error('❌ Could not connect to SQLite', err);
  } else {
    console.log('✅ Connected to SQLite');
  }
});

// Create table if not exists (with location + createdAt)
db.run(`
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    status TEXT,
    imageUrl TEXT,
    location TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// ---- Multer/Cloudinary storage ----
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'lost-found',
    allowed_formats: ['jpg', 'png', 'jpeg']
  }
});
const upload = multer({ storage });

// ---- Upload route ----
app.post('/upload', upload.single('image'), (req, res) => {
  console.log('📥 Incoming upload request...');
  console.log('Form fields:', JSON.stringify(req.body, null, 2));
  console.log('Uploaded file info:', JSON.stringify(req.file, null, 2));

  const { title, description, status, location } = req.body;
  const imageUrl = req.file?.path;

  if (!title || !description || !status || !imageUrl || !location) {
    console.error('❌ Missing fields');
    return res.status(400).json({ error: 'Missing fields' });
  }

  db.run(
    `INSERT INTO items (title, description, status, imageUrl, location) VALUES (?, ?, ?, ?, ?)`,
    [title, description, status, imageUrl, location],
    function (err) {
      if (err) {
        console.error('❌ DB insert error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      console.log(`✅ Item saved with ID ${this.lastID}`);
      res.json({
        success: true,
        id: this.lastID,
        title,
        description,
        status,
        location,
        imageUrl
      });
    }
  );
});

// ---- Fetch all items route ----
app.get('/items', (req, res) => {
  console.log("📡 GET /items request received");
  db.all(`SELECT * FROM items ORDER BY id DESC`, (err, rows) => {
    if (err) {
      console.error("❌ DB fetch error:", err);
      return res.status(500).json({ error: 'Database fetch error' });
    }
    console.log(`✅ Returning ${rows.length} items`);
    res.json(rows);
  });
});

// ---- Found report route ----
app.post('/found-report', upload.single('foundImage'), (req, res) => {
  console.log('📥 Incoming found report request...');
  console.log('Form fields:', JSON.stringify(req.body, null, 2));
  console.log('Uploaded file info:', JSON.stringify(req.file, null, 2));

  const { itemId, phone } = req.body;
  const foundImageUrl = req.file?.path;

  if (!itemId || !phone || !foundImageUrl) {
    console.error('❌ Missing fields in found report');
    return res.status(400).json({ error: 'Missing fields' });
  }

  // Optional: Save the found report in a separate table or send notification here.
  // For now, just log and respond success.

  console.log(`✅ Found report for item ${itemId} from phone ${phone} saved.`);
  
  // If you want, create a table 'found_reports' and save it:
  /*
  db.run(
    `INSERT INTO found_reports (itemId, phone, foundImageUrl, createdAt) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
    [itemId, phone, foundImageUrl],
    function (err) {
      if (err) {
        console.error('❌ DB insert error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ success: true, id: this.lastID });
    }
  );
  */

  res.status(200).json({ success: true, message: 'Found report received' });
});

// ---- Start server ----
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
