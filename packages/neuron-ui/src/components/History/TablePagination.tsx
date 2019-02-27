import React from 'react'
import { Pagination } from 'react-bootstrap'

interface TablePaginationProps {
  page: number
  pageSize: number
  total: number
  onChange: (page: number) => void
}

const TablePagination = ({ total, page, pageSize, onChange }: TablePaginationProps) => (
  <Pagination>
    <Pagination.First />
    <Pagination.Prev />
    {Array.from({
      length: Math.round(total / pageSize),
    }).map((_value: any, pageNo: number) => {
      return (
        <Pagination.Item key={Math.random()} active={pageNo === page} onClick={() => onChange(pageNo)}>
          {pageNo + 1}
        </Pagination.Item>
      )
    })}

    <Pagination.Next />
    <Pagination.Last />
  </Pagination>
)

export default TablePagination
