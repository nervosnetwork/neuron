import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Stack,
  Text,
  ActionButton,
  DefaultButton,
  DetailsList,
  DetailsRow,
  Icon,
  IColumn,
  CheckboxVisibility,
  DetailsListLayoutMode,
  IRenderFunction,
  IDetailsRowProps,
  IDetailsRowStyles,
  FontSizes,
  Callout,
  MessageBar,
  MessageBarType,
} from 'office-ui-fabric-react'
import PropertyList, { Property } from 'widgets/PropertyList'

import { StateWithDispatch } from 'states/stateProvider/reducer'
import { updateTransactionList, addPopup } from 'states/stateProvider/actionCreators'

import { showTransactionDetails, showErrorMessage } from 'services/remote'

import { localNumberFormatter, shannonToCKBFormatter, uniformTimeFormatter as timeFormatter } from 'utils/formatters'
import { PAGE_SIZE, Routes, CONFIRMATION_THRESHOLD } from 'utils/const'
import { backToTop } from 'utils/animations'

const TITLE_FONT_SIZE = 'xxLarge'
export type ActivityItem = State.Transaction & { confirmations: string; typeLabel: string }

const genTypeLabel = (
  type: 'send' | 'receive',
  confirmationCount: number,
  status: 'pending' | 'success' | 'failed'
) => {
  switch (type) {
    case 'send': {
      if (status === 'failed') {
        return 'sent'
      }
      if (status === 'pending' || confirmationCount < CONFIRMATION_THRESHOLD) {
        return 'sending'
      }
      return 'sent'
    }
    case 'receive': {
      if (status === 'failed') {
        return 'received'
      }
      if (status === 'pending' || confirmationCount < CONFIRMATION_THRESHOLD) {
        return 'receiving'
      }
      return 'received'
    }
    default: {
      return type
    }
  }
}

const onTransactionActivityRender = (item?: ActivityItem) => {
  if (!item) {
    return null
  }
  return (
    <>
      <Text variant="mediumPlus" as="span" title={`${item.value} shannon`}>
        {`${item.typeLabel} ${shannonToCKBFormatter(item.value)} CKB`}
      </Text>
      <Text variant="mediumPlus" as="span" title={item.confirmations} styles={{ root: [{ paddingLeft: '5px' }] }}>
        {item.confirmations}
      </Text>
    </>
  )
}

const onTransactionRowRender = (props?: IDetailsRowProps) => {
  if (!props) {
    return null
  }
  const customStyles: Partial<IDetailsRowStyles> = {
    root: {
      animationDuration: '0!important',
    },
  }
  return <DetailsRow {...props} styles={customStyles} />
}

const onTimestampRender = (item?: any) => {
  if (!item) {
    return null
  }
  return (
    <Text variant="mediumPlus" as="span">
      {timeFormatter(item.timestamp || item.createdAt)}
    </Text>
  )
}

