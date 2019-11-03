import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Stack, Text, ActionButton, DefaultButton, DetailsList, Callout } from 'office-ui-fabric-react'
import PropertyList, { Property } from 'widgets/PropertyList'

import { StateWithDispatch } from 'states/stateProvider/reducer'
import { updateTransactionList } from 'states/stateProvider/actionCreators'

import { localNumberFormatter, shannonToCKBFormatter } from 'utils/formatters'
import { epochParser } from 'utils/parsers'
import { PAGE_SIZE, Routes, CONFIRMATION_THRESHOLD } from 'utils/const'
import { backToTop } from 'utils/animations'

import ActivityRow, { ActivityItem } from 'components/CustomRows/ActivityRow'

const TITLE_FONT_SIZE = 'xxLarge'

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

const Overview = ({
  dispatch,
  app: { tipBlockNumber, chain, epoch, difficulty },
  wallet: { id, name, balance = '' },
  chain: {
    tipBlockNumber: syncedBlockNumber,
    transactions: { items = [] },
  },
  history,
}: React.PropsWithoutRef<StateWithDispatch & RouteComponentProps>) => {
  const [t] = useTranslation()
  const [displayBlockchainInfo, setDisplayBlockchainInfo] = useState(false)

  const blockchainInfoRef = useRef<HTMLDivElement>(null)

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
        value: epochParser(epoch).index,
      },
      {
        label: t('overview.difficulty'),
        value: localNumberFormatter(+difficulty),
      },
    ],
    [t, chain, epoch, difficulty, tipBlockNumber]
  )

  const [showBlockchainStatus, hideBlockchainStatus] = useMemo(
    () => [() => setDisplayBlockchainInfo(true), () => setDisplayBlockchainInfo(false)],
    [setDisplayBlockchainInfo]
  )

  const activityItems: ActivityItem[] = useMemo(
    () =>
      items.map(item => {
        let confirmations = ''
        let typeLabel: string = item.type
        let { status } = item
        if (item.blockNumber !== undefined) {
          const confirmationCount =
            item.blockNumber === null || item.status === 'failed'
              ? 0
              : 1 + Math.max(+syncedBlockNumber, +tipBlockNumber) - +item.blockNumber

          if (status === 'success' && confirmationCount < CONFIRMATION_THRESHOLD) {
            status = 'pending'

            if (confirmationCount === 1) {
              confirmations = t('overview.confirmation', {
                confirmationCount: localNumberFormatter(confirmationCount),
                threshold: CONFIRMATION_THRESHOLD,
              })
            } else if (confirmationCount > 1) {
              confirmations = `${t('overview.confirmations', {
                confirmationCount: localNumberFormatter(confirmationCount),
                threshold: CONFIRMATION_THRESHOLD,
              })}`
            }
          }

          typeLabel = genTypeLabel(item.type, confirmationCount, status)
        }

        return {
          ...item,
          status,
          statusLabel: t(`overview.statusLabel.${status}`),
          value: item.value.replace(/^-/, ''),
          confirmations,
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
        </Stack>
      </Stack>
      <Text as="h2" variant={TITLE_FONT_SIZE}>
        {t('overview.recent-activities')}
      </Text>
      {items.length ? (
        <Stack verticalFill>
          <DetailsList isHeaderVisible={false} items={activityItems.slice(0, 10)} onRenderRow={ActivityRow} />
          {items.length > 10 ? (
            <ActionButton onClick={onGoToHistory} styles={{ root: { border: 'none' } }}>
              {t('overview.more')}
            </ActionButton>
          ) : null}
        </Stack>
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
    </Stack>
  )
}

Overview.displayName = 'Overview'

export default Overview
