module.exports = {
  "extends": "eslint:recommended",
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "sourceType": "module"
  },
  "plugins": ["@typescript-eslint"],
  "rules": {
    "no-console": 0,
    "no-cond-assign": 0,
    "no-extra-semi": "warn",
    "semi": 0,
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": ["error", {
      "vars": "local",
      "args": "after-used",
      "ignoreRestSiblings": false,
      "argsIgnorePattern": "^_"
    }],
    "curly": [2, "all"],
    "implicit-arrow-linebreak": "off",
    "arrow-parens": [2, "as-needed"],
    "max-len": [2, {
      "code": 150,
      "ignoreComments": true,
      "ignoreTrailingComments": true,
      "ignoreUrls": true,
      "ignoreStrings": true,
      "ignoreTemplateLiterals": true,
      "ignoreRegExpLiterals": true,
    }],
    "object-curly-newline": ["error", {
      "ObjectExpression": {
        "consistent": true
      },
      "ObjectPattern": {
        "consistent": true
      },
      "ImportDeclaration": {
        "consistent": true,
      },
      "ExportDeclaration": {
        "multiline": true,
        "minProperties": 3
      }
    }],
    "no-plusplus": [0],
    "lines-between-class-members": ["error", "always", { exceptAfterSingleLine: true }],
    "max-classes-per-file": [0],
    "@typescript-eslint/no-angle-bracket-type-assertion": [0],
    "no-alert": [0],
    "require-atomic-updates": [0]
  },
  "globals": {
    "BigInt": "readonly"
  },
  "env": {
    "es6": true,
    "node": true,
    "browser": true,
    "jest": true
  },
  "settings": {
    "import/resolver": {
      "node": {
        "paths": ["src"],
        "extensions": [".js", ".ts"]
      }
    }
  }
};
