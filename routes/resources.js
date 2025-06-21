import express from 'express';
import { 
  getNearbyResources,
  createResource,
  getAllResources
} from '../controllers/resourcesController.js';

const router = express.Router();

// GET /api/resources - Get all resources
router.get('/', getAllResources);

// POST /api/resources - Create a new resource
router.post('/', createResource);

// GET /api/disasters/:id/resources?lat=...&lon=... - Get nearby resources for a disaster
router.get('/disasters/:id/resources', getNearbyResources);

export default router;
