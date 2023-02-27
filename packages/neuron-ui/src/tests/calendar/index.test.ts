import {
  isDayInRange,
  isMonthInRange,
  isYearInRange,
  isDateEqual,
  getMonthCalendar,
} from '../../widgets/Calendar/utils'

describe('Check day in range', () => {
  it('check no restrictions', () => {
    expect(isDayInRange(new Date(2023, 1, 1), {})).toBe(true)
  })
  it('check minDate', () => {
    expect(isDayInRange(new Date(2023, 1, 1), { minDate: new Date(2023, 1, 1) })).toBe(true)
    expect(isDayInRange(new Date(2023, 1, 1), { minDate: new Date(2023, 1, 1, 12) })).toBe(true)
    expect(isDayInRange(new Date(2023, 1, 1), { minDate: new Date(2023, 1, 2) })).toBe(false)
  })
  it('check maxDate', () => {
    expect(isDayInRange(new Date(2023, 1, 2), { maxDate: new Date(2023, 1, 2) })).toBe(true)
    expect(isDayInRange(new Date(2023, 1, 2), { maxDate: new Date(2023, 1, 1) })).toBe(false)
    expect(isDayInRange(new Date(2023, 1, 2), { maxDate: new Date(2023, 1, 1, 12) })).toBe(false)
  })
})

describe('Check month in range', () => {
  it('check no restrictions', () => {
    expect(isMonthInRange(2023, 1, {})).toBe(true)
  })
  it('check minDate', () => {
    expect(isMonthInRange(2023, 1, { minDate: new Date(2023, 1, 1) })).toBe(false)
    expect(isMonthInRange(2023, 1, { minDate: new Date(2023, 0, 31) })).toBe(true)
  })
  it('check maxDate', () => {
    expect(isMonthInRange(2023, 2, { maxDate: new Date(2023, 1, 1) })).toBe(true)
    expect(isMonthInRange(2023, 2, { maxDate: new Date(2023, 0, 31) })).toBe(false)
  })
})

describe('Check year in range', () => {
  it('check no restrictions', () => {
    expect(isYearInRange(2023, {})).toBe(true)
  })
  it('check minDate', () => {
    expect(isYearInRange(2023, { minDate: new Date(2023, 1, 1) })).toBe(true)
    expect(isYearInRange(2023, { minDate: new Date(2024, 1, 1) })).toBe(false)
    expect(isYearInRange(2023, { minDate: new Date(2022, 1, 1) })).toBe(true)
  })
  it('check maxDate', () => {
    expect(isYearInRange(2023, { maxDate: new Date(2023, 1, 1) })).toBe(true)
    expect(isYearInRange(2023, { maxDate: new Date(2024, 1, 1) })).toBe(true)
    expect(isYearInRange(2023, { maxDate: new Date(2022, 1, 1) })).toBe(false)
  })
})

describe('Check date equal', () => {
  it('undefined in one side', () => {
    expect(isDateEqual(new Date(2023, 2, 1), undefined)).toBe(false)
    expect(isDateEqual(undefined, new Date(2023, 2, 1))).toBe(false)
  })
  it('check date equal', () => {
    expect(isDateEqual(new Date(2023, 2, 1), new Date(2023, 2, 1))).toBe(true)
  })
  it('check date equal ignore time', () => {
    expect(isDateEqual(new Date(2023, 2, 1, 12), new Date(2023, 2, 1, 18))).toBe(true)
  })
})

describe('Generate monthly calendar data', () => {
  it('Test month calendar output', () => {
    expect(getMonthCalendar(2023, 1).map(week => week.map(date => `${date.year}/${date.month}/${date.date}`))).toEqual([
      ['2023/1/1', '2023/1/2', '2023/1/3', '2023/1/4', '2023/1/5', '2023/1/6', '2023/1/7'],
      ['2023/1/8', '2023/1/9', '2023/1/10', '2023/1/11', '2023/1/12', '2023/1/13', '2023/1/14'],
      ['2023/1/15', '2023/1/16', '2023/1/17', '2023/1/18', '2023/1/19', '2023/1/20', '2023/1/21'],
      ['2023/1/22', '2023/1/23', '2023/1/24', '2023/1/25', '2023/1/26', '2023/1/27', '2023/1/28'],
      ['2023/1/29', '2023/1/30', '2023/1/31', '2023/2/1', '2023/2/2', '2023/2/3', '2023/2/4'],
      ['2023/2/5', '2023/2/6', '2023/2/7', '2023/2/8', '2023/2/9', '2023/2/10', '2023/2/11'],
    ])
  })

  it('Test month canlendar with specified start weekday', () => {
    expect(
      getMonthCalendar(2023, 1, 1).map(week => week.map(date => `${date.year}/${date.month}/${date.date}`))
    ).toEqual([
      ['2022/12/26', '2022/12/27', '2022/12/28', '2022/12/29', '2022/12/30', '2022/12/31', '2023/1/1'],
      ['2023/1/2', '2023/1/3', '2023/1/4', '2023/1/5', '2023/1/6', '2023/1/7', '2023/1/8'],
      ['2023/1/9', '2023/1/10', '2023/1/11', '2023/1/12', '2023/1/13', '2023/1/14', '2023/1/15'],
      ['2023/1/16', '2023/1/17', '2023/1/18', '2023/1/19', '2023/1/20', '2023/1/21', '2023/1/22'],
      ['2023/1/23', '2023/1/24', '2023/1/25', '2023/1/26', '2023/1/27', '2023/1/28', '2023/1/29'],
      ['2023/1/30', '2023/1/31', '2023/2/1', '2023/2/2', '2023/2/3', '2023/2/4', '2023/2/5'],
    ])
  })
})
