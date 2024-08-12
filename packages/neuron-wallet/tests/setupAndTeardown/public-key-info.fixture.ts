import { scriptToAddress } from '../../src/utils/scriptAndAddress'
import { hd } from '@ckb-lumos/lumos'
import SystemScriptInfo from '../../src/models/system-script-info'

const AddressType = hd.AddressType

const walletId1 = 'w1'
const walletId2 = 'w2'
const walletId3 = 'w3'

const alicePublicKeyHash = '0xe2193df51d78411601796b35b17b4f8f2cd85bd0'
const aliceLockScript = SystemScriptInfo.generateSecpScript(alicePublicKeyHash)
const alice = {
  lockScript: aliceLockScript,
  lockHash: aliceLockScript.computeHash(),
  address: scriptToAddress(aliceLockScript, false),
  blake160: aliceLockScript.args,
  walletId: walletId1,
}

const bobPublicKeyHash = '0x36c329ed630d6ce750712a477543672adab57f4c'
const bobLockScript = SystemScriptInfo.generateSecpScript(bobPublicKeyHash)
const bob = {
  lockScript: bobLockScript,
  lockHash: bobLockScript.computeHash(),
  address: scriptToAddress(bobLockScript, false),
  blake160: bobPublicKeyHash,
  walletId: walletId1,
}

const charliePublicKeyHash = '0xe2193df51d78411601796b35b17b4f8f2cd80000'
const charlieLockScript = SystemScriptInfo.generateSecpScript(charliePublicKeyHash)
const charlie = {
  lockScript: charlieLockScript,
  lockHash: charlieLockScript.computeHash(),
  address: scriptToAddress(charlieLockScript, false),
  blake160: charliePublicKeyHash,
  walletId: walletId2,
}

const aliceKeyInfo = {
  walletId: walletId1,
  path: "m/44'/309'/0'/0/0",
  address: alice.address,
  addressType: AddressType.Receiving,
  addressIndex: 0,
  publicKeyInBlake160: aliceLockScript.args,
  lockScript: aliceLockScript,
}
const bobKeyInfo = {
  walletId: walletId1,
  path: "m/44'/309'/0'/0/1",
  address: bob.address,
  addressType: AddressType.Receiving,
  addressIndex: 1,
  publicKeyInBlake160: bobLockScript.args,
  lockScript: bobLockScript,
}
const charlieKeyInfo = {
  walletId: walletId2,
  path: "m/44'/309'/0'/0/2",
  address: charlie.address,
  addressType: AddressType.Receiving,
  addressIndex: 2,
  publicKeyInBlake160: charlieLockScript.args,
  lockScript: charlieLockScript,
}

const duplicatedAliceKeyInfo = {
  walletId: walletId3,
  path: "m/44'/309'/0'/0/0",
  address: alice.address,
  addressType: AddressType.Receiving,
  addressIndex: 0,
  publicKeyInBlake160: aliceLockScript.args,
  lockScript: aliceLockScript,
}
const duplicatedCharlieKeyInfo = {
  walletId: walletId3,
  path: "m/44'/309'/0'/0/2",
  address: charlie.address,
  addressType: AddressType.Receiving,
  addressIndex: 2,
  publicKeyInBlake160: charlieLockScript.args,
  lockScript: charlieLockScript,
}

export default [aliceKeyInfo, bobKeyInfo, charlieKeyInfo]

export const keyInfos = [aliceKeyInfo, bobKeyInfo, charlieKeyInfo, duplicatedAliceKeyInfo, duplicatedCharlieKeyInfo]
