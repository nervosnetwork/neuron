import React, { useEffect, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ReactComponent as EditNetwork } from 'widgets/Icons/Edit.svg'
import { ReactComponent as DeleteNetwork } from 'widgets/Icons/Delete.svg'
import { ReactComponent as AddSimple } from 'widgets/Icons/AddSimple.svg'
import NetworkEditorDialog from 'components/NetworkEditorDialog'
import AlertDialog from 'widgets/AlertDialog'
import Toast from 'widgets/Toast'
import { chainState } from 'states'
import { setCurrentNetwork, deleteNetwork } from 'services/remote'
import RadioGroup from 'widgets/RadioGroup'
import { useOnWindowResize, useToggleChoiceGroupBorder } from 'utils'
import { LIGHT_CLIENT_TESTNET } from 'utils/const'
import styles from './networkSetting.module.scss'

const getNetworkLabelI18nkey = (type: 'ckb' | 'ckb_testnet' | 'ckb_dev' | string) => {
  switch (type) {
    case 'ckb': {
      return 'settings.network.mainnet'
    }
    case 'ckb_testnet': {
      return 'settings.network.testnet'
    }
    case LIGHT_CLIENT_TESTNET: {
      return 'settings.network.lightTestnet'
    }
    default: {
      return 'settings.network.devnet'
    }
  }
}

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
        // @ts-ignore
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
              <div className={styles.tag}>{t(getNetworkLabelI18nkey(network.chain))}</div>
            </div>
          ),
          suffix: (
            <div className={styles.suffix}>
              {network.chain === LIGHT_CLIENT_TESTNET ? null : (
                <button type="button" aria-label={t('common.edit')} onClick={onHandleNetwork}>
                  <EditNetwork data-action="edit" data-id={network.id} />
                </button>
              )}
              {network.type && network.chain !== LIGHT_CLIENT_TESTNET ? (
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
