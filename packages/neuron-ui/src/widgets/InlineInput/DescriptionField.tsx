import styled from 'styled-components'

const DescriptionField = styled.input`
  padding: 0 5px;
  background: transparent;
  border: none;
  &:focus {
    box-shadow: inset 0px 0px 8px rgba(0, 0, 0, 0.3);
  }
`
export default DescriptionField
