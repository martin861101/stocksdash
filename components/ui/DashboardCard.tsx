import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card"; // Assuming card is in the same ui folder

export interface DashboardCardProps {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({ title, description, children, className }) => {
  return (
    <Card className={className}>
      <CardHeader className="pb-1 pt-3">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-3">
        {children}
      </CardContent>
    </Card>
  );
};
