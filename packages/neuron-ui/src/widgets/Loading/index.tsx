import styled, { keyframes } from 'styled-components'

const rotate = keyframes`
  from{
    transform: rotate(0);
  }
  to{
    transform: rotate(360deg);
  }
`
export const Spinner = styled.div<{
  frontColor?: string
  backgroundColor?: string
  size?: string
  bandSize?: string
}>`
  margin: 0 auto;
  width: ${props => props.size || '20px'};
  height: ${props => props.size || '20px'};
  border-radius: 50%;
  border-style: solid;
  border-width: ${props => props.bandSize || '3px'};
  border-top-color: ${props => props.frontColor || '#fff'};
  border-right-color: ${props => props.frontColor || '#fff'};
  border-bottom-color: ${props => props.frontColor || 'rgba(255, 255, 255, 0.5)'};
  border-left-color: ${props => props.frontColor || 'rgba(255, 255, 255, 0.5)'};
  animation: ${rotate} 1s linear infinite;
`

export default {
  Spinner,
}
