module.exports = {
  "extends": [
    "../../.eslintrc.js",
    "plugin:react/recommended",
    "plugin:import/react",
    "prettier/react"
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
  }
}
