import { TFunction } from 'i18next'
import { useCallback, useState } from 'react'
import { verifyLockWindowPassword } from 'services/remote'
import { updateLockWindowInfo, useDispatch } from 'states'
import { isSuccessResponse } from 'utils'

export const passwordLength = 4

export const useOldPassword = ({ t }: { t: TFunction }) => {
  const [oldPasswordErr, setOldPasswordErr] = useState('')
  const [oldPassword, setOldPassword] = useState(new Array(passwordLength).fill(''))
  const [verifySuccess, setVerifySuccess] = useState(false)
  const onUpdateOldPassword = useCallback(
    (v: string, idx: number) => {
      const updatedOldPassword = oldPassword.toSpliced(idx, 1, v).join('')
      if (updatedOldPassword.length === passwordLength) {
        verifyLockWindowPassword(updatedOldPassword)
          .then(res => {
            if (isSuccessResponse(res)) {
              // verify success
              setVerifySuccess(true)
            }
            throw new Error('verify failed')
          })
          .catch(() => {
            setOldPassword(new Array(passwordLength).fill(''))
            setOldPasswordErr(t('settings.general.lock-window.password-error'))
          })
      } else {
        setOldPassword(value => value.toSpliced(idx, 1, v))
      }
    },
    [oldPassword]
  )
  const resetOldPassword = useCallback(() => {
    setOldPasswordErr('')
    setOldPassword(new Array(passwordLength).fill(''))
    setVerifySuccess(false)
  }, [])
  return {
    oldPasswordErr,
    oldPassword,
    onUpdateOldPassword,
    verifySuccess,
    setVerifySuccess,
    resetOldPassword,
  }
}

export const usePassword = () => {
  const [password, setPassword] = useState(new Array(passwordLength).fill(''))
  const onUpdatePassword = useCallback((v: string, idx: number) => {
    setPassword(value => value.toSpliced(idx, 1, v))
  }, [])
  const resetPassword = useCallback(() => {
    setPassword(new Array(passwordLength).fill(''))
  }, [])
  return {
    password,
    onUpdatePassword,
    resetPassword,
  }
}

export const useRepeatPassword = ({
  password,
  t,
  encryptedPassword,
  onCancel,
}: {
  password: string
  t: TFunction
  encryptedPassword?: string
  onCancel: (success: boolean) => void
}) => {
  const dispatch = useDispatch()
  const [errMsg, setErrMsg] = useState('')
  const [repeatPassword, setRepeatPassword] = useState(new Array(passwordLength).fill(''))
  const [isSuccess, setIsSuccess] = useState(false)
  const onUpdateRepeatPassword = useCallback(
    (v: string, idx: number) => {
      const updatedRepeatPassword = repeatPassword.toSpliced(idx, 1, v).join('')
      if (updatedRepeatPassword.length === passwordLength) {
        if (updatedRepeatPassword !== password) {
          setErrMsg(t('settings.general.lock-window.different-password'))
          setRepeatPassword(new Array(passwordLength).fill(''))
        } else {
          setIsSuccess(true)
          updateLockWindowInfo(
            encryptedPassword ? { password: updatedRepeatPassword } : { password: updatedRepeatPassword, locked: true }
          )(dispatch)
          onCancel(true)
        }
      } else {
        setErrMsg('')
        setRepeatPassword(value => value.toSpliced(idx, 1, v))
      }
    },
    [password, t, repeatPassword]
  )
  const resetRepeatPassword = useCallback(() => {
    setErrMsg('')
    setRepeatPassword(new Array(passwordLength).fill(''))
    setIsSuccess(false)
  }, [])
  return {
    errMsg,
    repeatPassword,
    onUpdateRepeatPassword,
    resetRepeatPassword,
    isSuccess,
  }
}
