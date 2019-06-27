import React from 'react'
import { Row, Col, Table as BsTable } from 'react-bootstrap'

import Pagination from './Pagination'

interface TableHeader {
  label: string
  key: string
}

interface TableItem {
  key: string
  [index: string]: any
}

interface Table {
  headers: TableHeader[]
  items: TableItem[]
  pageNo: number
  pageSize: number
  totalCount: number
  onPageChange: Function
  tableAttrs?: { [index: string]: boolean }
  onContextMenu?: Function
}

export default ({
  headers,
  items,
  pageNo,
  pageSize = 15,
  totalCount,
  onPageChange,
  tableAttrs = {
    striped: true,
    bordered: true,
  },
  onContextMenu,
}: Table) => (
  <>
    <BsTable {...tableAttrs}>
      <thead>
        <tr>
          {headers.map(col => (
            <th key={col.key}>{col.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {items.map(item => (
          <tr key={item.key} onContextMenu={onContextMenu && onContextMenu(item.key)}>
            {headers.map(header => (
              <td key={header.key}>{item[header.key]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </BsTable>
    {totalCount <= pageSize ? null : (
      <Row>
        <Col>
          <Pagination
            currentPage={pageNo}
            pageSize={pageSize}
            total={totalCount}
            onChange={page => onPageChange(page, pageSize)}
          />
        </Col>
      </Row>
    )}
  </>
)
