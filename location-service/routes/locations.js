const express = require('express')
const router = express.Router()
const {
  getLocations,
  addLocation,
} = require('../controllers/locationController')

router.get('/', getLocations)
router.post('/', addLocation)

module.exports = router
