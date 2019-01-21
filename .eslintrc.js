module.exports = {
  "extends": "airbnb",
  "parser": "@typescript-eslint/parser",
  "plugins": ["prettier"],
  "rules": {
    "prettier/prettier": "error",
    "semi": [2, "never"]
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
