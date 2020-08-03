module.exports = function override(config, env) {
  const oneOfRules = config.module.rules.find(r => Array.isArray(r.oneOf))

  oneOfRules.oneOf.unshift({
    test: /\.tsx?$/,
    loader: 'ts-loader',
    options: {
      // since react-app-rewired have ForkTsCheckerWebpackPlugin injected for type checking,
      // transpileOnly will be fine
      transpileOnly: true,
    },
  })
  return {
    ...config,
    mode: env,
    devtool: env === 'production' ? false : 'eval-cheap-module-source-map',
  }
}
