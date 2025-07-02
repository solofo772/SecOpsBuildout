import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

export function getSeverityColor(severity: string): string {
  switch (severity.toLowerCase()) {
    case 'critical':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'high':
      return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'medium':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'low':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

export function getSeverityBadgeColor(severity: string): string {
  switch (severity.toLowerCase()) {
    case 'critical':
      return 'bg-red-600';
    case 'high':
      return 'bg-orange-600';
    case 'medium':
      return 'bg-yellow-600';
    case 'low':
      return 'bg-blue-600';
    default:
      return 'bg-gray-600';
  }
}
