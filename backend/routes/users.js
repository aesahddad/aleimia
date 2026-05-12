const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const { protect, admin, hasPerm } = require('../middleware/auth');
const { validate, userUpdateSchema } = require('../middleware/validator');

router.use(protect);

router.get('/', hasPerm('users.manage'), (req, res) => UserController.getAll(req, res));
router.put('/:id/role', admin, validate(userUpdateSchema), (req, res) => UserController.updateRole(req, res));
router.put('/:id/permissions', admin, validate(userUpdateSchema), (req, res) => UserController.updatePermissions(req, res));
router.put('/:id/status', admin, validate(userUpdateSchema), (req, res) => UserController.updateStatus(req, res));
router.put('/:id', admin, validate(userUpdateSchema), (req, res) => UserController.update(req, res));
router.delete('/:id', admin, (req, res) => UserController.delete(req, res));

module.exports = router;
