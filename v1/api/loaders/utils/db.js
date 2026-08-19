const { MongoClient } = require("mongodb");
const uri = process.env.MONGO_URI;

let client;
let db;

async function connectDB() {
    if (!client) {
        client = new MongoClient(uri);
        await client.connect();
        db = client.db("loader_system");
    }
    return db;
}

module.exports = connectDB;
