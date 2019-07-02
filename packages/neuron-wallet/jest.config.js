module.exports = {
  "displayName": "Neuron Wallet",
  testRegex: "(/tests/.*.(test|spec))\\.(ts?|js?)$",
  transform: {
    "^.+\\.ts?$": "ts-jest"
  },
  "moduleFileExtensions": [
    "ts",
    "js",
    "json",
    "node"
  ],
  "setupFilesAfterEnv": [
    "<rootDir>/setup-tests.ts"
  ],
  "moduleFileExtensions": [
    "ts",
    "js",
    "json",
    "node"
  ],
  projects: [
    "<rootDir>/packages/neuron-wallet"
  ]
};
