module.exports = {
  parser: "@typescript-eslint/parser",
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
