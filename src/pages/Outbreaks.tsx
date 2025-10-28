import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BellRing, Shield, Activity, AlertTriangle, Map, Users, CheckCircle2, Timer, Loader2 } from "lucide-react";
import { useOutbreaks, useDetectOutbreaks, useCreateOutbreak } from '@/lib/api';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Outbreak {
  id: string;
  disease: string;
  location: string;
  coordinates: [number, number];
  status: 'active' | 'monitoring' | 'resolved';
  cases: number;
  startDate: string;
  lastUpdate: string;
  riskLevel: 'high' | 'medium' | 'low';
  affectedAreas: string[];
  assignedTeam: string[];
}

const statusColors = {
  active: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  monitoring: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  resolved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
};

const riskColors = {
  high: "bg-red-100 text-red-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-blue-100 text-blue-800"
};

export default function Outbreaks() {
  const [selectedOutbreak, setSelectedOutbreak] = useState<any | null>(null);

  const { data: outbreaks = [], isLoading: outbreaksLoading } = useOutbreaks();
  const { data: detectedClusters = [], isLoading: detectingLoading } = useDetectOutbreaks();
  const createOutbreak = useCreateOutbreak();

  const handleDeclareOutbreak = async (cluster: any) => {
    try {
      await createOutbreak.mutateAsync({
        disease_code: cluster.disease,
        location: cluster.location,
        case_count: cluster.cases,
        start_date: new Date().toISOString(),
        status: 'active',
      });
      
      toast.success(`Outbreak declared: ${cluster.disease} in ${cluster.location}`);
    } catch (error: any) {
      console.error('Error declaring outbreak:', error);
      toast.error(error?.message || 'Failed to declare outbreak');
    }
  };

  if (outbreaksLoading || detectingLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeOutbreaks = outbreaks.filter((o: any) => o.status === 'active');
  const totalCases = outbreaks.reduce((sum: number, o: any) => sum + (o.case_count || 0), 0);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Outbreak Management</h2>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Shield className="mr-2 h-4 w-4" />
          Declare New Outbreak
        </Button>
      </div>

      {/* Alert for detected clusters */}
      {detectedClusters.length > 0 && (
        <Alert className="border-red-500 bg-red-50 dark:bg-red-950">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800 dark:text-red-200">Potential Outbreaks Detected</AlertTitle>
          <AlertDescription className="text-red-700 dark:text-red-300">
            {detectedClusters.length} potential outbreak cluster(s) detected with 5+ confirmed cases in the last 7 days.
            Review and declare official outbreaks if needed.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Outbreaks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeOutbreaks.length}</div>
            <p className="text-xs text-muted-foreground">
              Officially declared
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cases</CardTitle>
            <Activity className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCases}</div>
            <p className="text-xs text-muted-foreground">
              Across all outbreaks
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Detected Clusters</CardTitle>
            <Map className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{detectedClusters.length}</div>
            <p className="text-xs text-muted-foreground">
              Potential outbreak areas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monitoring</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {outbreaks.filter((o: any) => o.status === 'monitoring').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Under surveillance
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-7 lg:grid-cols-7">
        <Card className="md:col-span-3 lg:col-span-3">
          <CardHeader>
            <CardTitle>Active Outbreaks</CardTitle>
            <CardDescription>
              Current disease outbreaks and their status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-4">
              {/* Show detected clusters first */}
              {detectedClusters.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-semibold text-sm mb-2 text-red-600">⚠️ Detected Clusters (Not Yet Declared)</h3>
                  {detectedClusters.map((cluster: any, idx: number) => (
                    <Card 
                      key={`cluster-${idx}`}
                      className="mb-3 border-red-200 bg-red-50 dark:bg-red-950/20"
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <CardTitle className="text-lg">{cluster.disease}</CardTitle>
                            <Badge variant="destructive">ALERT</Badge>
                          </div>
                        </div>
                        <CardDescription>{cluster.location}</CardDescription>
                      </CardHeader>
                      <CardContent className="pb-3">
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-red-600" />
                            <span className="font-bold text-red-600">{cluster.cases} confirmed cases</span>
                          </div>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleDeclareOutbreak(cluster)}
                            disabled={createOutbreak.isPending}
                          >
                            {createOutbreak.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                Declaring...
                              </>
                            ) : (
                              'Declare Outbreak'
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Show declared outbreaks */}
              {outbreaks.length > 0 ? (
                outbreaks.map((outbreak: any) => (
                <Card 
                  key={outbreak.id}
                  className={cn(
                    "mb-4 cursor-pointer transition-all hover:shadow-md",
                    selectedOutbreak?.id === outbreak.id && "ring-2 ring-blue-500"
                  )}
                  onClick={() => setSelectedOutbreak(outbreak)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CardTitle className="text-lg">{outbreak.disease_code}</CardTitle>
                        <Badge 
                          variant="secondary"
                          className={statusColors[outbreak.status as keyof typeof statusColors]}
                        >
                          {outbreak.status}
                        </Badge>
                      </div>
                    </div>
                    <CardDescription>{outbreak.location || 'Unknown location'}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-gray-500" />
                        <span>{outbreak.case_count || 0} cases</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Timer className="h-4 w-4 text-gray-500" />
                        <span>{outbreak.start_date ? format(new Date(outbreak.start_date), 'MMM dd, yyyy') : 'N/A'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No declared outbreaks</p>
              </div>
            )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="md:col-span-4 lg:col-span-4">
          <CardHeader>
            <CardTitle>Outbreak Details</CardTitle>
            <CardDescription>
              Detailed information and response management
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedOutbreak ? (
              <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="team">Response Team</TabsTrigger>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  <TabsTrigger value="actions">Actions</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                  <div className="space-y-4">
                    <div className="grid gap-4 grid-cols-2">
                      <div>
                        <h4 className="font-semibold mb-2">Disease</h4>
                        <Badge variant="default" className="text-lg">
                          {selectedOutbreak.disease_code}
                        </Badge>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Key Statistics</h4>
                        <div className="space-y-2 text-sm">
                          <div>Total Cases: {selectedOutbreak.case_count || 0}</div>
                          <div>Start Date: {selectedOutbreak.start_date ? format(new Date(selectedOutbreak.start_date), 'MMM dd, yyyy') : 'N/A'}</div>
                          <div>Status: {selectedOutbreak.status}</div>
                          <div>Location: {selectedOutbreak.location || 'Unknown'}</div>
                        </div>
                      </div>
                    </div>

                    <Alert>
                      <Activity className="h-4 w-4" />
                      <AlertTitle>Response Status</AlertTitle>
                      <AlertDescription>
                        This outbreak is currently being monitored. Response teams are coordinating containment efforts.
                      </AlertDescription>
                    </Alert>
                  </div>
                </TabsContent>

                <TabsContent value="team">
                  <div className="space-y-4">
                    <h4 className="font-semibold">Response Management</h4>
                    <Alert>
                      <Users className="h-4 w-4" />
                      <AlertTitle>Team Assignment</AlertTitle>
                      <AlertDescription>
                        Response team management will be available soon. Contact your district coordinator to assign field teams.
                      </AlertDescription>
                    </Alert>
                    <Button className="w-full">
                      <Users className="mr-2 h-4 w-4" />
                      Assign Response Team
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="timeline">
                  <div className="space-y-4">
                    <Alert>
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertTitle>Outbreak Timeline</AlertTitle>
                      <AlertDescription>
                        Started on {selectedOutbreak.start_date ? format(new Date(selectedOutbreak.start_date), 'MMMM dd, yyyy') : 'Unknown date'}
                      </AlertDescription>
                    </Alert>
                    <div className="text-sm text-muted-foreground">
                      Detailed timeline will be available in a future update.
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="actions">
                  <div className="space-y-4">
                    <div className="grid gap-4 grid-cols-2">
                      <Button className="w-full" variant="outline">
                        Update Status
                      </Button>
                      <Button className="w-full" variant="outline">
                        Add Report
                      </Button>
                      <Button className="w-full" variant="outline">
                        Send Alert
                      </Button>
                      <Button className="w-full" variant="outline">
                        Request Resources
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="flex flex-col items-center justify-center h-[500px] text-center text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mb-4" />
                <h3 className="font-semibold mb-2">No Outbreak Selected</h3>
                <p>Select an outbreak from the list to view details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}