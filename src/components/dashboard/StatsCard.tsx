import { ReactNode } from 'react';
import Card from '@/components/ui/Card';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export default function StatsCard({ title, value, icon, subtitle, trend }: StatsCardProps) {
  return (
    <Card className="hover:shadow-lg transition-all duration-300 border border-gray-200">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{title}</p>
            <p className="text-4xl font-bold text-gray-900 mb-2">{value}</p>
            {subtitle && (
              <p className="text-sm text-gray-600 font-medium">{subtitle}</p>
            )}
            {trend && (
              <p
                className={`mt-3 text-sm font-semibold ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </p>
            )}
          </div>
          {icon && (
            <div className="text-4xl opacity-80 ml-4">
              {icon}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}


