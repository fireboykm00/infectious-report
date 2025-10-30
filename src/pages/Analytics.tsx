"use client"
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, Map, TrendingUp, Users, Loader2, Activity, AlertTriangle } from 'lucide-react';
import { useAnalyticsStats, useDiseaseDistribution, useTrendsData } from '@/lib/api';
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedDisease, setSelectedDisease] = useState('all');

  const { data: stats, isLoading: statsLoading } = useAnalyticsStats(timeRange);
  const { data: diseaseData, isLoading: diseaseLoading } = useDiseaseDistribution(timeRange);
  const { data: trendsData, isLoading: trendsLoading } = useTrendsData(timeRange);

  if (statsLoading || diseaseLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedDisease} onValueChange={setSelectedDisease}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select disease" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Diseases</SelectItem>
              <SelectItem value="covid19">COVID-19</SelectItem>
              <SelectItem value="malaria">Malaria</SelectItem>
              <SelectItem value="cholera">Cholera</SelectItem>
              <SelectItem value="typhoid">Typhoid</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cases</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCases || 0}</div>
            <p className="text-xs text-muted-foreground">
              In selected time range
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Outbreaks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeOutbreaks || 0}</div>
            <p className="text-xs text-muted-foreground">
              Current disease outbreaks
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recovery Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.recoveryRate || '0%'}</div>
            <p className="text-xs text-muted-foreground">
              Cases marked as recovered
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed Cases</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.confirmedCases || 0}</div>
            <p className="text-xs text-muted-foreground">
              Laboratory confirmed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-blue-50 dark:bg-blue-950">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="geographic" className="flex items-center gap-2">
            <Map className="h-4 w-4" />
            <span>Geographic</span>
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span>Trends</span>
          </TabsTrigger>
          <TabsTrigger value="demographics" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Demographics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Disease Distribution</CardTitle>
                <CardDescription>
                  Cases by disease type in selected period
                </CardDescription>
              </CardHeader>
              <CardContent>
                {diseaseData && diseaseData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={diseaseData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="disease" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="total" fill="#8884d8" name="Total Cases" />
                      <Bar dataKey="confirmed" fill="#82ca9d" name="Confirmed" />
                      <Bar dataKey="suspected" fill="#ffc658" name="Suspected" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No disease data available for this period
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Disease Breakdown</CardTitle>
                <CardDescription>
                  Distribution by disease type
                </CardDescription>
              </CardHeader>
              <CardContent>
                {diseaseData && diseaseData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={diseaseData}
                        dataKey="total"
                        nameKey="disease"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {diseaseData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="geographic" className="space-y-4">
          <Card className="col-span-7">
            <CardHeader>
              <CardTitle>Geographic Distribution</CardTitle>
              <CardDescription>
                Case distribution by location
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-12">
                <Map className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Geographic map visualization coming soon</p>
                <p className="text-sm mt-2">Will display case hotspots and outbreak locations</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card className="col-span-7">
            <CardHeader>
              <CardTitle>Case Trends Over Time</CardTitle>
              <CardDescription>
                Daily case trends by disease type
              </CardDescription>
            </CardHeader>
            <CardContent>
              {trendsData && trendsData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={trendsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {Object.keys(trendsData[0] || {}).filter(key => key !== 'date').map((disease, index) => (
                      <Line 
                        key={disease}
                        type="monotone" 
                        dataKey={disease} 
                        stroke={COLORS[index % COLORS.length]}
                        name={disease}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                  No trend data available for this period
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="demographics" className="space-y-4">
          <Card className="col-span-7">
            <CardHeader>
              <CardTitle>Top Diseases</CardTitle>
              <CardDescription>
                Most reported diseases in selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              {diseaseData && diseaseData.length > 0 ? (
                <div className="space-y-4">
                  {diseaseData.slice(0, 5).map((disease: any, index) => (
                    <div key={disease.disease} className="flex items-center">
                      <div className="w-32">
                        <Badge>{disease.disease}</Badge>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div 
                            className="h-4 rounded-full transition-all"
                            style={{
                              width: `${(disease.total / (diseaseData[0]?.total || 1)) * 100}%`,
                              backgroundColor: COLORS[index % COLORS.length]
                            }}
                          />
                          <span className="text-sm font-medium">{disease.total} cases</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                  No demographic data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}