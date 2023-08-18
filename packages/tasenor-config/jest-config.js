module.exports = {
  roots: [
    '<rootDir>/tests',
    '<rootDir>/src'
  ],
  testMatch: [
    '**/?(*.)+(spec|test).+(ts|tsx|js)'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  }
}
