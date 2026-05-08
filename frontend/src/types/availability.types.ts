export interface AvailableSlot {
  startUtc: string
  endUtc: string
  startLocal: string
  endLocal: string
  isGroup: boolean
  maxParticipants: number | null
  currentParticipants: number
  isFull: boolean
}

export interface WeeklySlot {
  id?: string
  dayOfWeek: number // 0=Sunday ... 6=Saturday
  startTime: string // HH:mm
  endTime: string
}
