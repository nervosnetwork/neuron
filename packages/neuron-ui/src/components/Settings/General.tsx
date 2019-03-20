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
      <ItemPanel>{t('settings.general.photosetting')}</ItemPanel>
      <ItemPanel>{t('settings.general.passwordsetting')}</ItemPanel>
      <ItemPanel>{t('settings.general.languagesetting')}</ItemPanel>
      <ItemPanel>{t('settings.general.aboutneuron')}</ItemPanel>
      <ItemPanel>{t('settings.general.contactus')}</ItemPanel>
    </ContentPanel>
  )
}

export default General
