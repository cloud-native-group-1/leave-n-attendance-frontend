import api from "@/lib/api"

export interface Holiday {
  id: number
  name: string
  date: string
  description?: string
}

/**
 * Fetches upcoming holidays
 * @param limit Number of holidays to fetch
 * @returns Array of upcoming holidays
 */
export async function getUpcomingHolidays(limit: number = 5): Promise<Holiday[]> {
  try {
    const response = await api.get<{ holidays: Holiday[] }>("/holidays/upcoming", {
      params: { limit }
    })
    return response.data.holidays
  } catch (error) {
    console.error("Failed to fetch upcoming holidays:", error)
    
    // Return mock data for now
    return getMockHolidays()
  }
}

/**
 * Fetches all holidays for a given year
 * @param year Year to fetch holidays for
 * @returns Array of holidays for the year
 */
export async function getHolidaysForYear(year: number): Promise<Holiday[]> {
  try {
    const response = await api.get<{ holidays: Holiday[] }>("/holidays", {
      params: { year }
    })
    return response.data.holidays
  } catch (error) {
    console.error("Failed to fetch holidays for year:", error)
    
    // Return mock data for now
    return getMockHolidaysForYear(year)
  }
}

/**
 * Check if a date is a weekend (Saturday or Sunday)
 * @param date Date to check
 * @returns True if the date is a weekend
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6 // Sunday = 0, Saturday = 6
}

/**
 * Check if a date is a holiday
 * @param date Date to check
 * @param holidays Array of holidays to check against
 * @returns True if the date is a holiday
 */
export function isHoliday(date: Date, holidays: Holiday[]): boolean {
  const dateString = date.toISOString().split('T')[0] // YYYY-MM-DD format
  return holidays.some(holiday => holiday.date === dateString)
}

/**
 * Check if a date is a weekend or holiday
 * @param date Date to check
 * @param holidays Array of holidays to check against
 * @returns Object with boolean flags and details
 */
export function isWeekendOrHoliday(date: Date, holidays: Holiday[]): {
  isWeekendOrHoliday: boolean
  isWeekend: boolean
  isHoliday: boolean
  holidayName?: string
} {
  const weekend = isWeekend(date)
  const holiday = isHoliday(date, holidays)
  const holidayInfo = holiday ? holidays.find(h => h.date === date.toISOString().split('T')[0]) : undefined
  
  return {
    isWeekendOrHoliday: weekend || holiday,
    isWeekend: weekend,
    isHoliday: holiday,
    holidayName: holidayInfo?.name
  }
}

/**
 * Get all weekend and holiday dates in a date range
 * @param startDate Start date of the range
 * @param endDate End date of the range
 * @param holidays Array of holidays to check against
 * @returns Array of dates that are weekends or holidays
 */
export function getWeekendAndHolidayDatesInRange(
  startDate: Date, 
  endDate: Date, 
  holidays: Holiday[]
): Array<{ date: Date; isWeekend: boolean; isHoliday: boolean; holidayName?: string }> {
  const dates: Array<{ date: Date; isWeekend: boolean; isHoliday: boolean; holidayName?: string }> = []
  const currentDate = new Date(startDate)
  
  while (currentDate <= endDate) {
    const result = isWeekendOrHoliday(currentDate, holidays)
    if (result.isWeekendOrHoliday) {
      dates.push({
        date: new Date(currentDate),
        isWeekend: result.isWeekend,
        isHoliday: result.isHoliday,
        holidayName: result.holidayName
      })
    }
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  return dates
}

/**
 * Returns mock holiday data (will be replaced by actual API later)
 */
function getMockHolidays(): Holiday[] {
  const today = new Date()
  const year = today.getFullYear()
  
  return [
    {
      id: 1,
      name: "中秋節",
      date: `${year}-09-17`,
      description: "中秋節是傳統的團圓佳節"
    },
    {
      id: 2,
      name: "國慶日",
      date: `${year}-10-10`,
      description: "中華民國國慶日"
    },
    {
      id: 3,
      name: "聖誕節",
      date: `${year}-12-25`,
      description: "聖誕節假期"
    },
    {
      id: 4, 
      name: "元旦",
      date: `${year + 1}-01-01`,
      description: "新年第一天"
    },
    {
      id: 5,
      name: "農曆新年",
      date: `${year + 1}-02-10`,
      description: "農曆新年假期"
    }
  ]
}

/**
 * Returns mock holiday data for a specific year
 */
function getMockHolidaysForYear(year: number): Holiday[] {
  return [
    {
      id: 1,
      name: "元旦",
      date: `${year}-01-01`,
      description: "新年第一天"
    },
    {
      id: 2,
      name: "農曆新年",
      date: `${year}-02-10`,
      description: "農曆新年假期"
    },
    {
      id: 3,
      name: "農曆新年",
      date: `${year}-02-11`,
      description: "農曆新年假期"
    },
    {
      id: 4,
      name: "農曆新年",
      date: `${year}-02-12`,
      description: "農曆新年假期"
    },
    {
      id: 5,
      name: "兒童節",
      date: `${year}-04-04`,
      description: "兒童節"
    },
    {
      id: 6,
      name: "清明節",
      date: `${year}-04-05`,
      description: "清明節"
    },
    {
      id: 7,
      name: "勞動節",
      date: `${year}-05-01`,
      description: "勞動節"
    },
    {
      id: 8,
      name: "端午節",
      date: `${year}-06-22`,
      description: "端午節"
    },
    {
      id: 9,
      name: "中秋節",
      date: `${year}-09-17`,
      description: "中秋節是傳統的團圓佳節"
    },
    {
      id: 10,
      name: "國慶日",
      date: `${year}-10-10`,
      description: "中華民國國慶日"
    },
    {
      id: 11,
      name: "聖誕節",
      date: `${year}-12-25`,
      description: "聖誕節假期"
    }
  ]
} 