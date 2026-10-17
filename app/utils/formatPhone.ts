export const formatPhone = (value: string) => {
  let cleaned = value.replace(/\D/g, '')
  if (cleaned.length > 11) cleaned = cleaned.slice(0, 11)

  if (cleaned.startsWith('8') && cleaned.length === 11) {
    cleaned = '7' + cleaned.slice(1)
  }

  if (cleaned.length === 0) return ''

  let result = '+7'
  if (cleaned.length > 1) {
    result += ` (${cleaned.slice(1, 4)}`
  }
  if (cleaned.length >= 4) {
    result += `) ${cleaned.slice(4, 7)}`
  }
  if (cleaned.length >= 7) {
    result += `-${cleaned.slice(7, 9)}`
  }
  if (cleaned.length >= 9) {
    result += `-${cleaned.slice(9, 11)}`
  }
  return result
}
