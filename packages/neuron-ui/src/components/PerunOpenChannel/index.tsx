import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { showErrorMessage, signMessage, verifyMessage } from 'services/remote'
import { ControllerResponse } from 'services/remote/remoteApiWrapper'
import {
  ErrorCode,
  isSuccessResponse,
  shannonToCKBFormatter,
  useExitOnWalletChange,
  useGoBack,
  validateAddress,
  isMainnet as isMainnetUtil,
} from 'utils'
import { isErrorWithI18n } from 'exceptions'
import { useState as useGlobalState } from 'states'
import Button from 'widgets/Button'
import Balance from 'widgets/Balance'
import TextField from 'widgets/TextField'
import Dialog from 'widgets/Dialog'
import Alert from 'widgets/Alert'
import Arrow from 'widgets/Icons/Arrow.svg?react'
import { AddSimple } from 'widgets/Icons/icon'
import styles from './perunOpenChannel.module.scss'

const PerunOpenChannel = ({ onClose }: { onClose?: () => void }) => {
  const [t] = useTranslation()
  const [notification, setNotification] = useState<Notification>(null)
  const [failReason, setFailReason] = useState<string | undefined>('')
  const [showDialog, setShowDialog] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false)
  const [message, setMessage] = useState('')
  const [signature, setSignature] = useState('')
  const [address, setAddress] = useState('')
  const [tokens, setTokens] = useState([
    {
      symbol: '',
      amount: '',
    },
  ])
  const {
    chain: { networkID },
    settings: { networks },
    wallet,
  } = useGlobalState()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const isMainnet = isMainnetUtil(networks, networkID)
  useExitOnWalletChange()

  const handlePasswordDialogOpen = useCallback(() => {
    setShowDialog(false)
    setIsDialogOpen(true)
  }, [setIsDialogOpen])

  const handlePasswordDialogDismiss = useCallback(() => {
    setShowDialog(true)
    setIsDialogOpen(false)
  }, [setIsDialogOpen])

  const handleNotificationDismiss = useCallback(() => {
    setShowDialog(true)
    setNotification(null)
    setFailReason('')
  }, [setNotification])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => {
      const {
        dataset: { field },
        value,
      } = e.target
      switch (field) {
        case 'message': {
          setMessage(value)
          break
        }
        case 'signature': {
          setSignature(value)
          break
        }
        case 'address': {
          setAddress(value)
          break
        }
        default: {
          // ignore
        }
      }
    },
    [setMessage, setSignature, setAddress]
  )

  const handleVerifyMessage = useCallback(() => {
    verifyMessage({ message, signature, address })
      .then(res => {
        if (isSuccessResponse(res)) {
          if (res.result === 'old-sign') {
            setNotification('verify-old-sign-success')
          } else {
            setNotification('verify-success')
          }
        } else {
          setNotification('verify-failure')
          setShowDialog(false)
          if (typeof res.message === 'object') {
            setFailReason(res.message.content ?? '')
          }
        }
      })
      .catch((err: Error) => {
        showErrorMessage('Error', err.message)
      })
  }, [message, address, setNotification, signature])

  const handleSignMessage = useCallback(
    async (password: string) => {
      const res: ControllerResponse = await signMessage({
        walletID: wallet?.id ?? '',
        address,
        message,
        password,
      })
      if (isSuccessResponse(res)) {
        setSignature(res.result)
        handlePasswordDialogDismiss()
      } else if (res.status === ErrorCode.PasswordIncorrect) {
        // pass through this kind of error
      } else if (res.status === ErrorCode.AddressNotFound) {
        handlePasswordDialogDismiss()
        setNotification('address-not-found')
      } else {
        handlePasswordDialogDismiss()
        showErrorMessage('Error', 'Fail to sign the message')
      }
      return res
    },
    [setSignature, handlePasswordDialogDismiss, address, wallet, message]
  )

  const onBack = useGoBack()

  const addressError = useMemo(() => {
    if (!address) {
      return undefined
    }
    try {
      validateAddress(address, isMainnet)
    } catch (err) {
      if (isErrorWithI18n(err)) {
        return t(err.message, err.i18n)
      }
    }
    if (wallet?.addresses && !wallet.addresses.find(item => item.address === address)) {
      return t('sign-and-verify.address-not-found')
    }
    return undefined
  }, [t, address, isMainnet, wallet.addresses])

  const handleAddToken = useCallback(() => {
    setTokens([
      ...tokens,
      {
        symbol: '',
        amount: '',
      },
    ])
  }, [setTokens, tokens])

  return (
    <Dialog
      show
      title={t('perun.open-channel')}
      disabled={!message || !signature || !address || !!addressError}
      onCancel={onClose}
      onConfirm={handleVerifyMessage}
      confirmText={t('perun.open-channel')}
      contentClassName={styles.contentClassName}
    >
      <div className={styles.container}>
        <Alert status="warn" className={styles.notification}>
          {t('perun.open-channel-notification')}
        </Alert>

        <div className={styles.mainContent}>
          <div className={styles.selectAddress}>
            <div className={styles.dropdown}>
              <div className={styles.content}>
                <TextField
                  label={t('perun.channel-participant-address')}
                  placeholder={t('perun.choose-address')}
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  data-field="address"
                  value={address}
                  onChange={handleInputChange}
                  rows={address ? 2 : 1}
                  suffix={
                    <div className={styles.arrow} data-active={isDropdownOpen}>
                      <Arrow />
                    </div>
                  }
                  width="100%"
                  error={addressError}
                />
              </div>
              {isDropdownOpen && wallet?.addresses ? (
                <div className={styles.selects}>
                  {wallet.addresses.map(addr => (
                    <Button
                      type="text"
                      key={addr.address}
                      className={styles.selectItem}
                      onClick={() => {
                        setIsDropdownOpen(false)
                        setAddress(addr.address)
                      }}
                    >
                      <div className={styles.wrap}>
                        <div className={styles.title}>
                          {`${addr.address.slice(0, 16)}...${addr.address.slice(-16)} `}
                          (<Balance balance={shannonToCKBFormatter(addr.balance)} />)
                        </div>
                        <div className={styles.type} data-type={addr.type}>
                          {addr.type === 1 ? t('addresses.change-address') : t('addresses.receiving-address')}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className={styles.tokenTitle}>
            <p>{t('perun.token')}</p>
            {!!tokens[0].symbol && (
              <Button type="text" className={styles.addToken} onClick={handleAddToken}>
                <AddSimple />
                {t('perun.add-token')}
              </Button>
            )}
          </div>
          {tokens.map(token => (
            <div className={styles.selectToken} key={token.symbol}>
              <div className={styles.dropdown}>
                <div className={styles.content}>
                  <TextField
                    placeholder={t('perun.choose-address')}
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    data-field="address"
                    value={address}
                    onChange={handleInputChange}
                    suffix={
                      <div className={styles.arrow} data-active={isDropdownOpen}>
                        <Arrow />
                      </div>
                    }
                    width="100%"
                    error={addressError}
                  />
                  {wallet.balance}
                </div>
                {isDropdownOpen && wallet?.addresses ? (
                  <div className={styles.selects}>
                    {wallet.addresses.map(addr => (
                      <Button
                        type="text"
                        key={addr.address}
                        className={styles.selectItem}
                        onClick={() => {
                          setIsDropdownOpen(false)
                          setAddress(addr.address)
                        }}
                      >
                        <div className={styles.wrap}>
                          <div className={styles.title}>
                            {`${addr.address.slice(0, 16)}...${addr.address.slice(-16)} `}
                            (<Balance balance={shannonToCKBFormatter(addr.balance)} />)
                          </div>
                          <div className={styles.type} data-type={addr.type}>
                            {addr.type === 1 ? t('addresses.change-address') : t('addresses.receiving-address')}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Dialog>
  )
}

PerunOpenChannel.displayName = 'PerunOpenChannel'

export default PerunOpenChannel
