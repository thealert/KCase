import getQueryString from '@/utils/getCookies'

const getCookies = getQueryString.getCookie

export function buildAuthHeaders(extraHeaders = {}) {
  const headers = { ...extraHeaders }
  const username = getCookies('username')

  if (username) {
    headers.Username = username
  }

  return headers
}
