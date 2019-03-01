import React from 'react'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import { Languages } from '../../utils/const'

const languages = [
  {
    label: 'English',
    lng: Languages.EN,
  },
  {
    label: '中文',
    lng: Languages.ZH,
  },
]

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
  const [, i18n] = useTranslation()

  const changeLanguage = (lng: Languages) => () => {
    i18n.changeLanguage(lng)
  }

  return (
    <ContentPanel>
      <ItemPanel>Photo Setting</ItemPanel>
      <ItemPanel>Password Setting</ItemPanel>
      <ItemPanel>Language Setting</ItemPanel>
      <ItemPanel>About Neuron</ItemPanel>
      <ItemPanel>Contact Us</ItemPanel>
      <ItemPanel>
        Language Switch:
        {languages.map(language => {
          return (
            <button type="button" key={language.lng} onClick={changeLanguage(language.lng)}>
              {language.label}
            </button>
          )
        })}
      </ItemPanel>
    </ContentPanel>
  )
}

export default General