const ActivityList = ({
  columns,
  items,
  onGoToHistory,
  t,
  ...props
}: React.PropsWithoutRef<{
  columns: IColumn[]
  items: any
  onGoToHistory: any
  t: any
  isHeaderVisible?: boolean
  onRenderRow?: IRenderFunction<IDetailsRowProps>
  [index: string]: any
}>) => (
  <Stack verticalFill>
    <DetailsList
      isHeaderVisible={false}
      layoutMode={DetailsListLayoutMode.justified}
      checkboxVisibility={CheckboxVisibility.hidden}
      compact
      items={items.slice(0, 10)}
      columns={columns}
      onItemInvoked={item => {
        showTransactionDetails(item.hash)
      }}
      styles={{
        root: {
          backgroundColor: 'transparent',
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
    {items.length > 10 ? (
      <ActionButton onClick={onGoToHistory} styles={{ root: { border: 'none' } }}>
        {t('overview.more')}
      </ActionButton>
    ) : null}
  </Stack>
)

const Overview = ({
  dispatch,
  app: { tipBlockNumber, chain, epoch, difficulty },
  wallet: { id, name, balance = '', addresses = [] },
  chain: {
    tipBlockNumber: syncedBlockNumber,
    codeHash = '',
    transactions: { items = [] },
  },
  history,
}: React.PropsWithoutRef<StateWithDispatch & RouteComponentProps>) => {
  const [t] = useTranslation()
  const [displayBlockchainInfo, setDisplayBlockchainInfo] = useState(false)
  const [displayMinerInfo, setDisplayMinerInfo] = useState(false)

  const blockchainInfoRef = useRef<HTMLDivElement>(null)
  const minerInfoRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (id) {
      backToTop()
    }
  }, [id])

  useEffect(() => {
    updateTransactionList({
      pageNo: 1,
      pageSize: PAGE_SIZE,
      keywords: '',
      walletID: id,
    })(dispatch)
  }, [id, dispatch])
  const onGoToHistory = useCallback(() => {
    history.push(Routes.History)
  }, [history])

  const activityColumns: IColumn[] = useMemo(() => {
    return [
      {
        key: 'status',
        name: t('overview.status'),
        minWidth: 20,
        maxWidth: 20,
        onRender: (item?: State.Transaction) => {
          if (!item) {
            return null
          }
          let iconName = 'TransactionPending'
          if (item.status === 'success') {
            iconName = 'TransactionSuccess'
          } else if (item.status === 'failed') {
            iconName = 'TransactionFailure'
          }
          return <Icon iconName={iconName} title={item.status} />
        },
      },
      {
        key: 'timestamp',
        name: t('overview.datetime'),
        minWidth: 180,
        maxWidth: 180,
        onRender: onTimestampRender,
      },
      {
        key: 'activity',
        name: t('overview.activity'),
        minWidth: 100,
        maxWidth: 600,
        onRender: onTransactionActivityRender,
      },
    ].map(
      (col): IColumn => ({
        fieldName: col.key,
        ariaLabel: col.name,
        ...col,
      })
    )
  }, [t])

  const balanceProperties: Property[] = useMemo(
    () => [
      {
        label: t('overview.balance'),
        value: `${shannonToCKBFormatter(balance)} CKB`,
      },
    ],
    [t, balance]
  )
  const blockchainStatusProperties = useMemo(
    () => [
      {
        label: t('overview.chain-identity'),
        value: chain,
      },
      {
        label: t('overview.tip-block-number'),
        value: localNumberFormatter(tipBlockNumber),
      },
      {
        label: t('overview.epoch'),
        value: epoch,
      },
      {
        label: t('overview.difficulty'),
        value: localNumberFormatter(+difficulty),
      },
    ],
    [t, chain, epoch, difficulty, tipBlockNumber]
  )

  const [showBlockchainStatus, hideBlockchainStatus, showMinerInfo, hideMinerInfo] = useMemo(
    () => [
      () => setDisplayBlockchainInfo(true),
      () => setDisplayBlockchainInfo(false),
      () => setDisplayMinerInfo(true),
      () => setDisplayMinerInfo(false),
    ],
    [setDisplayBlockchainInfo, setDisplayMinerInfo]
  )

  const defaultAddress = useMemo(() => {
    return addresses.find(addr => addr.type === 0 && addr.index === 0)
  }, [addresses])

  const onCopyPubkeyHash = useCallback(() => {
    if (defaultAddress) {
      window.navigator.clipboard.writeText(defaultAddress.identifier)
      hideMinerInfo()
      addPopup('lock-arg-copied')(dispatch)
    } else {
      showErrorMessage(t('messages.error'), t('messages.can-not-find-the-default-address'))
    }
  }, [defaultAddress, t, hideMinerInfo, dispatch])

  const activityItems = useMemo(
    () =>
      items.map(item => {
        let confirmations = '(-)'
        let typeLabel: string = item.type
        let { status } = item
        if (item.blockNumber !== undefined) {
          const confirmationCount =
            item.blockNumber === undefined ? 0 : 1 + Math.max(+syncedBlockNumber, +tipBlockNumber) - +item.blockNumber

          if (status === 'success' && confirmationCount < CONFIRMATION_THRESHOLD) {
            status = 'pending'
          }

          typeLabel = genTypeLabel(item.type, confirmationCount, status)

          if (confirmationCount === 1) {
            confirmations = `(${t('overview.confirmation', {
              confirmationCount: localNumberFormatter(confirmationCount),
            })})`
          } else if (confirmationCount > 1) {
            confirmations = `(${t('overview.confirmations', {
              confirmationCount: localNumberFormatter(confirmationCount),
            })})`
          }
        }

        return {
          ...item,
          status,
          value: item.value.replace(/^-/, ''),
          confirmations: item.status === 'success' ? confirmations : '',
          typeLabel: t(`overview.${typeLabel}`),
        }
      }),
    [items, t, syncedBlockNumber, tipBlockNumber]
  )

  return (
    <Stack tokens={{ childrenGap: 15 }} horizontalAlign="stretch">
      <Text as="h1" variant={TITLE_FONT_SIZE}>
        {name}
      </Text>
      <Stack horizontal horizontalAlign="space-between">
        <PropertyList properties={balanceProperties} />
        <Stack tokens={{ childrenGap: 15 }}>
          <div ref={blockchainInfoRef}>
            <DefaultButton onClick={showBlockchainStatus} styles={{ root: { width: '200px' } }}>
              {t('overview.blockchain-status')}
            </DefaultButton>
          </div>
          <div ref={minerInfoRef}>
            <DefaultButton onClick={showMinerInfo} styles={{ root: { width: '200px' } }}>
              {t('overview.miner-info')}
            </DefaultButton>
          </div>
        </Stack>
      </Stack>
      <Text as="h2" variant={TITLE_FONT_SIZE}>
        {t('overview.recent-activities')}
      </Text>
      {items.length ? (
        <ActivityList
          columns={activityColumns}
          items={activityItems}
          onRenderRow={onTransactionRowRender}
          onGoToHistory={onGoToHistory}
          t={t}
        />
      ) : (
        <div>{t('overview.no-recent-activities')}</div>
      )}
      {blockchainInfoRef.current ? (
        <Callout
          target={blockchainInfoRef.current}
          hidden={!displayBlockchainInfo}
          onDismiss={hideBlockchainStatus}
          gapSpace={0}
        >
          <Stack tokens={{ padding: 15 }}>
            <PropertyList properties={blockchainStatusProperties} />
          </Stack>
        </Callout>
      ) : null}
      {minerInfoRef.current ? (
        <Callout target={minerInfoRef.current} hidden={!displayMinerInfo} onDismiss={hideMinerInfo} gapSpace={0}>
          <Stack tokens={{ padding: 15 }}>
            {defaultAddress ? (
              <Stack tokens={{ childrenGap: 15 }} styles={{ root: { padding: 5 } }}>
                <Stack tokens={{ childrenGap: 15 }}>
                  <Text variant="small" style={{ fontWeight: 600 }}>
                    {t('overview.address')}
                  </Text>
                  <Text variant="small" className="monospacedFont">
                    {defaultAddress.address}
                  </Text>
                </Stack>
                <Stack tokens={{ childrenGap: 15 }}>
                  <Text variant="small" style={{ fontWeight: 600 }}>
                    {t('overview.code-hash')}
                  </Text>
                  <Text variant="small" className="monospacedFont">
                    {codeHash}
                  </Text>
                </Stack>
                <Stack tokens={{ childrenGap: 15 }}>
                  <Text variant="small" style={{ fontWeight: 600 }}>
                    {t('overview.lock-arg')}
                  </Text>
                  <Text variant="small" className="monospacedFont">
                    {defaultAddress.identifier}
                  </Text>
                </Stack>
                <Stack horizontalAlign="end">
                  <ActionButton iconProps={{ iconName: 'MiniCopy' }} onClick={onCopyPubkeyHash}>
                    {t('overview.copy-pubkey-hash')}
                  </ActionButton>
                </Stack>
              </Stack>
            ) : (
              <MessageBar messageBarType={MessageBarType.error}>
                {t('messages.can-not-find-the-default-address')}
              </MessageBar>
            )}
          </Stack>
        </Callout>
      ) : null}
    </Stack>
  )
}

Overview.displayName = 'Overview'

export default Overview
