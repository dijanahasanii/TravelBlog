/**
 * Cloudinary direct browser upload utility
 *
 * Setup (one-time, free):
 *  1. Sign up at https://cloudinary.com (free tier is generous)
 *  2. Go to Settings → Upload → Upload presets → Add preset
 *  3. Set "Signing mode" = "Unsigned"
 *  4. Copy the preset name and your Cloud Name
 *  5. Create a .env file (or .env.local) in /frontend with:
 *       REACT_APP_CLOUDINARY_CLOUD_NAME=your_cloud_name
 *       REACT_APP_CLOUDINARY_UPLOAD_PRESET=your_preset_name
 *
 * Until configured, the utility falls back to the base64 data URI
 * (same as before) so nothing breaks.
 */

const CLOUD_NAME    = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET
const UPLOAD_URL    = CLOUD_NAME
  ? `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`
  : null

export const cloudinaryEnabled = Boolean(CLOUD_NAME && UPLOAD_PRESET)

/**
 * Upload a data URI or File/Blob to Cloudinary.
 * Returns the secure_url string on success, or throws on failure.
 *
 * @param {string|File|Blob} source  – base64 data URI or File object
 * @param {string} folder            – optional Cloudinary folder (e.g. 'posts' | 'avatars')
 * @returns {Promise<string>}        – CDN URL
 */
export async function uploadToCloudinary(source, folder = 'posts') {
  if (!cloudinaryEnabled) {
    // No Cloudinary config — return the data URI as-is (backward compat)
    if (typeof source === 'string') return source
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target.result)
      reader.readAsDataURL(source)
    })
  }

  const formData = new FormData()
  formData.append('upload_preset', UPLOAD_PRESET)
  formData.append('folder', `wandr/${folder}`)

  if (typeof source === 'string' && source.startsWith('data:')) {
    // Convert base64 data URI to a Blob
    const res   = await fetch(source)
    const blob  = await res.blob()
    formData.append('file', blob)
  } else {
    formData.append('file', source)
  }

  const res = await fetch(UPLOAD_URL, { method: 'POST', body: formData })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || 'Cloudinary upload failed')
  }
  const data = await res.json()
  return data.secure_url
}

/**
 * Upload multiple images (data URIs or Files) in parallel.
 * Returns array of CDN URLs (or original data URIs if Cloudinary not configured).
 */
export async function uploadManyToCloudinary(sources, folder = 'posts') {
  return Promise.all(sources.map((s) => uploadToCloudinary(s, folder)))
}
