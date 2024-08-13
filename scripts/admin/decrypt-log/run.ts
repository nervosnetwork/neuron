import { createDecipheriv, privateDecrypt } from "node:crypto";

export const DEFAULT_ALGORITHM = "aes-256-cbc";

export class LogDecryption {
  private readonly adminPrivateKey: string;

  constructor(adminPrivateKey: string) {
    this.adminPrivateKey = adminPrivateKey;
  }

  decrypt(encryptedMessage: string): string {
    const { iv, key, content } = parseMessage(encryptedMessage);

    const decipher = createDecipheriv(
      DEFAULT_ALGORITHM,
      privateDecrypt(this.adminPrivateKey, Buffer.from(key, "base64")),
      Buffer.from(iv, "base64")
    );

    return Buffer.concat([decipher.update(content, "base64"), decipher.final()]).toString("utf-8");
  }
}

/**
 * Parse a message into a JSON
 *
 * Input:
 * ```
 * [key1:value2] [key2:value2] remain content
 * ```
 * Output:
 * ```json
 * {
 *   "key1": "value1",
 *   "key2": "value2",
 *   "content": "remain content"
 *  }
 * ```
 * @param message
 */
function parseMessage(message: string) {
  const result: Record<string, string> = {};
  const regex = /\[([^\]:]+):([^\]]+)]/g;
  let match;
  let lastIndex = 0;

  while ((match = regex.exec(message)) !== null) {
    const [, key, value] = match;
    result[key.trim()] = value.trim();
    lastIndex = regex.lastIndex;
  }

  // Extract remaining content after the last bracket
  const remainingContent = message.slice(lastIndex).trim();
  if (remainingContent) {
    result.content = remainingContent;
  }

  return result;
}

const ADMIN_PRIVATE_KEY = process.env
  .ADMIN_PRIVATE_KEY!.split(/\r?\n/)
  .map((line) => line.trim())
  .join("\n");
const LOG_MESSAGE = process.env.LOG_MESSAGE!;

const decryption = new LogDecryption(ADMIN_PRIVATE_KEY);
console.log(decryption.decrypt(LOG_MESSAGE));
