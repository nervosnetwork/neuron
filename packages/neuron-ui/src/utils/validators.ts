import { ADDRESS_LENGTH } from './const'

export const verifyAddress = (address: string): boolean => {
  // TODO: verify address
  return address.replace(/^0x/, '').length === ADDRESS_LENGTH
}
export const verifyWalletSubmission = ({
  password,
  confirmPassword,
  name,
}: {
  password: string
  confirmPassword: string
  name: string
}) => {
  return password && name && password === confirmPassword
}

export default {
  verifyAddress,
  verifyWalletSubmission,
}
