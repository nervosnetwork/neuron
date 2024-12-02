import { predefined, createConfig, type ScriptConfig } from '@ckb-lumos/config-manager'

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

function getPredefinedFromEnv(
  isMainnet: boolean,
  envScriptName: 'SUDT' | 'ACP' | 'XUDT',
  scriptConfigKey: keyof typeof predefined.LINA.SCRIPTS
): Partial<typeof predefined.LINA.SCRIPTS> | undefined {
  const prefix = `${isMainnet ? 'MAINNET_' : 'TESTNET_'}${envScriptName}_`
  const CODE_HASH = process.env[`${prefix}SCRIPT_CODEHASH`]
  const HASH_TYPE = process.env[`${prefix}SCRIPT_HASHTYPE`] as ScriptConfig['HASH_TYPE']
  const TX_HASH = process.env[`${prefix}DEP_TXHASH`]
  const INDEX = process.env[`${prefix}DEP_INDEX`]
  const DEP_TYPE = process.env[`${prefix}DEP_TYPE`] as ScriptConfig['DEP_TYPE']
  if (CODE_HASH && HASH_TYPE && TX_HASH && INDEX && DEP_TYPE) {
    return {
      [scriptConfigKey]: {
        CODE_HASH,
        HASH_TYPE,
        TX_HASH,
        INDEX,
        DEP_TYPE,
      },
    }
  }
}

export const LINA = createConfig({
  PREFIX: predefined.LINA.PREFIX,
  SCRIPTS: {
    ...predefined.LINA.SCRIPTS,
    ...getPredefinedFromEnv(true, 'SUDT', 'SUDT'),
    ...getPredefinedFromEnv(true, 'XUDT', 'XUDT'),
    ...getPredefinedFromEnv(true, 'ACP', 'ANYONE_CAN_PAY'),
  },
})

export const AGGRON4 = createConfig({
  PREFIX: predefined.AGGRON4.PREFIX,
  SCRIPTS: {
    ...predefined.AGGRON4.SCRIPTS,
    ...getPredefinedFromEnv(false, 'SUDT', 'SUDT'),
    ...getPredefinedFromEnv(false, 'XUDT', 'XUDT'),
    ...getPredefinedFromEnv(false, 'ACP', 'ANYONE_CAN_PAY'),
  },
})
