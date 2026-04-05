module.exports = {
  preset: "jest-expo",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  setupFiles: [
    "<rootDir>/src/tests/jest-setup-globals.ts",
  ],
};
