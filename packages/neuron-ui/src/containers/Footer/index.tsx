import React, { useCallback, useContext, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { RouteComponentProps } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Stack, getTheme, Text, ProgressIndicator, Icon, TooltipHost, TeachingBubble } from 'office-ui-fabric-react'

import { openExternal } from 'services/remote'
import { guideBubbleTimes } from 'services/localCache'
import { StateWithDispatch } from 'states/stateProvider/reducer'
import { NeuronWalletContext } from 'states/stateProvider'
import { ConnectionStatus, FULL_SCREENS, RUN_NODE_GUIDE_URL, Routes } from 'utils/const'

const theme = getTheme()
const stackStyles = {
  root: [
    {
      width: '100%',
      background: theme.palette.neutralLighter,
    },
  ],
}
const stackItemStyles = {
  root: [theme.fonts.xSmall],
}

export const SyncStatus = ({
  tipBlockNumber = '',
  syncedBlockNumber = '',
  bufferBlockNumber = 10,
}: React.PropsWithoutRef<{ tipBlockNumber: string; syncedBlockNumber: string; bufferBlockNumber?: number }>) => {
  const [t] = useTranslation()
  if (tipBlockNumber === '') {
    return <Text variant="xSmall">{t('footer.fail-to-fetch-tip-block-number')}</Text>
  }

  if (BigInt(syncedBlockNumber) < BigInt(0)) {
    return <Text variant="xSmall">{t('footer.sync-not-start')}</Text>
  }

  const percentage = +syncedBlockNumber / +tipBlockNumber

  return +syncedBlockNumber + bufferBlockNumber < +tipBlockNumber ? (
    <TooltipHost
      content={`${syncedBlockNumber} / ${tipBlockNumber}`}
      styles={{ root: { display: 'flex', justifyContent: 'center', alignItems: 'center' } }}
    >
      {t('sync.syncing')}
      <ProgressIndicator
        percentComplete={percentage}
        styles={{ root: { width: '120px', marginLeft: '5px', marginRight: '5px' } }}
      />
    </TooltipHost>
  ) : (
    <>{t('sync.synced')}</>
  )
}

export const NetworkStatus = ({ name, online }: { name: string; online: boolean }) => {
  return (
    <Stack id="network-status" horizontal verticalAlign="center" tokens={{ childrenGap: 5 }} styles={stackItemStyles}>
      <Icon
        iconName={online ? 'Connected' : 'Disconnected'}
        styles={{ root: { display: 'flex', alignItems: 'center' } }}
      />
      <Text variant="xSmall">{name}</Text>
    </Stack>
  )
}

const Footer = ({
  history,
  location: { pathname },
}: React.PropsWithoutRef<StateWithDispatch & RouteComponentProps>) => {
  const {
    app: { tipBlockNumber = '0' },
    chain: { networkID = '', connectionStatus = ConnectionStatus.Offline, tipBlockNumber: syncedBlockNumber = '0' },
    settings: { networks = [] },
  } = useContext(NeuronWalletContext)
  const [t] = useTranslation()
  const [showGuide, setShowGuide] = useState(false)

  useEffect(() => {
    if (connectionStatus !== ConnectionStatus.Online && guideBubbleTimes.getRemaining()) {
      setShowGuide(true)
      guideBubbleTimes.reduce()
    } else {
      setShowGuide(false)
    }
  }, [connectionStatus, setShowGuide])

  const onDismissGuide = useCallback(() => {
    setShowGuide(false)
  }, [setShowGuide])

  const onGuideLinkClick = useCallback(() => {
    openExternal(RUN_NODE_GUIDE_URL)
  }, [])

  const goToNetworksSetting = useCallback(() => {
    history.push(Routes.SettingsNetworks)
  }, [history])

  if (FULL_SCREENS.find(url => pathname.startsWith(url))) {
    return null
  }
  const currentNetwork = networks.find(network => network.id === networkID)

  return (
    <Stack
      horizontal
      horizontalAlign="space-between"
      verticalFill
      verticalAlign="center"
      tokens={{
        padding: '0 15px',
      }}
      styles={stackStyles}
    >
      <Stack.Item styles={stackItemStyles}>
        <SyncStatus tipBlockNumber={tipBlockNumber} syncedBlockNumber={syncedBlockNumber} />
      </Stack.Item>

      <Stack styles={stackItemStyles} onClick={goToNetworksSetting} horizontal>
        {currentNetwork ? (
          <NetworkStatus online={connectionStatus === ConnectionStatus.Online} name={currentNetwork.name} />
        ) : (
          <Text>{t('settings.setting-tabs.network')}</Text>
        )}
        {showGuide ? (
          <TeachingBubble
            target="#network-status"
            headline={t('messages.run-ckb-guide')}
            hasSmallHeadline
            primaryButtonProps={{
              children: t('common.open'),
              onClick: onGuideLinkClick,
            }}
            onDismiss={onDismissGuide}
            styles={{
              subText: {
                fontSize: '14px',
              },
            }}
          >
            <Text as="span" variant="xSmall">
              {t('messages.view-the-run-node-doc')}
            </Text>
          </TeachingBubble>
        ) : null}
      </Stack>
    </Stack>
  )
}

Footer.displayName = 'Footer'

const Container: React.SFC = (props: any) =>
  createPortal(<Footer {...props} />, document.querySelector('footer') as HTMLElement)
export default Container
