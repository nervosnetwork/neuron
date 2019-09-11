import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Stack,
  Text,
  ShimmeredDetailsList,
  TextField,
  IconButton,
  IColumn,
  IGroup,
  CheckboxVisibility,
  getTheme,
} from 'office-ui-fabric-react'

import { StateDispatch } from 'states/stateProvider/reducer'
import { contextMenu, showTransactionDetails } from 'services/remote'

import { useLocalDescription } from 'utils/hooks'
import {
  shannonToCKBFormatter,
  uniformTimeFormatter as timeFormatter,
  uniformTimeFormatter,
  localNumberFormatter,
} from 'utils/formatters'
import { onRenderRow } from 'utils/fabricUIRender'
import { CONFIRMATION_THRESHOLD } from 'utils/const'

const theme = getTheme()
const { semanticColors } = theme

const MIN_CELL_WIDTH = 50

interface FormatTransaction extends State.Transaction {
  date: string
}

const onRenderHeader = ({ group }: any) => {
  const { name } = group
  return (
    <Stack
      tokens={{ padding: 15 }}
      styles={{
        root: {
          background: theme.palette.neutralLighterAlt,
          borderTop: `1px solid ${theme.palette.neutralSecondary}`,
          borderBottom: `1px solid ${theme.palette.neutralLighter}`,
        },
      }}
    >
      <Text variant="large">{name}</Text>
    </Stack>
  )
}

