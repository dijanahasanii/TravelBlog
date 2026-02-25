/**
 * fetch with a timeout. Aborts the request after ms.
 * @param {string} url
 * @param {RequestInit & { timeout?: number }} options - fetch options; timeout defaults to 10000 (10s)
 * @returns {Promise<Response>}
 */
export function fetchWithTimeout(url, options = {}) {
  const { timeout = 10000, ...fetchOptions } = options
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)
  return fetch(url, { ...fetchOptions, signal: controller.signal }).finally(() => clearTimeout(id))
}
