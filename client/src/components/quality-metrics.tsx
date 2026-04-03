import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import type { CodeMetrics } from "@shared/schema";

export function QualityMetrics() {
  const { data: quality, isLoading } = useQuery<CodeMetrics>({
    queryKey: ["/api/quality"],
  });

  const getCoverageColor = (val: string) => {
    const n = parseFloat(val);
    if (n >= 80) return "bg-green-600 text-green-600";
    if (n >= 60) return "bg-yellow-600 text-yellow-600";
    return "bg-red-600 text-red-600";
  };

  const getComplexityColor = (val: string | null | undefined) => {
    if (!val) return "bg-gray-400 text-gray-500";
    const n = parseFloat(val);
    if (n <= 5) return "bg-green-600 text-green-600";
    if (n <= 10) return "bg-yellow-600 text-yellow-600";
    return "bg-red-600 text-red-600";
  };

  const getMaintainabilityColor = (val: string | null | undefined) => {
    if (!val) return "bg-gray-400 text-gray-500";
    if (val === "A") return "bg-green-600 text-green-600";
    if (val === "B") return "bg-blue-600 text-blue-600";
    if (val === "C") return "bg-yellow-600 text-yellow-600";
    return "bg-red-600 text-red-600";
  };

  if (isLoading) {
    return (
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-2 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!quality) {
    return (
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Qualité du Code</h3>
          <p className="text-gray-500">Aucune métrique disponible</p>
        </CardContent>
      </Card>
    );
  }

  const coverageColorClass = getCoverageColor(quality.coverage);
  const complexityColorClass = getComplexityColor(quality.cyclomaticComplexity);
  const maintColorClass = getMaintainabilityColor(quality.maintainabilityIndex);

  const metrics = [
    {
      label: "Couverture de Tests",
      value: `${quality.coverage}%`,
      barWidth: `${parseFloat(quality.coverage)}%`,
      bgColor: coverageColorClass.split(" ")[0],
      textColor: coverageColorClass.split(" ")[1],
    },
    {
      label: "Complexité Cyclomatique",
      value: quality.cyclomaticComplexity ?? "—",
      barWidth: quality.cyclomaticComplexity
        ? `${Math.min((parseFloat(quality.cyclomaticComplexity) / 10) * 100, 100)}%`
        : "0%",
      bgColor: complexityColorClass.split(" ")[0],
      textColor: complexityColorClass.split(" ")[1],
    },
    {
      label: "Indice de Maintenabilité",
      value: quality.maintainabilityIndex ?? "—",
      barWidth: quality.maintainabilityIndex
        ? ({ A: "92%", B: "75%", C: "58%", D: "40%", F: "20%" }[quality.maintainabilityIndex] ?? "50%")
        : "0%",
      bgColor: maintColorClass.split(" ")[0],
      textColor: maintColorClass.split(" ")[1],
    },
  ];

  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-gray-900">Qualité du Code</h3>
        </div>

        <div className="space-y-5">
          {metrics.map(({ label, value, barWidth, bgColor, textColor }) => (
            <div key={label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">{label}</span>
                <span className={`text-sm font-bold ${textColor}`}>{value}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${bgColor}`}
                  style={{ width: barWidth }}
                />
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between pt-2">
            <span className="text-sm font-medium text-gray-700">Dette Technique</span>
            <span className="text-sm font-bold text-red-600">{quality.technicalDebt ?? "—"}</span>
          </div>

          {quality.bugs != null && (
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="text-center p-2 bg-red-50 rounded-lg">
                <p className="text-xl font-bold text-red-600">{quality.bugs}</p>
                <p className="text-xs text-gray-500">Bugs</p>
              </div>
              <div className="text-center p-2 bg-orange-50 rounded-lg">
                <p className="text-xl font-bold text-orange-600">{quality.codeSmells ?? 0}</p>
                <p className="text-xs text-gray-500">Code Smells</p>
              </div>
              <div className="text-center p-2 bg-blue-50 rounded-lg">
                <p className="text-xl font-bold text-blue-600">{quality.duplicatedLines ?? 0}</p>
                <p className="text-xs text-gray-500">Lignes dupliquées</p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium text-gray-700">Quality Gate : Passé</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
