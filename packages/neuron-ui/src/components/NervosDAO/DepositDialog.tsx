import React, { useMemo } from 'react'
import {
  Stack,
  Dialog,
  TextField,
  Slider,
  Text,
  DefaultButton,
  PrimaryButton,
  ActionButton,
  DialogType,
  DialogFooter,
  Spinner,
  SpinnerSize,
} from 'office-ui-fabric-react'
import { useTranslation, Trans } from 'react-i18next'
import { SHANNON_CKB_RATIO, NERVOS_DAO_RFC_URL } from 'utils/const'
import { openExternal } from 'services/remote'

interface DepositDialogProps {
  show: boolean
  value: any
  fee: string
  onDismiss: any
  onChange: any
  onSubmit: any
  onSlide: any
  maxDepositAmount: bigint
  isDepositing: boolean
  errorMessage: string
}

const DepositDialog = ({
  show,
  value,
  fee,
  maxDepositAmount,
  onChange,
  onSlide,
  onSubmit,
  onDismiss,
  isDepositing,
  errorMessage,
}: DepositDialogProps) => {
  const [t] = useTranslation()
  const rfcLink = useMemo(
    () => (
      <ActionButton
        styles={{
          root: {
            height: 20,
            margin: 0,
            padding: 0,
            textDecoration: 'underline',
            fontSize: 14,
            color: 'rgb(0, 120, 212)',
          },
          label: {
            margin: 0,
          },
        }}
        onClick={() => openExternal(NERVOS_DAO_RFC_URL)}
        ariaLabel="Nervos DAO RFC"
      />
    ),
    []
  )
  const maxValue = +(maxDepositAmount / BigInt(SHANNON_CKB_RATIO)).toString()

  if (!show) {
    return null
  }

  return (
    <Dialog
      hidden={false}
      onDismiss={onDismiss}
      dialogContentProps={{
        type: DialogType.close,
        title: t('nervos-dao.deposit-to-nervos-dao'),
      }}
      modalProps={{
        isBlocking: false,
        styles: { main: { maxWidth: '500px!important' } },
      }}
    >
      {isDepositing ? (
        <Spinner size={SpinnerSize.large} />
      ) : (
        <>
          <TextField label={t('nervos-dao.deposit')} value={value} onChange={onChange} suffix="CKB" />
          <Slider value={value} min={0} max={maxValue} step={1} showValue={false} onChange={onSlide} />
          <Text as="p" variant="small" block>
            {`${t('nervos-dao.fee')}: ${fee}`}
          </Text>
          <Text as="span" variant="tiny" block styles={{ root: { color: 'red' } }}>
            {errorMessage}
          </Text>
          <Stack>
            <Text as="h2" variant="large">
              {`${t('nervos-dao.notice')}:`}
            </Text>
            <Text as="p">
              <Trans i18nKey="nervos-dao.deposit-terms" components={[rfcLink]} />
            </Text>
          </Stack>
          <DialogFooter>
            <DefaultButton onClick={onDismiss} text={t('nervos-dao.cancel')} />
            <PrimaryButton onClick={onSubmit} text={t('nervos-dao.proceed')} disabled={!!errorMessage} />
          </DialogFooter>
        </>
      )}
    </Dialog>
  )
}

DepositDialog.displayName = 'DepositDialog'

export default DepositDialog
