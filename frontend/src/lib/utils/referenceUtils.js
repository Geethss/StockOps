// Generate reference numbers like WH/IN/0001
export const generateReference = (prefix, id) => {
  const paddedId = String(id).padStart(4, '0')
  return `${prefix}/${paddedId}`
}

// Parse reference number
export const parseReference = (reference) => {
  const parts = reference.split('/')
  return {
    prefix: parts[0],
    type: parts[1],
    id: parseInt(parts[2]),
  }
}

