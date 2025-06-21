import express from 'express';
import geocodeController from '../controllers/geocode.js';

const app = express();

app.post('/geocode', geocodeController.geocodeHandler);

export default app;
