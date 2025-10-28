import { Queue, Worker, Job } from 'bullmq';
import { createClient } from '@supabase/supabase-js';

const REDIS_CONFIG = {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
};

// Queue definitions
export const notificationQueue = new Queue('notifications', REDIS_CONFIG);
export const reportProcessingQueue = new Queue('report-processing', REDIS_CONFIG);

// Notification worker
const notificationWorker = new Worker('notifications', async (job: Job) => {
  const { type, recipient, message } = job.data;
  
  // Example: Send notification based on type (email, SMS, etc.)
  switch (type) {
    case 'email':
      // Implement email sending logic
      console.log(`Sending email to ${recipient}: ${message}`);
      break;
    case 'sms':
      // Implement SMS sending logic
      console.log(`Sending SMS to ${recipient}: ${message}`);
      break;
    default:
      throw new Error(`Unknown notification type: ${type}`);
  }
}, REDIS_CONFIG);

// Report processing worker
const reportProcessingWorker = new Worker('report-processing', async (job: Job) => {
  const { reportId, data } = job.data;
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
  );

  try {
    // Process report data
    await supabase
      .from('case_reports')
      .update({ status: 'processed', processed_data: data })
      .eq('id', reportId);

    // Add to notification queue
    await notificationQueue.add('report-processed', {
      type: 'email',
      recipient: data.submitterEmail,
      message: `Report ${reportId} has been processed successfully.`
    });
  } catch (error) {
    console.error('Error processing report:', error);
    throw error;
  }
}, REDIS_CONFIG);

// Error handlers
notificationWorker.on('failed', (job: Job | undefined, error: Error) => {
  console.error(`Notification job ${job?.id} failed:`, error);
});

reportProcessingWorker.on('failed', (job: Job | undefined, error: Error) => {
  console.error(`Report processing job ${job?.id} failed:`, error);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await notificationWorker.close();
  await reportProcessingWorker.close();
});