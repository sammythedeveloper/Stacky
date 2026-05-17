require("dotenv").config();
const express = require("express");
const cors = require("cors");
const dbConnection = require("./db/dbConfig");

const app = express();
const port = process.env.PORT || 5500;

/* ===============================
   1. MIDDLEWARE (Fixed for Vercel)
================================ */
const corsOptions = {
  origin: [
    "https://stackyapp.vercel.app",
    "http://localhost:3000",
    /\.vercel\.app$/, // This allows any Vercel preview branch too
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json());

/* ===============================
   2. HEALTH & DB CHECK ROUTES
================================ */
app.get("/api/db-check", async (req, res) => {
  try {
    const [rows] = await dbConnection.query("SELECT VERSION() AS version");
    res.json({
      success: true,
      message: "Backend is live and Database is connected!",
      mysqlVersion: rows[0].version,
    });
  } catch (err) {
    console.error("❌ DB Check Failed:", err.message);
    res.status(500).json({
      success: false,
      message: "Backend is live but Database connection failed.",
      error: err.message,
    });
  }
});

/* ===============================
   3. API ROUTES
================================ */
app.use("/api/users", require("./routes/userRoute"));
app.use("/api/notifications", require("./routes/notificationRoute"));
app.use("/api/questions", require("./routes/questionRoute"));
app.use("/api/answers", require("./routes/answerRoute"));

/* ===============================
   4. GLOBAL ERROR HANDLER
================================ */
app.use((err, req, res, next) => {
  console.error("🔥 GLOBAL ERROR:", err.stack);
  res.status(err.status || 500).json({
    success: false,
    msg: err.message || "Internal Server Error",
  });
});

/* ===============================
   5. SERVER INITIALIZATION
================================ */
// We start the server IMMEDIATELY so Railway sees it as "Active" (Fixes 502)
app.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Server is officially running on port ${port}`);

  // Now we try to connect to the DB in the background
  checkDatabase();
});

async function checkDatabase() {
  try {
    await dbConnection.execute("SELECT 1");
    console.log("✅ Database connection verified and ready.");
  } catch (err) {
    console.error(
      "⚠️ DATABASE WARNING: Server is up but DB connection failed."
    );
    console.error("Error Detail:", err.message);
    // We DO NOT process.exit(1) here so the server stays alive for debugging
  }
}
