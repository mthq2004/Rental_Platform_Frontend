import { FormErrors } from '../components/booking/VisitorInfoForm'

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/
  return phoneRegex.test(phone)
}

export const validateEmail = (email: string): boolean => {
  if (!email) return true
  return /\S+@\S+\.\S+/.test(email)
}

export type ValidateFormParams = {
  visitorName: string
  visitorPhone: string
  visitorEmail: string
  selectedTimeSlot: string | null
  selectedDate: Date
}

export type ValidateFormResult = {
  isValid: boolean
  errors: FormErrors
  errorMessage?: string
}

export const validateBookingForm = ({
  visitorName,
  visitorPhone,
  visitorEmail,
  selectedTimeSlot,
  selectedDate
}: ValidateFormParams): ValidateFormResult => {
  let isValid = true
  const errors: FormErrors = { name: '', phone: '', email: '' }
  let errorMessage: string | undefined

  // Validate name
  if (!visitorName.trim()) {
    errors.name = 'Vui lòng nhập họ tên'
    isValid = false
  } else if (visitorName.trim().length < 2) {
    errors.name = 'Họ tên quá ngắn'
    isValid = false
  }

  // Validate phone
  if (!visitorPhone.trim()) {
    errors.phone = 'Vui lòng nhập số điện thoại'
    isValid = false
  } else if (!validatePhone(visitorPhone)) {
    errors.phone = 'Số điện thoại không đúng định dạng'
    isValid = false
  }

  // Validate email
  if (visitorEmail && !validateEmail(visitorEmail)) {
    errors.email = 'Email không hợp lệ'
    isValid = false
  }

  // Validate time slot
  if (!selectedTimeSlot) {
    errorMessage = 'Vui lòng chọn khung giờ'
    isValid = false
  }

  // Validate date is not in the past
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const selected = new Date(selectedDate)
  selected.setHours(0, 0, 0, 0)

  if (selected < now) {
    errorMessage = 'Không thể đặt lịch trong quá khứ'
    isValid = false
  }

  return { isValid, errors, errorMessage }
}

export const formatDate = (date: Date): string => {
  const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
  const day = days[date.getDay()]
  const dateNum = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${day}, ${dateNum}/${month}/${year}`
}