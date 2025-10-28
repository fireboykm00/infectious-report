import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatisticCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  description: string;
}

export function StatisticCard({
  title,
  value,
  change,
  trend,
  description
}: StatisticCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        <div className={cn(
          "flex items-center gap-1 text-xs font-medium",
          trend === 'up' ? 'text-green-600' : 'text-red-600'
        )}>
          {trend === 'up' ? (
            <ArrowUpIcon className="h-3 w-3" />
          ) : (
            <ArrowDownIcon className="h-3 w-3" />
          )}
          {change}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <CardDescription className="text-xs text-muted-foreground">
          {description}
        </CardDescription>
      </CardContent>
    </Card>
  );
}