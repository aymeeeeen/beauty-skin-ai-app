const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const authenticateToken = require("./authMiddleware");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

// In-memory data stores
const users = [];
const uploadRecords = [];

// Ensure uploads directory exists
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// Test route
app.get("/", (req, res) => {
  res.send("Hello from backend!");
});

// Signup route
app.post("/signup", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required." });
  }

  if (users.find((u) => u.username === username)) {
    return res.status(400).json({ message: "User already exists" });
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  users.push({ id: users.length + 1, username, password: hashedPassword });
  res.status(201).json({ message: "User registered successfully" });
});

// Login route
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required." });
  }

  const user = users.find((u) => u.username === username);
  if (!user) {
    return res.status(400).json({ message: "Invalid username or password" });
  }

  const validPass = await bcrypt.compare(password, user.password);
  if (!validPass) {
    return res.status(400).json({ message: "Invalid username or password" });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username },
    "secretkey",
    { expiresIn: "1h" }
  );
  res.json({ token });
});

// Upload route - authenticated
app.post("/upload", authenticateToken, upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const record = {
    userId: req.user.id,
    filename: req.file.filename,
    timestamp: new Date(),
    analysis: null,
  };
  uploadRecords.push(record);
  res.json(record);
});

// Get uploads history - authenticated
app.get("/uploads", authenticateToken, (req, res) => {
  const userUploads = uploadRecords.filter((r) => r.userId === req.user.id);
  res.json(userUploads);
});

// Mock analysis route
app.post("/analyze", (req, res) => {
  const { filename } = req.body;

  if (!filename) {
    return res
      .status(400)
      .json({ message: "Filename is required for analysis" });
  }

  const analysisResult = {
    skinType: "Combination",
    issues: ["Dryness", "Mild acne"],
    routine: [
      "Use gentle cleanser twice daily",
      "Apply moisturizer with SPF every morning",
      "Use acne spot treatment as needed",
    ],
  };

  res.json({
    message: "Analysis successful",
    filename,
    analysis: analysisResult,
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
