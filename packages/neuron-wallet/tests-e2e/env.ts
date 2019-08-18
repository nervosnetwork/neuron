export interface TransactionSendTo {
  address: string
  amount: number
}

export interface TransactionTestEnv {
  // Used to test sending transactions, please make sure there is enough balance.
  mnemonic: string,
  sendTo: TransactionSendTo[]
}

export interface TestEnv {
  transaction: TransactionTestEnv
}

const env: TestEnv = {
  transaction: {
    mnemonic: 'refuse ecology globe virus demand gentle couch scrub bulk project chronic dog',
    sendTo: [
      {
        address: "ckt1qyqgkl88c7ss3lut0s6ysfz294e6l4fd8snq8xdkwf",
        amount: 100,
      },
      {
        address: "ckt1qyqgkl88c7ss3lut0s6ysfz294e6l4fd8snq8xdkwf",
        amount: 100,
      },
      {
        address: "ckt1qyqgkl88c7ss3lut0s6ysfz294e6l4fd8snq8xdkwf",
        amount: 100,
      },
      {
        address: "ckt1qyqgkl88c7ss3lut0s6ysfz294e6l4fd8snq8xdkwf",
        amount: 100,
      },
    ]
  }
}

export default env;