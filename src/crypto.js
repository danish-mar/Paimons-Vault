"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encrypt = encrypt;
exports.decrypt = decrypt;
exports.generateMasterKey = generateMasterKey;
var crypto = require("crypto");
var ALGORITHM = 'aes-256-cbc';
var IV_LENGTH = 16; // For AES-256-CBC
function encrypt(text, key) {
    var iv = crypto.randomBytes(IV_LENGTH);
    var cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    var encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return { iv: iv.toString('hex'), encryptedData: encrypted };
}
function decrypt(encryptedData, iv, key) {
    var decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'hex'));
    var decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}
function generateMasterKey() {
    return crypto.randomBytes(32); // 32 bytes for AES-256
}
