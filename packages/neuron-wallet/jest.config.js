module.exports = {
  displayName: 'Unit Tests',
  preset: 'ts-jest',
  testEnvironment: 'node',
  testRegex: '(/tests/.*.(test|spec))\\.(ts?|js?)$',
  transform: {
    '^.+\\.ts?$': 'ts-jest'
  },
  roots: ['<rootDir>/src/', '<rootDir>/tests/'],
  moduleDirectories: ['node_modules', 'src'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  setupFiles: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: {
    // FIXME: module mapper causes typeorm errors
    // "electron": "<rootDir>/tests/mock/electron.ts",
    // "logger": "<rootDir>/tests/mock/logger",
  }
}
