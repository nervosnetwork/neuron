import React, { useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Stack, Text, Label, Image, PrimaryButton, DefaultButton, TextField, FontSizes } from 'office-ui-fabric-react'
import { FormAdd, FormUpload } from 'grommet-icons'

import withWizard, { WizardElementProps, WithWizardState } from 'components/withWizard'

import { MnemonicAction, BUTTON_GAP } from 'utils/const'
import { verifyWalletSubmission } from 'utils/validators'
import { helpersCall, walletsCall } from 'services/UILayer'
import { registerIcons, buttonGrommetIconStyles } from 'utils/icons'

export enum WalletWizardPath {
  Welcome = '/welcome',
  Mnemonic = '/mnemonic',
  Submission = '/submission',
}

const initState: WithWizardState = {
  generated: '',
  imported: '',
  password: '',
  confirmPassword: '',
  name: '',
}

const submissionInputs = [
  { label: 'name', key: 'name', type: 'text', hint: 'wizard.set-wallet-name', autoFocus: false },
  {
    label: 'password',
    key: 'password',
    type: 'password',
    hint: 'wizard.set-a-strong-password-to-protect-your-wallet',
    autoFocus: true,
  },
  { label: 'confirm-password', key: 'confirmPassword', type: 'password', autoFocus: false },
]

registerIcons({
  icons: {
    Import: <FormUpload color="white" />,
    Create: <FormAdd />,
  },
})

const Welcome = ({ rootPath = '/wizard', history }: WizardElementProps<{ rootPath: string }>) => {
  const [t] = useTranslation()

  const next = useCallback(
    (link: string) => () => {
      history.push(link)
    },
    [history]
  )

  return (
    <Stack verticalFill verticalAlign="center" horizontalAlign="start" padding="0 160px" tokens={{ childrenGap: 50 }}>
      <Stack horizontal styles={{ root: { width: '100%' } }}>
        {/* TODO: Make loading images work for packaged app */}
        <Image src="/icon.png" width="120px" />
      </Stack>
      <Stack tokens={{ childrenGap: 5 }}>
        <Text variant="xLargePlus">{t('wizard.welcome-to-nervos-neuron')}</Text>
        <Text variant="large">{t('wizard.please-setup-the-wallet')}</Text>
      </Stack>
      <Stack
        horizontal
        horizontalAlign="start"
        verticalAlign="center"
        tokens={{ childrenGap: 40 }}
        styles={{ root: { width: '100%' } }}
      >
        <PrimaryButton
          styles={{ root: [{ height: '60px' }] }}
          text={t('wizard.import-wallet')}
          onClick={next(`${rootPath}${WalletWizardPath.Mnemonic}/${MnemonicAction.Import}`)}
          iconProps={{ iconName: 'Import', styles: buttonGrommetIconStyles }}
        />
        <span>{t('common.or')}</span>
        <DefaultButton
          styles={{ root: [{ height: '60px' }] }}
          text={t('wizard.create-new-wallet')}
          onClick={next(`${rootPath}${WalletWizardPath.Mnemonic}/${MnemonicAction.Create}`)}
          iconProps={{ iconName: 'Create', styles: buttonGrommetIconStyles }}
        />
      </Stack>
    </Stack>
  )
}

Welcome.displayName = 'Welcome'

