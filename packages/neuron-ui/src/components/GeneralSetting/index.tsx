import React from 'react'
import styled from 'styled-components'

const ContentPanel = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: left;
  margin: 30px;
`

const GeneralSetting = () => {
  return <ContentPanel />
}

GeneralSetting.displayName = 'GeneralSetting'

export default GeneralSetting
