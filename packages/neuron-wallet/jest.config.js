module.exports = {
  displayName: "Unit Tests",
  testRegex: "(/tests/.*.(test|spec))\\.(ts?|js?)$",
  transform: {
    "^.+\\.ts?$": "ts-jest"
  },
  roots: [
    "<rootDir>/src/",
    "<rootDir>/tests/"
  ],
  moduleDirectories: [
    "node_modules",
    "src"
  ],
  moduleFileExtensions: [
    "ts",
    "js",
    "json",
    "node"
  ],
  setupFiles: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: {
    "electron": "<rootDir>/tests/mock/electron.ts",
    "logger": "<rootDir>/tests/mock/logger",
  }
};
