import React from 'react'
import {
  Stack,
  Dialog,
  TextField,
  Slider,
  Text,
  DefaultButton,
  PrimaryButton,
  DialogType,
  DialogFooter,
  Spinner,
  SpinnerSize,
} from 'office-ui-fabric-react'
import { useTranslation } from 'react-i18next'
import { SHANNON_CKB_RATIO } from 'utils/const'

const DepositDialog = ({
  show,
  value,
  fee,
  balance,
  onChange,
  onSlide,
  onSubmit,
  onDismiss,
  isDepositing,
  errorMessage,
}: any) => {
  const [t] = useTranslation()
  const maxValue = +(BigInt(balance) / BigInt(SHANNON_CKB_RATIO)).toString()

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
            {t('nervos-dao.deposit-terms')
              .split('\n')
              .map(term => (
                <Text as="p" key={term}>
                  {term}
                </Text>
              ))}
          </Stack>
          <DialogFooter>
            <DefaultButton onClick={onDismiss} text={t('nervos-dao.cancel')} />
            <PrimaryButton onClick={onSubmit} text={t('nervos-dao.proceed')} disabled={errorMessage} />
          </DialogFooter>
        </>
      )}
    </Dialog>
  )
}

DepositDialog.displayName = 'DepositDialog'

export default DepositDialog
