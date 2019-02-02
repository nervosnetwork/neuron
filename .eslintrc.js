module.exports = {
  "extends": "airbnb",
  "parser": "@typescript-eslint/parser",
  "plugins": ["prettier", "@typescript-eslint"],
  "rules": {
    "prettier/prettier": ["error", {
      "printWidth": 120
    }],
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
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": ["error", {
      "vars": "local",
      "args": "after-used",
      "ignoreRestSiblings": false
    }]
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
