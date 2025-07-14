/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
/* eslint-disable consistent-return */
/* eslint-disable no-console */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useState as useGlobalState } from 'states'
import { PerunState as PerunStateSubject } from 'services/subjects'
import { bytes } from '@ckb-lumos/codec'
import { blockchain } from '@ckb-lumos/base'
import Dialog from 'widgets/Dialog'
import Button from 'widgets/Button'
import PageContainer from 'components/PageContainer'
import { PerunIcon } from 'widgets/Icons/icon'
import { type CKBComponents } from '@ckb-lumos/lumos/rpc'
import {
  SerializeOffChainParticipant,
  SerializeSEC1EncodedPubKey,
} from '@ckb-connect/perun-wallet-wrapper/dist/ckb/serialization'
import { channelIdToString, channelIdFromString } from '@ckb-connect/perun-wallet-wrapper/dist/translator'
import * as wire from '@ckb-connect/perun-wallet-wrapper/dist/wire'

import { ControllerResponse } from 'services/remote/remoteApiWrapper'
import {
  OfflineSignStatus,
  OfflineSignType,
  getCurrentWalletAccountExtendedPubKey,
  perunServiceAction,
  respondPerunRequest,
  signRawMessage,
  signTransactionOnly,
  showErrorMessage,
} from 'services/remote'
import { addressToScript, scriptToAddress, bytesToHex, ErrorCode, errorFormatter, isSuccessResponse } from 'utils'
import { PasswordDialog } from 'components/SignAndVerify'
import { State } from '@ckb-connect/perun-wallet-wrapper/dist/wire'
import TextField from 'widgets/TextField'
import styles from './perun.module.scss'

// eslint-disable-next-line @typescript-eslint/no-shadow
function bigintFromBEBytes(bytes: Uint8Array): bigint {
  let result = BigInt(0)

  for (let i = 0; i < bytes.length; i++) {
    // eslint-disable-next-line no-bitwise
    result = (result << BigInt(8)) + BigInt(bytes[i])
  }

  return result
}

