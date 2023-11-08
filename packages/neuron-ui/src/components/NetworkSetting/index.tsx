import React, { useEffect, useCallback, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ReactComponent as EditNetwork } from 'widgets/Icons/Edit.svg'
import { ReactComponent as DeleteNetwork } from 'widgets/Icons/Delete.svg'
import NetworkEditorDialog from 'components/NetworkEditorDialog'
import AlertDialog from 'widgets/AlertDialog'
import Toast from 'widgets/Toast'
import { chainState } from 'states'
import { setCurrentNetwork, deleteNetwork } from 'services/remote'
import RadioGroup from 'widgets/RadioGroup'
import { useOnWindowResize, useToggleChoiceGroupBorder, getNetworkLabelI18nkey } from 'utils'
import { AddSimple, Switch } from 'widgets/Icons/icon'
import Tooltip from 'widgets/Tooltip'
import { LIGHT_CLIENT_MAINNET, NetworkType } from 'utils/const'
import { lastShowInternalNodeIds } from 'services/localCache'
import styles from './networkSetting.module.scss'

const NetworkSetting = ({ chain = chainState, settings: { networks = [] } }: State.AppWithNeuronWallet) => {
  const [t] = useTranslation()
  const [showEditorDialog, setShowEditorDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [notice, setNotice] = useState('')

  const { networkID: currentId } = chain
  const [netId, setNetId] = useState('new')

  const onHandleNetwork = useCallback(
    (e: React.BaseSyntheticEvent) => {
      const {
        dataset: { action, id },
      } = e.target
      switch (action) {
        case 'edit': {
          setNetId(id)
          setShowEditorDialog(true)
          break
        }
        case 'delete': {
          setNetId(id)
          setShowDeleteDialog(true)
          break
        }
        case 'add': {
          setNetId('new')
          setShowEditorDialog(true)
          break
        }
        default:
      }
    },
    [setNetId, setShowEditorDialog, setShowDeleteDialog]
  )

  const toggleBottomBorder = useToggleChoiceGroupBorder(`.${styles.networks}`, styles.hasBottomBorder)

  useEffect(() => {
    if (networks.length) {
      toggleBottomBorder()
    }
  }, [toggleBottomBorder, networks.length])

  useOnWindowResize(toggleBottomBorder)

  const handleChange = useCallback(
    checked => {
      if (checked !== currentId) {
        setCurrentNetwork(checked)
      }
    },
    [currentId]
  )

  const onEditSuccess = useCallback(() => {
    setShowEditorDialog(false)
    if (netId !== 'new') {
      setNotice(t('settings.network.edit-success'))
    }
  }, [setShowEditorDialog, setNotice, netId])

  const onSwitchNetworkType = useCallback<React.MouseEventHandler<HTMLButtonElement>>(() => {
    const selectedNetwork = networks.find(v => v.id === currentId)
    const switchNetwork = networks.find(v => v.type === selectedNetwork?.type && v.id !== currentId)
    if (switchNetwork) {
      setCurrentNetwork(switchNetwork.id)
      lastShowInternalNodeIds.save(switchNetwork.type, switchNetwork.id)
    }
  }, [currentId, networks])

  const showNetworks = useMemo(() => {
    const internalLightNodeId = lastShowInternalNodeIds.get(NetworkType.Light)
    return networks.filter(v => v.type !== NetworkType.Light || v.id === internalLightNodeId)
  }, [currentId, networks])

  return (
    <div>
      <RadioGroup
        value={currentId}
        onChange={handleChange}
        itemClassName={styles.radioItem}
        options={showNetworks.map(network => ({
          value: network.id,
          label:
            currentId === network.id && network.type === NetworkType.Light ? (
              <div className={styles.networkLabel}>
                <p>{`${network.name} (${network.remote})`}</p>
                <Tooltip
                  tip={
                    <div className={styles.tooltip}>
                      {t('settings.network.switch-network-type', {
                        type: network.chain === LIGHT_CLIENT_MAINNET ? 'testnet' : 'mainnet',
                      })}
                    </div>
                  }
                  placement="top"
                  showTriangle
                >
                  <button type="button" className={styles.tag} onClick={onSwitchNetworkType}>
                    {t(getNetworkLabelI18nkey(network.chain))}
                    <Switch />
                  </button>
                </Tooltip>
              </div>
            ) : (
              <div className={styles.networkLabel}>
                <p>{`${network.name} (${network.remote})`}</p>
                <div className={styles.tag}>{t(getNetworkLabelI18nkey(network.chain))}</div>
              </div>
            ),
          suffix: (
            <div className={styles.suffix}>
              {network.readonly ? null : (
                <button type="button" aria-label={t('common.edit')} onClick={onHandleNetwork}>
                  <EditNetwork data-action="edit" data-id={network.id} />
                </button>
              )}
              {network.type && !network.readonly ? (
                <button type="button" aria-label={t('common.delete')} onClick={onHandleNetwork}>
                  <DeleteNetwork data-action="delete" data-id={network.id} />
                </button>
              ) : null}
            </div>
          ),
        }))}
      />

      <button type="button" className={styles.addBtn} onClick={onHandleNetwork}>
        <span data-action="add">
          <AddSimple /> {t('settings.network.add-network')}
        </span>
      </button>

      {showEditorDialog ? (
        <NetworkEditorDialog onSuccess={onEditSuccess} onCancel={() => setShowEditorDialog(false)} id={netId} />
      ) : null}

      <Toast content={notice} onDismiss={() => setNotice('')} />

      <AlertDialog
        show={showDeleteDialog}
        title={t('settings.network.remove-network')}
        message={t('settings.network.remove-network-msg')}
        type="warning"
        onCancel={() => setShowDeleteDialog(false)}
        onOk={() => {
          deleteNetwork(netId)
          setShowDeleteDialog(false)
        }}
      />
    </div>
  )
}

NetworkSetting.displayName = 'NetworkSetting'

export default NetworkSetting
