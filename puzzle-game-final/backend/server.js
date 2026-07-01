import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());

const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `snap-${Date.now()}${ext}`);
  },
});
const upload = multer({ storage });

const publicDir = path.join(__dirname, "public");
app.use(express.static(publicDir));

app.get("/admin", (_req, res) => {
  res.sendFile(path.join(publicDir, "admin.html"));
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, message: "Puzzle backend running" });
});

app.post("/api/photos", upload.single("photo"), (req, res) => {
  if (!req.file) return res.status(400).json({ ok: false, error: "No photo uploaded" });

  return res.json({
    ok: true,
    filename: req.file.filename,
    url: `/uploads/${req.file.filename}`,
  });
});

app.get("/api/photos", (_req, res) => {
  const files = fs
    .readdirSync(uploadDir)
    .filter((f) => !f.startsWith("."))
    .sort((a, b) => b.localeCompare(a))
    .map((name) => ({ name, url: `/uploads/${name}` }));

  res.json({ ok: true, count: files.length, files });
});

app.use("/uploads", express.static(uploadDir));

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});