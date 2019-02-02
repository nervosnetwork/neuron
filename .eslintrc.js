module.exports = {
  "extends": [
     "plugin:@typescript-eslint/recommended",
     "plugin:import/errors",
     "plugin:import/warnings",
     "prettier",
     "prettier/@typescript-eslint"
    ],
  "parser": "@typescript-eslint/parser",
  "plugins": [
     "@typescript-eslint",
     "prettier",
     "react"
  ],
  "rules": {
    "quotes": ["error", "single"],
    "semi": [2, "never"],
    "comma-dangle": [2, {
      "arrays": "always-multiline",
      "objects": "always-multiline",
      "imports": "always-multiline",
      "exports": "always-multiline",
      "functions": "ignore"
    }],
    "import/no-extraneous-dependencies": [2, {
      "devDependencies": true
    }],
    "@typescript-eslint/explicit-function-return-type": "off"
  },
  "env": {
    "jest": true,
    "browser": true,
    "node": true
  },
  "settings": {
    "import/resolver": {
      "node": {
        "paths": ["src"],
        "extensions": [".js", ".jsx", ".ts", ".tsx"]
      }
    }
  }
};
