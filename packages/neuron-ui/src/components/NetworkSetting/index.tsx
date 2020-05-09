import React, { useEffect, useCallback } from 'react'
import { useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChoiceGroup, IChoiceGroupOption } from 'office-ui-fabric-react'
import Button from 'widgets/Button'

import chainState from 'states/init/chain'
import { setCurrentNetowrk, openContextMenu, deleteNetwork } from 'services/remote'

import { backToTop, RoutePath } from 'utils'
import styles from './networkSetting.module.scss'

const Label = ({ type, t }: { type: 'ckb' | 'ckb_testnet' | 'ckb_dev' | string; t: any }) => {
  switch (type) {
    case 'ckb': {
      return <span className="label primary">{t('settings.network.mainnet')}</span>
    }
    case 'ckb_testnet': {
      return <span className="label secondary">{t('settings.network.testnet')}</span>
    }
    default: {
      return <span className="label third">{t('settings.network.devnet')}</span>
    }
  }
}

const NetworkSetting = ({ chain = chainState, settings: { networks = [] } }: State.AppWithNeuronWallet) => {
  const [t] = useTranslation()
  const history = useHistory()
  useEffect(() => {
    backToTop()
  }, [])

  const onChoiceChange = useCallback((_e, option?: IChoiceGroupOption) => {
    if (option) {
      setCurrentNetowrk(option.key)
    }
  }, [])

  const goToCreateNetwork = useCallback(() => {
    history.push(`${RoutePath.NetworkEditor}/new`)
  }, [history])

  const onContextMenu = useCallback(
    (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
      e.stopPropagation()
      e.preventDefault()
      const { networkId } = (e.target as HTMLElement).dataset
      const item = networks.find(n => n.id === networkId)
      if (item) {
        const isCurrent = item.id === chain.networkID
        const isDefault = item.type === 0
        const menuTemplate = [
          {
            label: t('common.select'),
            enabled: !isCurrent,
            click: () => {
              setCurrentNetowrk(item.id)
            },
          },
          {
            label: t('common.edit'),
            enabled: true,
            click: () => {
              history.push(`${RoutePath.NetworkEditor}/${item.id}`)
            },
          },
          {
            label: t('common.delete'),
            enabled: !isDefault,
            click: () => {
              deleteNetwork(item.id)
            },
          },
        ]
        openContextMenu(menuTemplate)
      }
    },
    [chain.networkID, networks, history, t]
  )

  return (
    <div className={styles.container}>
      <ChoiceGroup
        className={styles.networks}
        options={networks.map(
          (network): IChoiceGroupOption => ({
            key: network.id,
            text: network.name,
            checked: chain.networkID === network.id,
            onRenderLabel: ({ text }: IChoiceGroupOption) => {
              return (
                <div
                  className={styles.network}
                  data-network-id={network.id}
                  onContextMenu={onContextMenu}
                  title={`${text}: ${network.remote}`}
                >
                  <span className="ms-ChoiceFieldLabel" style={{ pointerEvents: 'none' }}>
                    {text}
                  </span>
                  <span style={{ color: '#999', pointerEvents: 'none' }}>{`(${network.remote})`}</span>
                  <Label type={network.chain} t={t} />
                </div>
              )
            },
          })
        )}
        onChange={onChoiceChange}
      />
      <div className={styles.actions}>
        <Button type="default" label={t('settings.network.add-network')} onClick={goToCreateNetwork} />
      </div>
    </div>
  )
}

NetworkSetting.displayName = 'NetworkSetting'

export default NetworkSetting
