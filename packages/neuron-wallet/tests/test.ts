import console = require('console')

try {
  throw new Error('123')
} catch (e) {
  console.log(e.message)
}
