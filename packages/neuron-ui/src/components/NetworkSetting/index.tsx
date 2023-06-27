import React, { useEffect, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ReactComponent as EditNetwork } from 'widgets/Icons/Edit.svg'
import { ReactComponent as DeleteNetwork } from 'widgets/Icons/Delete.svg'
import { ReactComponent as AddSimple } from 'widgets/Icons/AddSimple.svg'
import NetworkEditorDialog from 'components/NetworkEditorDialog'
import { chainState } from 'states'
import { setCurrentNetowrk } from 'services/remote'
import RadioGroup from 'widgets/RadioGroup'
import { useOnHandleNetwork, useOnWindowResize, useToggleChoiceGroupBorder } from 'utils'
import { LIGHT_CLIENT_TESTNET } from 'utils/const'
import styles from './networkSetting.module.scss'

const NetworkSetting = ({ chain = chainState, settings: { networks = [] } }: State.AppWithNeuronWallet) => {
  const [t] = useTranslation()
  const [showEditorDialog, setShowEditorDialog] = useState(false)

  const { networkID: currentId } = chain
  const [netId, setNetId] = useState('new')

  const handleNet = useCallback(
    (val: string) => {
      setNetId(val)
      setShowEditorDialog(true)
    },
    [setNetId, setShowEditorDialog]
  )

  const toggleBottomBorder = useToggleChoiceGroupBorder(`.${styles.networks}`, styles.hasBottomBorder)

  useEffect(() => {
    if (networks.length) {
      toggleBottomBorder()
    }
  }, [toggleBottomBorder, networks.length])

  useOnWindowResize(toggleBottomBorder)

  const onHandleNetwork = useOnHandleNetwork(handleNet)

  const handleChange = useCallback(
    checked => {
      if (checked !== currentId) {
        setCurrentNetowrk(checked)
      }
    },
    [currentId]
  )
  return (
    <div>
      <RadioGroup
        defaultValue={currentId}
        onChange={handleChange}
        itemClassName={styles.radioItem}
        options={networks.map(network => ({
          value: network.id,
          label: (
            <div className={styles.networkLabel}>
              <p>{`${network.name} (${network.remote})`}</p>
              <div className={styles.tag}>{network.chain}</div>
            </div>
          ),
          suffix: (
            <div className={styles.suffix}>
              {
                network.chain === LIGHT_CLIENT_TESTNET ? null : (
                  <button type="button" aria-label={t('common.edit')} onClick={onHandleNetwork}>
                    <EditNetwork data-action="edit" data-id={network.id} />
                  </button>
                )
              }
              {(network.type && network.chain !== LIGHT_CLIENT_TESTNET) ? (
                <button type="button" aria-label={t('common.delete')} onClick={onHandleNetwork}>
                  <DeleteNetwork data-action="delete" data-id={network.id} />
                </button>
              ) : null}
            </div>
          ),
        }))}
      />

      <button type="button" className={styles.addBtn} onClick={() => handleNet('new')}>
        <AddSimple /> {t('settings.network.add-network')}
      </button>

      <NetworkEditorDialog show={showEditorDialog} close={() => setShowEditorDialog(false)} id={netId} />
    </div>
  )
}

NetworkSetting.displayName = 'NetworkSetting'

export default NetworkSetting
