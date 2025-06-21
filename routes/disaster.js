import disaster from "../controllers/disaster.js";
import express from 'express';
const app = express();
app.post('/disasters', disaster.createDisaster);
app.get('/disasters', disaster.getDisasters);
app.put('/disasters/:id', disaster.updateDisaster);
app.delete('/disasters/:id', disaster.deleteDisaster);
export default app;