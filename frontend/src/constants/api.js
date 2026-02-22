/**
 * Central API base URLs.
 * In development these fall back to localhost.
 * In production set the REACT_APP_* env vars to your deployed service URLs.
 */
export const USER_SERVICE    = process.env.REACT_APP_USER_SERVICE_URL    || 'http://localhost:5004'
export const CONTENT_SERVICE = process.env.REACT_APP_CONTENT_SERVICE_URL || 'http://localhost:5002'
export const NOTIF_SERVICE   = process.env.REACT_APP_NOTIF_SERVICE_URL   || 'http://localhost:5006'
