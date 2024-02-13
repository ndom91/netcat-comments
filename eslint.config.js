export default config = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: { project: ["./tsconfig.json"] },
  plugins: [
    "@typescript-eslint",
    "eslint-plugin-prettier"
  ],
  extends: [
    "eslint:recommended",
      "plugin:@typescript-eslint/recommended",
  ],
};
