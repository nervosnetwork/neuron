const fixtures = {
  'Should return true when last version is null': {
    params: {
      lastVersion: null,
      targetVersion: 0.32,
    },
    expected: true,
  },
  'Should return true when last version is not a number': {
    params: {
      lastVersion: NaN,
      targetVersion: 0.32,
    },
    expected: true,
  },
  'Should return false when last version > target version': {
    params: {
      lastVersion: 0.32,
      targetVersion: 0.31,
    },
    expected: false,
  },
  'Should return false when last version = target version': {
    params: {
      lastVersion: 0.32,
      targetVersion: 0.32,
    },
    expected: false,
  },
  'Should return true when last version < target version': {
    params: {
      lastVersion: 0.32,
      targetVersion: 0.33,
    },
    expected: true,
  },
}

export default fixtures
