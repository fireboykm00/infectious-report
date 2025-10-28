import { notificationQueue, reportProcessingQueue } from '../jobs/queues';
import * as api from '../integrations/supabase/api';
import type { CaseReport, Notification } from '../integrations/supabase/types';

export class CaseReportService {
  static async submit(data: any) {
    // 1. Save to Supabase
    const report = await api.createCaseReport(data);

    // 2. Queue for processing
    await reportProcessingQueue.add('process-report', {
      reportId: report.id,
      data: report
    });

    // 3. Queue notification
    await notificationQueue.add('report-submitted', {
      type: 'email',
      recipient: data.reported_by,
      message: `Case report ${report.id} has been submitted successfully.`
    });

    return report;
  }

  static async updateStatus(reportId: string, status: CaseReport['status']) {
    // 1. Update status in Supabase
    await api.updateCaseReportStatus(reportId, status);

    // 2. Queue notification
    await notificationQueue.add('status-update', {
      type: 'email',
      reportId,
      status
    });
  }

  static async attachLabResult(reportId: string, labData: any) {
    // 1. Create lab result
    const labResult = await api.createLabResult({
      case_report_id: reportId,
      ...labData
    });

    // 2. Update case report
    await api.updateCaseReport(reportId, {
      lab_result_id: labResult.id,
      status: 'confirmed'
    });

    // 3. Queue notification
    await notificationQueue.add('lab-result-added', {
      type: 'email',
      reportId,
      labResultId: labResult.id
    });

    return labResult;
  }
}

export class NotificationService {
  static async send(notification: Omit<Notification, 'id' | 'created_at'>) {
    // 1. Save to Supabase
    const saved = await api.createNotification(notification);

    // 2. Queue for sending
    await notificationQueue.add('send-notification', {
      id: saved.id,
      ...notification
    });

    return saved;
  }

  static async markAsSent(id: string) {
    return api.updateNotification(id, {
      status: 'sent',
      sent_at: new Date().toISOString()
    });
  }
}