module.exports = function override(config, env) {
  const oneOfRules = config.module.rules.find(r => Array.isArray(r.oneOf))
  const babelRules = oneOfRules.oneOf.find(r => r.loader.includes('babel-loader'))

  oneOfRules.oneOf.unshift({
    test: /\.tsx?$/,
    loader: 'ts-loader',
    options: {
      // since react-app-rewired have ForkTsCheckerWebpackPlugin injected for type checking,
      // transpileOnly will be fine
      transpileOnly: true,
    },
  })

  babelRules.options.presets.unshift([
    '@babel/preset-env',
    {
      targets: {
        electron: '9',
      },
    },
  ])
  return {
    ...config,
    mode: env,
    devtool: env === 'production' ? false : 'eval-cheap-module-source-map',
  }
}
