module.exports = {
  parser: "@typescript-eslint/parser",
  env: {
    "node": true,
    "mocha": true,
    "jest": true
  },
  plugins: [
    "@typescript-eslint"
  ],
  extends: [
    "turbo",
    "plugin:@typescript-eslint/recommended",
  ],
  rules: {
    "semi": [2, "never"]
  },
  parserOptions: {
  },
}
