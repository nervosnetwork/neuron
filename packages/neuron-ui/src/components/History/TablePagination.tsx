import React from 'react'
import { Pagination } from 'react-bootstrap'

interface TablePaginationProps {
  currentPage: number
  pageSize: number
  total: number
  displayCount?: number
  onChange: (page: number) => void
}

const PageNos = ({
  currentPage,
  pageNos,
  pageCount,
  onChange,
}: {
  currentPage: number
  pageNos: number[]
  pageCount: number
  onChange: (pageNo: number) => void
}) => (
  <Pagination>
    <Pagination.First onClick={() => onChange(0)} />
    <Pagination.Prev disabled={currentPage === 0} onClick={() => onChange(currentPage - 1)} />
    {pageNos.map(pageNo => {
      if (pageNo < 0) {
        return <Pagination.Ellipsis disabled />
      }
      return (
        <Pagination.Item key={Math.random()} active={pageNo === currentPage} onClick={() => onChange(pageNo)}>
          {pageNo + 1}
        </Pagination.Item>
      )
    })}
    <Pagination.Next disabled={currentPage === pageCount - 1} onClick={() => onChange(currentPage + 1)} />
    <Pagination.Last onClick={() => onChange(pageCount - 1)} />
  </Pagination>
)

const TablePagination = ({ total, currentPage, pageSize, displayCount = 5, onChange }: TablePaginationProps) => {
  const pageCount = Math.ceil(total / pageSize)
  const pageNos: number[] = []
  const range = Math.round((displayCount - 1) / 2)
  if (pageCount <= displayCount) {
    for (let i = 0; i < pageCount; i++) {
      pageNos.push(i)
    }
  } else if (currentPage <= range) {
    for (let i = 0; i < displayCount; i++) {
      pageNos.push(i)
    }
  } else if (currentPage >= pageCount - range) {
    for (let i = pageCount - displayCount; i < pageCount; i++) {
      pageNos.push(i)
    }
  } else {
    pageNos.push(-1)
    for (let i = currentPage - range; i <= range + currentPage; i++) {
      pageNos.push(i)
    }
    pageNos.push(-1)
  }

  return <PageNos currentPage={currentPage} pageNos={pageNos} pageCount={pageCount} onChange={onChange} />
}

export default TablePagination
