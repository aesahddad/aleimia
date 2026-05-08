const express = require('express');
const router = express.Router();
const SubscriptionController = require('../controllers/SubscriptionController');
const { protect, admin } = require('../middleware/auth');

router.get('/plans', (req, res) => SubscriptionController.getPlans(req, res));
router.post('/plans/seed', (req, res) => SubscriptionController.seedPlans(req, res));

router.get('/admin/plans', protect, admin, (req, res) => SubscriptionController.getAllPlans(req, res));
router.post('/admin/plans', protect, admin, (req, res) => SubscriptionController.createPlan(req, res));
router.put('/admin/plans/:id', protect, admin, (req, res) => SubscriptionController.updatePlan(req, res));
router.delete('/admin/plans/:id', protect, admin, (req, res) => SubscriptionController.deletePlan(req, res));

router.get('/my', protect, (req, res) => SubscriptionController.getUserSubscription(req, res));
router.post('/', protect, (req, res) => SubscriptionController.subscribe(req, res));

module.exports = router;
