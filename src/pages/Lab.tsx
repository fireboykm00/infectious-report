import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { usePendingLabCases, useCreateLabResult } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function Lab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCase, setSelectedCase] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [testType, setTestType] = useState('');
  const [result, setResult] = useState<'positive' | 'negative' | 'inconclusive'>('positive');
  const [notes, setNotes] = useState('');

  const { data: pendingCases = [], isLoading } = usePendingLabCases();
  const createLabResult = useCreateLabResult();

  const handleSubmitResult = async () => {
    if (!selectedCase || !testType) {
      toast.error('Please fill in all required fields');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('You must be logged in');
      return;
    }

    try {
      await createLabResult.mutateAsync({
        case_report_id: selectedCase,
        test_type: testType,
        result: result,
        test_date: new Date().toISOString(),
        lab_technician_id: user.id,
        notes: notes || undefined,
      });

      toast.success('Lab result submitted successfully!');
      setDialogOpen(false);
      setSelectedCase(null);
      setTestType('');
      setResult('positive');
      setNotes('');
    } catch (error: any) {
      console.error('Error submitting lab result:', error);
      toast.error(error?.message || 'Failed to submit lab result');
    }
  };

  const filteredCases = pendingCases.filter(caseReport => 
    caseReport.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    caseReport.disease_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    caseReport.location_detail?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Laboratory Results Management</span>
            <Badge variant="secondary">{filteredCases.length} Pending Cases</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Input
              placeholder="Search by Case ID, Disease, or Location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Case ID</TableHead>
                  <TableHead>Disease</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Symptoms</TableHead>
                  <TableHead>Report Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No pending cases found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCases.map((caseReport) => (
                    <TableRow key={caseReport.id}>
                      <TableCell className="font-mono text-xs">
                        {caseReport.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">{caseReport.disease_code}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={caseReport.status === 'pending_lab' ? 'default' : 'secondary'}>
                          {caseReport.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {caseReport.location_detail || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {caseReport.symptoms && Array.isArray(caseReport.symptoms) ? (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {caseReport.symptoms.slice(0, 2).map((symptom, idx) => (
                              <span key={idx} className="px-2 py-0.5 text-xs bg-muted rounded">
                                {symptom}
                              </span>
                            ))}
                            {caseReport.symptoms.length > 2 && (
                              <span className="text-xs text-muted-foreground">
                                +{caseReport.symptoms.length - 2} more
                              </span>
                            )}
                          </div>
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(caseReport.report_date), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <Dialog open={dialogOpen && selectedCase === caseReport.id} onOpenChange={(open) => {
                          setDialogOpen(open);
                          if (!open) setSelectedCase(null);
                        }}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedCase(caseReport.id)}
                            >
                              Add Result
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Submit Lab Result</DialogTitle>
                              <DialogDescription>
                                Add test results for case {caseReport.disease_code}
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label htmlFor="testType">Test Type *</Label>
                                <Input
                                  id="testType"
                                  placeholder="e.g., PCR Test, Blood Culture, Rapid Test"
                                  value={testType}
                                  onChange={(e) => setTestType(e.target.value)}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="result">Result *</Label>
                                <Select value={result} onValueChange={(value: any) => setResult(value)}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="positive">Positive</SelectItem>
                                    <SelectItem value="negative">Negative</SelectItem>
                                    <SelectItem value="inconclusive">Inconclusive</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="notes">Notes (Optional)</Label>
                                <Textarea
                                  id="notes"
                                  placeholder="Additional observations or comments..."
                                  value={notes}
                                  onChange={(e) => setNotes(e.target.value)}
                                  rows={3}
                                />
                              </div>
                            </div>

                            <DialogFooter>
                              <Button 
                                variant="outline" 
                                onClick={() => {
                                  setDialogOpen(false);
                                  setSelectedCase(null);
                                }}
                              >
                                Cancel
                              </Button>
                              <Button 
                                onClick={handleSubmitResult}
                                disabled={createLabResult.isPending}
                              >
                                {createLabResult.isPending && (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Submit Result
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}