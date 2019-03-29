// / <reference types="node" />

declare module 'scrypt.js' {
  export interface Params {
    N: number
    r: number
    p: number
  }

  export function paramsSync(maxtime: number, maxmem?: number, maxmemfrac?: number): Params

  export function kdf(key: string | Buffer, paramsObject: Params): Promise<Buffer>
  export function kdfSync(key: string | Buffer, paramsObject: Params): Buffer

  export function verifyKdf(): any
  export function verifyKdfSync(): any

  export function hash(
    key: string | Buffer,
    params: Params,
    outputLength: number,
    salt: string | Buffer,
  ): Promise<Buffer>
  export function hashSync(key: string | Buffer, params: Params, outputLength: number, salt: string | Buffer): Buffer
}
