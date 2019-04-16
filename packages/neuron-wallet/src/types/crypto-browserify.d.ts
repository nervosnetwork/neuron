declare type Buffer = any

declare module 'crypto-browserify' {
  export interface EventEmitter {
    addListener(event: string, listener: Function): this
    on(event: string, listener: Function): this
    once(event: string, listener: Function): this
    removeListener(event: string, listener: Function): this
    removeAllListeners(event?: string): this
    setMaxListeners(n: number): this
    getMaxListeners(): number
    listeners(event: string): Function[]
    emit(event: string, ...args: any[]): boolean
    listenerCount(type: string): number
  }

  export interface ReadableStream extends EventEmitter {
    readable: boolean
    read(size?: number): string | Buffer
    setEncoding(encoding: string): void
    pause(): void
    resume(): void
    pipe<T extends WritableStream>(destination: T, options?: { end?: boolean }): T
    unpipe<T extends WritableStream>(destination?: T): void
    unshift(chunk: string): void
    unshift(chunk: Buffer): void
    wrap(oldStream: ReadableStream): ReadableStream
  }

  export interface WritableStream extends EventEmitter {
    writable: boolean
    write(buffer: Buffer | string, cb?: Function): boolean
    write(str: string, encoding?: string, cb?: Function): boolean
    end(): void
    end(buffer: Buffer, cb?: Function): void
    end(str: string, cb?: Function): void
    end(str: string, encoding?: string, cb?: Function): void
  }

  export interface ReadWriteStream extends ReadableStream, WritableStream {}

  export interface CredentialDetails {
    pfx: string
    key: string
    passphrase: string
    cert: string
    ca: string | string[]
    crl: string | string[]
    ciphers: string
  }
  export interface Credentials {
    context?: any
  }
  export function createCredentials(details: CredentialDetails): Credentials
  export function createHash(algorithm: string): Hash
  export function createHmac(algorithm: string, key: Buffer): Hmac
  export interface Hash {
    update(data: any, inputEncoding?: string): Hash
    digest(encoding: 'buffer'): Buffer
    digest(encoding: string): any
    digest(): Buffer
  }
  export interface Hmac extends ReadWriteStream {
    update(data: any, inputEncoding?: string): Hmac
    digest(encoding: 'buffer'): Buffer
    digest(encoding: string): any
    digest(): Buffer
  }
  export function createCipher(algorithm: string, password: any): Cipher
  export function createCipheriv(algorithm: string, key: any, iv: any): Cipher
  export interface Cipher extends ReadWriteStream {
    update(data: Buffer): Buffer
    update(data: string, inputEncoding: 'utf8' | 'ascii' | 'binary'): Buffer
    update(data: Buffer, inputEncoding: any, outputEncoding: 'binary' | 'base64' | 'hex'): string
    update(
      data: string,
      inputEncoding: 'utf8' | 'ascii' | 'binary',
      outputEncoding: 'binary' | 'base64' | 'hex',
    ): string
    final(): Buffer
    final(outputEncoding: string): string
    setAutoPadding(autoPadding: boolean): void
    getAuthTag(): Buffer
  }
  export function createDecipher(algorithm: string, password: any): Decipher
  export function createDecipheriv(algorithm: string, key: any, iv: any): Decipher
  export interface Decipher extends ReadWriteStream {
    update(data: Buffer): Buffer
    update(data: string, inputEncoding: 'binary' | 'base64' | 'hex'): Buffer
    update(data: Buffer, inputEncoding: any, outputEncoding: 'utf8' | 'ascii' | 'binary'): string
    update(
      data: string,
      inputEncoding: 'binary' | 'base64' | 'hex',
      outputEncoding: 'utf8' | 'ascii' | 'binary',
    ): string
    final(): Buffer
    final(outputEncoding: string): string
    setAutoPadding(autoPadding: boolean): void
    setAuthTag(tag: Buffer): void
  }
  export function createSign(algorithm: string): Signer
  export interface Signer extends WritableStream {
    update(data: any): void
    sign(privateKey: string, outputFormat: string): string
  }
  export function createVerify(algorith: string): Verify
  export interface Verify extends WritableStream {
    update(data: any): void
    verify(object: string, signature: string, signatureFormat?: string): boolean
  }
  export function createDiffieHellman(prime: number, encoding?: string): DiffieHellman
  export interface DiffieHellman {
    generateKeys(encoding?: string): string
    computeSecret(otherPublicKey: string, inputEncoding?: string, outputEncoding?: string): string
    getPrime(encoding?: string): string
    getGenerator(encoding: string): string
    getPublicKey(encoding?: string): string
    getPrivateKey(encoding?: string): string
    setPublicKey(publicKey: string, encoding?: string): void
    setPrivateKey(publicKey: string, encoding?: string): void
  }
  export function getDiffieHellman(groupName: string): DiffieHellman
  export function pbkdf2(
    password: string | Buffer,
    salt: string | Buffer,
    iterations: number,
    keylen: number,
    digest: string,
    callback: (err: Error, derivedKey: Buffer) => any,
  ): void
  export function pbkdf2Sync(
    password: string | Buffer,
    salt: string | Buffer,
    iterations: number,
    keylen: number,
    digest: string,
  ): Buffer
  export function randomBytes(size: number): Buffer
  export function pseudoRandomBytes(size: number, callback: (err: Error, buf: Buffer) => void): void
  export interface RsaPublicKey {
    key: string
    padding?: any
  }
  export interface RsaPrivateKey {
    key: string
    passphrase?: string
    padding?: any
  }
  export function publicEncrypt(publicKey: string | RsaPublicKey, buffer: Buffer): Buffer
  export function privateDecrypt(privateKey: string | RsaPrivateKey, buffer: Buffer): Buffer
}
