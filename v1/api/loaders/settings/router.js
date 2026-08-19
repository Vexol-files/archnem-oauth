const express = require("express");
const router = express.Router();
const connectDB = require("../../utils/db");

// GET — status skryptu (on/off)
router.get("/status", async (req, res) => {
    const db = await connectDB();
    const settings = db.collection("settings");

    const doc = await settings.findOne({});
    res.send(doc.script_status);
});

// GET — placeId gry
router.get("/placeid", async (req, res) => {
    const db = await connectDB();
    const settings = db.collection("settings");

    const doc = await settings.findOne({});
    res.send(doc.placeid);
});

// POST — zmiana statusu (on/off)
router.post("/toggle", async (req, res) => {
    const { state } = req.body;

    if (!state) return res.send("invalid");

    const db = await connectDB();
    const settings = db.collection("settings");

    await settings.updateOne({}, { $set: { script_status: state } });

    res.send("updated");
});

// POST — zmiana placeId
router.post("/placeid", async (req, res) => {
    const { placeid } = req.body;

    if (!placeid) return res.send("invalid");

    const db = await connectDB();
    const settings = db.collection("settings");

    await settings.updateOne({}, { $set: { placeid } });

    res.send("updated");
});

module.exports = router;
