import { ADDRESS_LENGTH, MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH } from './const'

export const verifyAddress = (address: string): boolean => {
  // TODO: verify address, prd required
  return address.length === ADDRESS_LENGTH
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
  return (
    password &&
    name &&
    password === confirmPassword &&
    password.length >= MIN_PASSWORD_LENGTH &&
    password.length <= MAX_PASSWORD_LENGTH
  )
}

export default {
  verifyAddress,
  verifyWalletSubmission,
}
