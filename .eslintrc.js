module.exports = {
  "extends": [
     "airbnb"
   ],
  "parser": "@typescript-eslint/parser",
  "plugins": [
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
    }]
  },
  "parserOptions": {
    "ecmaVersion": 6,
    "sourceType": "module",
    "ecmaFeatures": {
      "modules": true
    }
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
