const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 3000;

// Setup SQLite
const db = new sqlite3.Database('./videos.db');
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS videos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL,
        originalname TEXT NOT NULL
    )`);
});

// Upload folder
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Middleware statici
app.use(express.static(path.join(__dirname, 'src')));
app.use('/uploads', express.static(uploadDir)); // serve i video direttamente

// Multer setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Upload video
app.post('/upload', upload.single('video'), (req, res) => {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'Nessun file caricato' });

    // Salva nel DB
    db.run(`INSERT INTO videos (filename, originalname) VALUES (?, ?)`,
        [file.filename, file.originalname],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID });
        });
});

// Streaming video
app.get('/video/:id', (req, res) => {
    const videoId = req.params.id;

    db.get(`SELECT filename FROM videos WHERE id = ?`, [videoId], (err, row) => {
        if (err || !row) return res.status(404).send('Video non trovato');

        const filePath = path.join(uploadDir, row.filename);
        if (!fs.existsSync(filePath)) return res.status(404).send('File video mancante');

        const stat = fs.statSync(filePath);
        const fileSize = stat.size;
        const range = req.headers.range;
        const MAX_CHUNK = 10 * 1024 * 1024;

        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : Math.min(start + MAX_CHUNK - 1, fileSize - 1);
            const chunkSize = (end - start) + 1;

            const fileStream = fs.createReadStream(filePath, { start, end });
            const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunkSize,
                'Content-Type': 'video/mp4'
            };
            res.writeHead(206, head);
            fileStream.pipe(res);
        } else {
            const head = {
                'Content-Length': fileSize,
                'Content-Type': 'video/mp4'
            };
            res.writeHead(200, head);
            fs.createReadStream(filePath).pipe(res);
        }
    });
});

// Lista video
app.get('/videos', (req, res) => {
    db.all(`SELECT * FROM videos ORDER BY id DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'index.html'));
});

app.listen(PORT, () => console.log(`✅ Server in ascolto su http://localhost:${PORT}`));
