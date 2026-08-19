const express = require("express");
const router = express.Router();
const connectDB = require("../../utils/db");
const { decrypt } = require("../../utils/encryption");

router.get("/:filename", async (req, res) => {
    const ua = req.headers["user-agent"] || "";

    if (ua.includes("Mozilla")) {
        return res.status(403).send("-- access denied");
    }

    const db = await connectDB();
    const updates = db.collection("updates");

    const loader = await updates.findOne({ filename: req.params.filename });
    if (!loader) return res.status(404).send("-- loader not found");

    const decrypted = decrypt(loader.encryptedScript);

    res.setHeader("Content-Type", "text/plain");
    res.send(decrypted);
});

module.exports = router;