const TransactionList = ({
  isLoading = false,
  items = [],
  walletID,
  tipBlockNumber,
  dispatch,
}: {
  isLoading?: boolean
  walletID: string
  items: State.Transaction[]
  tipBlockNumber: string
  dispatch: StateDispatch
}) => {
  const [t] = useTranslation()

  const {
    localDescription,
    onDescriptionPress,
    onDescriptionFieldBlur,
    onDescriptionChange,
    onDescriptionSelected,
  } = useLocalDescription('transaction', walletID, dispatch)

  const transactionColumns: IColumn[] = useMemo(
    (): IColumn[] =>
      [
        {
          name: t('history.type'),
          key: 'type',
          fieldName: 'type',
          minWidth: MIN_CELL_WIDTH,
          maxWidth: 50,
          onRender: (item?: FormatTransaction) => {
            if (!item) {
              return null
            }
            const type = t(`history.${item.type}`)
            return <span title={type}>{type}</span>
          },
        },
        {
          name: t('history.timestamp'),
          key: 'timestamp',
          fieldName: 'timestamp',
          minWidth: 80,
          maxWidth: 80,
          onRender: (item?: FormatTransaction) => {
            if (!item) {
              return null
            }
            const time = uniformTimeFormatter(item.timestamp || item.createdAt).split(' ')[1]
            return <span title={time}>{time}</span>
          },
        },
        {
          name: t('history.transaction-hash'),
          key: 'hash',
          fieldName: 'hash',
          minWidth: 150,
          maxWidth: 150,
          onRender: (item?: FormatTransaction) => {
            if (!item) {
              return '-'
            }
            return (
              <span className="textOverflow monospacedFont" title={item.hash}>
                {`${item.hash.slice(0, 8)}...${item.hash.slice(-6)}`}
              </span>
            )
          },
        },
        {
          name: t('history.confirmations'),
          key: 'confirmation',
          minWidth: 100,
          maxWidth: +tipBlockNumber > 1e12 ? undefined : 150,
          onRender: (item?: FormatTransaction) => {
            if (!item || item.status !== 'success') {
              return null
            }
            const confirmationCount = 1 + +tipBlockNumber - +item.blockNumber
            if (confirmationCount < CONFIRMATION_THRESHOLD) {
              return t(`history.confirming-with-count`, {
                confirmations: `${confirmationCount} / ${CONFIRMATION_THRESHOLD}`,
              })
            }
            const confirmations = localNumberFormatter(confirmationCount)
            return (
              <span title={`${confirmations}`} className="textOverflow">
                {confirmations}
              </span>
            )
          },
        },
        {
          name: t('history.status'),
          key: 'status',
          fieldName: 'status',
          minWidth: 80,
          maxWidth: 80,
          onRender: (item?: FormatTransaction) => {
            if (!item) {
              return null
            }
            if (item.status !== 'success') {
              const status = t(`history.${item.status}`)
              return <span title={status}>{status}</span>
            }
            const confirmationCount = 1 + +tipBlockNumber - +item.blockNumber
            if (confirmationCount < CONFIRMATION_THRESHOLD) {
              return t(`history.confirming`)
            }
            return t(`history.success`)
          },
        },
        {
          name: t('history.description'),
          key: 'description',
          fieldName: 'description',
          minWidth: 100,
          maxWidth: 100,
          onRender: (item?: FormatTransaction) => {
            const isSelected = item && localDescription.key === item.hash
            return item ? (
              <>
                <TextField
                  title={item.description}
                  value={isSelected ? localDescription.description : item.description || ''}
                  onBlur={isSelected ? onDescriptionFieldBlur(item.hash, item.description) : undefined}
                  onKeyPress={isSelected ? onDescriptionPress(item.hash, item.description) : undefined}
                  onChange={isSelected ? onDescriptionChange(item.hash) : undefined}
                  borderless
                  readOnly={!isSelected}
                  styles={{
                    fieldGroup: {
                      backgroundColor: isSelected ? '#fff' : 'transparent',
                      borderColor: 'transparent',
                      border: isSelected ? `1px solid ${semanticColors.inputBorder}!important` : 'none',
                    },
                  }}
                />
                {isSelected ? null : (
                  <IconButton
                    iconProps={{ iconName: 'Edit' }}
                    className="editButton"
                    onClick={onDescriptionSelected(item.hash, item.description)}
                  />
                )}
              </>
            ) : null
          },
        },
        {
          name: t('history.amount'),
          key: 'value',
          fieldName: 'value',
          minWidth: 200,
          maxWidth: 250,
          onRender: (item?: FormatTransaction) => {
            if (item) {
              return (
                <span title={`${item.value} shannon`} className="textOverflow">
                  {`${shannonToCKBFormatter(item.value, true)} CKB`}
                </span>
              )
            }
            return '-'
          },
        },
      ].map((col): IColumn => ({ fieldName: col.key, ariaLabel: col.name, ...col })),
    [
      tipBlockNumber,
      localDescription,
      onDescriptionChange,
      onDescriptionFieldBlur,
      onDescriptionPress,
      onDescriptionSelected,
      t,
    ]
  )

  const { groups, txs } = useMemo(() => {
    const groupItems: IGroup[] = [
      {
        key: 'pending',
        name: 'Pending',
        startIndex: 0,
        count: 0,
      },
    ]
    const txItems = items.map(item => {
      const date = timeFormatter(+(item.timestamp || item.createdAt)).split(' ')[0]
      if (item.status === 'pending') {
        groupItems[0].count++
        return { ...item, date }
      }

      if (date !== groupItems[groupItems.length - 1].key) {
        groupItems.push({
          key: date,
          name: date,
          startIndex: groupItems[groupItems.length - 1].count + groupItems[groupItems.length - 1].startIndex,
          count: 1,
        })
      } else {
        groupItems[groupItems.length - 1].count++
      }
      return { ...item, date }
    })
    return { groups: groupItems, txs: txItems }
  }, [items])

  return (
    <ShimmeredDetailsList
      enableShimmer={isLoading}
      columns={transactionColumns}
      items={txs}
      groups={groups.filter(group => group.count !== 0)}
      groupProps={{
        onRenderHeader,
      }}
      checkboxVisibility={CheckboxVisibility.hidden}
      onItemInvoked={item => {
        showTransactionDetails(item.hash)
      }}
      onItemContextMenu={item => {
        if (item) {
          contextMenu({ type: 'transactionList', id: item.hash })
        }
      }}
      className="listWithDesc"
      onRenderRow={onRenderRow}
    />
  )
}

TransactionList.displayName = 'TransactionList'

export default TransactionList
