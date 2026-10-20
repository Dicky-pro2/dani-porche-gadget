export function validateRegistrationInput(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Invalid registration request.')
  }
  const data = value as Record<string, unknown>
  if (Object.keys(data).some((key) => key !== 'email' && key !== 'password')) {
    throw new Error('Invalid registration request.')
  }
  if (typeof data.email !== 'string' || typeof data.password !== 'string') {
    throw new Error('Invalid registration request.')
  }
  const email = data.email.trim()
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Invalid registration request.')
  }
  if (data.password.length < 8 || data.password.length > 1024) {
    throw new Error('Invalid registration request.')
  }
  return { email, password: data.password }
}