const Perun = () => {
  const { wallet } = useGlobalState()
  const [t, _] = useTranslation()
  const [amount, setAmount] = useState<number>(100)
  const [updateAmount, setUpdateAmount] = useState<number>(100)
  const [peerAddress, setPeerAddress] = useState(
    'ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsq2jyhhmdq7ujffqla0n3jtt6l0yy0hflycvakuds'
  )
  const peerPubKey = '0x0260065151b232cb34bcd62447b46c3683480e4de1ce95b63212187a1ff36cc0da'
  const [peerAmount, setPeerAmount] = useState<number>(100)
  const [challengeDuration, setChallengeDuration] = useState<number>(10000)
  const [validInputs, setValidInputs] = useState(false)
  const [channels] = useState(new Map<string, State>())
  const [showRejectionModal, setShowRejectionModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [updateChannelDialog, setUpdateChannelDialog] = useState(false)
  const [channelID, setChannelID] = useState<Uint8Array>()
  const [perunState, setPerunState] = useState<Subject.PerunState>({ type: 'SignMessage' })

  const [showPrompt, setShowPrompt] = useState(false)

  const [pubKey, setPubKey] = useState('')

  const [showPasswordDialog, setShowPasswordDialog] = useState(false)

  const { address: MyAddress } = wallet.addresses[0]

  // TODO: Use global state instead of local, otherwise the state will be lost
  // when the user does not actively have the page open.
  PerunStateSubject.subscribe(setPerunState)

  console.log('perunState-------:', perunState)

  const handleAmountChange = (am: string) => {
    const amountNum = parseFloat(am)
    if (Number.isNaN(amountNum)) {
      return
    }
    setAmount(amountNum)
  }

  const handlePeerAmountChange = (am: string) => {
    const amountNum = parseFloat(am)
    if (Number.isNaN(amountNum)) {
      return
    }
    setPeerAmount(amountNum)
  }

  const handleUpdateAmountChange = (am: string) => {
    const amountNum = parseFloat(am)
    if (Number.isNaN(amountNum)) {
      return
    }
    setUpdateAmount(amountNum)
  }

  const handlePeerAddressChange = (ad: string) => {
    setPeerAddress(ad)
  }

  const handleChallengeDurationChange = (cd: string) => {
    const cdNum = parseFloat(cd)
    if (Number.isNaN(cdNum)) {
      return
    }
    setChallengeDuration(cdNum)
  }

  const handleRejected = (reason: React.SetStateAction<string>) => {
    console.log('HANDLE REJECTED REASON: ', reason)
    setRejectionReason(reason)
    setShowRejectionModal(true)
  }

  const handleCloseRejectionModal = () => {
    setShowRejectionModal(false)
  }

  useEffect(() => {
    if (amount && peerAddress && challengeDuration) {
      setValidInputs(true)
    }
  }, [amount, peerAddress, challengeDuration])

  useEffect(() => {
    if (!perunState.request) {
      return
    }

    // Prompt the user upon receiving a perun request.
    setShowPrompt(true)
  }, [perunState])

  const handleSigningRequest = async (password: string) => {
    const handleSignMessage = async (request: any) => {
      const addressBytes = request.pubkey.data
      // Uint8Array -> String
      const address = new TextDecoder().decode(new Uint8Array(addressBytes))
      console.log('signing request for address----------', address)
      const msgToSign = bytesToHex(new Uint8Array(request.data.data))
      // TODO: It would be nice to have a decoder for the Perun encoded messages.
      // We could fetch the channel state here, display it to the user AND update
      // the state cache upon successful signing.

      const res: ControllerResponse = await signRawMessage({
        walletID: wallet?.id ?? '',
        address,
        message: msgToSign,
        password,
      })

      console.log(`handleSigningRequest: message to sign---------: ${msgToSign}`)

      if (isSuccessResponse(res)) {
        await respondPerunRequest({
          type: 'SignMessage',
          response: {
            data: res.result,
          },
        })
      } else if (res.status === ErrorCode.PasswordIncorrect) {
        showErrorMessage('Error', 'Password incorrect')
      } else if (res.status === ErrorCode.AddressNotFound) {
        showErrorMessage('Error', 'Address not found')
      }
      setShowPrompt(false)
      setShowPasswordDialog(false)
      return res
    }

    const handleSignTransaction = async (request: any) => {
      console.log('handleSignTransaction', request)
      console.log('inputs', request.transaction.inputs)
      // TODO: Inject NetworkType.
      const offlineTx = {
        transaction: { ...request.transaction, fee: '1' },
        status: OfflineSignStatus.Unsigned,
        type: OfflineSignType.Regular,
        description: 'Perun channel transaction',
        walletID: wallet?.id ?? '',
        password,
      }
      console.log(`trying to sign with wallet ${wallet?.id}`)
      const res: ControllerResponse = await signTransactionOnly(offlineTx as any)

      if (!isSuccessResponse(res)) {
        showErrorMessage('Error', errorFormatter(res.message, t))
        return res
      }

      console.log('sign transaction success')

      // Bring into backend compatible JSON format.
      const sdkTx = res.result.transaction
      const camelToSnakeReplacer = (s: string) => {
        return s.replace(/([A-Z])/g, '_$1').toLowerCase()
      }
      const camelToSnakeCloner = (obj: any, valueModifier: (key: any, value: any) => [any, any]) => {
        return Object.keys(obj).reduce((acc: any, key) => {
          const newKey = camelToSnakeReplacer(key)
          const val = obj[key as keyof CKBComponents.Transaction]
          if (Array.isArray(val)) {
            acc[newKey] = val.map((v: any) => {
              if (typeof v === 'object' && v !== null) {
                return camelToSnakeCloner(v, valueModifier)
              }
              // eslint-disable-next-line @typescript-eslint/no-shadow
              const [_, modVal] = valueModifier('', v)
              return modVal
            })
          } else if (typeof val === 'object' && val !== null) {
            acc[newKey] = camelToSnakeCloner(val, valueModifier)
          } else {
            const [modKey, modVal] = valueModifier(newKey, val)
            acc[modKey] = modVal
          }
          return acc
        }, {})
      }
      const bigIntStringToHex = (s: string) => {
        return `0x${BigInt(s).toString(16)}`
      }
      const compatibleTx = camelToSnakeCloner(sdkTx, (key: any, value: any) => {
        let newValue = value
        switch (key) {
          case 'dep_type':
            newValue = camelToSnakeReplacer(value)
            break
          case 'since':
            newValue = `0x${value}`
            break
          case 'input_index':
            newValue = `0x${value}`
            break
          case 'index':
            newValue = `0x${value}`
            break
          case 'capacity':
            newValue = bigIntStringToHex(value)
            break
          case 'version':
            newValue = `0x${value}`
            break
          default:
        }
        return [key, newValue]
      })
      await respondPerunRequest({
        type: 'SignTransaction',
        response: {
          data: JSON.stringify(compatibleTx),
        },
      })
      setShowPrompt(false)
      setShowPasswordDialog(false)
      return res
    }

    switch (perunState.type) {
      case 'SignMessage':
        return handleSignMessage(perunState.request)
      case 'SignTransaction':
        return handleSignTransaction(perunState.request) as any
      default:
    }
  }

  const handleUpdateNotification = async (request: any) => {
    console.log('handleUpdateNotification', request)
    const decodedState = wire.State.decode(request.encodedState)
    const channelId = channelIdToString(decodedState.id)
    const channel = channels.get(channelId)
    if (!channel) {
      showErrorMessage('Error', `channel ${channelId} not found`)
      return
    }

    // Update accepted channel update.
    channel.version = decodedState.version
    channel.allocation = decodedState.allocation
    channel.isFinal = decodedState.isFinal
    channels.set(channelId, channel)

    await respondPerunRequest({
      type: 'UpdateNotification',
      response: {
        data: true,
      },
    })
  }

  const meAsParticipant = (myAddress: string, myPubKey: string) => {
    const sec1bytes = bytes.bytify(myPubKey)
    const lockScript = addressToScript(myAddress)

    const serializedPubKey = SerializeSEC1EncodedPubKey(sec1bytes.buffer)
    const serializableScript = {
      code_hash: bytes.bytify(lockScript.codeHash).buffer,
      hash_type: blockchain.HashType.pack(lockScript.hashType),
      args: bytes.bytify(lockScript.args).buffer,
    }

    const buf = SerializeOffChainParticipant({
      payment_script: serializableScript,
      unlock_script: serializableScript,
      pub_key: serializedPubKey,
    })
    return new Uint8Array(buf)
  }

  const equalNumPaddedHex = (num: bigint) => {
    const hex = num.toString(16)
    const res = hex.length % 2 === 0 ? hex : `0${hex}`
    return `0x${res}`
  }

  const getPubKey = async () => {
    const res = await getCurrentWalletAccountExtendedPubKey({ type: 0, index: 0 })
    if (!isSuccessResponse(res)) {
      handleRejected((res.message as any).content)
      return
    }

    setPubKey(res.result)
  }

  const handleOpenChannel = async () => {
    const myAddress = MyAddress
    const res = await getCurrentWalletAccountExtendedPubKey({ type: 0, index: 0 })
    if (!isSuccessResponse(res)) {
      handleRejected((res.message as any).content)
      return
    }
    const myPubKey = res.result
    const myBalanceCKB = amount!
    const myBalanceShannon = equalNumPaddedHex(BigInt(myBalanceCKB * 1e8))
    const peerBalanceCKB = peerAmount!
    const peerBalanceShannon = equalNumPaddedHex(BigInt(peerBalanceCKB * 1e8))

    console.log('handleOpenChannel: myaddress, myPubKey----', myAddress, myPubKey)

    console.log('handleOpenChannel: balances----', myBalanceShannon, peerBalanceShannon)

    const actionRes = await perunServiceAction({
      type: 'open',
      payload: {
        me: meAsParticipant(myAddress, myPubKey),
        peer: meAsParticipant(peerAddress, peerPubKey),
        balances: [bytes.bytify(myBalanceShannon), bytes.bytify(peerBalanceShannon)],
        challengeDuration: Number(challengeDuration) as number,
      },
    })
    if (!isSuccessResponse(actionRes)) {
      showErrorMessage('Error', errorFormatter(actionRes.message, t))
    }
  }

  const handleUpdateChannel = async (channelId: Uint8Array, swapAmount: bigint) => {
    console.log('handleUpdateChannel-----', channelId, swapAmount)
    console.log('HANDLE UPDATE CHANNEL')
    const res = await perunServiceAction({
      type: 'update',
      payload: {
        channelId: channelIdToString(channelId),
        index: 0,
        amount: swapAmount,
      },
    })
    console.log('HANDLE UPDATE CHANNEL RES: ', res)
    if (!isSuccessResponse(res)) {
      handleRejected(res.message as string)
      return
    }
    // If we could update the chanenl, we cache the updated channel state.
    const updatedChannelState = res.result.state
    const channel = channels.get(channelIdToString(channelId))
    if (!channel) {
      showErrorMessage('Error', `channel ${channelId} not found`)
      return
    }
    channel.version = updatedChannelState.version
    channel.allocation = updatedChannelState.allocation
    channel.isFinal = updatedChannelState.isFinal
    channels.set(channelIdToString(channelId), channel)
  }

  const handleCloseChannel = async (channelId: Uint8Array) => {
    console.log('handleCloseChannel-----', channelId)
    const res = await perunServiceAction({
      type: 'close',
      payload: {
        channelId,
      },
    })

    if (!isSuccessResponse(res)) {
      handleRejected(res.message as string)
      return
    }
    channels.delete(channelIdToString(res.result.channelId))
  }

  const getChannels = async () => {
    console.log('Getting channels')

    console.log('wallet----', wallet)
    // console.log(
    //   'addresses----',
    //   wallet.addresses.find(item => item.address === MyAddress)
    // )
    console.log('addresses----', wallet.addresses)

    const myAddress = MyAddress
    const res = await getCurrentWalletAccountExtendedPubKey({ type: 0, index: 0 })
    if (!isSuccessResponse(res)) {
      handleRejected((res.message as any).content)
      return
    }
    const myPubKey = res.result
    console.log('requester----', meAsParticipant(myAddress, myPubKey))
    const actionRes = await perunServiceAction({
      type: 'get',
      payload: {
        requester: meAsParticipant(myAddress, myPubKey),
      },
    })

    console.log('actionRes--get--', actionRes)
    if (!isSuccessResponse(actionRes)) {
      return
    }
    if (!actionRes.result) {
      return
    }
    // console.log('GET CHANNELS result: ', JSON.stringify(actionRes))
    const id = actionRes.result.channels.id.data
    const { version } = actionRes.result.channels
    const { app } = actionRes.result.channels
    const alloc = wire.Allocation.create({
      assets: [new Uint8Array(32)],
      balances: wire.Balances.create({
        balances: [
          {
            balance: [
              actionRes.result.channels.allocation.balances.balances[0].balance[0].data,
              actionRes.result.channels.allocation.balances.balances[0].balance[1].data,
            ],
          },
        ],
      }),
      locked: [],
    })
    const { data } = actionRes.result.channels
    const { isFinal } = actionRes.result.channels

    const state = wire.State.create({
      id,
      version,
      app,
      allocation: alloc,
      data,
      isFinal,
    })

    channels.set(channelIdToString(id), state)
  }

  const restoreChannels = async () => {
    const actionRes = await perunServiceAction({
      type: 'restore',
      payload: {
        data: new Uint8Array(0),
      },
    })
    debugger
  }

  // setInterval(getChannels, 5000)

  const rejectPerunRequest = async (type: 'SignMessage' | 'SignTransaction' | 'UpdateNotification', reason: string) => {
    await respondPerunRequest({
      type,
      response: {
        rejected: {
          reason,
        },
        data: undefined,
      },
    })
  }

  const renderPerunRequest = useCallback(
    (state: Subject.PerunState) => {
      if (!state.request) {
        return <>No request</>
      }

      switch (state.type) {
        case 'SignMessage': {
          const addressBytes = state.request.pubkey.data
          const address = new TextDecoder().decode(new Uint8Array(addressBytes))
          return (
            <>
              <div>Address:</div>
              <div>{address}</div>
              <div>Message:</div>
              <div>{bytesToHex(new Uint8Array(state.request.data.data))}</div>
            </>
          )
        }
        case 'SignTransaction': {
          const { identifier, transaction } = state.request as {
            identifier: CKBComponents.Script
            transaction: CKBComponents.Transaction
          }
          const addr = scriptToAddress(identifier, { isMainnet: false })
          console.log('sign transaction identifier', addr)
          return (
            <>
              <div>With address:</div>
              <div>{JSON.stringify(addr)}</div>
              <div>Transaction:</div>
              <div>{JSON.stringify(transaction)}</div>
            </>
          )
        }
        case 'UpdateNotification': {
          console.log('UpdateNotification request: ', state.request)
          const ps = state.request.state
          const id = ps.id.data
          const { version } = ps
          const alloc = wire.Allocation.create({
            assets: [new Uint8Array(32)],
            balances: wire.Balances.create({
              balances: [
                {
                  balance: [
                    ps.allocation.balances.balances[0].balance[0].data,
                    ps.allocation.balances.balances[0].balance[1].data,
                  ],
                },
              ],
            }),
            locked: [],
          })
          const { isFinal } = ps
          return (
            <>
              <h3>Update Notification</h3>
              <p>{`Channel ID: ${channelIdToString(id)}`}</p>
              <p>{`State: `}</p>
              <p>{`Version: ${version}`}</p>
              <p>{`Balances: A: ${bigintFromBEBytes(alloc.balances?.balances[0].balance[0]!)}, B: ${bigintFromBEBytes(
                alloc.balances?.balances[0].balance[1]!
              )}`}</p>
              <p>{`IsFinal: ${isFinal}`}</p>
            </>
          )
        }
        default:
      }
    },
    [perunState]
  )

  return (
    <PageContainer
      head={
        <div className={styles.pageHeader}>
          <PerunIcon />
          <p>Perun Channels</p>
        </div>
      }
    >
      <div className={styles.header}>
        <div className={styles.daoContainer}>
          <Dialog show={showPrompt} showFooter={false}>
            <div className={styles.perunPrompt}>
              <div className={styles.perunModal}>
                <div className={styles.perunModalHeader}>
                  <div className={styles.perunModalTitle}>{t(`perun.signing-request`)}</div>
                </div>
                <div className={styles.perunModalBody}>
                  <div className={styles.perunModalBodyText}>{t(`perun.signing-request-text`)}</div>
                  <div className={styles.perunModalBodyMessage}>{renderPerunRequest(perunState)}</div>
                </div>
                <div className={styles.perunModalFooter}>
                  <button
                    type="button"
                    className={styles.perunModalAcceptButton}
                    onClick={() => {
                      if (perunState.type === 'UpdateNotification') {
                        handleUpdateNotification(perunState.request).catch(err =>
                          rejectPerunRequest(perunState.type, err.message)
                        )
                        setShowPrompt(false)
                        return
                      }
                      setShowPasswordDialog(true)
                    }}
                  >
                    {t(`perun.accept`)}
                  </button>
                  <button
                    type="button"
                    className={styles.perunModalRejectButton}
                    onClick={() => {
                      rejectPerunRequest(perunState.type, 'User rejected')
                      setShowPrompt(false)
                      setShowPasswordDialog(false)
                    }}
                  >
                    {t(`perun.reject`)}
                  </button>
                </div>
              </div>
              {showPasswordDialog && (
                <PasswordDialog
                  show={showPrompt}
                  walletName=""
                  onSubmit={pass =>
                    handleSigningRequest(pass).catch(err => rejectPerunRequest(perunState.type, err.message))
                  }
                  onCancel={() => setShowPrompt(false)}
                />
              )}
            </div>
          </Dialog>

          <div className={styles.openChannel}>
            <div className={styles.formContainer}>
              <div className={styles.formGroup}>
                <p className={styles.formLabel}>{t(`perun.insert-amount`)}:</p>
                <TextField
                  type="number"
                  value={amount || ''}
                  onChange={(event: { currentTarget: { value: string } }) => {
                    handleAmountChange(event.currentTarget.value)
                  }}
                />
                <span className={styles.formText}>CKB</span>
              </div>
              <div className={styles.formGroup}>
                <Button
                  onClick={() => {
                    getChannels()
                    getPubKey()
                  }}
                >
                  Get Channels
                </Button>
                <Button
                  onClick={() => {
                    restoreChannels()
                  }}
                >
                  Restore Channels
                </Button>
                <p>myAddress: {MyAddress}</p>
                <p>My: {pubKey}</p>
                <p>peer: {peerPubKey}</p>
                <p className={styles.formLabel}>{t(`perun.peer-address`)} :</p>
                <TextField
                  type="text"
                  value={peerAddress || ''}
                  onChange={(event: { currentTarget: { value: string } }) => {
                    handlePeerAddressChange(event.currentTarget.value)
                  }}
                />
              </div>
              <div className={styles.formGroup}>
                <p className={styles.formLabel}>{t(`perun.peer-amount`)} :</p>
                <TextField
                  type="number"
                  value={peerAmount || ''}
                  onChange={(event: { currentTarget: { value: string } }) => {
                    handlePeerAmountChange(event.currentTarget.value)
                  }}
                />
              </div>
              <div className={styles.formGroup}>
                <p className={styles.formLabel}>{t(`perun.challenge-duration`)} :</p>
                <TextField
                  type="number"
                  value={challengeDuration || ''}
                  onChange={(event: { currentTarget: { value: string } }) => {
                    handleChallengeDurationChange(event.currentTarget.value)
                  }}
                />
              </div>
            </div>

            <button
              className={styles.openButton}
              onClick={() => handleOpenChannel()}
              type="button"
              disabled={!validInputs}
            >
              {t(`perun.open-channel`)}
            </button>
          </div>
        </div>

        <div className={`${styles['channel-entry']} ${styles.channels}`}>
          <div className={`${styles.header}`} color="white">
            {t(`perun.channels`)} :{' '}
          </div>
          {channels.size === 0 && <div>{t(`perun.no-open`)} </div>}
          {Array.from(channels).map(channel => (
            <div key={channel[0]} className={`${styles['channel-entry']}`}>
              <div className={`${styles['channel-info']}`}>
                <p>{`Channel ID: ${channelIdToString(channel[1].id)}`}</p>
                <p>{`State: `}</p>
                <p>{`Version: ${channel[1].version}`}</p>
                <p>{`Balances: A: ${
                  bigintFromBEBytes(channel[1].allocation?.balances?.balances[0].balance[0]!) / BigInt(1e8)
                }, B: ${bigintFromBEBytes(channel[1].allocation?.balances?.balances[0].balance[1]!) / BigInt(1e8)}`}</p>
                <p>{`IsFinal: ${channel[1].isFinal}`}</p>
              </div>
              <div className={styles['channel-buttons']}>
                <button
                  className={`${styles['channel-button']} ${styles['channel-update-button']}`}
                  type="button"
                  onClick={() => {
                    console.log('Before setChannelID: ', channel[1].id)
                    setChannelID(channel[1].id)
                    setUpdateChannelDialog(true)
                  }}
                >
                  {t(`perun.update-channel`)}
                </button>
                <button
                  className={`${styles['channel-button']} ${styles['channel-close-button']}`}
                  type="button"
                  onClick={() => handleCloseChannel(channelIdFromString(channel[0]))}
                >
                  {t(`perun.close-channel`)}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 拒绝请求的弹窗 */}
        <Dialog
          title={t(`perun.rejection-reason`)}
          show={showRejectionModal}
          onCancel={() => handleCloseRejectionModal()}
        >
          <div>
            <p>${rejectionReason}</p>
          </div>

          <Button onClick={() => handleCloseRejectionModal()}>{t(`perun.ok`)}!</Button>
        </Dialog>

        {/* 更新通道的弹窗 */}
        <Dialog
          show={updateChannelDialog && channelID !== undefined}
          showFooter={false}
          onClose={() => {
            setUpdateChannelDialog(false)
            setChannelID(undefined)
          }}
        >
          <p>{t(`perun.enter-amount`)}</p>
          <div className={styles.formGroup}>
            <p className={styles.formLabel}>Amount:</p>
            <TextField
              type="number"
              value={updateAmount || ''}
              onChange={(event: { currentTarget: { value: string } }) => {
                handleUpdateAmountChange(event.currentTarget.value)
              }}
            />
            <span className={styles.formText}>CKB</span>
          </div>
          <Button
            className={styles.updateButton}
            onClick={() => {
              setUpdateChannelDialog(false)
              console.log('Before handleUpdateChannel: ', channelID, updateAmount)
              handleUpdateChannel(channelID, BigInt(updateAmount! * 1e8))
              setChannelID(undefined)
            }}
          >
            {t(`perun.update-channel`)}
          </Button>
        </Dialog>
      </div>
    </PageContainer>
  )
}

Perun.displayName = 'Perun'

export default Perun
