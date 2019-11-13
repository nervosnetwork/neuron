export default {
  'return 0 if the genesis block is not loaded': {
    currentTime: Date.now(),
    genesisTime: undefined,
    expectAPY: 0,
  },
  'one period and one handrand days': {
    currentTime: new Date('2023-04-10').getTime(),
    genesisTime: new Date('2019-01-01').getTime(),
    expectAPY: 0.02369552868619654,
  },
}
