import {
  isDayInRange,
  isMonthInRange,
  isYearInRange,
  isDateEqual,
  getMonthCalendar,
  getLocalMonthNames,
  getLocalMonthShortNames,
  getLocalWeekNames,
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

describe('Get Local Month Short Names', () => {
  it('Chinese', () => {
    const names = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
    expect(getLocalMonthShortNames('zh')).toEqual(names)
  })

  it('English', () => {
    const names = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May.', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.']
    expect(getLocalMonthShortNames('en')).toEqual(names)
  })
})

describe('Get Local Month Names', () => {
  it('Chinese', () => {
    const names = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
    expect(getLocalMonthNames('zh')).toEqual(names)
  })

  it('English', () => {
    const names = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ]
    expect(getLocalMonthNames('en')).toEqual(names)
  })
})

describe('Get Local Week Names', () => {
  it('Chinese', () => {
    const names = ['日', '一', '二', '三', '四', '五', '六']
    expect(getLocalWeekNames('zh')).toEqual(names)
  })

  it('English', () => {
    const names = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
    expect(getLocalWeekNames('en')).toEqual(names)
  })

  it('Traditional Chinese', () => {
    const names = ['日', '一', '二', '三', '四', '五', '六']
    expect(getLocalWeekNames('zh-TW')).toEqual(names)
  })

  it('Japanese', () => {
    const names = ['日', '月', '火', '水', '木', '金', '土']
    expect(getLocalWeekNames('ja')).toEqual(names)
  })
})
