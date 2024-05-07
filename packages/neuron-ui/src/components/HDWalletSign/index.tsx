import React, { useCallback, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { encodeToAddress, generateAddress } from '@ckb-lumos/helpers'
import { predefined } from '@ckb-lumos/config-manager'
import { shannonToCKBFormatter, useDidMount, isSuccessResponse, CONSTANTS } from 'utils'
import { getSystemCodeHash, getAllNetworks, getCurrentNetworkID } from 'services/remote'
import CopyZone from 'widgets/CopyZone'
import { DeviceSignIndex as DeviceSignIndexSubject } from 'services/subjects'

import styles from '../HardwareSign/hardwareSign.module.scss'

const { MAINNET_CLIENT_LIST } = CONSTANTS

const HDWalletSign = ({ tx }: { tx: State.DetailedTransaction }) => {
  const [t] = useTranslation()
  const [isMainnet, setIsMainnet] = useState(false)
  const [systemCodeHash, setSystemCodeHash] = useState<string>('')
  const [inputVisible, setInputVisible] = useState(true)
  const [activeInputIndex, setActiveInputIndex] = useState(0)

  useDidMount(() => {
    getSystemCodeHash().then(res => {
      if (isSuccessResponse(res)) {
        setSystemCodeHash(res.result)
      }
    })
    Promise.all([getAllNetworks(), getCurrentNetworkID()])
      .then(([networksRes, idRes]) => {
        if (isSuccessResponse(networksRes) && isSuccessResponse(idRes)) {
          const network = networksRes.result.find((n: any) => n.id === idRes.result)
          if (!network) {
            throw new Error('Cannot find current network in the network list')
          }

          setIsMainnet(MAINNET_CLIENT_LIST.includes(network.chain))
        }
      })
      .catch(err => console.warn(err))

    const DeviceSignIndexSubscription = DeviceSignIndexSubject.subscribe(index => {
      setActiveInputIndex(index)
    })

    return () => {
      DeviceSignIndexSubscription.unsubscribe()
    }
  })

  const config = isMainnet ? predefined.LINA : predefined.AGGRON4
  const renderList = useCallback(
    (cells: Readonly<(State.DetailedInput | State.DetailedOutput)[]>, activeIndex: number, isInput: boolean) =>
      cells.map((cell, index) => {
        let address = ''
        if (!cell.lock) {
          address = t('transaction.cell-from-cellbase')
        } else {
          try {
            if (cell.lock.codeHash === systemCodeHash && cell.lock.hashType === 'type') {
              address = generateAddress(cell.lock, { config })
            } else if (['data', 'type', 'data1', 'data2'].includes(cell.lock.hashType)) {
              address = encodeToAddress(cell.lock, { config })
            } else {
              throw new Error(`Invalid lock script hash type ${cell.lock.hashType}`)
            }
          } catch (err) {
            console.error(err)
          }
        }
        const capacity = shannonToCKBFormatter(cell.capacity || '0')

        const classNames = [styles.tr]

        if (activeIndex === index && isInput) {
          classNames.push(styles.active)
        }

        if (index < activeIndex && isInput) {
          classNames.push(styles.signed)
        }

        return (
          <tr key={cell.lockHash || ''} data-address={address} className={classNames.join('')}>
            <td title={`${index + 1}`}>
              <div>{index + 1}</div>
            </td>
            <td title={address} className={styles.addressCell}>
              <CopyZone content={address} name={t('history.copy-address')}>
                {address}
              </CopyZone>
            </td>
            <td>
              <CopyZone content={capacity.replace(/,/g, '')} name={t('history.copy-balance')}>
                {`${capacity} CKB`}
              </CopyZone>
            </td>
          </tr>
        )
      }),
    [t, isMainnet, systemCodeHash]
  )

  const inputBody = useMemo(() => {
    return renderList(tx.inputs, activeInputIndex, true)
  }, [activeInputIndex, tx.inputs, renderList])

  const outputBody = useMemo(() => {
    return renderList(tx.outputs, activeInputIndex, false)
  }, [activeInputIndex, tx.outputs, renderList])

  const showInput = useCallback(() => {
    setInputVisible(true)
  }, [setInputVisible])

  const showOutput = useCallback(() => {
    setInputVisible(false)
  }, [setInputVisible])

  return (
    <div className={styles.sign}>
      <div className={styles.tabs}>
        <button className={inputVisible ? styles.active : ''} onClick={showInput} type="button">
          {t('hardware-sign.inputs', { index: activeInputIndex, length: tx.inputs.length })}
        </button>
        <button className={!inputVisible ? styles.active : ''} onClick={showOutput} type="button">
          {t('hardware-sign.outputs', { length: tx.outputs.length })}
        </button>
      </div>
      <div className={styles.table}>
        <hr />
        <table className={styles.inputList}>
          <tbody>{inputVisible ? inputBody : outputBody}</tbody>
        </table>
        <hr />
      </div>
    </div>
  )
}

HDWalletSign.displayName = 'HDWalletSign'

export default HDWalletSign
