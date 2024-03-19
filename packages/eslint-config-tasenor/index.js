module.exports = {
  parser: "@typescript-eslint/parser",
  env: {
    "node": true,
    "mocha": true,
    "jest": true
  },
  plugins: [
    "react",
    "react-hooks",
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
    "comma-dangle": "off",
    "semi": [2, "never"],
    "@typescript-eslint/no-unused-vars": "off"
  },
  parserOptions: {
  },
}
