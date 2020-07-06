export const dialog = {
  showSaveDialog: jest.fn(),
  showMessageBox: jest.fn(),
  showErrorBox: jest.fn()
}

export const app = {
  getVersion: jest.fn().mockReturnValue('mock_version'),
  getPath: jest.fn().mockReturnValue('mock_path')
}
