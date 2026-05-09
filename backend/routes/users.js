const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const { protect, admin, adminOrHasPerm } = require('../middleware/auth');

router.use(protect);

router.get('/', adminOrHasPerm, (req, res) => UserController.getAll(req, res));
router.put('/:id/role', admin, (req, res) => UserController.updateRole(req, res));
router.put('/:id/permissions', admin, (req, res) => UserController.updatePermissions(req, res));
router.put('/:id/status', admin, (req, res) => UserController.updateStatus(req, res));
router.delete('/:id', admin, (req, res) => UserController.delete(req, res));

module.exports = router;
