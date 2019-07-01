module.exports = {
  testRegex: "(/tests/.*.(test|spec))\\.(ts?|js?)$",
  transform: {
    "^.+\\.ts?$": "ts-jest"
  },
  bail: 1,
  verbose: true,
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  projects: [
    "<rootDir>/packages/neuron-wallet"
  ]
};
