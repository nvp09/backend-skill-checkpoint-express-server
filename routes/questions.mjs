import express from "express";
import pool from "../utils/db.mjs";

const router = express.Router();

/* POST /questions สร้างคำถามใหม่ */
router.post("/", async (req, res) => {
  try {
    const { title, description, category } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({
        message: "Title, description and category are required",
      });
    }

    const result = await pool.query(
      `INSERT INTO questions (title, description, category)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [title, description, category]
    );

    return res.status(201).json({
      message: "Question created successfully",
      data: result.rows[0],
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create question",
      error: error.message,
    });
  }
});

/* GET /questions ดึงคำถามทั้งหมด */
router.get("/", async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT * FROM questions ORDER BY id DESC`
      );
  
      return res.status(200).json({
        data: result.rows,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Failed to fetch questions",
        error: error.message,
      });
    }
  });
  
/* GET /questions/search ค้นหาคำถามจาก title หรือ category */
router.get("/search", async (req, res) => {
    try {
      const { title, category } = req.query;
  
      if (!title && !category) {
        return res.status(400).json({
          message: "At least title or category must be provided",
        });
      }
  
      let query = "SELECT * FROM questions WHERE 1=1";
      const values = [];
  
      if (title) {
        values.push(`%${title}%`);
        query += ` AND title ILIKE $${values.length}`;
      }
  
      if (category) {
        values.push(`%${category}%`);
        query += ` AND category ILIKE $${values.length}`;
      }
  
      const result = await pool.query(query, values);
  
      return res.status(200).json({
        data: result.rows,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Failed to search questions",
        error: error.message,
      });
    }
  });
  
/* GET /questions/:id ดึงคำถามตาม id */
router.get("/:id", async (req, res) => {
    try {
      const { id } = req.params;
  
      const result = await pool.query(
        `SELECT * FROM questions WHERE id = $1`,
        [id]
      );
  
      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Question not found",
        });
      }
  
      return res.status(200).json({
        data: result.rows[0],
      });
    } catch (error) {
      return res.status(500).json({
        message: "Failed to fetch question",
        error: error.message,
      });
    }
  });

/* PUT /questions/:id แก้ไขคำถาม */
router.put("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description } = req.body;
  
      if (!title && !description) {
        return res.status(400).json({
          message: "At least title or description must be provided",
        });
      }
  
      const result = await pool.query(
        `UPDATE questions
         SET title = COALESCE($1, title),
             description = COALESCE($2, description)
         WHERE id = $3
         RETURNING *`,
        [title || null, description || null, id]
      );
  
      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Question not found",
        });
      }
  
      return res.status(200).json({
        message: "Question updated successfully",
        data: result.rows[0],
      });
    } catch (error) {
      return res.status(500).json({
        message: "Failed to update question",
        error: error.message,
      });
    }
  });
  
/* DELETE /questions/:id ลบคำถาม */
router.delete("/:id", async (req, res) => {
    try {
      const { id } = req.params;
  
      const result = await pool.query(
        `DELETE FROM questions WHERE id = $1 RETURNING *`,
        [id]
      );
  
      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Question not found",
        });
      }
  
      return res.status(200).json({
        message: "Question deleted successfully",
      });
    } catch (error) {
      return res.status(500).json({
        message: "Failed to delete question",
        error: error.message,
      });
    }
  });

/* POST /questions/:questionId/answers สร้างคำตอบของคำถาม */
router.post("/:questionId/answers", async (req, res) => {
    try {
      const { questionId } = req.params;
      const { content } = req.body;
  
      if (!content) {
        return res.status(400).json({
          message: "Content is required",
        });
      }
  
      if (content.length > 300) {
        return res.status(400).json({
          message: "Content must not exceed 300 characters",
        });
      }
  
      // เช็คว่า question มีอยู่จริงไหม
      const questionCheck = await pool.query(
        `SELECT id FROM questions WHERE id = $1`,
        [questionId]
      );
  
      if (questionCheck.rows.length === 0) {
        return res.status(404).json({
          message: "Question not found",
        });
      }
  
      const result = await pool.query(
        `INSERT INTO answers (question_id, content)
         VALUES ($1, $2)
         RETURNING *`,
        [questionId, content]
      );
  
      return res.status(201).json({
        message: "Answer created successfully",
        data: result.rows[0],
      });
    } catch (error) {
      return res.status(500).json({
        message: "Failed to create answer",
        error: error.message,
      });
    }
  });

/* GET /questions/:questionId/answers ดึงคำตอบทั้งหมดของคำถาม */
router.get("/:questionId/answers", async (req, res) => {
    try {
      const { questionId } = req.params;
  
      // เช็คว่า question มีอยู่จริงไหม
      const questionCheck = await pool.query(
        `SELECT id FROM questions WHERE id = $1`,
        [questionId]
      );
  
      if (questionCheck.rows.length === 0) {
        return res.status(404).json({
          message: "Question not found",
        });
      }
  
      const result = await pool.query(
        `SELECT * FROM answers WHERE question_id = $1 ORDER BY id DESC`,
        [questionId]
      );
  
      return res.status(200).json({
        data: result.rows,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Failed to fetch answers",
        error: error.message,
      });
    }
  });
  
/* DELETE /questions/:questionId/answers ลบคำตอบทั้งหมดของคำถาม */
router.delete("/:questionId/answers", async (req, res) => {
    try {
      const { questionId } = req.params;
  
      // เช็คว่า question มีอยู่จริงไหม
      const questionCheck = await pool.query(
        `SELECT id FROM questions WHERE id = $1`,
        [questionId]
      );
  
      if (questionCheck.rows.length === 0) {
        return res.status(404).json({
          message: "Question not found",
        });
      }
  
      await pool.query(
        `DELETE FROM answers WHERE question_id = $1`,
        [questionId]
      );
  
      return res.status(200).json({
        message: "All answers deleted successfully",
      });
    } catch (error) {
      return res.status(500).json({
        message: "Failed to delete answers",
        error: error.message,
      });
    }
  });
  

export default router;
