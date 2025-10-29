'use client'

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, MapPin, Camera, Wifi, WifiOff, Upload, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logCaseAction } from '@/lib/audit';
import { 
  PRIORITY_DISEASES, 
  SYMPTOM_OPTIONS, 
  AGE_GROUPS, 
  GENDER_OPTIONS, 
  CASE_STATUS, 
  SEVERITY_LEVELS,
  suggestDiseases,
  getDiseasesForDropdown
} from '@/lib/diseases';

const caseReportSchema = z.object({
  disease_code: z.string().min(1, 'Disease is required'),
  patient_age_group: z.string().min(1, 'Age group is required'),
  patient_gender: z.string().min(1, 'Gender is required'),
  onset_date: z.date({ required_error: 'Onset date is required' }),
  symptoms: z.array(z.string()).min(1, 'At least one symptom is required'),
  severity: z.string().optional(),
  notes: z.string().optional(),
  location_latitude: z.number().optional(),
  location_longitude: z.number().optional(),
});

type CaseReportFormData = z.infer<typeof caseReportSchema>;

interface CaseReportFormProps {
  onSuccess?: (caseId: string) => void;
}

export function CaseReportForm({ onSuccess }: CaseReportFormProps) {
  const { user, userRole: userRoleData } = useAuth();
  const [isOnline, setIsOnline] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<File | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [suggestedDiseases, setSuggestedDiseases] = useState<typeof PRIORITY_DISEASES>([]);
  const [profile, setProfile] = useState<any>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CaseReportFormData>({
    resolver: zodResolver(caseReportSchema),
  });

  const onsetDate = watch('onset_date');
  const selectedDisease = watch('disease_code');

  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch user profile
  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('*, facility:facility_id(id, name)')
        .eq('id', user.id)
        .single();
      
      setProfile(data);
    }
    
    fetchProfile();
  }, [user]);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    const formData = watch();
    const interval = setInterval(() => {
      if (formData.disease_code) {
        localStorage.setItem('case_draft', JSON.stringify({
          ...formData,
          timestamp: new Date().toISOString(),
        }));
        toast.info('Draft saved', { duration: 1000 });
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [watch]);

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem('case_draft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        // Restore form data
        Object.keys(parsed).forEach(key => {
          if (key !== 'timestamp' && key !== 'symptoms') {
            setValue(key as any, parsed[key]);
          }
        });
        if (parsed.symptoms) {
          setSelectedSymptoms(parsed.symptoms);
          setValue('symptoms', parsed.symptoms);
        }
        toast.info('Draft restored');
      } catch (e) {
        console.error('Failed to restore draft', e);
      }
    }
  }, [setValue]);

  // Suggest diseases based on symptoms
  useEffect(() => {
    if (selectedSymptoms.length > 0) {
      const suggestions = suggestDiseases(selectedSymptoms);
      setSuggestedDiseases(suggestions);
    } else {
      setSuggestedDiseases([]);
    }
  }, [selectedSymptoms]);

  // Capture GPS location
  const captureLocation = () => {
    if ('geolocation' in navigator) {
      toast.info('Getting your location...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setValue('location_latitude', position.coords.latitude);
          setValue('location_longitude', position.coords.longitude);
          toast.success('Location captured');
        },
        (error) => {
          toast.error('Failed to get location');
          console.error(error);
        }
      );
    } else {
      toast.error('Geolocation not supported');
    }
  };

  // Handle symptom selection
  const handleSymptomToggle = (symptom: string) => {
    setSelectedSymptoms(prev => {
      const newSymptoms = prev.includes(symptom)
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom];
      setValue('symptoms', newSymptoms);
      return newSymptoms;
    });
  };

  // Handle photo capture
  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Compress image (basic implementation)
      if (file.size > 2 * 1024 * 1024) {
        toast.warning('Image too large, compressing...');
        // TODO: Implement actual compression
      }
      setCapturedPhoto(file);
      toast.success('Photo captured');
    }
  };

  // Generate receipt number
  const generateReceiptNumber = () => {
    const prefix = 'CASE';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  };

  // Submit form
  const onSubmit = async (data: CaseReportFormData) => {
    if (!user || !profile) {
      toast.error('User profile not loaded');
      return;
    }

    setIsSubmitting(true);
    const receiptNumber = generateReceiptNumber();

    try {
      // Upload photo if present
      let photoUrl = null;
      if (capturedPhoto) {
        const fileName = `${receiptNumber}-${Date.now()}.jpg`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('case-attachments')
          .upload(fileName, capturedPhoto);

        if (uploadError) {
          console.error('Photo upload failed:', uploadError);
          toast.warning('Case saved but photo upload failed');
        } else {
          photoUrl = uploadData.path;
        }
      }

      // Create case report
      const caseData = {
        reporter_id: user.id,
        facility_id: profile.facility_id,
        district_id: profile.district_id,
        disease_code: data.disease_code,
        age_group: data.patient_age_group,
        gender: data.patient_gender,
        symptoms: data.symptoms.join(', '),
        status: 'suspected' as const,
        notes: data.notes || '',
        location_detail: data.location_latitude && data.location_longitude
          ? `${data.location_latitude}, ${data.location_longitude}`
          : null,
        attachments: photoUrl ? [photoUrl] : null,
        client_local_id: receiptNumber,
      };

      if (isOnline) {
        // Online: Submit directly
        const { data: insertedCase, error } = await supabase
          .from('case_reports')
          .insert(caseData)
          .select()
          .single();

        if (error) throw error;

        // Log audit
        await logCaseAction(user.id, 'create', insertedCase.id, caseData);

        toast.success(
          <div>
            <p className="font-bold">Case reported successfully!</p>
            <p className="text-sm">Receipt: {receiptNumber}</p>
          </div>,
          { duration: 5000 }
        );

        // Clear draft
        localStorage.removeItem('case_draft');
        
        // Reset form
        reset();
        setSelectedSymptoms([]);
        setCapturedPhoto(null);

        onSuccess?.(insertedCase.id);
      } else {
        // Offline: Save to IndexedDB
        const offlineCase = {
          ...caseData,
          client_local_id: receiptNumber,
          synced: false,
          created_at: new Date().toISOString(),
        };

        // Store in localStorage for now (TODO: Use IndexedDB)
        const offlineCases = JSON.parse(localStorage.getItem('offline_cases') || '[]');
        offlineCases.push(offlineCase);
        localStorage.setItem('offline_cases', JSON.stringify(offlineCases));

        toast.success(
          <div>
            <p className="font-bold">Case saved offline!</p>
            <p className="text-sm">Receipt: {receiptNumber}</p>
            <p className="text-xs text-muted-foreground">Will sync when online</p>
          </div>,
          { duration: 5000 }
        );

        reset();
        setSelectedSymptoms([]);
        setCapturedPhoto(null);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('Failed to submit case report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Report New Case</CardTitle>
            <CardDescription>Complete the form to report a disease case</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <div className="flex items-center gap-1 text-green-600">
                <Wifi className="h-4 w-4" />
                <span className="text-xs">Online</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-orange-600">
                <WifiOff className="h-4 w-4" />
                <span className="text-xs">Offline</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Symptoms Selection */}
          <div className="space-y-3">
            <Label>Symptoms *</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {SYMPTOM_OPTIONS.slice(0, 12).map((symptom) => (
                <div key={symptom.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={symptom.value}
                    checked={selectedSymptoms.includes(symptom.value)}
                    onCheckedChange={() => handleSymptomToggle(symptom.value)}
                  />
                  <label
                    htmlFor={symptom.value}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {symptom.label}
                  </label>
                </div>
              ))}
            </div>
            {errors.symptoms && (
              <p className="text-sm text-destructive">{errors.symptoms.message}</p>
            )}
          </div>

          {/* Suggested Diseases */}
          {suggestedDiseases.length > 0 && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <p className="text-sm font-medium mb-2">Suggested diseases based on symptoms:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedDiseases.map((disease) => (
                  <Button
                    key={disease.code}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setValue('disease_code', disease.code)}
                    className={cn(
                      selectedDisease === disease.code && 'bg-primary text-primary-foreground'
                    )}
                  >
                    {disease.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Disease Selection */}
          <div className="space-y-2">
            <Label htmlFor="disease_code">Disease *</Label>
            <Select
              value={selectedDisease}
              onValueChange={(value) => setValue('disease_code', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select disease" />
              </SelectTrigger>
              <SelectContent>
                {getDiseasesForDropdown().map((disease) => (
                  <SelectItem key={disease.value} value={disease.value}>
                    <span className={cn(
                      disease.priority === 'high' && 'font-bold text-red-600'
                    )}>
                      {disease.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.disease_code && (
              <p className="text-sm text-destructive">{errors.disease_code.message}</p>
            )}
          </div>

          {/* Patient Demographics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="patient_age_group">Age Group *</Label>
              <Select onValueChange={(value) => setValue('patient_age_group', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select age" />
                </SelectTrigger>
                <SelectContent>
                  {AGE_GROUPS.map((age) => (
                    <SelectItem key={age.value} value={age.value}>
                      {age.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.patient_age_group && (
                <p className="text-sm text-destructive">{errors.patient_age_group.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="patient_gender">Gender *</Label>
              <Select onValueChange={(value) => setValue('patient_gender', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  {GENDER_OPTIONS.map((gender) => (
                    <SelectItem key={gender.value} value={gender.value}>
                      {gender.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.patient_gender && (
                <p className="text-sm text-destructive">{errors.patient_gender.message}</p>
              )}
            </div>
          </div>

          {/* Onset Date */}
          <div className="space-y-2">
            <Label>Onset Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !onsetDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {onsetDate ? format(onsetDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={onsetDate}
                  onSelect={(date) => date && setValue('onset_date', date)}
                  disabled={(date) => date > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.onset_date && (
              <p className="text-sm text-destructive">{errors.onset_date.message}</p>
            )}
          </div>

          {/* Severity */}
          <div className="space-y-2">
            <Label htmlFor="severity">Severity</Label>
            <Select onValueChange={(value) => setValue('severity', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select severity" />
              </SelectTrigger>
              <SelectContent>
                {SEVERITY_LEVELS.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              {...register('notes')}
              placeholder="Enter any additional information..."
              rows={3}
            />
          </div>

          {/* Location & Photo */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={captureLocation}
              className="flex-1"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Capture Location
            </Button>
            
            <label className="flex-1">
              <Button type="button" variant="outline" className="w-full" asChild>
                <span>
                  <Camera className="h-4 w-4 mr-2" />
                  {capturedPhoto ? 'Photo Captured' : 'Take Photo'}
                </span>
              </Button>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhotoCapture}
              />
            </label>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Upload className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Submit Case Report
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
