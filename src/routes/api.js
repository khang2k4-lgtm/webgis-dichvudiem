const express = require("express");
const router = express.Router();
const pool = require("../config/database");

const allowedTables = ["school1", "hospital", "atm"];

// ======================
// 1. THÊM
// ======================
router.post("/add/:type", async (req, res) => {
    try {
        const { type } = req.params;
        const { name, lat, lng } = req.body;

        console.log("TYPE:", type);
        console.log("BODY:", req.body);

        // Kiểm tra type hợp lệ
        if (!allowedTables.includes(type)) {
            return res.status(400).json({
                success: false,
                message: "Invalid type"
            });
        }

        // Kiểm tra dữ liệu đầu vào
        if (!name || lat === undefined || lng === undefined) {
            return res.status(400).json({
                success: false,
                message: "Missing name or coordinates"
            });
        }

        const result = await pool.query(
            `INSERT INTO ${type} (name, lat, lng)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [name, lat, lng]
        );

        return res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (err) {
        console.error("ADD ERROR:", err);
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
});


// ======================
// 2. LẤY DANH SÁCH
// ======================
router.get("/list/:type", async (req, res) => {
    try {
        const { type } = req.params;

        if (!allowedTables.includes(type)) {
            return res.status(400).json({
                success: false,
                message: "Invalid type"
            });
        }

        const result = await pool.query(
            `SELECT * FROM ${type}`
        );

        return res.json(result.rows);

    } catch (err) {
        console.error("LIST ERROR:", err);
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
});


// ======================
// 3. XÓA
// ======================
router.delete("/delete/:type/:id", async (req, res) => {
    try {
        const { type, id } = req.params;

        if (!allowedTables.includes(type)) {
            return res.status(400).json({
                success: false,
                message: "Invalid type"
            });
        }

        await pool.query(
            `DELETE FROM ${type} WHERE id = $1`,
            [id]
        );

        return res.json({
            success: true
        });

    } catch (err) {
        console.error("DELETE ERROR:", err);
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
});

module.exports = router;
