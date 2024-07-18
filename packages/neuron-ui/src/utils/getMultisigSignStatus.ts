import { addressToScript } from 'utils'
import { computeScriptHash } from '@ckb-lumos/lumos/utils'
import { MultisigConfig } from 'services/remote'

export const getMultisigSignStatus = ({
  multisigConfig,
  signatures,
  addresses,
}: {
  multisigConfig: MultisigConfig
  signatures?: State.Signatures
  addresses: State.Address[]
}) => {
  const multisigLockHash = computeScriptHash(addressToScript(multisigConfig.fullPayload))
  const multisigBlake160s = multisigConfig.addresses.map(v => addressToScript(v).args)
  const addressBlake160s = addresses.map(v => addressToScript(v.address).args)
  const notSpecifiedCount = multisigConfig.m - multisigConfig.r
  const specifiedUnsignedAddresses: string[] = []
  const unspecifiedSignedAddresses: string[] = []
  const unspecifiedUnsignedAddresses: string[] = []
  for (let i = 0; i < multisigBlake160s.length; i++) {
    const hasSigned = signatures?.[multisigLockHash]?.includes(multisigBlake160s[i])
    if (i < multisigConfig.r) {
      if (!hasSigned) {
        specifiedUnsignedAddresses.push(multisigBlake160s[i])
      }
    } else {
      ;(hasSigned ? unspecifiedSignedAddresses : unspecifiedUnsignedAddresses).push(multisigBlake160s[i])
    }
  }
  const lackOfUnspecifiedCount =
    unspecifiedSignedAddresses.length < notSpecifiedCount ? notSpecifiedCount - unspecifiedSignedAddresses.length : 0
  let canBroadcastAfterSign = false
  let canSign = specifiedUnsignedAddresses.some(v => addressBlake160s.includes(v))
  if (lackOfUnspecifiedCount + specifiedUnsignedAddresses.length === 1) {
    if (specifiedUnsignedAddresses.length === 1) {
      canBroadcastAfterSign = addressBlake160s.includes(specifiedUnsignedAddresses[0])
    } else {
      canBroadcastAfterSign = unspecifiedUnsignedAddresses.some(v => addressBlake160s.includes(v))
    }
    canSign = canBroadcastAfterSign
  } else {
    canSign =
      specifiedUnsignedAddresses.some(v => addressBlake160s.includes(v)) ||
      (!!lackOfUnspecifiedCount && unspecifiedUnsignedAddresses.some(v => addressBlake160s.includes(v)))
  }
  return {
    lackOfRCount: specifiedUnsignedAddresses.length,
    lackOfMCount: lackOfUnspecifiedCount + specifiedUnsignedAddresses.length,
    canBroadcastAfterSign,
    canSign,
  }
}

export default getMultisigSignStatus
