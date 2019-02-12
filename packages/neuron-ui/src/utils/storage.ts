export const getGuidedFlag = () => window.localStorage.getItem('guided')
export const setGuidedFlag = (guided: boolean) => {
  window.localStorage.setItem('guided', `${guided}`)
}
