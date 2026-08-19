const path = require("path");
require("dotenv").config({
    path: path.join(__dirname, "..", ".env")
});

const crypto = require("crypto");

const AES_SECRET = process.env.AES_SECRET;
const AES_KEY = crypto.createHash("sha256").update(AES_SECRET).digest();
const AES_IV = Buffer.alloc(16, 0);

function encrypt(text) {
    const cipher = crypto.createCipheriv("aes-256-cbc", AES_KEY, AES_IV);
    let encrypted = cipher.update(text, "utf8", "base64");
    encrypted += cipher.final("base64");
    return encrypted;
}

function decrypt(text) {
    const decipher = crypto.createDecipheriv("aes-256-cbc", AES_KEY, AES_IV);
    let decrypted = decipher.update(text, "base64", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
}

module.exports = { encrypt, decrypt };
