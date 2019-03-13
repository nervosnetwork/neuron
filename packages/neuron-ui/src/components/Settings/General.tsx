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
      <ItemPanel>{t('Photo Setting')}</ItemPanel>
      <ItemPanel>{t('Password Setting')}</ItemPanel>
      <ItemPanel>{t('Language Setting')}</ItemPanel>
      <ItemPanel>{t('About Neuron')}</ItemPanel>
      <ItemPanel>{t('Contact Us')}</ItemPanel>
    </ContentPanel>
  )
}

export default General
