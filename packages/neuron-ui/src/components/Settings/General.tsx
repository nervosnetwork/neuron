import React from 'react'
import styled from 'styled-components'

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
  return (
    <ContentPanel>
      <ItemPanel>Photo Setting</ItemPanel>
      <ItemPanel>Password Setting</ItemPanel>
      <ItemPanel>Language Setting</ItemPanel>
      <ItemPanel>About Neuron</ItemPanel>
      <ItemPanel>Contact Us</ItemPanel>
    </ContentPanel>
  )
}

export default General
