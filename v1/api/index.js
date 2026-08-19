const express = require("express");
const router = express.Router();
const connectDB = require("../../utils/db");

router.post("/", async (req, res) => {
    const { key, hwid } = req.body;

    if (!key || !hwid) return res.send("invalid_key");

    const db = await connectDB();
    const keys = db.collection("keys");

    const doc = await keys.findOne({ key });
    if (!doc) return res.send("invalid_key");

    if (doc.owner === null) return res.send("not_whitelisted");

    if (doc.hwid === null) {
        await keys.updateOne({ key }, { $set: { hwid } });
        return res.send("hwid_attached");
    }

    if (doc.hwid !== hwid) {
        return res.send("hwid_mismatch");
    }

    return res.send("ok");
});

module.exports = router;
