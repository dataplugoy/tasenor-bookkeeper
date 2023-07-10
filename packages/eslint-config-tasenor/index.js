module.exports = {
  parser: "@typescript-eslint/parser",
  env: {
    "node": true,
    "mocha": true,
    "jest": true
  },
  plugins: [
    "@typescript-eslint",
  ],
  extends: [
    "semistandard",
    "turbo",
    "plugin:@typescript-eslint/recommended",
  ],
  rules: {
    "space-before-function-paren": "off",
    "padded-blocks": "off",
    "semi": [2, "never"]
  },
  parserOptions: {
  },
}
