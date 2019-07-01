import styled from 'styled-components'

const ScreenButtonRow = styled.div`
  display: flex;
  padding-top: 30px;
  justify-content: space-between;
`

const LeftScreenButtonRow = styled(ScreenButtonRow)`
  justify-content: flex-start;

  button {
    margin-right: 20px;
  }
`

const RightScreenButtonRow = styled(ScreenButtonRow)`
  justify-content: flex-end;

  button {
    margin-left: 20px;
  }
`

export { LeftScreenButtonRow, RightScreenButtonRow }
export default ScreenButtonRow
