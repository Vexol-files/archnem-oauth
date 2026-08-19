const express = require("express");
const router = express.Router();
const connectDB = require("../../utils/db");

// GET /v1/api/owner/logs
router.get("/logs", async (req, res) => {
    const db = await connectDB();
    const logs = db.collection("loader_logs");

    const allLogs = await logs.find({}).toArray();
    res.json(allLogs);
});

module.exports = router;
