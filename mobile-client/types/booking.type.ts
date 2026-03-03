export type TimeSlot = {
  id: string
  time: string
  available: boolean
}

export type VisitorInfo = {
  name: string
  phone: string
  email?: string
  count: number
}
