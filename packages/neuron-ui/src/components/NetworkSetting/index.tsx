import React, { useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChoiceGroup, IChoiceGroupOption } from 'office-ui-fabric-react'
import NetworkTypeLabel from 'components/NetworkTypeLabel'
import Button from 'widgets/Button'
import { ReactComponent as EditNetwork } from 'widgets/Icons/Edit.svg'
import { ReactComponent as DeleteNetwork } from 'widgets/Icons/Delete.svg'

import { chainState } from 'states'
import { setCurrentNetowrk } from 'services/remote'

import { backToTop, RoutePath, useOnHandleNetwork, useOnWindowResize, useToggleChoiceGroupBorder } from 'utils'
import styles from './networkSetting.module.scss'

const NetworkSetting = ({ chain = chainState, settings: { networks = [] } }: State.AppWithNeuronWallet) => {
  const [t] = useTranslation()
  const navigate = useNavigate()
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
    navigate(`${RoutePath.NetworkEditor}/new`)
  }, [navigate])

  const toggleBottomBorder = useToggleChoiceGroupBorder(`.${styles.networks}`, styles.hasBottomBorder)

  useEffect(() => {
    if (networks.length) {
      toggleBottomBorder()
    }
  }, [toggleBottomBorder, networks.length])

  useOnWindowResize(toggleBottomBorder)

  const onHandleNetwork = useOnHandleNetwork({ navigate })

  return (
    <div className={styles.container}>
      <ChoiceGroup
        className={styles.networks}
        options={networks.map(
          (network): IChoiceGroupOption => ({
            key: network.id,
            text: network.name,
            checked: chain.networkID === network.id,
            onRenderLabel: props => {
              const isDefault = network.type === 0
              return (
                <div
                  role="presentation"
                  className={`ms-ChoiceFieldLabel ${styles.choiceLabel}`}
                  data-id={network.id}
                  onClick={onHandleNetwork}
                  title={`${props?.text}: ${network.remote}`}
                >
                  <span className={styles.networkLabel}>
                    {props?.text}
                    <span className={styles.url}>{`(${network.remote}`}</span>
                    <NetworkTypeLabel type={network.chain} />
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
