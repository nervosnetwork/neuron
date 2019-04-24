import { useState, useMemo, useCallback } from 'react'
import { MainActions } from '../../containers/MainContent/reducer'
import i18n from '../../utils/i18n'

export const useWalletEditor = () => {
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  return {
    initiate: (initName: string = '') => {
      setName(initName)
    },
    name: {
      value: name,
      onChange: (e: React.FormEvent<Pick<any, string>>) => setName(e.currentTarget.value),
    },
    password: {
      value: password,
      onChange: (e: React.FormEvent<Pick<any, string>>) => setPassword(e.currentTarget.value),
    },
    newPassword: {
      value: newPassword,
      onChange: (e: React.FormEvent<Pick<any, string>>) => setNewPassword(e.currentTarget.value),
    },
    confirmNewPassword: {
      value: confirmNewPassword,
      onChange: (e: React.FormEvent<Pick<any, string>>) => setConfirmNewPassword(e.currentTarget.value),
    },
  }
}

export const useInputs = ({ name, newPassword, confirmNewPassword }: ReturnType<typeof useWalletEditor>) => {
  return useMemo(
    () => [
      {
        ...name,
        label: i18n.t('settings.wallet-manager.edit-wallet.wallet-name'),
        placeholder: i18n.t('settings.wallet-manager.edit-wallet.wallet-name'),
        maxLength: 20,
      },
      {
        ...newPassword,
        label: i18n.t('settings.wallet-manager.edit-wallet.new-password'),
        placeholder: i18n.t('settings.wallet-manager.edit-wallet.password'),
        inputType: 'password',
      },
      {
        ...confirmNewPassword,
        label: i18n.t('settings.wallet-manager.edit-wallet.confirm-password'),
        placeholder: i18n.t('settings.wallet-manager.edit-wallet.confirm-password'),
        inputType: 'password',
      },
    ],
    [name.value, newPassword.value, confirmNewPassword.value],
  )
}

export const useAreParamsValid = (name: string, password: string, confirmPassword: string) => {
  return useMemo(() => {
    return !(password === '' || confirmPassword === '' || password !== confirmPassword || name === '')
  }, [name, password, confirmPassword])
}

export const useToggleDialog = (dispatch: React.Dispatch<any>) =>
  useCallback(
    (open: boolean) => {
      dispatch({
        type: MainActions.SetDialog,
        payload: {
          open,
        },
      })
    },
    [dispatch],
  )

export default {
  useWalletEditor,
  useInputs,
  useAreParamsValid,
}
