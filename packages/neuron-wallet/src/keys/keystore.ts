export interface KeysData {
  privateKey: string
  chainCode: string
}

export interface Child {
  path: string
  privateKey: string
  chainCode: string
}

export interface CipherParams {
  iv: string
}

export interface KdfParams {
  dklen: number
  n: number
  r: number
  p: number
  salt: string
}

export interface Crypto {
  ciper: string
  cipherparams: CipherParams
  ciphertext: string
  kdf: string
  kdfparams: KdfParams
  mac: string
}

export interface Keystore {
  crypto: Crypto
  id: string
  version: number
}
