export const CKB_CONFIG = {
  ckbConfigPath: 'source/ckb/',
  ckbLightClientConfigPath: 'source/ckb-light-client',
  binPath: 'source/bin',
}

export const CKB_CHAIN_DATA = {
  dbBlock2000: 'source/ckb-data/db.2000.tar.gz',
  accounts: [
    'brush scan basic know movie next time soccer speak loop balcony describe',
    'equip slim poem depth struggle tonight define stool brave sustain spy cabbage',
  ],
}

export const NEURON_CONFIG_DATA = {
  binPath: 'neuron',
  envPath: 'source/neuron/.env',
  networks: {
    dev: 'source/neuron/dev-wallet1/dev/networks/index.dev.json',
    light: 'source/neuron/dev-wallet1/dev/networks/index.light.json',
  },
  accounts: {
    account1: {
      path: 'source/neuron/dev-wallet1/dev/wallets',
      wallets: 'wallets.json',
      passwd: 'neuron.123456',
      account: 'aced9a1c-85c8-40eb-811d-9399212a92b9.json',
      walletsSelectId: 'c114f8e1-141f-49b1-937f-db0ab50faee5',
    },
  },
}

// SQLite数据路径
export const SQLITE_DATA_PATH = {
  dbBlock2000: {
    version: '',
    fullNode:
      'source/neuron-cell-data/2000/fullNode/wallet1/cell-0x9c96d0b369b5fd42d7e6b30d6dfdb46e32dac7293bf84de9d1e2d11ca7930717.sqlite',
    lightNode:
      'source/neuron-cell-data/2000/lightNode/wallet1/cell-0x9c96d0b369b5fd42d7e6b30d6dfdb46e32dac7293bf84de9d1e2d11ca7930717.sqlite',
  },
}
