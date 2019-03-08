export interface Master {
  privateKey: string
  chainCode: string
}

export interface Child {
  path: string
  depth: number
  privateKey: string
  chainCode: string
}

export interface Keystore {
  master: Master
  children?: Child[]
}
