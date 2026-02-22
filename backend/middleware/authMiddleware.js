const jwt = require('jsonwebtoken')

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1] // Format: Bearer <token>

  if (!token)
    return res.status(401).json({ error: 'Access denied. No token provided.' })

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' })
    req.user = user // contains decoded user data (e.g., user.id)
    next()
  })
}

module.exports = authenticateToken
