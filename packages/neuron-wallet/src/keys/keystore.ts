export interface Master {
  privateKey: string
  chainCode: string
}

export interface Child {
  path: string
  privateKey: string
  chainCode: string
}

export interface Keystore {
  master: Master
  children?: Child[]
}
