import { supabase } from "@/integrations/supabase/client";
import { offlineDb, OfflineCaseReport } from "./offlineDb";
import { toast } from "sonner";

export const syncOfflineReports = async (userId: string) => {
  try {
    const pendingReports = await offlineDb.caseReports
      .where('syncStatus')
      .equals('pending')
      .toArray();

    if (pendingReports.length === 0) {
      return { success: true, synced: 0 };
    }

    let syncedCount = 0;
    let failedCount = 0;

    for (const report of pendingReports) {
      try {
        // Update status to syncing
        await offlineDb.caseReports.update(report.id!, { syncStatus: 'syncing' });

        // Check if already synced (deduplication)
        const { data: existing } = await supabase
          .from('case_reports')
          .select('id')
          .eq('client_local_id', report.clientLocalId)
          .maybeSingle();

        if (existing) {
          // Already synced, mark as synced
          await offlineDb.caseReports.update(report.id!, { syncStatus: 'synced' });
          syncedCount++;
          continue;
        }

        // Get facilities and districts for mapping
        const { data: facilities } = await supabase
          .from('facilities')
          .select('id, name')
          .eq('name', report.facility)
          .maybeSingle();

        const { data: districts } = await supabase
          .from('districts')
          .select('id, name')
          .eq('name', report.district)
          .maybeSingle();

        // Insert to database
        const { error } = await supabase
          .from('case_reports')
          .insert({
            reporter_id: userId,
            facility_id: facilities?.id,
            district_id: districts?.id,
            disease_code: report.diseaseCode,
            age_group: report.ageGroup,
            gender: report.gender,
            symptoms: report.symptoms,
            notes: report.notes,
            client_local_id: report.clientLocalId,
            report_date: report.reportDate,
            sync_status: 'synced',
          });

        if (error) throw error;

        // Mark as synced
        await offlineDb.caseReports.update(report.id!, { syncStatus: 'synced' });
        syncedCount++;
      } catch (error: any) {
        console.error('Failed to sync report:', error);
        await offlineDb.caseReports.update(report.id!, {
          syncStatus: 'failed',
          syncError: error.message,
        });
        failedCount++;
      }
    }

    if (syncedCount > 0) {
      toast.success(`Synced ${syncedCount} offline reports`);
    }
    if (failedCount > 0) {
      toast.error(`Failed to sync ${failedCount} reports`);
    }

    return { success: true, synced: syncedCount, failed: failedCount };
  } catch (error) {
    console.error('Sync error:', error);
    return { success: false, error };
  }
};