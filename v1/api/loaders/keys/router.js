const express = require("express");
const router = express.Router();
const connectDB = require("../../utils/db");
const generateTimestamp = require("../../utils/timestamp");

router.post("/", async (req, res) => {
    const { key } = req.body;

    if (!key) return res.send("invalid_key");

    const db = await connectDB();
    const keys = db.collection("keys");

    const doc = await keys.findOne({ key });
    if (!doc) return res.send("invalid_key");

    if (doc.owner === null) return res.send("not_whitelisted");

    if (doc.expires !== "never") {
        const now = Number(generateTimestamp());
        const exp = Number(doc.expires);
        if (now > exp) return res.send("expired");
    }

    return res.send("ok");
});

module.exports = router;
