export const cell = {
  version: 0,
  args: [],
  signedArgs: [],
  reference: 'reference',
  binary: [],
  outPoint: {
    hash: 'tx hash',
    index: 0,
  },
}

export const transactions = Array.from({
  length: 20,
}).map(() => ({
  date: new Date(),
  value: Math.random(),
  hash: Math.round(Math.random() * 10000000000000000),
}))

export const transactionCount = 200

export default {
  cell,
  transactions,
  transactionCount,
}
