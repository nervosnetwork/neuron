import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Stack, DetailsList, Text, CheckboxVisibility, IColumn, Icon } from 'office-ui-fabric-react'
import { currentWallet as currentWalletCache } from 'services/localCache'
import { getTransaction, showErrorMessage, getAllNetworks, getCurrentNetworkID, openExternal } from 'services/remote'
import { ckbCore } from 'services/chain'

import { transactionState } from 'states/initStates/chain'

import { localNumberFormatter, uniformTimeFormatter, shannonToCKBFormatter } from 'utils/formatters'
import { ErrorCode } from 'utils/const'
import { explorerNavButton } from './style.module.scss'

const MIN_CELL_WIDTH = 70

const Transaction = () => {
  const [t] = useTranslation()
  const [transaction, setTransaction] = useState(transactionState)
  const [addressPrefix, setAddressPrefix] = useState(ckbCore.utils.AddressPrefix.Mainnet)
  const [error, setError] = useState({ code: '', message: '' })

  const inputColumns: IColumn[] = useMemo(
    () =>
      [
        {
          key: 'index',
          name: t('transaction.index'),
          minWidth: 60,
          maxWidth: 60,
          onRender: (_item?: any, index?: number) => {
            if (undefined !== index) {
              return index
            }
            return null
          },
        },
        {
          key: 'outPointCell',
          name: 'OutPoint Cell',
          minWidth: 150,
          maxWidth: 600,
          onRender: (item: any) => {
            const text = item.previousOutput ? `${item.previousOutput.txHash}[${item.previousOutput.index}]` : 'none'
            return (
              <span title={text} className="textOverflow">
                {text}
              </span>
            )
          },
        },
        {
          key: 'capacity',
          name: t('transaction.amount'),
          minWidth: 100,
          maxWidth: 250,
          onRender: (input?: State.DetailedOutput) => {
            if (input) {
              return `${shannonToCKBFormatter(input.capacity)} CKB`
            }
            return null
          },
        },
      ].map(
        (col): IColumn => ({
          ariaLabel: col.name,
          fieldName: col.key,
          ...col,
        })
      ),
    [t]
  )

  const outputColumns: IColumn[] = useMemo(
    () =>
      [
        {
          key: 'index',
          name: t('transaction.index'),
          minWidth: 60,
          maxWidth: 60,
          onRender: (item?: any | State.DetailedOutput) => {
            if (item) {
              return item.outPoint.index
            }
            return null
          },
        },
        {
          key: 'address',
          name: t('transaction.address'),
          minWidth: 200,
          maxWidth: 500,
          onRender: (output?: State.DetailedOutput, _index?: number, column?: IColumn) => {
            if (!output) {
              return null
            }
            try {
              const address = ckbCore.utils.bech32Address(output.lock.args, {
                prefix: addressPrefix,
                type: ckbCore.utils.AddressType.HashIdx,
                codeHashIndex: '0x00',
              })
              if (column && (column.calculatedWidth || 0) < 450) {
                return (
                  <div
                    title={address}
                    style={{
                      overflow: 'hidden',
                      display: 'flex',
                    }}
                    className="monospacedFont"
                  >
                    <span className="textOverflow">{address.slice(0, -6)}</span>
                    <span>{address.slice(-6)}</span>
                  </div>
                )
              }
              return (
                <span title={address} className="monospacedFont">
                  {address}
                </span>
              )
            } catch {
              return null
            }
          },
        },
        {
          key: 'capacity',
          name: t('transaction.amount'),
          minWidth: 100,
          maxWidth: 250,
          onRender: (output?: State.DetailedOutput) => {
            if (output) {
              return `${shannonToCKBFormatter(output.capacity)} CKB`
            }
            return null
          },
        },
      ].map(col => ({
        ariaLabel: col.name,
        fieldName: col.key,
        ...col,
      })),
    [addressPrefix, t]
  )

  const basicInfoColumns: IColumn[] = useMemo(
    () =>
      [
        {
          key: 'label',
          name: 'label',
          minWidth: 100,
          maxWidth: 120,
        },
        {
          key: 'value',
          name: 'value',
          minWidth: 150,
        },
      ].map(
        (col): IColumn => ({
          minWidth: MIN_CELL_WIDTH,
          ariaLabel: col.name,
          fieldName: col.key,
          ...col,
        })
      ),
    []
  )

  useEffect(() => {
    Promise.all([getAllNetworks(), getCurrentNetworkID()])
      .then(([networksRes, idRes]) => {
        if (networksRes.status === 1 && idRes.status === 1) {
          const network = networksRes.result.find((n: any) => n.id === idRes.result)
          if (!network) {
            throw new Error('Cannot find current network in the network list')
          }

          setAddressPrefix(
            network.chain === process.env.REACT_APP_MAINNET_TAG
              ? ckbCore.utils.AddressPrefix.Mainnet
              : ckbCore.utils.AddressPrefix.Testnet
          )
        }
      })
      .catch(err => console.warn(err))

    const currentWallet = currentWalletCache.load()
    if (currentWallet) {
      const hash = window.location.href.split('/').pop()
      getTransaction({ hash, walletID: currentWallet.id })
        .then(res => {
          if (res.status) {
            setTransaction(res.result)
          } else {
            showErrorMessage(
              t(`messages.error`),
              t(`messages.codes.${ErrorCode.FieldNotFound}`, { fieldName: 'transaction' })
            )
            window.close()
          }
        })
        .catch((err: Error) => {
          setError({
            code: '-1',
            message: err.message,
          })
        })
    }
  }, [t])

  useEffect(() => {
    window.addEventListener('storage', (e: StorageEvent) => {
      if (e.key === 'currentWallet') {
        window.close()
      }
    })
  }, [])

  // TODO: add conditional branch on mainnet and testnet
  const onExplorerBtnClick = useCallback(() => {
    openExternal(`https://explorer.nervos.org/transaction/${transaction.hash}`)
  }, [transaction.hash])

  const basicInfoItems = useMemo(
    () => [
      { label: t('transaction.transaction-hash'), value: transaction.hash || 'none' },
      {
        label: t('transaction.block-number'),
        value: localNumberFormatter(transaction.blockNumber) || 'none',
      },
      {
        label: t('transaction.date'),
        value: +(transaction.timestamp || transaction.createdAt)
          ? uniformTimeFormatter(+(transaction.timestamp || transaction.createdAt))
          : 'none',
      },
      {
        label: t('transaction.income'),
        value: `${shannonToCKBFormatter(transaction.value)} CKB`,
      },
    ],
    [t, transaction]
  )

  if (error.code) {
    return (
      <Stack verticalFill verticalAlign="center" horizontalAlign="center">
        {error.message || t(`messages.codes.${ErrorCode.FieldNotFound}`, { fieldName: 'transaction' })}
      </Stack>
    )
  }

  return (
    <Stack tokens={{ childrenGap: 15 }}>
      <Stack tokens={{ childrenGap: 15 }}>
        <Text variant="xLarge" as="h1">
          {t('history.basic-information')}
        </Text>
        <DetailsList
          columns={basicInfoColumns}
          items={basicInfoItems}
          checkboxVisibility={CheckboxVisibility.hidden}
          compact
          isHeaderVisible={false}
        />
      </Stack>
      <Stack tokens={{ childrenGap: 15 }} verticalFill>
        <Stack.Item>
          <Text variant="xLarge" as="h1">
            {`${t('transaction.inputs')} (${transaction.inputs.length}/${localNumberFormatter(
              transaction.inputsCount
            )})`}
          </Text>
          <DetailsList
            items={transaction.inputs}
            columns={inputColumns}
            checkboxVisibility={CheckboxVisibility.hidden}
            compact
            isHeaderVisible
          />
        </Stack.Item>
        <Stack.Item>
          <Text variant="xLarge" as="h1">
            {`${t('transaction.outputs')} (${transaction.outputs.length}/${localNumberFormatter(
              transaction.outputsCount
            )})`}
          </Text>
          <DetailsList
            items={transaction.outputs}
            columns={outputColumns}
            checkboxVisibility={CheckboxVisibility.hidden}
            compact
            isHeaderVisible
          />
        </Stack.Item>
      </Stack>
      <button
        type="button"
        className={explorerNavButton}
        title={t('transaction.view-in-explorer-button-title')}
        onClick={onExplorerBtnClick}
      >
        <Icon iconName="Explorer" />
        <span>{t('transaction.view-in-explorer')}</span>
      </button>
    </Stack>
  )
}

Transaction.displayName = 'Transaction'

export default Transaction
