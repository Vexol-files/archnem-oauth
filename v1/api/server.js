require("dotenv").config();
const express = require("express");
const app = express();

app.use(express.json());

// ROUTERY
app.use("/v1/api/keys", require("./v1/api/keys/router"));
app.use("/v1/api/hwid", require("./v1/api/hwid/router"));
app.use("/v1/api/owner", require("./v1/api/owner/router"));
app.use("/v1/api/loaders", require("./v1/api/loaders/router"));

app.listen(process.env.PORT, () => {
    console.log("ArchNem API running on port", process.env.PORT);
});
