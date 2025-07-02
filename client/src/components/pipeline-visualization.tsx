import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Code, Hammer, Shield, TestTube, Rocket, Check } from "lucide-react";
import { cn, formatDuration } from "@/lib/utils";
import type { PipelineRun } from "@shared/schema";

const pipelineStages = [
  { id: 'source', name: 'Source', icon: Code, description: 'Code checkout' },
  { id: 'build', name: 'Build', icon: Hammer, description: 'Compilation' },
  { id: 'security', name: 'Security Scan', icon: Shield, description: 'SAST/DAST' },
  { id: 'test', name: 'Test', icon: TestTube, description: 'Unit/Integration' },
  { id: 'deploy', name: 'Deploy', icon: Rocket, description: 'Deployment' },
];

export function PipelineVisualization() {
  const { data: currentRun, isLoading } = useQuery<PipelineRun>({
    queryKey: ["/api/pipeline/current"],
  });

  const getStageStatus = (stageId: string, currentStage: string, status: string) => {
    const currentIndex = pipelineStages.findIndex(s => s.id === currentStage);
    const stageIndex = pipelineStages.findIndex(s => s.id === stageId);
    
    if (stageIndex < currentIndex) return 'completed';
    if (stageIndex === currentIndex && status === 'running') return 'running';
    if (stageIndex === currentIndex && status === 'failed') return 'failed';
    return 'pending';
  };

  const getStageColor = (stageStatus: string) => {
    switch (stageStatus) {
      case 'completed':
        return 'bg-green-500 text-white';
      case 'running':
        return 'bg-yellow-500 text-white animate-pulse';
      case 'failed':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-300 text-gray-500';
    }
  };

  const getConnectorColor = (fromStatus: string, toStatus: string) => {
    if (fromStatus === 'completed' && (toStatus === 'completed' || toStatus === 'running')) {
      return 'bg-green-500';
    }
    return 'bg-gray-300';
  };

  if (isLoading) {
    return (
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-sm border border-gray-200 mb-8">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">DevSecOps Pipeline Status</h3>
          <div className="flex items-center space-x-2">
            <span className={cn(
              "w-3 h-3 rounded-full",
              currentRun?.status === 'running' ? 'bg-green-500' :
              currentRun?.status === 'failed' ? 'bg-red-500' : 'bg-gray-400'
            )}></span>
            <span className="text-sm text-gray-600 capitalize">
              {currentRun?.status || 'No active pipeline'}
            </span>
          </div>
        </div>

        <div className="relative">
          <div className="flex items-center justify-between space-x-4 overflow-x-auto pb-4">
            {pipelineStages.map((stage, index) => {
              const StageIcon = stage.icon;
              const stageStatus = currentRun ? 
                getStageStatus(stage.id, currentRun.stage, currentRun.status) : 
                'pending';
              
              return (
                <div key={stage.id} className="flex items-center">
                  <div className="flex-shrink-0 text-center">
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center mb-2 relative",
                      getStageColor(stageStatus)
                    )}>
                      <StageIcon className="h-5 w-5" />
                      {stageStatus === 'completed' && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white">
                          <Check className="h-2 w-2 text-white m-0.5" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-900">{stage.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{stageStatus}</p>
                  </div>
                  
                  {index < pipelineStages.length - 1 && (
                    <div className={cn(
                      "flex-1 h-px mx-4 min-w-[2rem]",
                      getConnectorColor(
                        stageStatus, 
                        currentRun ? getStageStatus(pipelineStages[index + 1].id, currentRun.stage, currentRun.status) : 'pending'
                      )
                    )}></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {currentRun && (
          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                Current Stage: {pipelineStages.find(s => s.id === currentRun.stage)?.name || currentRun.stage}
              </span>
              <span className="text-gray-600">
                Duration: {currentRun.duration ? formatDuration(currentRun.duration) : 'Calculating...'}
              </span>
            </div>
            {currentRun.successRate && (
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${currentRun.successRate}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
