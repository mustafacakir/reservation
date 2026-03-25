export interface AvailableSlot {
  startUtc: string
  endUtc: string
  startLocal: string
  endLocal: string
}

export interface WeeklySlot {
  id?: string
  dayOfWeek: number // 0=Sunday ... 6=Saturday
  startTime: string // HH:mm
  endTime: string
}
