import express from "express";
import cors from "cors";
import pool from "./utils/db.mjs";
import questionRoutes from "./routes/questions.mjs";

const app = express();
const port = 4000;

app.use(cors());
app.use(express.json());

app.use("/questions", questionRoutes);

app.get("/test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    return res.json({
      message: "Server API is working 🚀",
      time: result.rows[0],
    });
  } catch (error) {
    return res.status(500).json({
      message: "Database error",
      error: error.message,
    });
  }
});

app.listen(port, async () => {
  try {
    await pool.query("SELECT 1");
    console.log("Database connected ✅");
    console.log(`Server is running at ${port}`);
  } catch (err) {
    console.error("Database connection failed ❌", err);
  }
});
