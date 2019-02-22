import React from 'react'
import { Button, Box, Grommet, Text } from 'grommet'
import styled from 'styled-components'

interface TablePaginationProps {
  page: number
  pageSize: number
  total: number
  onChange: (page: number) => void
}

const Theme = {
  button: {
    border: {
      radius: '0px',
      color: 'light-2',
    },
    primary: {
      color: 'light-2',
    },
    color: 'dark-2',
  },
}

const Content = styled.div`
  height: 36px;
  background: gray;
  align-items: center;
`

const Separator = styled.div`
  width: 44px;
`

const TablePagination = (props: TablePaginationProps) => {
  const { page, pageSize, total, onChange } = props
  const displayCount = 5
  const totalPage = Math.ceil(total / pageSize)

  let pages: number[] = []
  if (totalPage <= displayCount) {
    for (let i = 0; i < totalPage; i += 1) {
      pages.push(i)
    }
  } else {
    let idx = page
    if (idx < 2) {
      idx = 2
    } else if (idx >= totalPage - 2) {
      idx = totalPage - 1 - 2
    }
    pages = [-2, -1, 0, 1, 2].map(i => i + idx)
  }

  const changePage = (idx: number) => {
    if (page !== idx && idx >= 0 && idx < totalPage) {
      onChange(idx)
    }
  }

  return (
    <Content>
      <Grommet theme={Theme}>
        <Box wrap direction="row-responsive" background="light-1">
          <Box justify="center" align="baseline">
            <Text textAlign="center" alignSelf="center">
              {`PageSize: ${pageSize} Total: ${total}`}
            </Text>
          </Box>
          <Separator />
          <Button label="<<" color={page === 0 ? 'light-3' : 'light-2'} onClick={() => changePage(0)} primary />
          <Button label="<" color={page === 0 ? 'light-3' : 'light-2'} onClick={() => changePage(page - 1)} primary />
          {pages.map(idx => (
            <Button
              label={(idx + 1).toString()}
              color={idx === page ? 'light-6' : 'light-2'}
              onClick={() => changePage(idx)}
              primary
            />
          ))}
          <Button
            label=">"
            color={page + 1 === totalPage ? 'light-3' : 'light-2'}
            onClick={() => changePage(page + 1)}
            primary
          />
          <Button
            label=">>"
            color={page + 1 === totalPage ? 'light-3' : 'light-2'}
            onClick={() => changePage(totalPage - 1)}
            primary
          />
        </Box>
      </Grommet>
    </Content>
  )
}

export default TablePagination
