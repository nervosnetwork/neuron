import { useState, useMemo, useCallback } from 'react'
import actionCreators from 'states/stateProvider/actionCreators'
import { StateDispatch } from 'states/stateProvider/reducer'
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
      onChange: (_e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, value?: string) =>
        undefined !== value && setName(value),
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

export const useOnConfirm = (name: string = '', id: string = '', dispatch: StateDispatch) => {
  return useCallback(() => {
    dispatch(
      actionCreators.updateWallet({
        id,
        name,
      })
    )
  }, [name, id, dispatch])
}

export const useAreParamsValid = (name: string) => {
  return useMemo(() => {
    return !(name === '')
  }, [name])
}

export default {
  useWalletEditor,
  useInputs,
  useOnConfirm,
  useAreParamsValid,
}
