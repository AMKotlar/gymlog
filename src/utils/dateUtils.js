export function formatDateKey(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function localDateKey() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function localDayStartUTC(dateValue) {
  const date = dateValue ? new Date(dateValue) : new Date()
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString()
}

export function localDayEndUTC(dateValue) {
  const date = dateValue ? new Date(dateValue) : new Date()
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).toISOString()
}

export function localDateKeyFromISO(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
