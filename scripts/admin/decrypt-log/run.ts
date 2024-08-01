import { LogDecryption } from "../../../packages/neuron-wallet/src/services/log-encryption";

const ADMIN_PRIVATE_KEY = process.env
  .ADMIN_PRIVATE_KEY!.split(/\r?\n/)
  .map((line) => line.trim())
  .join("\n");
const LOG_MESSAGE = process.env.LOG_MESSAGE!;

const decryption = new LogDecryption(ADMIN_PRIVATE_KEY);
console.log(decryption.decrypt(LOG_MESSAGE));