const Mnemonic = ({
  state = initState,
  rootPath = '/wizard',
  match: {
    params: { type = MnemonicAction.Create },
  },
  history,
  dispatch,
}: WizardElementProps<{ type: string }>) => {
  const { generated, imported } = state
  const [t] = useTranslation()
  const isCreate = type === MnemonicAction.Create
  const message = isCreate ? 'wizard.your-wallet-seed-is' : 'wizard.input-your-seed'
  const hint = isCreate ? 'wizard.write-down-seed' : ''
  const disableNext =
    (type === MnemonicAction.Import && imported === '') || (type === MnemonicAction.Verify && !(generated === imported))

  useEffect(() => {
    if (type === MnemonicAction.Create) {
      helpersCall
        .generateMnemonic()
        .then((res: string) => {
          dispatch({
            type: 'generated',
            payload: res,
          })
        })
        .catch(err => {
          console.error(err)
          history.goBack()
        })
    } else {
      dispatch({
        type: 'imported',
        payload: '',
      })
    }
  }, [dispatch, type, history])

  const onChange = useCallback(
    (_e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, value?: string) => {
      if (undefined !== value) {
        dispatch({
          type: 'imported',
          payload: value,
        })
      }
    },
    [dispatch]
  )
  const onNext = useCallback(() => {
    if (isCreate) {
      history.push(`${rootPath}${WalletWizardPath.Mnemonic}/${MnemonicAction.Verify}`)
    } else {
      history.push(
        `${rootPath}${WalletWizardPath.Submission}/${
          type === MnemonicAction.Verify ? MnemonicAction.Create : MnemonicAction.Import
        }`
      )
    }
  }, [isCreate, history, rootPath, type])

  return (
    <Stack verticalFill verticalAlign="center" horizontalAlign="stretch" tokens={{ childrenGap: 15 }}>
      <Text variant="xLargePlus">{t(message)}</Text>
      <TextField
        autoFocus
        multiline
        resizable={false}
        rows={3}
        readOnly={isCreate}
        value={isCreate ? generated : imported}
        onChange={onChange}
        description={t(hint)}
        styles={{
          field: {
            fontSize: FontSizes.xLarge,
          },
          description: {
            top: '110%',
            left: 0,
            position: 'absolute',
            fontSize: FontSizes.medium,
          },
        }}
      />
      <Stack horizontal horizontalAlign="end" tokens={{ childrenGap: BUTTON_GAP }}>
        <DefaultButton onClick={history.goBack} text={t('wizard.back')} />
        <PrimaryButton onClick={onNext} disabled={disableNext} text={t('wizard.next')} />
      </Stack>
    </Stack>
  )
}

Mnemonic.displayName = 'Mnemonic'

const Submission = ({
  state = initState,
  wallets = [],
  match: {
    params: { type = MnemonicAction.Create },
  },
  history,
  dispatch,
}: WizardElementProps<{ type: string }>) => {
  const { name, password, confirmPassword, imported } = state
  const [t] = useTranslation()
  const message = 'wizard.set-wallet-name-and-password'

  useEffect(() => {
    const genName = (baseNum: number = 0): string => {
      const walletName = t('wizard.wallet-suffix', { suffix: baseNum })
      if (wallets.some(wallet => wallet.name === walletName)) {
        return genName(baseNum + 1)
      }
      return walletName
    }
    dispatch({
      type: 'name',
      payload: genName(wallets.length + 1),
    })
    dispatch({
      type: 'password',
      payload: '',
    })
    dispatch({
      type: 'confirmPassword',
      payload: '',
    })
  }, [dispatch, wallets, t])

  const onChange = useCallback(
    (field: keyof WithWizardState) => {
      return (_e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, value?: string) => {
        if (undefined !== value) {
          dispatch({
            type: field,
            payload: value,
          })
        }
      }
    },
    [dispatch]
  )

  const onNext = useCallback(() => {
    const p = {
      name,
      password,
      mnemonic: imported,
    }
    if (type === MnemonicAction.Create) {
      walletsCall.create(p)
    } else {
      walletsCall.importMnemonic(p)
    }
  }, [type, name, password, imported])

  const disableNext = !verifyWalletSubmission({ name, password, confirmPassword })

  return (
    <Stack verticalFill verticalAlign="center" horizontalAlign="stretch" tokens={{ childrenGap: 15 }}>
      <Text variant="xxLargePlus">{t(message)}</Text>
      {submissionInputs.map(input => (
        <div key={input.key}>
          <Label required>{t(`wizard.${input.label}`)}</Label>
          <TextField
            autoFocus={input.autoFocus}
            type={input.type}
            value={state[input.key]}
            onChange={onChange(input.key)}
            description={t(input.hint || '')}
          />
        </div>
      ))}

      <Stack horizontal horizontalAlign="end" tokens={{ childrenGap: BUTTON_GAP }}>
        <DefaultButton onClick={history.goBack} text={t('wizard.back')} />
        <PrimaryButton onClick={onNext} disabled={disableNext} text={t('wizard.next')} />
      </Stack>
    </Stack>
  )
}

Submission.displayName = 'Submission'

const elements = [
  {
    path: WalletWizardPath.Welcome,
    comp: Welcome,
  },
  {
    path: WalletWizardPath.Mnemonic,
    params: '/:type',
    comp: Mnemonic,
  },
  {
    path: WalletWizardPath.Submission,
    params: '/:type',
    comp: Submission,
  },
]

export default withWizard(elements, initState)
