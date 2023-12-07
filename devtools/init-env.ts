import { Keystore } from "@ckb-lumos/hd";
import * as fs from "fs";

const json = fs.readFileSync(`./wallet.json`).toString();
const password = process.env.PASSWORD || `Qwe123456`;

const keystore = Keystore.fromJson(json);
const extPrivKey = keystore.extendedPrivateKey(password);
const env = [];

env.push(`EXTENDED_PRIVATE_KEY=${extPrivKey.privateKey}`);
env.push(`CHAIN_CODE=${extPrivKey.chainCode}`);

const privateKey0 = extPrivKey.privateKeyInfoByPath(`m/44'/309'/0'/0/0`).privateKey;
const privateKey1 = extPrivKey.privateKeyInfoByPath(`m/44'/309'/0'/0/1`).privateKey;
const privateKey2 = extPrivKey.privateKeyInfoByPath(`m/44'/309'/0'/0/2`).privateKey;

env.push(`PRIVATE_KEY_0=${privateKey0}`);
env.push(`PRIVATE_KEY_1=${privateKey1}`);
env.push(`PRIVATE_KEY_2=${privateKey2}`);

env.push(`RPC_URL=http://localhost:8114`);

console.log(env.join("\n"));
if (fs.existsSync(".env")) {
  throw new Error(".env is already exists");
}
fs.writeFileSync(".env", env.join("\n"));
