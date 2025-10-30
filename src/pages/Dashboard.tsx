'use client'

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Activity, Users, MapPin, Plus, Bell, Loader2 } from "lucide-react";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { useCaseReportsInfinite, useCaseStatistics } from "@/lib/api-optimized";
import type { CaseReport } from "@/lib/types";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<"all" | "active" | "alert">("all");
  const { data: caseStats, isLoading: statsLoading } = useCaseStatistics();
  const { data: casesData, isLoading: casesLoading } = useCaseReportsInfinite();
  
  // Get first 5 cases from first page
  const recentCases = casesData?.pages[0]?.data.slice(0, 5) || [];

  const stats = [
    { 
      label: "Active Cases", 
      value: caseStats?.totalCases.toString() ?? "...", 
      change: `${caseStats?.confirmedCases ?? 0} confirmed`, 
      icon: Activity, 
      variant: "default" as const 
    },
    { 
      label: "Active Outbreaks", 
      value: caseStats?.activeOutbreaks.toString() ?? "...", 
      change: "Ongoing monitoring", 
      icon: AlertTriangle, 
      variant: statsLoading ? "default" : (caseStats?.activeOutbreaks ?? 0) > 0 ? "warning" : "default" as const 
    },
    { 
      label: "Facilities Reporting", 
      value: "...", 
      change: "Last 24h", 
      icon: Users, 
      variant: "default" as const 
    },
    { 
      label: "Districts Affected", 
      value: "...", 
      change: "Under surveillance", 
      icon: MapPin, 
      variant: "default" as const 
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 z-10 backdrop-blur-sm bg-card/95">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">IDSR Platform</h1>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              <Link href="/dashboard/report">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Report
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="p-6 shadow-card hover:shadow-elevated transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-2">{stat.change}</p>
                </div>
                <div className={`p-3 rounded-lg bg-${stat.variant === 'warning' ? 'warning' : stat.variant === 'success' ? 'success' : 'primary'}/10`}>
                  <stat.icon className={`h-6 w-6 text-${stat.variant === 'warning' ? 'warning' : stat.variant === 'success' ? 'success' : 'primary'}`} />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Case List */}
        <Card className="p-6 shadow-card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">Recent Case Reports</h2>
            <div className="flex gap-2">
              <Button
                variant={activeTab === "all" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("all")}
              >
                All Cases
              </Button>
              <Button
                variant={activeTab === "active" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("active")}
              >
                Active
              </Button>
              <Button
                variant={activeTab === "alert" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("alert")}
              >
                Alerts
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {casesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : recentCases.map((caseReport) => (
              <div
                key={caseReport.id}
                className="p-4 border border-border rounded-lg hover:border-primary/50 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-mono text-muted-foreground">{caseReport.id}</span>
                      <Badge variant="default">
                        {caseReport.disease_code}
                      </Badge>
                      <Badge
                        variant={caseReport.status === "confirmed" ? "default" : "secondary"}
                      >
                        {caseReport.status}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{caseReport.location_detail || 'Location not specified'}</span>
                      </div>
                      
                      {caseReport.symptoms && Array.isArray(caseReport.symptoms) && caseReport.symptoms.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {caseReport.symptoms.map((symptom, idx) => (
                            <span key={idx} className="px-2 py-0.5 text-xs bg-muted rounded">
                              {symptom}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>
                          {caseReport.age_group} • {caseReport.gender}
                        </span>
                        <span>
                          {caseReport.created_at
                            ? formatDistanceToNow(new Date(caseReport.created_at), { addSuffix: true })
                            : 'Recently'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
