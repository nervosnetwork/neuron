const { execSync } = require('node:child_process')

exports.default = async configuration => {
  if (!configuration.path) {
    throw new Error(`Configuration is required`)
  }

  execSync(`smctl sign --keypair-alias="${process.env.SM_KEYPAIR_NAME}" --input "${String(configuration.path)}"`, {
    stdio: 'inherit',
  })
}
