export default {
  'return 0 if the genesis block is not loaded': {
    currentTime: Date.now(),
    genesisTime: undefined,
    expectAPC: 0,
  },
  'one period and one handrand days': {
    currentTime: new Date('2023-04-10').getTime(),
    genesisTime: new Date('2019-01-01').getTime(),
    expectAPC: 2.369552868619654,
  },
}
