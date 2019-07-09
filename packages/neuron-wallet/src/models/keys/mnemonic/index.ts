import crypto from 'crypto'
import wordList from './word-list'

const RADIX = 2048
const PBKDF2_ROUNDS = 2048
const KEY_LEN = 64
const MIN_ENTROPY_SIZE = 16
const MAX_ENTROPY_SIZE = 32
const MIN_WORDS_SIZE = 12
const MAX_WORDS_SIZE = 24

const INVALID_MNEMONIC = `Invalid mnemonic`
const INVALID_CHECKSUM = `Invalid checksum`
const ENTROPY_NOT_DIVISIBLE = `Entropy should be divisable by 4`
const ENTROPY_TOO_LONG = `Entropy should be shorter than ${MAX_ENTROPY_SIZE + 1}`
const ENTROPY_TOO_SHORT = `Entropy should be longer than ${MIN_ENTROPY_SIZE - 1}`
const WORDS_TOO_LONG = `Words should be shorter than ${MAX_WORDS_SIZE + 1}`
const WORDS_TOO_SHORT = `Words should be longer than ${MIN_WORDS_SIZE - 1}`

if (wordList.length !== RADIX) {
  throw new Error(`Word list should have ${RADIX} words, but ${wordList.length} received in fact`)
}

const bytesToBinary = (bytes: Buffer): string => {
  return bytes.reduce((binary, byte) => {
    return binary + byte.toString(2).padStart(8, '0')
  }, '')
}

const deriveChecksumBits = (entropyBuffer: Buffer): string => {
  const ENT = entropyBuffer.length * 8
  const CS = ENT / 32
  const hash = crypto
    .createHash('sha256')
    .update(entropyBuffer)
    .digest()
  return bytesToBinary(hash).slice(0, CS)
}

const salt = (password = '') => {
  return `mnemonic${password}`
}

export const mnemonicToSeedSync = (mnemonic: string = '', password: string = '') => {
  const mnemonicBuffer = Buffer.from(mnemonic.normalize('NFKD'), 'utf8')
  const saltBuffer = Buffer.from(salt(password.normalize('NFKD')), 'utf8')
  return crypto.pbkdf2Sync(mnemonicBuffer, saltBuffer, PBKDF2_ROUNDS, KEY_LEN, 'sha512')
}

export function mnemonicToSeed(mnemonic: string = '', password: string = ''): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const mnemonicBuffer = Buffer.from(mnemonic.normalize('NFKD'), 'utf8')
      const saltBuffer = Buffer.from(salt(password.normalize('NFKD')), 'utf8')
      crypto.pbkdf2(mnemonicBuffer, saltBuffer, PBKDF2_ROUNDS, KEY_LEN, 'sha512', (err, data) => {
        if (err) {
          reject(err)
        }
        resolve(data)
      })
    } catch (error) {
      reject(error)
    }
  })
}

export function mnemonicToEntropy(mnemonic: string = '') {
  const words = mnemonic.normalize('NFKD').split(' ')
  if (words.length < MIN_WORDS_SIZE) {
    throw new Error(WORDS_TOO_SHORT)
  }
  if (words.length > MAX_WORDS_SIZE) {
    throw new Error(WORDS_TOO_LONG)
  }
  if (words.length % 3 !== 0) {
    throw new Error(INVALID_MNEMONIC)
  }
  const bits = words
    .map(word => {
      const index = wordList!.indexOf(word)
      if (index === -1) {
        throw new Error(INVALID_MNEMONIC)
      }
      return index.toString(2).padStart(11, '0')
    })
    .join('')

  const dividerIndex = Math.floor(bits.length / 33) * 32
  const entropyBits = bits.slice(0, dividerIndex)
  const checksumBits = bits.slice(dividerIndex)

  const entropyBytes = entropyBits.match(/(.{1,8})/g)!.map(byte => parseInt(byte, 2))
  if (entropyBytes.length < MIN_ENTROPY_SIZE) {
    throw new Error(ENTROPY_TOO_SHORT)
  }
  if (entropyBytes.length > MAX_ENTROPY_SIZE) {
    throw new Error(ENTROPY_TOO_LONG)
  }
  if (entropyBytes.length % 4 !== 0) {
    throw new Error(ENTROPY_NOT_DIVISIBLE)
  }

  const entropy = Buffer.from(entropyBytes)
  const newChecksum = deriveChecksumBits(entropy)
  if (newChecksum !== checksumBits) {
    throw new Error(INVALID_CHECKSUM)
  }

  return entropy.toString('hex')
}

export function entropyToMnemonic(entropyStr: string) {
  const entropy = Buffer.from(entropyStr, 'hex')

  if (entropy.length < MIN_ENTROPY_SIZE) {
    throw new TypeError(ENTROPY_TOO_SHORT)
  }
  if (entropy.length > MAX_ENTROPY_SIZE) {
    throw new TypeError(ENTROPY_TOO_LONG)
  }
  if (entropy.length % 4 !== 0) {
    throw new TypeError(ENTROPY_NOT_DIVISIBLE)
  }

  const entropyBytes = bytesToBinary(entropy)
  const checksumBytes = deriveChecksumBits(entropy)

  const bytes = entropyBytes + checksumBytes
  const chunks = bytes.match(/(.{1,11})/g)!
  const words = chunks.map(binary => {
    const index = parseInt(binary, 2)
    return wordList[index]
  })

  return words.join(' ')
}

export function validateMnemonic(mnemonic: string) {
  try {
    mnemonicToEntropy(mnemonic)
  } catch (e) {
    return false
  }
  return true
}

export default {
  entropyToMnemonic,
  mnemonicToEntropy,
  mnemonicToSeed,
  mnemonicToSeedSync,
  validateMnemonic,
}
