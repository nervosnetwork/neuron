import { predefined } from '@ckb-lumos/lumos/config'

const systemScriptsMainnet = predefined.LINA.SCRIPTS
const systemScriptsTestnet = predefined.AGGRON4.SCRIPTS

export const systemScripts = {
  SECP256K1_BLAKE160: {
    CODE_HASH: systemScriptsMainnet.SECP256K1_BLAKE160.CODE_HASH,
    HASH_TYPE: systemScriptsMainnet.SECP256K1_BLAKE160.HASH_TYPE,
  },
  DAO: {
    CODE_HASH: systemScriptsMainnet.DAO.CODE_HASH,
    HASH_TYPE: systemScriptsMainnet.DAO.HASH_TYPE,
  },
  SECP256K1_BLAKE160_MULTISIG: {
    CODE_HASH: systemScriptsMainnet.SECP256K1_BLAKE160_MULTISIG.CODE_HASH,
    HASH_TYPE: systemScriptsMainnet.SECP256K1_BLAKE160_MULTISIG.HASH_TYPE,
  },
  ANYONE_CAN_PAY_MAINNET: {
    CODE_HASH: systemScriptsMainnet.ANYONE_CAN_PAY.CODE_HASH,
    HASH_TYPE: systemScriptsMainnet.ANYONE_CAN_PAY.HASH_TYPE,
  },
  ANYONE_CAN_PAY_TESTNET: {
    CODE_HASH: systemScriptsTestnet.ANYONE_CAN_PAY.CODE_HASH,
    HASH_TYPE: systemScriptsTestnet.ANYONE_CAN_PAY.HASH_TYPE,
  },
}
