export const flushPromises = () => {
  jest.runAllTicks()
  return new Promise(process.nextTick)
}
