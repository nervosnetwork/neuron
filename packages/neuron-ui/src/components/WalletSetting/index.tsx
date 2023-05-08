import React, { useEffect, useCallback, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { WalletWizardPath } from 'components/WalletWizard'
import { ReactComponent as EditWallet } from 'widgets/Icons/Edit.svg'
import { ReactComponent as DeleteWallet } from 'widgets/Icons/Delete.svg'
import { ReactComponent as CreateWallet } from 'widgets/Icons/Add.svg'
import { ReactComponent as ImportKeystore } from 'widgets/Icons/SoftWalletImportKeystore.svg'
import { ReactComponent as Export } from 'widgets/Icons/Export.svg'
import { ReactComponent as ImportHardware } from 'widgets/Icons/HardWalletImport.svg'
import { ReactComponent as AddSimple } from 'widgets/Icons/AddSimple.svg'
import Tooltip from 'widgets/Tooltip'
import { StateDispatch } from 'states'
import WalletEditorDialog from 'components/WalletEditorDialog'
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
    label: 'wizard.wallet-seed',
    ariaLabel: 'import wallet seed',
    url: `${RoutePath.WalletWizard}${WalletWizardPath.Mnemonic}/${MnemonicAction.Import}`,
    icon: <Export />,
  },
  {
    label: 'wizard.keystore',
    ariaLabel: 'import from keystore',
    url: RoutePath.ImportKeystore,
    icon: <ImportKeystore />,
    stroke: true,
  },
  {
    label: 'wizard.hardware-wallet',
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
              <button type="button" aria-label={t('common.backup')} onClick={onHandleWallet}>
                <Export data-action="backup" data-id={wallet.id} />
              </button>
              {wallet.id !== currentID ? (
                <button type="button" onClick={onHandleWallet}>
                  <DeleteWallet data-action="delete" data-id={wallet.id} />
                </button>
              ) : null}
            </div>
          ),
        }))}
      />

      <div className={styles.addWrap}>
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
          <button type="button" className={styles.addBtn}>
            <AddSimple /> {t('wizard.add-one')}
          </button>
        </Tooltip>
      </div>

      <WalletEditorDialog
        show={showEditDialog}
        id={editWallet}
        onCancel={() => {
          setShowEditDialog(false)
        }}
      />
    </div>
  )
}

WalletSetting.displayName = 'WalletSetting'

export default WalletSetting
