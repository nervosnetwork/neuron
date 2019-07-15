import React, { useCallback, useMemo, useEffect } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Stack,
  Text,
  DetailsList,
  DetailsRow,
  IColumn,
  CheckboxVisibility,
  DetailsListLayoutMode,
  IRenderFunction,
  IDetailsRowProps,
  IDetailsRowStyles,
  FontSizes,
} from 'office-ui-fabric-react'

import { StateWithDispatch } from 'states/stateProvider/reducer'
import actionCreators from 'states/stateProvider/actionCreators'

import { localNumberFormatter, ShannonToCKBFormatter } from 'utils/formatters'
import { PAGE_SIZE, MIN_CELL_WIDTH } from 'utils/const'

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
})

const TITLE_FONT_SIZE = 'xxLarge'

const PropertyList = ({
  columns,
  items,
  ...props
}: React.PropsWithoutRef<{
  columns: IColumn[]
  items: any
  isHeaderVisible?: boolean
  onRenderRow?: IRenderFunction<IDetailsRowProps>
  [index: string]: any
}>) => (
  <DetailsList
    layoutMode={DetailsListLayoutMode.justified}
    checkboxVisibility={CheckboxVisibility.hidden}
    compact
    items={items}
    columns={columns}
    styles={{
      root: {
        backgroundColor: 'transparent',
      },
      headerWrapper: {
        selectors: {
          '.ms-DetailsHeader': {
            backgroundColor: 'transparent',
          },
          '.ms-DetailsHeader-cellName': {
            fontSize: FontSizes.xLarge,
          },
        },
      },
      contentWrapper: {
        selectors: {
          '.ms-DetailsRow': {
            backgroundColor: 'transparent',
          },
          '.ms-DetailsRow-cell': {
            fontSize: FontSizes.mediumPlus,
          },
        },
      },
    }}
    {...props}
  />
)
const Overview = ({
  dispatch,
  wallet: { id, balance = '' },
  chain: {
    networkID = '',
    transactions: { items = [] },
    tipBlockNumber = '0',
  },
  settings: { networks = [] },
}: React.PropsWithoutRef<StateWithDispatch & RouteComponentProps>) => {
  const [t] = useTranslation()
  const currentNetwork = useMemo(() => networks.find(n => n.id === networkID), [networkID, networks])

  useEffect(() => {
    dispatch(actionCreators.getTransactions({ pageNo: 1, pageSize: PAGE_SIZE, keywords: '', walletID: id }))
  }, [id, dispatch])

  const onTransactionRowRender = useCallback((props?: IDetailsRowProps) => {
    if (props) {
      const customStyles: Partial<IDetailsRowStyles> = {}
      if (props.item.status === 'failed') {
        customStyles.root = {
          color: 'red',
        }
      }
      return <DetailsRow {...props} styles={customStyles} />
    }
    return null
  }, [])

  const onTransactionTypeRender = useCallback((item?: any) => {
    if (item) {
      return (
        <Text
          variant="mediumPlus"
          as="span"
          style={{
            color: item.type === 'receive' ? '#28b463' : '#e66465',
          }}
        >
          {item.type}
        </Text>
      )
    }
    return null
  }, [])

  const onTimestampRender = useCallback((item?: any) => {
    if (item) {
      return (
        <Text variant="mediumPlus" as="span">
          {timeFormatter.format(+(item.timestamp || item.createdAt)).toLocaleString()}
        </Text>
      )
    }
    return null
  }, [])

  const activityColumns: IColumn[] = useMemo(() => {
    return [
      {
        key: 'timestamp',
        name: t('overview.datetime'),
        minWidth: 2 * MIN_CELL_WIDTH,
        onRender: onTimestampRender,
      },
      {
        key: 'type',
        name: t('overview.type'),
        onRender: onTransactionTypeRender,
      },
      {
        key: 'status',
        name: t('overview.status'),
      },
      {
        key: 'value',
        name: t('overview.amount'),
        title: 'value',
        minWidth: 2 * MIN_CELL_WIDTH,
        onRender: (item?: State.Transaction) => {
          if (item) {
            return <span title={`${item.value} shannon`}>{`${ShannonToCKBFormatter(item.value)} CKB`}</span>
          }
          return '-'
        },
      },
    ].map(
      (col): IColumn => ({
        isResizable: true,
        minWidth: MIN_CELL_WIDTH,
        fieldName: col.key,
        ariaLabel: col.name,
        ...col,
      })
    )
  }, [t, onTimestampRender, onTransactionTypeRender])

  const balanceColumns: IColumn[] = useMemo(
    () =>
      [
        {
          key: 'label',
          name: 'label',
          fieldName: 'label',
        },
        {
          key: 'value',
          name: 'value',
          fieldName: 'value',
        },
      ].map(col => ({
        isResizable: true,
        minWidth: 200,
        fieldName: col.key,
        ariaLabel: col.name,
        ...col,
      })),
    []
  )

  const balanceItems = useMemo(
    () => [
      {
        label: t('overview.amount'),
        value: <span title={`${balance} shannon`}>{`${ShannonToCKBFormatter(balance)} CKB`}</span>,
      },
      { label: t('overview.live-cells'), value: 'mock living cells' },
      { label: t('overview.cell-types'), value: 'mock cell typ' },
    ],
    [t, balance]
  )

  const blockchainStatusColumns = balanceColumns

  const blockchainStatusItems = useMemo(
    () => [
      { label: t('overview.blockchain-identity'), value: 'mock chain id' },
      { label: t('overview.block-number'), value: localNumberFormatter(tipBlockNumber) },
      { label: t('overview.rpc-service'), value: currentNetwork ? currentNetwork.name : '' },
    ],
    [t, currentNetwork, tipBlockNumber]
  )

  return (
    <Stack horizontal horizontalAlign="space-evenly" verticalFill tokens={{ childrenGap: 15 }}>
      <Stack tokens={{ childrenGap: 15 }}>
        <Stack>
          <Text as="h1" variant={TITLE_FONT_SIZE}>
            {t('overview.balance')}
          </Text>
          <PropertyList columns={balanceColumns} items={balanceItems} isHeaderVisible={false} />
        </Stack>
        <Stack.Item>
          <Text as="h1" variant={TITLE_FONT_SIZE}>
            {t('overview.blockchain-status')}
          </Text>
          {currentNetwork ? (
            <PropertyList columns={blockchainStatusColumns} items={blockchainStatusItems} isHeaderVisible={false} />
          ) : null}
        </Stack.Item>
      </Stack>
      <Stack horizontalAlign="stretch">
        <Text as="h1" variant={TITLE_FONT_SIZE}>
          {t('overview.recent-activities')}
        </Text>
        {items.length ? (
          <PropertyList columns={activityColumns} items={items} onRenderRow={onTransactionRowRender} />
        ) : (
          <div>{t('overview.no-recent-activities')}</div>
        )}
      </Stack>
    </Stack>
  )
}

Overview.displayName = 'Overview'

export default Overview
