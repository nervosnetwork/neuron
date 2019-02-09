module.exports = {
  "extends": [
    "../../.eslintrc.js"
  ],
  "plugins": ["react-hooks"],
  "settings": {
    "react": {
      "version": "detect"
    }
  },
  "rules": {
    "react/jsx-filename-extension": [1, {
      "extensions": [".ts", ".tsx"]
    }],
    "react-hooks/rules-of-hooks": 2
  }
}
