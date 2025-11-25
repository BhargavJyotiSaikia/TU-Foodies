// =======================
//  server.js - TU Foodies
// =======================
import "dotenv/config";   
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { MongoClient } from "mongodb";

dotenv.config();
const app = express();
app.use(cors());
app.use(bodyParser.json());

// -----------------------
//  CONFIGURATION
// -----------------------
const PORT = process.env.PORT || 3000;
const mongoURI = process.env.MONGO_URI;

// In-memory OTP store
let otpStore = new Map(); // { email: { code: 123456, expires: timestamp } }

// -----------------------
//  MONGO CONNECTION
// -----------------------
let db;
const client = new MongoClient(mongoURI);

(async () => {
  try {
    await client.connect();
    db = client.db("tufoodies");
    console.log("🍃 Connected to MongoDB successfully");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err);
  }
})();

// -----------------------
//  EMAIL SETUP
// -----------------------
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // Gmail address
    pass: process.env.EMAIL_PASS, // App password (not Gmail login password!)
  },
});

// -----------------------
//  ROUTE: SEND OTP
// -----------------------
app.post("/send-otp", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.json({ success: false, message: "Email is required." });

  // Generate and store OTP
  const otp = Math.floor(100000 + Math.random() * 900000);
  otpStore.set(email, { code: otp, expires: Date.now() + 2 * 60 * 1000 }); // 2 min expiry

  try {
    await transporter.sendMail({
      from: `"TU Foodies 🍴" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your TU Foodies OTP Code",
      html: `
        <div style="font-family:sans-serif;line-height:1.5">
          <p>Hello 👋,</p>
          <p>Your OTP for TU Foodies signup is:</p>
          <h2 style="color:#e63946;">${otp}</h2>
          <p>This code will expire in 2 minutes.</p>
          <p>🍴 TU Foodies Team</p>
        </div>`,
    });

    console.log(`📧 OTP sent to ${email}: ${otp}`);
    res.json({ success: true, message: "OTP sent successfully to Gmail!" });
  } catch (error) {
    console.error("❌ Error sending OTP:", error);
    res.json({ success: false, message: "Failed to send OTP. Try again." });
  }
});

// -----------------------
//  ROUTE: VERIFY OTP
// -----------------------
app.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.json({ success: false, message: "Email and OTP are required." });
  }

  const stored = otpStore.get(email);
  if (!stored) {
    return res.json({ success: false, message: "No OTP found or OTP expired." });
  }

  if (Date.now() > stored.expires) {
    otpStore.delete(email);
    return res.json({ success: false, message: "OTP expired. Please request again." });
  }

  if (String(stored.code) === String(otp)) {
    otpStore.delete(email);
    res.json({ success: true, message: "✅ OTP verified successfully!" });
  } else {
    res.json({ success: false, message: "Invalid OTP. Please try again." });
  }
});

// -----------------------
//  ROUTE: REGISTER USER
// -----------------------
app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.json({ success: false, message: "All fields are required." });
  }

  try {
    const existingUser = await db.collection("users").findOne({ email });
    if (existingUser) {
      return res.json({ success: false, message: "User already exists!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.collection("users").insertOne({
      username,
      email,
      password: hashedPassword,
      createdAt: new Date(),
      verified: true,
    });

    console.log(`👤 New user registered: ${username} (${email})`);
    res.json({ success: true, message: "✅ Signup successful!" });
  } catch (err) {
    console.error("❌ Registration error:", err);
    res.json({ success: false, message: "Error registering user." });
  }
});

// -----------------------
//  ROUTE: LOGIN USER
// -----------------------
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.json({ success: false, message: "Enter email and password." });
  }

  try {
    const user = await db.collection("users").findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "❌ User not found." });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.json({ success: false, message: "❌ Incorrect password." });
    }

    res.json({
      success: true,
      message: "✅ Login successful!",
      username: user.username,
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.json({ success: false, message: "Server error." });
  }
});

// -----------------------
//  START SERVER
// -----------------------
app.listen(PORT, () => {
  console.log(`🚀 Server running at: http://localhost:${PORT}`);
});
