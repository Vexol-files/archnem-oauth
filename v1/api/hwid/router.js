const express = require("express");
const router = express.Router();
const connectDB = require("../../utils/db");

// POST /v1/api/hwid/attach
router.post("/attach", async (req, res) => {
    const { key, hwid } = req.body;

    if (!key || !hwid) return res.status(400).send("invalid");

    const db = await connectDB();
    const keys = db.collection("keys");
    const logs = db.collection("hwid_logs");

    const doc = await keys.findOne({ key });
    if (!doc) return res.send("key_invalid");

    // jeśli klucz nie ma HWID → przypisz
    if (doc.hwid === "ANY") {
        await keys.updateOne({ key }, { $set: { hwid } });

        await logs.insertOne({
            key,
            hwid,
            date: Date.now(),
            action: "attach"
        });

        return res.send("hwid_attached");
    }

    // jeśli HWID nie pasuje
    if (doc.hwid !== hwid) {
        return res.send("hwid_invalid");
    }

    return res.send("ok");
});

module.exports = router;
