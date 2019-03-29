// / <reference types="node" />

declare module 'scrypt.js' {
  export interface Params {
    N: number
    r: number
    p: number
  }

  export function params(): any
  export function paramsSync(maxtime: number, maxmem?: number, maxmemfrac?: number): Params

  export function kdf(): any
  export function kdfSync(key: string | Buffer, paramsObject: Params): Buffer

  export function verifyKdf(): any
  export function verifyKdfSync(): any

  export function hash(): any
  export function hashSync(): any
}
