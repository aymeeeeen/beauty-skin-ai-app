require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const authenticateToken = require("./authMiddleware");
const mailgun = require("mailgun-js");
const cron = require("node-cron");
const axios = require("axios");

// Validate Mailgun environment variables
if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
  console.error(
    "MAILGUN_API_KEY and MAILGUN_DOMAIN must be set in environment"
  );
  process.exit(1);
}

const mg = mailgun({
  apiKey: process.env.MAILGUN_API_KEY,
  domain: process.env.MAILGUN_DOMAIN,
});

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

// In-memory data stores
const users = [];
const uploadRecords = [];

// Ensure 'uploads' directory exists
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// Routes

app.get("/", (req, res) => {
  res.send("Hello from backend!");
});

// Signup route
app.post("/signup", async (req, res) => {
  const { username, password, skinType } = req.body;
  if (!username || !password || !skinType) {
    return res.status(400).json({
      message: "Username, password, and skin type are required.",
    });
  }
  if (users.find((u) => u.username === username)) {
    return res.status(400).json({ message: "User already exists" });
  }
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const newUser = {
    id: users.length + 1,
    username,
    password: hashedPassword,
    skinType,
  };
  users.push(newUser);
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
    {
      expiresIn: "1h",
    }
  );
  res.json({ token });
});

// Upload route
app.post("/upload", authenticateToken, upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }
  const userId = req.user.id;
  const user = users.find((u) => u.id === userId);
  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }
  const record = {
    userId,
    filename: req.file.filename,
    uploadedAt: new Date(),
    skinType: user.skinType,
    analysis: null,
  };
  uploadRecords.push(record);
  res.json(record);
});

// Get user uploads
app.get("/uploads", authenticateToken, (req, res) => {
  const userUploads = uploadRecords.filter((r) => r.userId === req.user.id);
  res.json(userUploads);
});

// Mailgun email reminder
function sendReminderEmail(toEmail, username) {
  const data = {
    from: "SkinCare AI <no-reply@sandboxe18509c9558e4d33b09959e358a71ad6.mailgun.org>", // Replace with your verified domain
    to: toEmail,
    subject: "Time to upload your skin photo!",
    text: `Hi ${username},

It's been over 30 days since your last skin photo upload. Keep tracking your skin progress for the best results.

Please log in to your account and upload a new photo.

Thank you!
SkinCare AI Team`,
  };

  mg.messages().send(data, function (error, body) {
    if (error) {
      console.error(`Mailgun error sending to ${toEmail}:`, error);
    } else {
      console.log(`Reminder email sent to ${toEmail}:`, body);
    }
  });
}

// Daily reminder cron at 8:00 AM
cron.schedule("0 8 * * *", () => {
  console.log("Running daily email reminder job...");
  const now = new Date();
  let remindersSent = 0;

  users.forEach((user) => {
    if (!user.username || !user.username.includes("@")) {
      console.warn(`Skipping user with invalid email: ${user.username}`);
      return;
    }

    const userUploads = uploadRecords.filter((r) => r.userId === user.id);
    const latestUpload =
      userUploads.length > 0
        ? userUploads.reduce((a, b) =>
            new Date(a.uploadedAt) > new Date(b.uploadedAt) ? a : b
          )
        : null;

    let daysSinceLastUpload = Infinity;
    if (latestUpload) {
      daysSinceLastUpload = Math.floor(
        (now - new Date(latestUpload.uploadedAt)) / (1000 * 60 * 60 * 24)
      );
    }

    if (daysSinceLastUpload > 30) {
      try {
        sendReminderEmail(user.username, user.username);
        remindersSent++;
      } catch (err) {
        console.error(`Error sending reminder to ${user.username}:`, err);
      }
    }
  });

  if (remindersSent === 0) {
    console.log("No reminder emails sent today; all users are up to date.");
  } else {
    console.log(`Sent ${remindersSent} reminder email(s) today.`);
  }
});

// Perfect Corp API base and skin concerns array
const PERFECT_CORP_API_BASE = "https://yce-api-01.perfectcorp.com/v1.1";

const SKIN_CONCERNS_14 = [
  "wrinkles",
  "spots",
  "dark_circle",
  "redness",
  "pore",
  "acne",
  "oil",
  "dryness",
  "sensitivity",
  "pigmentation",
  "elasticity",
  "uneven_texture",
  "roughness",
  "fine_lines",
];

// Upload image file to Perfect Corp's upload_url (PUT request)
async function uploadFileToUrl(filePath, uploadUrl) {
  const fileStream = fs.createReadStream(filePath);

  await axios.put(uploadUrl, fileStream, {
    headers: { "Content-Type": "application/octet-stream" },
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });
}

// Full Perfect Corp AI workflow: get upload url, upload image, run analysis, poll result
async function analyzeWithPerfectCorp(filename) {
  try {
    // Step 1: Request upload URL and file_id
    let response = await axios.post(
      `${PERFECT_CORP_API_BASE}/file/skin-analysis`,
      {},
      {
        headers: {
          Authorization: `Bearer ${process.env.PERFECTCORP_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const uploadUrl = response.data.upload_url;
    const fileId = response.data.file_id;
    if (!uploadUrl || !fileId)
      throw new Error(
        "Upload URL or file ID missing from Perfect Corp response"
      );

    // Step 2: Upload image to uploadUrl
    const imagePath = path.join(__dirname, "uploads", filename);
    await uploadFileToUrl(imagePath, uploadUrl);

    // Step 3: Run analysis task with fileId and chose 14 skincare concerns
    const taskResponse = await axios.post(
      `${PERFECT_CORP_API_BASE}/task/skin-analysis`,
      {
        file_id: fileId,
        dst_actions: SKIN_CONCERNS_14,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PERFECTCORP_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const taskId = taskResponse.data.task_id;
    if (!taskId) throw new Error("No task ID returned from analysis task");

    // Step 4: Polling loop for analysis status
    const maxRetries = 30;
    const delayMillis = 2000;

    for (let i = 0; i < maxRetries; i++) {
      await new Promise((resolve) => setTimeout(resolve, delayMillis));

      const statusResp = await axios.get(
        `${PERFECT_CORP_API_BASE}/task/skin-analysis/${taskId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.PERFECTCORP_API_KEY}`,
          },
        }
      );

      const status = statusResp.data.status;
      if (status === "success") {
        return statusResp.data.result;
      }
      if (status === "error") {
        throw new Error("Skin analysis task failed");
      }
    }

    throw new Error("Skin analysis task timed out");
  } catch (error) {
    console.error(
      "Perfect Corp AI error:",
      error.response?.data || error.message
    );
    throw error;
  }
}

// Analyze route that triggers Perfect Corp workflow
app.post("/analyze", authenticateToken, async (req, res) => {
  const { filename } = req.body;
  if (!filename) {
    return res
      .status(400)
      .json({ message: "Filename is required for analysis" });
  }

  const uploadRecord = uploadRecords.find((u) => u.filename === filename);
  if (!uploadRecord) {
    return res.status(404).json({ message: "Upload not found" });
  }

  try {
    const result = await analyzeWithPerfectCorp(filename);

    // Save result to upload record history
    uploadRecord.analysis = result;

    res.json({
      message: "AI Skin Analysis successful",
      filename,
      analysis: result,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Skin analysis failed", error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
