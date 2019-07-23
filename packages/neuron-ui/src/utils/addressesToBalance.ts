/* globals BigInt */
const addressesToBalance = (addresses: State.Address[] = []) => {
  return addresses.reduce((total, addr) => total + BigInt(addr.balance || 0), BigInt(0)).toString()
}
export default addressesToBalance
