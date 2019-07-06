import styled from 'styled-components'

const ScreenButtonRow = styled.div`
  display: flex;
  padding-top: 30px;
  justify-content: space-between;
`

const RightScreenButtonRow = styled(ScreenButtonRow)`
  justify-content: flex-end;

  button {
    margin-left: 20px;
  }
`

export { RightScreenButtonRow }
export default ScreenButtonRow
