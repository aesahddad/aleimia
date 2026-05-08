const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const { protect, admin } = require('../middleware/auth');

router.use(protect, admin);

router.get('/', (req, res) => UserController.getAll(req, res));
router.put('/:id/role', (req, res) => UserController.updateRole(req, res));
router.put('/:id/status', (req, res) => UserController.updateStatus(req, res));
router.delete('/:id', (req, res) => UserController.delete(req, res));

module.exports = router;
