import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useCaseStatistics, useActiveOutbreaks } from "@/lib/api";
import { useActiveDiseases } from "@/hooks/useDiseaseCodes";
import { AlertCircle } from "lucide-react";

export function DashboardOverview() {
  const { data: stats, isLoading: statsLoading, error: statsError } = useCaseStatistics();
  const { data: diseases, isLoading: diseasesLoading, error: diseasesError } = useActiveDiseases();
  const { data: outbreaks, isLoading: outbreaksLoading, error: outbreaksError } = useActiveOutbreaks();

  const isLoading = statsLoading || diseasesLoading || outbreaksLoading;
  const error = statsError || diseasesError || outbreaksError;

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load dashboard data. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Cases</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-[100px]" />
          ) : (
            <div className="text-2xl font-bold">{stats?.totalCases}</div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Confirmed Cases</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-[100px]" />
          ) : (
            <div className="text-2xl font-bold">{stats?.confirmedCases}</div>
          )}
          <p className="text-xs text-muted-foreground">
            {stats && ((stats.confirmedCases / stats.totalCases) * 100).toFixed(1)}% confirmation rate
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Outbreaks</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-[100px]" />
          ) : (
            <div className="text-2xl font-bold">{stats?.activeOutbreaks}</div>
          )}
        </CardContent>
        <CardFooter>
          <Button variant="outline" size="sm" className="w-full">
            View All Outbreaks
          </Button>
        </CardFooter>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Active Diseases</CardTitle>
          <CardDescription>
            Current disease spread and severity
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-[220px]" />
            </div>
          ) : (
            <div className="space-y-4">
              {diseases?.map((disease) => (
                <div key={disease.code} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{disease.name}</p>
                      <Progress value={(disease.cases.length / (stats?.totalCases || 1)) * 100} />
                    </div>
                    <div className="font-bold">{disease.cases.length}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}