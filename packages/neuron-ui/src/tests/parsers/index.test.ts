import { describe, it, expect } from '@jest/globals'
import { listParams, epochParser, toUint128Le } from 'utils/parsers'

describe('listParams', () => {
  it('should have default pageNo = 1 and pageSize = 15', () => {
    const fixture = {
      params: '?keywords=foo',
      expected: {
        pageNo: 1,
        pageSize: 15,
        keywords: 'foo',
        sort: '',
        direction: '',
      },
    }
    expect(listParams(fixture.params)).toEqual(fixture.expected)
  })

  it('should use passed pageNo and pageSize', () => {
    const fixture = {
      params: '?keywords=foo&pageNo=2&pageSize=30',
      expected: {
        pageNo: 2,
        pageSize: 30,
        keywords: 'foo',
        sort: '',
        direction: '',
      },
    }
    expect(listParams(fixture.params)).toEqual(fixture.expected)
  })

  it('should use passed sort and direction', () => {
    const fixture = {
      params: '?sort=foo&direction=asc',
      expected: {
        pageNo: 1,
        pageSize: 15,
        keywords: '',
        sort: 'foo',
        direction: 'asc',
      },
    }
    expect(listParams(fixture.params)).toEqual(fixture.expected)
  })
})

describe('epochParser', () => {
  it('should have float number in value if length is not 0', () => {
    const fixture = {
      params: '0x1e00017000090',
      expected: {
        value: 144.04792,
        index: BigInt('0x17'),
        length: BigInt('0x1e0'),
        number: BigInt('0x90'),
      },
    }
    const res = epochParser(fixture.params)
    expect(+res.value.toFixed(5)).toEqual(fixture.expected.value)
    expect(res.index).toEqual(fixture.expected.index)
    expect(res.length).toEqual(fixture.expected.length)
    expect(res.number).toEqual(fixture.expected.number)
  })

  it('should not have float number in value if length is 0', () => {
    const fixture = {
      params: '0x2000000010000200',
      expected: {
        value: +'0x200',
        index: BigInt('0x10'),
        length: BigInt('0x0'),
        number: BigInt('0x200'),
      },
    }

    const res = epochParser(fixture.params)
    expect(res.value).toEqual(fixture.expected.value)
    expect(res.index).toEqual(fixture.expected.index)
    expect(res.length).toEqual(fixture.expected.length)
    expect(res.number).toEqual(fixture.expected.number)
  })

  it('should handle int string', () => {
    const fixture = {
      params: (+'0x1e00017000090').toString(),
      expected: {
        value: 144.04792,
        index: BigInt('0x17'),
        length: BigInt('0x1e0'),
        number: BigInt('0x90'),
      },
    }
    const res = epochParser(fixture.params)
    expect(+res.value.toFixed(5)).toEqual(fixture.expected.value)
    expect(res.index).toEqual(fixture.expected.index)
    expect(res.length).toEqual(fixture.expected.length)
    expect(res.number).toEqual(fixture.expected.number)
  })
})

describe('toUint128Le', () => {
  it('should parse 16 bytes', () => {
    const fixture = {
      params: '0x000010632d5ec76b0500000000000000',
      expected: '0x00000000000000056bc75e2d63100000',
    }
    expect(toUint128Le(fixture.params)).toEqual(fixture.expected)
  })

  it('should pad 0 if bytes are not enough', () => {
    const fixture = {
      params: '0x000010632d5ec76b05',
      expected: '0x00000000000000056bc75e2d63100000',
    }
    expect(toUint128Le(fixture.params)).toEqual(fixture.expected)
  })

  it('should ignore overflowed bytes', () => {
    const fixture = {
      params: '0x000010632d5ec76b0500000000000000b0',
      expected: '0x00000000000000056bc75e2d63100000',
    }
    expect(toUint128Le(fixture.params)).toEqual(fixture.expected)
  })

  it('should throw an error if params is not a hex string', () => {
    expect(() => toUint128Le('0')).toThrowError()
  })
})
