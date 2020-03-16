import { useState, useMemo, useCallback } from 'react'
import { useHistory } from 'react-router-dom'
import { updateWalletProperty } from 'states/stateProvider/actionCreators'
import { StateDispatch } from 'states/stateProvider/reducer'
import { ErrorCode, MAX_WALLET_NAME_LENGTH } from 'utils/const'
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
      onChange: (e: React.SyntheticEvent<HTMLInputElement>) => {
        const { value } = e.target as HTMLInputElement
        setName(value)
      },
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
        maxLength: MAX_WALLET_NAME_LENGTH,
      },
    ],
    [name]
  )
}

export const useOnSubmit = (
  name: string = '',
  id: string = '',
  history: ReturnType<typeof useHistory>,
  dispatch: StateDispatch,
  disabled: boolean
) => {
  return useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (disabled) {
        return
      }
      updateWalletProperty({
        id,
        name,
      })(dispatch, history)
    },
    [name, id, history, dispatch, disabled]
  )
}

export const useHint = (name: string, usedNames: string[], t: Function): string | null => {
  return useMemo(() => {
    if (name === '') {
      return t(`messages.codes.${ErrorCode.FieldRequired}`, { fieldName: 'name' })
    }
    if (usedNames.includes(name)) {
      return t(`messages.codes.${ErrorCode.FieldUsed}`, { fieldName: 'name', fieldValue: name })
    }
    return null
  }, [name, usedNames, t])
}

export default {
  useWalletEditor,
  useInputs,
  useOnSubmit,
  useHint,
}
