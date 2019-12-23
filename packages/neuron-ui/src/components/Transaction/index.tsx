import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Stack, DetailsList, Text, CheckboxVisibility, IColumn, Icon } from 'office-ui-fabric-react'
import { currentWallet as currentWalletCache } from 'services/localCache'
import {
  getTransaction,
  showErrorMessage,
  getAllNetworks,
  getCurrentNetworkID,
  openExternal,
  openContextMenu,
} from 'services/remote'
import { ckbCore } from 'services/chain'

import { transactionState } from 'states/initStates/chain'

import { localNumberFormatter, uniformTimeFormatter, shannonToCKBFormatter } from 'utils/formatters'
import { ErrorCode, MAINNET_TAG } from 'utils/const'
import { explorerNavButton } from './style.module.scss'

const MIN_CELL_WIDTH = 70

const CompactAddress = ({ address }: { address: string }) => (
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

const Transaction = () => {
  const [t] = useTranslation()
  const [transaction, setTransaction] = useState(transactionState)
  const [isMainnet, setIsMainnet] = useState(false)
  const [error, setError] = useState({ code: '', message: '' })

  const addressPrefix = isMainnet ? ckbCore.utils.AddressPrefix.Mainnet : ckbCore.utils.AddressPrefix.Testnet

  const inputColumns: IColumn[] = useMemo(
    () =>
      [
        {
          key: 'index',
          name: t('transaction.index'),
          minWidth: 60,
          maxWidth: 60,
          onRender: (_input?: State.DetailedInput, index?: number) => {
            if (undefined !== index) {
              return index
            }
            return null
          },
        },
        {
          key: 'address',
          name: t('transaction.address'),
          minWidth: 200,
          maxWidth: 500,
          onRender: (input?: State.DetailedInput, _index?: number, column?: IColumn) => {
            if (!input) {
              return null
            }
            if (!input.lock) {
              return t('transaction.cell-from-cellbase')
            }
            try {
              const address = ckbCore.utils.bech32Address(input.lock.args, {
                prefix: addressPrefix,
                type: ckbCore.utils.AddressType.HashIdx,
                codeHashOrCodeHashIndex: '0x00',
              })
              if (column && (column.calculatedWidth || 0) < 450) {
                return <CompactAddress address={address} />
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
    [addressPrefix, t]
  )

  const outputColumns: IColumn[] = useMemo(
    () =>
      [
        {
          key: 'index',
          name: t('transaction.index'),
          minWidth: 60,
          maxWidth: 60,
          onRender: (item?: State.DetailedOutput) => {
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
                codeHashOrCodeHashIndex: '0x00',
              })
              if (column && (column.calculatedWidth || 0) < 450) {
                return <CompactAddress address={address} />
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

          setIsMainnet(network.chain === MAINNET_TAG)
        }
      })
      .catch(err => console.warn(err))

    const currentWallet = currentWalletCache.load()
    if (currentWallet) {
      const hash = window.location.href.split('/').pop()
      if (!hash) {
        showErrorMessage(
          t(`messages.error`),
          t(`messages.codes.${ErrorCode.FieldNotFound}`, { fieldName: 'transaction hash' })
        )
        return
      }
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

  const onExplorerBtnClick = useCallback(() => {
    const explorerUrl = isMainnet ? 'https://explorer.nervos.org' : 'https://explorer.nervos.org/aggron'
    openExternal(`${explorerUrl}/transaction/${transaction.hash}`)
  }, [transaction.hash, isMainnet])

  const basicInfoItems = useMemo(
    () => [
      { label: t('transaction.transaction-hash'), value: transaction.hash || 'none' },
      {
        label: t('transaction.block-number'),
        value: transaction.blockNumber ? localNumberFormatter(transaction.blockNumber) : 'none',
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

  const onBasicInfoContextMenu = useCallback(
    (property: { label: string; value: string }, index?: number) => {
      if (index === 0 && property && property.value) {
        const menuTemplate = [
          {
            label: t('common.copy-tx-hash'),
            click: () => {
              window.clipboard.writeText(property.value)
            },
          },
        ]
        openContextMenu(menuTemplate)
      }
    },
    [t]
  )

  const onInputContextMenu = useCallback(
    (input?: State.DetailedInput) => {
      if (input && input.lock && input.lock.args) {
        try {
          const address = ckbCore.utils.bech32Address(input.lock.args, {
            prefix: addressPrefix,
            type: ckbCore.utils.AddressType.HashIdx,
            codeHashOrCodeHashIndex: '0x00',
          })
          const menuTemplate = [
            {
              label: t('common.copy-address'),
              click: () => {
                window.clipboard.writeText(address)
              },
            },
          ]
          openContextMenu(menuTemplate)
        } catch (err) {
          console.error(err)
        }
      }
    },
    [addressPrefix, t]
  )

  const onOutputContextMenu = useCallback(
    (output?: State.DetailedOutput) => {
      if (output && output.lock && output.lock.args) {
        try {
          const address = ckbCore.utils.bech32Address(output.lock.args, {
            prefix: addressPrefix,
            type: ckbCore.utils.AddressType.HashIdx,
            codeHashOrCodeHashIndex: '0x00',
          })
          const menuTemplate = [
            {
              label: t('common.copy-address'),
              click: () => {
                window.clipboard.writeText(address)
              },
            },
          ]
          openContextMenu(menuTemplate)
        } catch (err) {
          console.error(err)
        }
      }
    },
    [addressPrefix, t]
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
          onItemContextMenu={onBasicInfoContextMenu}
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
            items={transaction.inputs as State.DetailedInput[]}
            columns={inputColumns}
            checkboxVisibility={CheckboxVisibility.hidden}
            onItemContextMenu={onInputContextMenu}
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
            items={transaction.outputs as State.DetailedOutput[]}
            columns={outputColumns}
            checkboxVisibility={CheckboxVisibility.hidden}
            onItemContextMenu={onOutputContextMenu}
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
