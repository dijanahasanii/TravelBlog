/**
 * Safely parse a fetch Response: check ok, parse JSON without throwing.
 * Use for critical flows to avoid crashes on non-JSON or error responses.
 * @param {Response} res - fetch Response
 * @returns {Promise<{ ok: boolean, data: any, error: string | null }>}
 */
export async function parseResponse(res) {
  const text = await res.text()
  let data = null
  try {
    data = text.length ? JSON.parse(text) : null
  } catch (_) {
    // non-JSON body (e.g. HTML error page)
  }
  return {
    ok: res.ok,
    data,
    error: res.ok ? null : (data?.message || data?.error || `Request failed (${res.status})`),
  }
}
