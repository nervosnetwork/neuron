module.exports = {
  "extends": [
    "../../.eslintrc.js"
  ],
  "settings": {
    "react": {
      "version": "detect"
    }
  },
  "rules": {
    "react/jsx-filename-extension": [1, {
      "extensions": [".ts", ".tsx"]
    }],
    "react/jsx-props-no-spreading": [0],
    "typescript-eslint/no-angle-bracket-type-assertion": [0],
    "no-alert": [0],
    "no-console": [2, {
      "allow": ["info", "warn", "error", "group", "groupEnd"]
    }]
  }
}
