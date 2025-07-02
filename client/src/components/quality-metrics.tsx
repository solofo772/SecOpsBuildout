import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy } from "lucide-react";
import type { CodeQuality } from "@shared/schema";

export function QualityMetrics() {
  const { data: quality, isLoading } = useQuery<CodeQuality>({
    queryKey: ["/api/quality"],
  });

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A':
        return 'text-green-600';
      case 'B':
        return 'text-blue-600';  
      case 'C':
        return 'text-yellow-600';
      case 'D':
        return 'text-orange-600';
      case 'F':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getProgressColor = (value: string, type: 'coverage' | 'complexity' | 'maintainability') => {
    if (type === 'coverage') {
      const num = parseFloat(value);
      if (num >= 80) return 'bg-green-600';
      if (num >= 60) return 'bg-yellow-600';
      return 'bg-red-600';
    }
    if (type === 'complexity') {
      const num = parseFloat(value);
      if (num <= 5) return 'bg-green-600';
      if (num <= 10) return 'bg-yellow-600';
      return 'bg-red-600';
    }
    if (type === 'maintainability') {
      if (value === 'A') return 'bg-green-600';
      if (value === 'B') return 'bg-blue-600';
      if (value === 'C') return 'bg-yellow-600';
      return 'bg-red-600';
    }
    return 'bg-gray-600';
  };

  const getProgressWidth = (value: string, type: 'coverage' | 'complexity' | 'maintainability') => {
    if (type === 'coverage') {
      return `${value}%`;
    }
    if (type === 'complexity') {
      const num = parseFloat(value);
      return `${Math.min((num / 10) * 100, 100)}%`;
    }  
    if (type === 'maintainability') {
      const gradeMap: Record<string, number> = { 'A': 92, 'B': 84, 'C': 76, 'D': 68, 'F': 60 };
      return `${gradeMap[value] || 50}%`;
    }
    return '0%';
  };

  if (isLoading) {
    return (
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-2 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!quality) {
    return (
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Code Quality Metrics</h3>
          <p className="text-gray-500">No quality metrics available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Code Quality Metrics</h3>
          <Button variant="ghost" className="text-primary hover:text-primary/80 text-sm font-medium">
            View Reports
          </Button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Test Coverage</span>
            <span className={`text-sm font-bold ${getProgressColor(quality.coverage, 'coverage')}`}>
              {quality.coverage}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(quality.coverage, 'coverage')}`}
              style={{ width: getProgressWidth(quality.coverage, 'coverage') }}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Code Complexity</span>
            <span className={`text-sm font-bold ${getProgressColor(quality.complexity, 'complexity')}`}>
              {quality.complexity}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(quality.complexity, 'complexity')}`}
              style={{ width: getProgressWidth(quality.complexity, 'complexity') }}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Maintainability</span>
            <span className={`text-sm font-bold ${getGradeColor(quality.maintainability)}`}>
              {quality.maintainability}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(quality.maintainability, 'maintainability')}`}
              style={{ width: getProgressWidth(quality.maintainability, 'maintainability') }}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Technical Debt</span>
            <span className="text-sm font-bold text-red-600">{quality.technicalDebt}</span>
          </div>
        </div>

        <div className="mt-6 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium text-gray-700">Quality Gate: Passed</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
