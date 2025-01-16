module.exports = {
  plugins: ["@stylistic/ts", "@typescript-eslint"],
  extends: [
    'plugin:@stylistic/ts/recommended-extends'
  ],
  parser: "@typescript-eslint/parser",
  ignorePatterns: [".eslintrc.cjs"],
  rules: {
    "@stylistic/ts/indent": ["error", 2],
    "@stylistic/ts/quotes": ["error", "single"],
    "@stylistic/ts/object-curly-spacing": ["error", "always"]
  },
};
