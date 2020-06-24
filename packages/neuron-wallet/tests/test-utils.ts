export const flushPromises = () => {
  jest.runAllImmediates()
  return new Promise(setImmediate)
};
