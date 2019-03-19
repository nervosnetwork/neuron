import React from 'react'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'

const ContentPanel = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: left;
  margin: 30px;
`

const ItemPanel = styled.li`
  margin-top: 30px;
`

const General = () => {
  const [t] = useTranslation()
  return (
    <ContentPanel>
      <ItemPanel>{t('Settings.General.PhotoSetting')}</ItemPanel>
      <ItemPanel>{t('Settings.General.PasswordSetting')}</ItemPanel>
      <ItemPanel>{t('Settings.General.LanguageSetting')}</ItemPanel>
      <ItemPanel>{t('Settings.General.AboutNeuron')}</ItemPanel>
      <ItemPanel>{t('Settings.General.ContactUs')}</ItemPanel>
    </ContentPanel>
  )
}

export default General
