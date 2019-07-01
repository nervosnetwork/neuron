import React from 'react'
import { PrimaryButton } from 'office-ui-fabric-react'
import styled from 'styled-components'

const ContentPanel = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: left;
  margin: 30px;
`

const General = () => {
  return (
    <ContentPanel>
      <PrimaryButton data-automation-id="test" disabled={false} checked={false} allowDisabledFocus>
        This is a temporary button
      </PrimaryButton>
    </ContentPanel>
  )
}

export default General
