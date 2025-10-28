import express from 'express';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { notificationQueue, reportProcessingQueue } from './queues';

const app = express();

// Create Bull Board
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [
    new BullMQAdapter(notificationQueue),
    new BullMQAdapter(reportProcessingQueue),
  ],
  serverAdapter,
});

// Mount the UI
app.use('/admin/queues', serverAdapter.getRouter());

// Basic security middleware
app.use('/admin/queues', (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader === `Bearer ${process.env.ADMIN_TOKEN}`) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

const PORT = process.env.QUEUE_MONITOR_PORT || 3001;
app.listen(PORT, () => {
  console.log(`Queue monitor running on port ${PORT}`);
});