const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings_controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', settingsController.getSettings);
router.put('/', settingsController.updateSettings);
router.post('/reset', settingsController.resetSettings);

module.exports = router;
