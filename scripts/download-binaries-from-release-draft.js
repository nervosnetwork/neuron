const { pipeline } = require('node:stream/promises')
const { existsSync, createWriteStream } = require('node:fs')

const { REPO, TOKEN } = process.env
const GITHUB_API_URL = 'https://api.github.com'

const download = async (directory) => {
  if (!existsSync(directory)) {
    throw new Error(`Directory ${directory} does not exist`)
  }

  const releases = await fetch(`${GITHUB_API_URL}/repos/${REPO}/releases`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  }).then((res) => res.json())

  const draft = releases.find((r) => r.draft)

  if (!draft) {
    throw new Error('No release draft found')
  }

  const assetList = await fetch(`${GITHUB_API_URL}/repos/${REPO}/releases/${draft.id}/assets`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  })
    .then((res) => res.json())
    .then((res) => res.map(({ name, url }) => ({ name, url })))

  assetList.forEach(async ({ name, url }) => {
    const path = `${directory}/${name}`

    await pipeline(
      await fetch(url, {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          'Content-Type': 'application/octet-stream',
          Accept: 'application/octet-stream',
        },
      })
        .then(async (res) => res.body)
        .catch(() => {
          throw new Error('Fail to fetch asset')
        }),

      createWriteStream(path)
    )
  })
}

if (process.argv.length < 3) {
  throw new Error(
    `Directory for binaries is required, use command as 'node ./download-binaries-from-release-draft.js ./binaries`
  )
}

const directory = process.argv[2]

download(directory)
