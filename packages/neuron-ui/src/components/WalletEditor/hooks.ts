import { useState, useMemo, useCallback } from 'react'
import i18n from 'utils/i18n'

export const useWalletEditor = () => {
  const [name, setName] = useState('')
  const initialize = useCallback(
    (initName: string = '') => {
      setName(initName)
    },
    [setName]
  )
  return {
    initialize,
    name: {
      value: name,
      onChange: (e: React.FormEvent<Pick<any, string>>) => setName(e.currentTarget.value),
    },
  }
}

export const useInputs = ({ name }: ReturnType<typeof useWalletEditor>) => {
  return useMemo(
    () => [
      {
        ...name,
        label: i18n.t('settings.wallet-manager.edit-wallet.wallet-name'),
        placeholder: i18n.t('settings.wallet-manager.edit-wallet.wallet-name'),
        maxLength: 20,
      },
    ],
    [name]
  )
}

export const useAreParamsValid = (name: string) => {
  return useMemo(() => {
    return !(name === '')
  }, [name])
}

export default {
  useWalletEditor,
  useInputs,
  useAreParamsValid,
}
