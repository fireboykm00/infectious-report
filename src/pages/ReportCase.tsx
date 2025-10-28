import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, ArrowLeft, Loader2, Upload, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useDiseaseCodes } from "@/hooks/useDiseaseCodes";
import { useDistricts } from "@/hooks/useLocation";
import { useCreateCaseReport } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import type { CaseReportInput } from "@/lib/types";

const AGE_GROUPS = [
  "0-5",
  "6-17",
  "18-49",
  "50-64",
  "65+"
] as const;

const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" }
] as const;

const ReportCase = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: diseases, isLoading: diseasesLoading } = useDiseaseCodes();
  const { data: districts, isLoading: districtsLoading } = useDistricts();
  
  const createCase = useCreateCaseReport();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  const [formData, setFormData] = useState<Omit<CaseReportInput, 'id' | 'report_date' | 'reporter_id'>>({
    disease_code: "",
    symptoms: "",
    age_group: "18-49",
    gender: "male",
    facility_id: "",
    notes: "",
    status: "suspected",  // Valid enum value - case starts as suspected
    sync_status: "pending",
    client_local_id: crypto.randomUUID(),
    location_detail: "",
    attachments: [],
  });

  const [facilityName, setFacilityName] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Validation
    if (!formData.disease_code) {
      toast.error("Please select a disease");
      return;
    }
    if (!selectedDistrict) {
      toast.error("Please select a district");
      return;
    }
    if (!facilityName.trim()) {
      toast.error("Please enter a facility name");
      return;
    }
    if (!formData.location_detail.trim()) {
      toast.error("Please enter location detail");
      return;
    }
    if (!formData.symptoms.trim()) {
      toast.error("Please describe the symptoms");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to submit a case report.");
        return;
      }

      setIsSubmitting(true);

      // Handle file uploads first
      let attachmentUrls: string[] = [];
      if (selectedFiles.length > 0) {
        toast.info("Uploading attachments...");
        
        for (const file of selectedFiles) {
          const filePath = `case-reports/${user.id}/${crypto.randomUUID()}-${file.name}`;
          
          try {
            const { error: uploadError } = await supabase.storage
              .from('attachments')
              .upload(filePath, file);

            if (uploadError) {
              console.error("Upload error:", uploadError);
              
              // Check if it's a bucket not found error
              if (uploadError.message.includes("Bucket not found") || uploadError.message.includes("bucket")) {
                toast.error("Storage is not set up. Please ask your administrator to create the 'attachments' bucket in Supabase Storage.");
                throw new Error("Storage bucket 'attachments' does not exist. Please contact your administrator.");
              }
              
              throw new Error(`Failed to upload file ${file.name}: ${uploadError.message}`);
            }

            attachmentUrls.push(filePath);
          } catch (err: any) {
            console.error("File upload error:", err);
            throw err;
          }
        }
      }

      // Submit case report with attachment URLs
      // Note: district_id and reporter_id columns don't exist in case_reports table
      // Store district info in location_detail, reporter info in notes
      const districtData = districts?.find(d => d.id === selectedDistrict);
      const districtName = districtData?.name || selectedDistrict;
      
      const facilityNote = `Facility: ${facilityName}`;
      const reporterNote = `Reporter: ${user.email || user.id}`;
      const districtNote = `District: ${districtName}`;
      const locationWithDistrict = `${districtNote}, ${formData.location_detail}`;
      
      const metadataNotes = `${facilityNote}\n${reporterNote}`;
      const combinedNotes = formData.notes 
        ? `${metadataNotes}\n\n${formData.notes}` 
        : metadataNotes;
      
      // Convert symptoms string to array (database expects text[])
      // Split by comma, newline, or semicolon and clean up
      const symptomsArray = formData.symptoms
        .split(/[,;\n]+/)
        .map(s => s.trim())
        .filter(s => s.length > 0);
      
      const caseData = {
        disease_code: formData.disease_code,
        symptoms: symptomsArray.length > 0 ? symptomsArray : [formData.symptoms.trim()],
        age_group: formData.age_group,
        gender: formData.gender,
        facility_id: null, // Column expects UUID, storing name in notes instead
        notes: combinedNotes,
        status: formData.status,
        sync_status: formData.sync_status,
        client_local_id: formData.client_local_id,
        location_detail: locationWithDistrict,
        attachments: attachmentUrls,
        report_date: new Date().toISOString(),
        // NOT including reporter_id - column doesn't exist in actual DB
      };

      console.log("Submitting case data:", caseData);

      await createCase.mutateAsync(caseData);

      toast.success("Case report submitted successfully!");
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Submission error:", error);
      toast.error(error?.message || "Failed to submit case report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Activity className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Report New Case</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Card className="p-8 shadow-card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Disease Selection */}
            <div className="space-y-2">
              <Label htmlFor="disease">Disease / Condition *</Label>
              <Select 
                value={formData.disease_code} 
                onValueChange={(value) => setFormData({ ...formData, disease_code: value })}
                disabled={diseasesLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={diseasesLoading ? "Loading..." : "Select disease"} />
                </SelectTrigger>
                <SelectContent>
                  {diseases?.map((disease) => (
                    <SelectItem key={disease.code} value={disease.code}>
                      {disease.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location and District */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="district">District *</Label>
                <Select 
                  value={selectedDistrict} 
                  onValueChange={(value) => setSelectedDistrict(value)}
                  disabled={districtsLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={districtsLoading ? "Loading..." : "Select district"} />
                  </SelectTrigger>
                  <SelectContent>
                    {districts?.map((district) => (
                      <SelectItem key={district.id} value={district.id}>
                        {district.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="locationDetail">Location Detail *</Label>
                <Input
                  id="locationDetail"
                  placeholder="Sector/cell/village"
                  value={formData.location_detail}
                  onChange={(e) => setFormData({ ...formData, location_detail: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Facility */}
            <div className="space-y-2">
              <Label htmlFor="facility">Reporting Facility *</Label>
              <Input
                id="facility"
                placeholder="Enter facility name"
                value={facilityName}
                onChange={(e) => setFacilityName(e.target.value)}
                required
              />
            </div>

            {/* Patient Demographics */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ageGroup">Age Group *</Label>
                <Select 
                  value={formData.age_group} 
                  onValueChange={(value) => setFormData({ ...formData, age_group: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select age group" />
                  </SelectTrigger>
                  <SelectContent>
                    {AGE_GROUPS.map((group) => (
                      <SelectItem key={group} value={group}>
                        {group} years
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender *</Label>
                <Select 
                  value={formData.gender} 
                  onValueChange={(value) => setFormData({ ...formData, gender: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENDERS.map((gender) => (
                      <SelectItem key={gender.value} value={gender.value}>
                        {gender.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Symptoms */}
            <div className="space-y-2">
              <Label htmlFor="symptoms">Symptoms *</Label>
              <Textarea
                id="symptoms"
                placeholder="Describe observed symptoms (e.g., fever, cough, rash...)"
                value={formData.symptoms}
                onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                required
                rows={4}
              />
            </div>

            {/* Additional Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any additional information, travel history, contacts..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label>Attachments (Optional)</Label>
              <div 
                className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer relative"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const files = Array.from(e.dataTransfer.files);
                  const validFiles = files.filter(file => {
                    const isValid = file.size <= 10 * 1024 * 1024;
                    if (!isValid) {
                      toast.error(`File ${file.name} is too large (max 10MB)`);
                    }
                    return isValid;
                  });
                  setSelectedFiles(prev => [...prev, ...validFiles]);
                }}
              >
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    const validFiles = files.filter(file => {
                      const isValid = file.size <= 10 * 1024 * 1024;
                      if (!isValid) {
                        toast.error(`File ${file.name} is too large (max 10MB)`);
                      }
                      return isValid;
                    });
                    setSelectedFiles(prev => [...prev, ...validFiles]);
                  }}
                />
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Images, PDFs, or documents (Max 10MB)
                </p>
              </div>

              {/* Selected Files */}
              {selectedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium truncate max-w-[200px]">
                          {file.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({(file.size / 1024 / 1024).toFixed(1)} MB)
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedFiles(files => files.filter((_, i) => i !== index));
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {selectedFiles.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => setSelectedFiles([])}
                    >
                      Clear All
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button 
                type="submit" 
                className="flex-1" 
                disabled={isSubmitting || createCase.isPending}
              >
                {(isSubmitting || createCase.isPending) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Report"
                )}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate("/dashboard")}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
};

export default ReportCase;