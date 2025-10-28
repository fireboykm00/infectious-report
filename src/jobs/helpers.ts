import { Queue } from 'bullmq';
import { notificationQueue, reportProcessingQueue } from './queues';

// Types for job data
export interface NotificationJob {
  type: 'email' | 'sms';
  recipient: string;
  message: string;
}

export interface ReportProcessingJob {
  reportId: string;
  data: any;
}

// Helper functions to add jobs to queues
export const queueNotification = async (data: NotificationJob) => {
  await notificationQueue.add('send-notification', data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  });
};

export const queueReportProcessing = async (data: ReportProcessingJob) => {
  await reportProcessingQueue.add('process-report', data, {
    attempts: 2,
    backoff: {
      type: 'fixed',
      delay: 5000,
    },
  });
};

// Queue status helper
export const getQueueStatus = async () => {
  const [notificationCount, reportCount] = await Promise.all([
    notificationQueue.getJobCounts(),
    reportProcessingQueue.getJobCounts(),
  ]);

  return {
    notifications: notificationCount,
    reports: reportCount,
  };
};