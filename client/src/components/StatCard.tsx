import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  iconBgColor: string;
  iconColor: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export default function StatCard({
  title,
  value,
  icon,
  iconBgColor,
  iconColor,
  trend,
}: StatCardProps) {
  return (
    <Card>
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center">
          <div className={cn("flex-shrink-0 rounded-md p-3", iconBgColor)}>
            <div className={cn("h-6 w-6", iconColor)}>{icon}</div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dt className="text-sm font-medium text-neutral-500 truncate">{title}</dt>
            <dd className="flex items-baseline">
              <div className="text-2xl font-semibold text-neutral-900">{value}</div>
              
              {trend && (
                <div 
                  className={cn(
                    "ml-2 flex items-baseline text-sm font-semibold",
                    trend.isPositive ? "text-success" : "text-error"
                  )}
                >
                  {trend.isPositive ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 self-center" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 self-center" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  )}
                  <span className="sr-only">
                    {trend.isPositive ? "Increased by" : "Decreased by"}
                  </span>
                  {trend.value}
                </div>
              )}
            </dd>
          </div>
        </div>
      </div>
    </Card>
  );
}
