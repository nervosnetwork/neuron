// this script is used to deploy always success contract to the chain

import { commons, config, hd, helpers, Indexer, RPC } from "@ckb-lumos/lumos";
import { bytes } from "@ckb-lumos/codec";
import { getContext } from "./context";

const debug = (...args: unknown[]) => console.log(new Date().toJSON(), "[info]", ...args);

// always success contract
// '0x' + fs.readFileSync('always_success').toString('hex')
const ALWAYS_SUCCESS_SCRIPT =
  "0x7f454c460201010000000000000000000200f3000100000078000100000000004000000000000000980000000000000005000000400038000100400003000200010000000500000000000000000000000000010000000000000001000000000082000000000000008200000000000000001000000000000001459308d00573000000002e7368737472746162002e74657874000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000b000000010000000600000000000000780001000000000078000000000000000a0000000000000000000000000000000200000000000000000000000000000001000000030000000000000000000000000000000000000082000000000000001100000000000000000000000000000001000000000000000000000000000000";

async function main() {
  const { rpcUrl, privateKey1 } = await getContext();

  const rpc = new RPC(rpcUrl);
  const indexer = new Indexer(rpcUrl);

  const genesisBlock = await rpc.getBlockByNumber("0x0");
  const genesisScriptConfig = config.generateGenesisScriptConfigs(genesisBlock);

  const secp256k1ScriptConfig = genesisScriptConfig.SECP256K1_BLAKE160;
  const managerConfig = { PREFIX: "ckt", SCRIPTS: genesisScriptConfig } as const;
  const configParam = { config: managerConfig };

  const address = helpers.encodeToAddress(
    {
      codeHash: secp256k1ScriptConfig.CODE_HASH,
      hashType: secp256k1ScriptConfig.HASH_TYPE,
      args: hd.key.privateKeyToBlake160(privateKey1),
    },
    configParam
  );

  debug(`Please make sure the address (${address}) has enough capacity before continue`);

  let { txSkeleton, scriptConfig, typeId } = await commons.deploy.generateDeployWithTypeIdTx({
    config: managerConfig,
    scriptBinary: bytes.bytify(ALWAYS_SUCCESS_SCRIPT),
    cellProvider: indexer,
    fromInfo: address,
  });

  txSkeleton = txSkeleton.asMutable();

  commons.common.prepareSigningEntries(txSkeleton, configParam);

  const digest = txSkeleton.get("signingEntries").get(0)!.message;
  const signature = hd.key.signRecoverable(digest, privateKey1);

  const tx = helpers.sealTransaction(txSkeleton, [signature]);

  await rpc.sendTransaction(tx);
  debug("Deploy successfully");
  debug("Lumos script config:", scriptConfig);
  debug("Deploying with the type script", typeId);
}

main();
