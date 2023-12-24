import React, { useEffect, useCallback, useState, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { WalletWizardPath } from 'components/WalletWizard'
import {
  Edit as EditWallet,
  Add as CreateWallet,
  Detect,
  Delete as DeleteWallet,
  Export,
  AddSimple,
  ImportKeystore,
  ImportHardware,
} from 'widgets/Icons/icon'
import Tooltip from 'widgets/Tooltip'
import Toast from 'widgets/Toast'
import { StateDispatch } from 'states'
import WalletEditorDialog from 'components/WalletEditorDialog'
import DetectDuplicateWalletDialog from 'components/DetectDuplicateWalletDialog'
import {
  backToTop,
  RoutePath,
  MnemonicAction,
  useOnHandleWallet,
  useOnWindowResize,
  useToggleChoiceGroupBorder,
} from 'utils'
import RadioGroup from 'widgets/RadioGroup'
import styles from './walletSetting.module.scss'

const buttons = [
  {
    label: 'wizard.create-new-wallet',
    ariaLabel: 'create a wallet',
    url: `${RoutePath.WalletWizard}${WalletWizardPath.Mnemonic}/${MnemonicAction.Create}?isSettings=1`,
    icon: <CreateWallet />,
  },
  {
    label: 'wizard.import-mnemonic',
    ariaLabel: 'import wallet seed',
    url: `${RoutePath.WalletWizard}${WalletWizardPath.Mnemonic}/${MnemonicAction.Import}`,
    icon: <Export />,
  },
  {
    label: 'wizard.import-keystore',
    ariaLabel: 'import from keystore',
    url: RoutePath.ImportKeystore,
    icon: <ImportKeystore />,
    stroke: true,
  },
  {
    label: 'wizard.import-hardware-wallet',
    ariaLabel: 'import from hardware wallet',
    url: RoutePath.ImportHardware,
    icon: <ImportHardware />,
  },
]

const WalletSetting = ({
  wallet: { id: currentID = '' },
  settings: { wallets = [] },
  dispatch,
}: State.AppWithNeuronWallet & { dispatch: StateDispatch }) => {
  const [t] = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editWallet, setEditWallet] = useState('')
  const [notice, setNotice] = useState('')
  const [showDetectDialog, setShowDetectDialog] = useState(false)

  const hasDuplicateWallets = useMemo(() => {
    const extendedKeys = wallets.map(item => item.extendedKey)
    const extendedKeySet = new Set(extendedKeys)
    return extendedKeys.length > extendedKeySet.size
  }, [wallets])

  useEffect(() => {
    backToTop()
  }, [])

  const onHandleWallet = useOnHandleWallet({ dispatch })

  const handleChange = useCallback(
    checked => {
      onHandleWallet({
        target: {
          dataset: {
            action: 'select',
            id: checked,
          },
        },
      } as React.BaseSyntheticEvent)
    },
    [onHandleWallet]
  )

  const handleEdit = useCallback(
    (e: React.BaseSyntheticEvent) => {
      const {
        dataset: { id },
      } = e.target
      if (id) {
        setEditWallet(id)
        setShowEditDialog(true)
      }
    },
    [setEditWallet, setShowEditDialog]
  )

  const navTo = useCallback(
    (url: string = '/') =>
      () => {
        if (url === RoutePath.ImportHardware) {
          navigate(RoutePath.ImportHardware)
        } else {
          navigate(url)
        }
      },
    [navigate, location.pathname]
  )

  const toggleBottomBorder = useToggleChoiceGroupBorder(`.${styles.wallets}`, styles.hasBottomBorder)

  useEffect(() => {
    if (wallets.length) {
      toggleBottomBorder()
    }
  }, [toggleBottomBorder, wallets.length])

  useOnWindowResize(toggleBottomBorder)

  const onEditSuccess = useCallback(() => {
    setShowEditDialog(false)
    setNotice(t('settings.wallet-manager.edit-success'))
  }, [setShowEditDialog, setNotice])

  const handleDetect = useCallback(() => {
    setShowDetectDialog(true)
  }, [setShowDetectDialog])

  const onDetectDialogClose = useCallback(() => {
    setShowDetectDialog(false)
  }, [setShowDetectDialog])

  return (
    <div>
      <RadioGroup
        defaultValue={currentID}
        onChange={handleChange}
        itemClassName={styles.radioItem}
        options={wallets.map(wallet => ({
          value: wallet.id,
          label: <span className={styles.walletName}>{wallet.name}</span>,
          suffix: (
            <div className={styles.suffix}>
              <button type="button" aria-label={t('common.edit')} onClick={handleEdit}>
                <EditWallet data-id={wallet.id} />
              </button>
              {wallet.isHD ? (
                <button type="button" aria-label={t('common.backup')} onClick={onHandleWallet}>
                  <Export data-action="backup" data-id={wallet.id} />
                </button>
              ) : null}
              {wallet.id !== currentID ? (
                <button type="button" onClick={onHandleWallet}>
                  <DeleteWallet data-action="delete" data-id={wallet.id} />
                </button>
              ) : null}
            </div>
          ),
        }))}
      />

      <div className={styles.actionWrap}>
        <Tooltip
          tip={
            <div className={styles.actions}>
              {buttons.map(({ label, url, icon, stroke }) => (
                <button type="button" key={label} onClick={navTo(url)} data-stroke={stroke}>
                  {icon}
                  <span>{t(label)}</span>
                </button>
              ))}
            </div>
          }
          trigger="click"
          showTriangle
        >
          <button type="button" className={styles.actionBtn}>
            <AddSimple /> {t('wizard.add-one')}
          </button>
        </Tooltip>

        {hasDuplicateWallets ? (
          <button type="button" className={styles.actionBtn} onClick={handleDetect}>
            <Detect /> {t('wizard.detect-duplicate-wallets')}
          </button>
        ) : null}
      </div>

      <WalletEditorDialog
        show={showEditDialog}
        id={editWallet}
        onCancel={() => {
          setShowEditDialog(false)
        }}
        onSuccess={onEditSuccess}
      />

      {showDetectDialog ? <DetectDuplicateWalletDialog onClose={onDetectDialogClose} /> : null}

      <Toast content={notice} onDismiss={() => setNotice('')} />
    </div>
  )
}

WalletSetting.displayName = 'WalletSetting'

export default WalletSetting
