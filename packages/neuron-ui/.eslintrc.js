module.exports = {
  "extends": ["airbnb", "plugin:prettier/recommended"],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "settings": {
    "import/resolver": {
      "node": {
        "paths": ["src"],
        "extensions": [".js", ".ts", ".jsx", ".tsx"]
      }
    },
    "react": {
      "version": "detect"
    }
  },
  "rules": {
    "prettier/prettier": [2, {
      "printWidth": 120
    }],
    "semi": [2, "never"],
    "curly": [2, "all"],
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
    "implicit-arrow-linebreak": "off",
    "@typescript-eslint/no-unused-vars": ["error", {
      "vars": "local",
      "args": "after-used",
      "ignoreRestSiblings": false
    }],
    "arrow-parens": [2, "as-needed"],
    "max-len": [2, {
      "code": 120,
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
    "react/jsx-filename-extension": [1, {
      "extensions": [".ts", ".tsx"]
    }],
    "react/jsx-props-no-spreading": [0],
    "typescript-eslint/no-angle-bracket-type-assertion": [0],
    "no-alert": [0],
    "no-console": [2, {
      "allow": ["info", "warn", "error", "group", "groupEnd"]
    }]
  },
  "env": {
    "jest": true,
    "node": true,
    "browser": true
  },
  "globals": {
    "BigInt": "readonly"
  },
}
