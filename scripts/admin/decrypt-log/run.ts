import { createDecipheriv, privateDecrypt } from "node:crypto";

const CLIENT_ENCRYPTED_KEY = process.env.CLIENT_ENCRYPTED_KEY!;
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY!;
const LOG_MESSAGE = process.env.LOG_MESSAGE!;

const ALGORITHM = "aes-256-cbc";

let [_original, _date, _level, iv, message] = LOG_MESSAGE.match(/(\[.+])\s*(\[.+])\s*(\[iv:.+])\s*(.+)/)!;

// recovery the client log key
const encryptedClientKey = Buffer.from(CLIENT_ENCRYPTED_KEY, "base64");
const clientKey = privateDecrypt(ADMIN_PRIVATE_KEY, encryptedClientKey);

const decodedIV = Buffer.from(iv.substring("[iv:".length, iv.length - 1), "base64");
const decipher = createDecipheriv(ALGORITHM, clientKey, decodedIV);

const decryptedLog = Buffer.concat([decipher.update(message, "base64"), decipher.final()]);

console.log(decryptedLog.toString("utf-8"));
