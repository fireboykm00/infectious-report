import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Activity, Users, MapPin, Plus, Bell } from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<"all" | "active" | "alert">("all");

  // Mock data - will be replaced with real data from Lovable Cloud
  const stats = [
    { label: "Active Cases", value: "23", change: "+5 today", icon: Activity, variant: "default" as const },
    { label: "Alert Threshold", value: "3", change: "Requires action", icon: AlertTriangle, variant: "warning" as const },
    { label: "Facilities Reporting", value: "12", change: "Last 24h", icon: Users, variant: "success" as const },
    { label: "Districts Affected", value: "4", change: "2 high-risk", icon: MapPin, variant: "default" as const },
  ];

  const recentCases = [
    {
      id: "CR-001",
      disease: "Malaria",
      facility: "Kigali Central Hospital",
      district: "Gasabo",
      status: "confirmed",
      reportedAt: "2 hours ago",
      severity: "high",
    },
    {
      id: "CR-002",
      disease: "Cholera",
      facility: "Rwamagana District Hospital",
      district: "Rwamagana",
      status: "suspected",
      reportedAt: "4 hours ago",
      severity: "critical",
    },
    {
      id: "CR-003",
      disease: "COVID-19",
      facility: "Kibagabaga Hospital",
      district: "Gasabo",
      status: "confirmed",
      reportedAt: "6 hours ago",
      severity: "medium",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10 backdrop-blur-sm bg-card/95">
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
              <Link to="/report">
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
            {recentCases.map((caseReport) => (
              <div
                key={caseReport.id}
                className="p-4 border border-border rounded-lg hover:border-primary/50 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-mono text-muted-foreground">{caseReport.id}</span>
                      <Badge
                        variant={
                          caseReport.severity === "critical"
                            ? "destructive"
                            : caseReport.severity === "high"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {caseReport.disease}
                      </Badge>
                      <Badge
                        variant={caseReport.status === "confirmed" ? "default" : "secondary"}
                      >
                        {caseReport.status}
                      </Badge>
                    </div>
                    <p className="text-foreground font-medium mb-1">{caseReport.facility}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {caseReport.district}
                      </span>
                      <span>{caseReport.reportedAt}</span>
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
