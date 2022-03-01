import '../src/locales/i18n'
import { LedgerHID, LedgerCkbApp } from './mock/hardware'
export const originalXMLHttpRequest = window.XMLHttpRequest

export const mockedXMLHttpRequest = {
  open: jest.fn(),
  send: jest.fn(),
  readyState: null,
  responseText: null,
}

Object.defineProperty(mockedXMLHttpRequest, 'readyState', {
  get: jest.fn(() => 4),
  set: jest.fn()
});
Object.defineProperty(mockedXMLHttpRequest, 'responseText', {
  get: jest.fn(() => JSON.stringify([])),
  set: jest.fn()
});

Object.defineProperty(window, "XMLHttpRequest", jest.fn(() => ({
  open: mockedXMLHttpRequest.open,
  send: mockedXMLHttpRequest.send,
  readyState: mockedXMLHttpRequest.readyState,
  responseText: mockedXMLHttpRequest.responseText
})));

jest.mock('levelup', () => {
  return () => ({
    get: () => {
      return new Promise(resolve => {
        resolve('description')
      })
    }
  })
})

jest.mock('dotenv', () => ({
  config: () => {
    process.env.MAINNET_SUDT_DEP_TXHASH='0x0000000000000000000000000000000000000000000000000000000000000000'
    process.env.MAINNET_SUDT_DEP_INDEX='0'
    process.env.MAINNET_SUDT_DEP_TYPE='code'
    process.env.MAINNET_SUDT_SCRIPT_CODEHASH='0x0000000000000000000000000000000000000000000000000000000000000000'
    process.env.MAINNET_SUDT_SCRIPT_HASHTYPE='data'

    process.env.MAINNET_ACP_DEP_TXHASH='0x0000000000000000000000000000000000000000000000000000000000000000'
    process.env.MAINNET_ACP_DEP_INDEX='0'
    process.env.MAINNET_ACP_DEP_TYPE='code'
    process.env.MAINNET_ACP_SCRIPT_CODEHASH='0x0000000000000000000000000000000000000000000000000000000000000000'
    process.env.MAINNET_ACP_SCRIPT_HASHTYPE='type'

    process.env.LEGACY_MAINNET_ACP_DEP_TXHASH='0x0000000000000000000000000000000000000000000000000000000000000001'
    process.env.LEGACY_MAINNET_ACP_DEP_INDEX='0'
    process.env.LEGACY_MAINNET_ACP_DEP_TYPE='code'
    process.env.LEGACY_MAINNET_ACP_SCRIPT_CODEHASH='0x0000000000000000000000000000000000000000000000000000000000000001'
    process.env.LEGACY_MAINNET_ACP_SCRIPT_HASHTYPE='type'

    process.env.MAINNET_PW_ACP_DEP_TXHASH='0x0000000000000000000000000000000000000000000000000000000000000002'
    process.env.MAINNET_PW_ACP_DEP_INDEX='0'
    process.env.MAINNET_PW_ACP_DEP_TYPE='depGroup'
    process.env.MAINNET_PW_ACP_SCRIPT_CODEHASH='0x0000000000000000000000000000000000000000000000000000000000000002'
    process.env.MAINNET_PW_ACP_SCRIPT_HASHTYPE='type'

    process.env.MAINNET_CHEQUE_DEP_TXHASH='0x0000000000000000000000000000000000000000000000000000000000000003'
    process.env.MAINNET_CHEQUE_DEP_INDEX='0'
    process.env.MAINNET_CHEQUE_DEP_TYPE='depGroup'
    process.env.MAINNET_CHEQUE_SCRIPT_CODEHASH='0x0000000000000000000000000000000000000000000000000000000000000003'
    process.env.MAINNET_CHEQUE_SCRIPT_HASHTYPE='type'

    process.env.MAINNET_SUDT_SCRIPT_CODEHASH='0x48dbf59b4c7ee1547238021b4869bceedf4eea6b43772e5d66ef8865b6ae7212'

    process.env.TESTNET_SUDT_DEP_TXHASH='0xc1b2ae129fad7465aaa9acc9785f842ba3e6e8b8051d899defa89f5508a77958'
    process.env.TESTNET_SUDT_DEP_INDEX='0'
    process.env.TESTNET_SUDT_DEP_TYPE='code'
    process.env.TESTNET_SUDT_SCRIPT_CODEHASH='0x48dbf59b4c7ee1547238021b4869bceedf4eea6b43772e5d66ef8865b6ae7212'
    process.env.TESTNET_SUDT_SCRIPT_HASHTYPE='data'

    process.env.TESTNET_ACP_DEP_TXHASH='0x4f32b3e39bd1b6350d326fdfafdfe05e5221865c3098ae323096f0bfc69e0a8c'
    process.env.TESTNET_ACP_DEP_INDEX='0'
    process.env.TESTNET_ACP_DEP_TYPE='depGroup'
    process.env.TESTNET_ACP_SCRIPT_CODEHASH='0x86a1c6987a4acbe1a887cca4c9dd2ac9fcb07405bbeda51b861b18bbf7492c4b'
    process.env.TESTNET_ACP_SCRIPT_HASHTYPE='type'

    process.env.LEGACY_TESTNET_ACP_DEP_TXHASH='0x0000000000000000000000000000000000000000000000000000000000000001'
    process.env.LEGACY_TESTNET_ACP_DEP_INDEX='0'
    process.env.LEGACY_TESTNET_ACP_DEP_TYPE='code'
    process.env.LEGACY_TESTNET_ACP_SCRIPT_CODEHASH='0x0000000000000000000000000000000000000000000000000000000000000001'
    process.env.LEGACY_TESTNET_ACP_SCRIPT_HASHTYPE='type'

    process.env.TESTNET_PW_ACP_DEP_TXHASH='0x0000000000000000000000000000000000000000000000000000000000000002'
    process.env.TESTNET_PW_ACP_DEP_INDEX='0'
    process.env.TESTNET_PW_ACP_DEP_TYPE='depGroup'
    process.env.TESTNET_PW_ACP_SCRIPT_CODEHASH='0x0000000000000000000000000000000000000000000000000000000000000002'
    process.env.TESTNET_PW_ACP_SCRIPT_HASHTYPE='type'

    process.env.TESTNET_CHEQUE_DEP_TXHASH='0x0000000000000000000000000000000000000000000000000000000000000003'
    process.env.TESTNET_CHEQUE_DEP_INDEX='0'
    process.env.TESTNET_CHEQUE_DEP_TYPE='depGroup'
    process.env.TESTNET_CHEQUE_SCRIPT_CODEHASH='0x0000000000000000000000000000000000000000000000000000000000000003'
    process.env.TESTNET_CHEQUE_SCRIPT_HASHTYPE='type'
  }
}))

process.on('unhandledRejection', console.error)
jest.mock('@ledgerhq/hw-transport-node-hid', () => {
  return LedgerHID
})

jest.mock('hw-app-ckb', () => {
  return LedgerCkbApp
})
