export interface Master {
  seed: string
  privkey: string
  chainCode: string
}

export interface Child {
  path: string
  depth: number
  privkey: string
  chainCode: string
}

export interface KeyStore {
  master: Master
  children: Child[]
}
