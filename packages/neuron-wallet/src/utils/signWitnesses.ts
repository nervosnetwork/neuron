import { bytes, Uint64LE } from '@ckb-lumos/lumos/codec'
import { serializeWitnessArgs } from './serialization'
import { CKBHasher } from '@ckb-lumos/lumos/utils'
import { hd } from '@ckb-lumos/lumos'

type StructuredWitness = CKBComponents.WitnessArgs | CKBComponents.Witness

// https://github.com/nervosnetwork/ckb-system-scripts/wiki/How-to-sign-transaction#signing
export const signWitnesses = ({
  witnesses,
  transactionHash,
  privateKey,
}: {
  witnesses: StructuredWitness[]
  transactionHash: string
  privateKey: string
}): StructuredWitness[] => {
  if (witnesses.length === 0) {
    throw new Error('witnesses cannot be empty')
  }
  if (typeof witnesses[0] !== 'object') {
    throw new Error('The first witness in the group should be type of WitnessArgs')
  }

  const emptyWitness = {
    ...witnesses[0],
    lock: `0x${'00'.repeat(65)}`,
  }
  const serializedEmptyWitnessBytes = bytes.bytify(serializeWitnessArgs(emptyWitness))
  const serializedEmptyWitnessSize = serializedEmptyWitnessBytes.byteLength

  const hasher = new CKBHasher()
  hasher.update(transactionHash)
  hasher.update(Uint64LE.pack(serializedEmptyWitnessSize))
  hasher.update(serializedEmptyWitnessBytes)

  witnesses.slice(1).forEach(witness => {
    const witnessBytes = bytes.bytify(typeof witness === 'string' ? witness : serializeWitnessArgs(witness))
    hasher.update(Uint64LE.pack(witnessBytes.byteLength))
    hasher.update(witnessBytes)
  })
  const message = hasher.digestHex()

  emptyWitness.lock = hd.key.signRecoverable(message, privateKey)
  return [serializeWitnessArgs(emptyWitness), ...witnesses.slice(1)]
}
