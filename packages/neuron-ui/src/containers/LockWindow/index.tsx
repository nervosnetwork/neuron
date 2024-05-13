/* eslint-disable jsx-a11y/media-has-caption */
import React, { useCallback, useEffect, useState } from 'react'
import { AppActions, getLockWindowInfo, useDispatch, useState as useGlobalState } from 'states'
import Spinner from 'widgets/Spinner'
import Locked from 'widgets/Icons/Locked.png'
import DarkUnLockMp4 from 'widgets/Icons/dark-unlock.mp4'
import UnLockMp4 from 'widgets/Icons/unlock.mp4'
import SplitPasswordInput from 'widgets/SplitPasswordInput'
import { useTranslation } from 'react-i18next'
import { clsx, isSuccessResponse } from 'utils'
import { isDark, unlockWindow } from 'services/remote'
import { retryUnlockWindow } from 'services/localCache'
import { MILLISECS_PER_HOUR, MILLISECS_PER_MIN, MILLISECS_PER_SEC } from 'utils/getSyncLeftTime'
import styles from './lockWindow.module.scss'

const passwordLen = 4
const wrongEnterTimes = 3
const formatterLockMillisecs = (lockMillisecs: number) => {
  const hrs = Math.floor(lockMillisecs / MILLISECS_PER_HOUR)
  const mins = Math.floor((lockMillisecs - hrs * MILLISECS_PER_HOUR) / MILLISECS_PER_MIN)
  const secs = Math.floor((lockMillisecs - hrs * MILLISECS_PER_HOUR - mins * MILLISECS_PER_MIN) / MILLISECS_PER_SEC)
  return (hrs > 0 ? [hrs, mins] : [mins, secs]).map(v => v.toString().padStart(2, '0')).join(':')
}

const getWaitMillisecs = (retryTimes: number) => {
  if (retryTimes % wrongEnterTimes === 0) {
    if (retryTimes >= 3 * wrongEnterTimes) {
      return 24 * MILLISECS_PER_HOUR
    }
    if (retryTimes > wrongEnterTimes) {
      return 30 * MILLISECS_PER_MIN
    }
    return 5 * MILLISECS_PER_MIN
  }
  return undefined
}

const LockWindow = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useDispatch()
  const [t] = useTranslation()
  useEffect(() => {
    getLockWindowInfo(dispatch)
  }, [])
  const { app } = useGlobalState()
  const [password, setPassword] = useState<string[]>(new Array(passwordLen).fill(''))
  const [errMsg, setErrMsg] = useState('')
  const [retryUnlockInfo, setRetryUnlockInfo] = useState(retryUnlockWindow.get())
  const [verifySuccess, setVerifySuccess] = useState(false)
  const onUpdatePassword = useCallback(
    (v: string, idx: number) => {
      const updatedPassword = password.toSpliced(idx, 1, v).join('')
      if (updatedPassword.length === passwordLen) {
        unlockWindow(updatedPassword)
          .then(res => {
            if (isSuccessResponse(res)) {
              setVerifySuccess(true)
              setTimeout(() => {
                dispatch({
                  type: AppActions.SetLockWindowInfo,
                  payload: { locked: false },
                })
                setVerifySuccess(false)
              }, 1000)
              retryUnlockWindow.reset()
              setRetryUnlockInfo({ retryTimes: 0 })
              setPassword(i => i.toSpliced(idx, 1, v))
              return
            }
            throw new Error('verify failed')
          })
          .catch(() => {
            const { retryTimes } = retryUnlockWindow.get()
            const newRetryUnlockInfo = { lastRetryTime: Date.now(), retryTimes: retryTimes + 1 }
            const needWaitMillisecs = getWaitMillisecs(retryTimes + 1)
            if (needWaitMillisecs) {
              setErrMsg(
                t('lock-window.failed-times', {
                  frequency: retryTimes + 1,
                  time: formatterLockMillisecs(needWaitMillisecs),
                })
              )
            } else {
              setErrMsg(t('lock-window.lock-password-error'))
            }
            retryUnlockWindow.save(newRetryUnlockInfo)
            setRetryUnlockInfo(newRetryUnlockInfo)
            setPassword(new Array(passwordLen).fill(''))
          })
      } else {
        setErrMsg('')
        setPassword(i => i.toSpliced(idx, 1, v))
      }
    },
    [password]
  )
  const [theme, setTheme] = useState<'dark' | 'light'>()
  useEffect(() => {
    isDark().then(res => {
      if (isSuccessResponse(res)) {
        setTheme(res.result ? 'dark' : 'light')
      }
    })
  }, [])
  useEffect(() => {
    if (app.lockWindowInfo?.locked) {
      setPassword(new Array(passwordLen).fill(''))
      setErrMsg('')
    }
  }, [app.lockWindowInfo?.locked])
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    const needWaitMillisecs = getWaitMillisecs(retryUnlockInfo.retryTimes)
    if (needWaitMillisecs && retryUnlockInfo.lastRetryTime) {
      interval = setInterval(() => {
        const hasWaitMillisecs = Date.now() - retryUnlockInfo.lastRetryTime!
        if (needWaitMillisecs > hasWaitMillisecs) {
          setErrMsg(
            t('lock-window.failed-times', {
              frequency: retryUnlockInfo.retryTimes,
              time: formatterLockMillisecs(needWaitMillisecs - hasWaitMillisecs),
            })
          )
        } else {
          const newRetryUnlockInfo = { retryTimes: retryUnlockInfo.retryTimes }
          retryUnlockWindow.save(newRetryUnlockInfo)
          setRetryUnlockInfo(newRetryUnlockInfo)
          setErrMsg('')
        }
      }, 1_000)
    }
    return () => clearInterval(interval)
  }, [retryUnlockInfo])
  if (!app.lockWindowInfo) {
    return (
      <div className={styles.loading}>
        <Spinner />
      </div>
    )
  }
  if (app.lockWindowInfo.locked) {
    return (
      <div className={styles.lockContainer}>
        {verifySuccess ? (
          <video autoPlay className={styles.video}>
            <source src={theme === 'dark' ? DarkUnLockMp4 : UnLockMp4} type="video/mp4" />
          </video>
        ) : (
          <img src={Locked} alt="Locked" className={clsx(styles.lockedImg, errMsg ? styles.animation : undefined)} />
        )}
        <p className={styles.title}>{t('lock-window.neuron-is-locked')}</p>
        <div
          className={styles.passwordContainer}
          data-has-err={!!errMsg && retryUnlockInfo.retryTimes < wrongEnterTimes}
        >
          <SplitPasswordInput
            disabled={retryUnlockInfo.retryTimes % wrongEnterTimes === 0 && !!retryUnlockInfo.lastRetryTime}
            values={password}
            onChange={onUpdatePassword}
          />
        </div>
        <div className={styles.notice} data-has-err={!!errMsg}>
          {errMsg || t('lock-window.enter-lock-password')}
        </div>
      </div>
    )
  }
  return children
}

LockWindow.displayName = 'LockWindow'

export default LockWindow
