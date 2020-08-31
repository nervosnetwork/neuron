// Until there's a @types/hw-app-ckb
// import type Transport from '@ledgerhq/hw-transport'
declare module '@ledgerhq/hw-transport-node-ble'
declare module 'hw-app-ckb' {
  export interface WalletPublicKey {
    publicKey: string,
    lockArg: string,
    address: string
  }
  export interface ExtendPublicKey {
    public_key: string,
    chain_code: string
  }
  export default class LedgerCKB {
    transport: any
    constructor(transport: any, scrambleKey?: string)
    /**
     * get CKB address for a given BIP 32 path.
     *
     * @param path a path in BIP 32 format
     * @return an object with a publicKey, lockArg, and (secp256k1+blake160) address.
     * @example
     * const result = await ckb.getWalletPublicKey("44'/144'/0'/0/0");
     * const publicKey = result.publicKey;
     * const lockArg = result.lockArg;
     * const address = result.address;
     */
    async getWalletPublicKey(path: string, testnet: boolean): Promise<WalletPublicKey>
    /**
     * get extended public key for a given BIP 32 path.
     *
     * @param path a path in BIP 32 format
     * @return an object with a publicKey
     * @example
     * const result = await ckb.getWalletPublicKey("44'/144'/0'/0/0");
     * const publicKey = result;
     */
    async getWalletExtendedPublicKey(path: string): Promise<ExtendPublicKey>
    /**
     * Sign a Nervos transaction with a given BIP 32 path
     *
     * @param signPath the path to sign with, in BIP 32 format
     * @param rawTxHex transaction to sign
     * @param groupWitnessesHex hex of in-group and extra witnesses to include in signature
     * @param contextTransaction list of transaction contexts for parsing
     * @param changePath the path the transaction sends change to, in BIP 32 format (optional, defaults to signPath)
     * @return a signature as hex string
     */
    async signTransaction(
      signPath: string | BIPPath | string[],
      rawTx: string | blockchain.RawTransactionJSON,
      groupWitnessesHex?: string[],
      rawContextsTx: string | blockchain.RawTransactionJSON[],
      changePath: string | BIPPath | number[]
    ): Promise<string>

    /**
     * Construct an AnnotatedTransaction for a given collection of signing data
     *
     * Parameters are the same as for signTransaction, but no ledger interaction is attempted.
     *
     * AnnotatedTransaction is a type defined for the ledger app that collects
     * all of the information needed to securely confirm a transaction on-screen
     * and a few bits of duplicative information to allow it to be processed as a
     * stream.
     */
    buildAnnotatedTransaction(
      signPath: string | BIPPath | [number],
      rawTx: string | RawTransactionJSON,
      groupWitnesses?: [string],
      rawContextsTx: [string | RawTransactionJSON],
      changePath: string | BIPPath | [number]
    ): AnnotatedTransactionJSON

    /**
     * Sign an already constructed AnnotatedTransaction.
     */
    async signAnnotatedTransaction(
      tx: AnnotatedTransaction | AnnotatedTransactionJSON
    ): Promise<string>

    /**
     * Get the version of the Nervos app installed on the hardware device
     *
     * @return an object with a version
     * @example
     * const result = await ckb.getAppConfiguration();
     *
     * {
     *   "version": "1.0.3",
     *   "hash": "0000000000000000000000000000000000000000"
     * }
     */
    async getAppConfiguration(): Promise<{
      version: string,
      hash: string,
    }>

    /**
     * Get the wallet identifier for the Ledger wallet
     *
     * @return a byte string
     * @example
     * const id = await ckb.getWalletId();
     *
     * "0x69c46b6dd072a2693378ef4f5f35dcd82f826dc1fdcc891255db5870f54b06e6"
     */
    async getWalletId(): Promise<string>

    async signMessage(
      path: string,
      rawMsgHex: string,
      displayHex: bool
    ): Promise<string>
  }
}
