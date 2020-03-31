const express = require('express')
const router = express.Router()
const eventController = require('../controllers/event')
const auth = require('../middleware/auth')
// CREATE A POST
router.post(
  '/',
  eventController.createEvent
)

router.post(
  '/event_update/:id',
  auth,
  eventController.updateEvent
)
router.post(
  '/:id/event_rsvp/:event_id',
  auth,
  eventController.rsvpOfEvent
)
router.get(
  '/geteventbyId/:id',
  auth,
  eventController.GetEventById
)

router.get(
  '/getallEvent',
  auth,
  eventController.GetAllEvent
)
router.delete(
  '/deleteEventById/:id',
  auth,
  eventController.deleteEventById
)
router.delete(
  '/deleteAllEvent',
  auth,
  eventController.deleteAllEvent
)

module.exports = router
