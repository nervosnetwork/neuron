const fixtures = {
  'should show nothing when count = 0': {
    params: {
      pageNo: 0,
      count: 0,
    },
    expected: [],
  },
  'should show all pages when count <= 5': {
    params: {
      pageNo: 4,
      count: 4,
    },
    expected: [1, 2, 3, 4],
  },
  'should show first 5 pages when pageNo <= 3': {
    params: {
      pageNo: 3,
      count: 100,
    },
    expected: [1, 2, 3, 4, 5],
  },
  'should show 5 pages around pageNo when pageNo = 4': {
    params: {
      pageNo: 4,
      count: 100,
    },
    expected: [2, 3, 4, 5, 6],
  },
  'should show last 5 pages when pageNo > count - 3': {
    params: {
      pageNo: 98,
      count: 100,
    },
    expected: [96, 97, 98, 99, 100],
  },
  'should show 5 pages around pageNo when pageNo = count - 3': {
    params: {
      pageNo: 97,
      count: 100,
    },
    expected: [95, 96, 97, 98, 99],
  },
  'should show 5 pages around pageNo when pageNo > 5 and pageNo < count - 4': {
    params: {
      pageNo: 30,
      count: 100,
    },
    expected: [28, 29, 30, 31, 32],
  },
}

export default fixtures
