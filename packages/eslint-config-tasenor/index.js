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
    "plugin:@typescript-eslint/recommended",
  ],
  rules: {
    "space-before-function-paren": "off",
    "padded-blocks": "off",
    "comma-dangle": "off",
    "semi": [2, "never"],
    "@typescript-eslint/no-unused-vars": "warn",
    "@typescript-eslint/no-unused-expressions": ["error", { "allowShortCircuit": true, "allowTernary": true }]
  },
  parserOptions: {
  },
}
