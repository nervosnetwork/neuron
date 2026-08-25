import fs from 'fs'
import path from 'path'
import { parse } from 'yaml'

describe('electron-builder config', () => {
  it('uses the static AppImage runtime for Linux AppImage builds', () => {
    const config = parse(fs.readFileSync(path.join(__dirname, '..', '..', 'electron-builder.yml'), 'utf8'))

    expect(config).toMatchObject({
      toolsets: { appimage: '1.0.3' },
      linux: { target: expect.arrayContaining(['AppImage']) },
    })
  })
})
