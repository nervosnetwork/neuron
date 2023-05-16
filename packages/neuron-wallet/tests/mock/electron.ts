import os from 'os'
import path from 'path'

export const dialog = {
  showSaveDialog: jest.fn(),
  showMessageBox: jest.fn(),
  showErrorBox: jest.fn(),
}

export const app = {
  getVersion: jest.fn().mockReturnValue('mock_version'),
  getPath: jest.fn((p: string) => path.join(os.tmpdir(), p)),
}
