export const verifyPassword = (_wallet: any, password: string): boolean => {
  if (password === '123456') {
    return true
  }
  return false
}
export const verifyBalance = (_address: string, capacity: string): boolean => {
  return +capacity <= 100
}
