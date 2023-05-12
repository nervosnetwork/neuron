export const error = console.error
export const transports = {
  file: {
    getFile: jest.fn(),
  },
}

export default {
  error,
  transports,
}
