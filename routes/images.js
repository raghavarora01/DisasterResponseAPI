import { verifyDisasterImage } from '../controllers/imageController.js'; // Fixed path
import express from 'express';
const router = express.Router();

// POST /api/disasters/:id/verify-image         

router.post('/disasters/:id/verify-image', verifyDisasterImage);
export default router;
