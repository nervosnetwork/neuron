module.exports = {
  displayName: "E2E Tests",
  testRegex: "(/tests-e2e/.*.(test|spec))\\.(ts?|js?)$",
  transform: {
    "^.+\\.ts?$": "ts-jest"
  },
  roots: [
    "<rootDir>/src/",
    "<rootDir>/tests-e2e/"
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
  setupFilesAfterEnv: [
    "<rootDir>/setup-e2e-tests.ts"
  ],
};
