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
    }]
  }
}
