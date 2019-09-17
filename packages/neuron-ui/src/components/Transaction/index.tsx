import React, { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Stack, DetailsList, Text, CheckboxVisibility, IColumn } from 'office-ui-fabric-react'
import { currentWallet as currentWalletCache } from 'services/localCache'
import { getTransaction, showErrorMessage } from 'services/remote'

import { transactionState } from 'states/initStates/chain'

import { localNumberFormatter, uniformTimeFormatter, shannonToCKBFormatter } from 'utils/formatters'
import { ErrorCode } from 'utils/const'

const MIN_CELL_WIDTH = 70

const inputColumns: IColumn[] = [
  {
    key: 'lockHash',
    name: 'Lock Hash',
    minWidth: 100,
    maxWidth: 200,
    onRender: (item: any) => (
      <span title={item.lockHash || 'none'} className="text-overflow">
        {item.lockHash || 'none'}
      </span>
    ),
  },
  {
    key: 'outPointCell',
    name: 'OutPoint Cell',
    minWidth: 150,
    onRender: (item: any) => {
      const text = item.previousOutput ? `${item.previousOutput.txHash}[${item.previousOutput.index}]` : 'none'
      return (
        <span title={text} className="text-overflow">
          {text}
        </span>
      )
    },
  },
  {
    key: 'capacity',
    name: 'Capacity',
    minWidth: 200,
    maxWidth: 250,
  },
].map(
  (col): IColumn => ({
    ariaLabel: col.name,
    fieldName: col.key,
    ...col,
  })
)
const outputColumns: IColumn[] = [
  {
    key: 'index',
    name: 'Index',
    minWidth: 80,
    maxWidth: 150,
  },
  {
    key: 'lockHash',
    name: 'Lock Hash',
    minWidth: 150,
  },
  {
    key: 'capacity',
    name: 'Capacity',
    minWidth: 200,
    maxWidth: 250,
  },
].map(col => ({
  ariaLabel: col.name,
  fieldName: col.key,
  ...col,
}))

const basicInfoColumns: IColumn[] = [
  {
    key: 'label',
    name: 'Label',
    minWidth: 100,
    maxWidth: 150,
  },
  {
    key: 'value',
    name: 'value',
    minWidth: 450,
  },
].map(
  (col): IColumn => ({
    minWidth: MIN_CELL_WIDTH,
    ariaLabel: col.name,
    fieldName: col.key,
    ...col,
  })
)
const Transaction = () => {
  const [t] = useTranslation()
  const [transaction, setTransaction] = useState(transactionState)
  const [error, setError] = useState({ code: '', message: '' })
  useEffect(() => {
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

  const basicInfoItems = useMemo(
    () => [
      { label: t('history.transaction-hash'), value: transaction.hash || 'none' },
      {
        label: t('history.date'),
        value: +(transaction.timestamp || transaction.createdAt)
          ? uniformTimeFormatter(+(transaction.timestamp || transaction.createdAt))
          : 'none',
      },
      {
        label: t('history.blockNumber'),
        value: localNumberFormatter(transaction.blockNumber) || 'none',
      },
      {
        label: t('history.amount'),
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
      <Stack tokens={{ childrenGap: 15 }}>
        <Stack.Item>
          <Text variant="xLarge" as="h1">
            Inputs
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
            Outputs
          </Text>
          <DetailsList
            items={transaction.outputs
              .map(output => ({
                ...output,
                index: output.outPoint.index,
                capacity: `${shannonToCKBFormatter(output.capacity)} CKB`,
              }))
              .sort((o1, o2) => +o1.index - +o2.index)}
            columns={outputColumns}
            checkboxVisibility={CheckboxVisibility.hidden}
            compact
            isHeaderVisible
          />
        </Stack.Item>
      </Stack>
    </Stack>
  )
}

Transaction.displayName = 'Transaction'

export default Transaction
