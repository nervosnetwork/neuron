import React, { useEffect, useCallback } from 'react'
import { useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { TFunction } from 'i18next'
import { ChoiceGroup, IChoiceGroupOption } from 'office-ui-fabric-react'
import Button from 'widgets/Button'
import { ReactComponent as EditNetwork } from 'widgets/Icons/Edit.svg'
import { ReactComponent as DeleteNetwork } from 'widgets/Icons/Delete.svg'

import chainState from 'states/init/chain'
import { setCurrentNetowrk } from 'services/remote'

import { backToTop, RoutePath, useOnHandleNetwork, useOnWindowResize, useToggleChoiceGroupBorder } from 'utils'
import styles from './networkSetting.module.scss'

const Label = ({ type, t }: { type: 'ckb' | 'ckb_testnet' | 'ckb_dev' | string; t: TFunction }) => {
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

  const { networkID: currentId } = chain

  const onChoiceChange = useCallback(
    (_e, option?: IChoiceGroupOption) => {
      if (option && option.key !== currentId) {
        setCurrentNetowrk(option.key)
      }
    },
    [currentId]
  )

  const goToCreateNetwork = useCallback(() => {
    history.push(`${RoutePath.NetworkEditor}/new`)
  }, [history])

  const toggleBottomBorder = useToggleChoiceGroupBorder(`.${styles.networks}`, styles.hasBottomBorder)

  useEffect(() => {
    if (networks.length) {
      toggleBottomBorder()
    }
  }, [toggleBottomBorder, networks.length])

  useOnWindowResize(toggleBottomBorder)

  const onHandleNetwork = useOnHandleNetwork({ history })

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
              const isDefault = network.type === 0
              return (
                <div
                  role="presentation"
                  className={`ms-ChoiceFieldLabel ${styles.choiceLabel}`}
                  data-id={network.id}
                  data-action="select"
                  onClick={onHandleNetwork}
                  title={`${text}: ${network.remote}`}
                >
                  <span className={styles.networkLabel}>
                    {text}
                    <span style={{ color: '#999', pointerEvents: 'none' }}>{`(${network.remote})`}</span>
                    <Label type={network.chain} t={t} />
                  </span>

                  <button type="button" data-action="edit" aria-label={t('common.edit')} title={t('common.edit')}>
                    <EditNetwork />
                  </button>
                  {isDefault ? null : (
                    <button
                      type="button"
                      data-action="delete"
                      aria-label={t('common.delete')}
                      title={t('common.delete')}
                    >
                      <DeleteNetwork />
                    </button>
                  )}
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
