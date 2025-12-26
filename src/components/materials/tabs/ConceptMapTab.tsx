import { useMemo } from "react";
import { motion } from "framer-motion";
import { 
  Network, 
  RefreshCw,
  Loader2,
  Sparkles,
  ZoomIn,
  ZoomOut,
  Maximize2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConceptMap } from "@/hooks/useStudyMaterials";
import { useRegenerateContent } from "@/hooks/useRegenerateContent";

interface ConceptMapTabProps {
  materialId: string;
}

export default function ConceptMapTab({ materialId }: ConceptMapTabProps) {
  const { data: conceptMap, isLoading } = useConceptMap(materialId);
  const regenerate = useRegenerateContent(materialId);

  const handleRegenerate = () => {
    regenerate.mutate("concept_map");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!conceptMap) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Network className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No concept map yet</h3>
        <p className="text-muted-foreground max-w-sm mb-6">
          Generate a visual concept map to see how ideas connect.
        </p>
        <Button className="gap-2" onClick={handleRegenerate} disabled={regenerate.isPending}>
          {regenerate.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          Generate Concept Map
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <h3 className="font-semibold">Concept Map</h3>
          <p className="text-sm text-muted-foreground">
            {conceptMap.nodes.length} concepts, {conceptMap.edges.length} connections
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8">
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8">
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8">
            <Maximize2 className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={handleRegenerate}
            disabled={regenerate.isPending}
          >
            {regenerate.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Regenerate
          </Button>
        </div>
      </div>

      {/* Map Canvas */}
      <div className="flex-1 relative overflow-hidden bg-secondary/20">
        <svg className="w-full h-full">
          {/* Edges */}
          {conceptMap.edges.map((edge, index) => {
            const sourceNode = conceptMap.nodes.find(n => n.id === edge.source);
            const targetNode = conceptMap.nodes.find(n => n.id === edge.target);
            
            if (!sourceNode || !targetNode) return null;

            const midX = (sourceNode.x + targetNode.x) / 2;
            const midY = (sourceNode.y + targetNode.y) / 2;

            return (
              <g key={index}>
                <line
                  x1={sourceNode.x}
                  y1={sourceNode.y}
                  x2={targetNode.x}
                  y2={targetNode.y}
                  stroke="hsl(var(--border))"
                  strokeWidth="2"
                  markerEnd="url(#arrowhead)"
                />
                {edge.label && (
                  <text
                    x={midX}
                    y={midY - 8}
                    textAnchor="middle"
                    className="text-xs fill-muted-foreground"
                  >
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Arrow marker definition */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="hsl(var(--border))"
              />
            </marker>
          </defs>

          {/* Nodes */}
          {conceptMap.nodes.map((node, index) => (
            <motion.g
              key={node.id}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <circle
                cx={node.x}
                cy={node.y}
                r="40"
                className="fill-card stroke-border"
                strokeWidth="2"
              />
              <text
                x={node.x}
                y={node.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-xs font-medium fill-foreground"
              >
                {node.label.length > 15 ? node.label.slice(0, 15) + '...' : node.label}
              </text>
            </motion.g>
          ))}
        </svg>

        {/* Empty state overlay if no meaningful map */}
        {conceptMap.nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-muted-foreground">Map visualization will appear here</p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Click on a concept to see more details. Drag to pan, scroll to zoom.
        </p>
      </div>
    </div>
  );
}
