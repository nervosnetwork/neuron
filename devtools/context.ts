export async function getContext() {
  return {
    rpcUrl: process.env.RPC_URL as string,
    privateKey1: process.env.PRIVATE_KEY_1 as string,
    privateKey2: process.env.PRIVATE_KEY_2 as string,
    privateKey3: process.env.PRIVATE_KEY_3 as string,
    extendedPrivateKey: process.env.EXTENDED_PRIVATE_KEY as string,
    chainCode: process.env.CHAIN_CODE as string,
  };
}
