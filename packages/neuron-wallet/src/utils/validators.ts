export const verifyPassword = (_address: string, password: string): boolean => {
  if (password === '123456') {
    return true
  }
  return false
}
export const verifyBalance = (_address: string, capacity: string): boolean => {
  return +capacity <= 100
}
