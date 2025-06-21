import express from 'express';
import {getSocialMediaReports, updateReport}  from '../controllers/socialmediaController.js';

const router = express.Router();

// GET /api/disasters/:id/social
router.get('/disasters/:id/social', getSocialMediaReports);
router.put('/reports/:id', updateReport);

export default router;
