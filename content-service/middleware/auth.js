const jwt = require('jsonwebtoken')

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  if (!authHeader) return res.status(401).json({ message: 'No token provided' })

  const token = authHeader.split(' ')[1]
  if (!token) return res.status(403).json({ message: 'Token missing' })

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    console.log('🧾 Decoded JWT payload:', decoded)

    req.user = { id: decoded.id } // ✅ FIXED: use decoded.id
    console.log('✅ Decoded userId from token:', decoded.id)

    next()
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' })
  }
}

module.exports = verifyToken
