import { useCallback, useMemo, useState } from "react";
import { 
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  MarkerType,
  BackgroundVariant,
  Panel
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { motion } from "framer-motion";
import { 
  Network, 
  RefreshCw,
  Loader2,
  Sparkles,
  Maximize2,
  X,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConceptMap } from "@/hooks/useStudyMaterials";
import { useRegenerateContent } from "@/hooks/useRegenerateContent";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ConceptMapTabProps {
  materialId: string;
}

// Custom node component for concepts
function ConceptNode({ data }: { data: { label: string; description?: string } }) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  return (
    <TooltipProvider>
      <Tooltip open={showTooltip} onOpenChange={setShowTooltip}>
        <TooltipTrigger asChild>
          <div 
            className="px-4 py-2 shadow-md rounded-lg border-2 border-primary/50 bg-card min-w-[120px] max-w-[180px] cursor-pointer transition-all hover:shadow-lg hover:border-primary"
            onClick={() => setShowTooltip(!showTooltip)}
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="font-medium text-sm text-center leading-tight">
                {data.label}
              </span>
            </div>
          </div>
        </TooltipTrigger>
        {data.description && (
          <TooltipContent side="bottom" className="max-w-[250px]">
            <p className="text-sm">{data.description}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}

const nodeTypes = {
  concept: ConceptNode,
};

export default function ConceptMapTab({ materialId }: ConceptMapTabProps) {
  const { data: conceptMap, isLoading } = useConceptMap(materialId);
  const regenerate = useRegenerateContent(materialId);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleRegenerate = () => {
    regenerate.mutate("concept_map");
  };

  // Convert concept map data to React Flow nodes and edges
  const { initialNodes, initialEdges } = useMemo(() => {
    if (!conceptMap || !conceptMap.nodes.length) {
      return { initialNodes: [], initialEdges: [] };
    }

    // Apply force-directed layout simulation
    const centerX = 400;
    const centerY = 300;
    const radius = Math.min(300, 100 + conceptMap.nodes.length * 20);

    const nodes: Node[] = conceptMap.nodes.map((node, index) => {
      // Arrange nodes in a circular pattern with some randomization
      const angle = (index / conceptMap.nodes.length) * 2 * Math.PI;
      const r = radius * (0.7 + Math.random() * 0.3);
      
      return {
        id: node.id,
        type: "concept",
        position: { 
          x: centerX + r * Math.cos(angle),
          y: centerY + r * Math.sin(angle)
        },
        data: { 
          label: node.label,
          description: node.description 
        },
        draggable: true,
      };
    });

    const edges: Edge[] = conceptMap.edges.map((edge, index) => ({
      id: `edge-${index}`,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      type: "smoothstep",
      animated: false,
      style: { stroke: "hsl(var(--primary))", strokeWidth: 2 },
      labelStyle: { fill: "hsl(var(--muted-foreground))", fontSize: 11 },
      labelBgStyle: { fill: "hsl(var(--background))", fillOpacity: 0.8 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "hsl(var(--primary))",
      },
    }));

    return { initialNodes: nodes, initialEdges: edges };
  }, [conceptMap]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when concept map changes
  useMemo(() => {
    if (initialNodes.length > 0) {
      setNodes(initialNodes);
      setEdges(initialEdges);
    }
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!conceptMap || !conceptMap.nodes.length) {
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

  const MapContent = ({ height = "100%" }: { height?: string }) => (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      fitView
      attributionPosition="bottom-left"
      proOptions={{ hideAttribution: true }}
      className="bg-secondary/20"
      style={{ height }}
    >
      <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="hsl(var(--border))" />
      <Controls 
        className="bg-background border border-border rounded-lg shadow-lg"
        showInteractive={false}
      />
      <Panel position="top-right" className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 bg-background/80 backdrop-blur-sm"
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
        {!isFullscreen && (
          <Button 
            variant="outline" 
            size="icon"
            className="h-9 w-9 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsFullscreen(true)}
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        )}
      </Panel>
      <Panel position="bottom-right" className="text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-border">
        <div className="flex items-center gap-2">
          <Info className="w-3 h-3" />
          <span>Click nodes for details • Drag to reposition • Scroll to zoom</span>
        </div>
      </Panel>
    </ReactFlow>
  );

  return (
    <>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h3 className="font-semibold">Concept Map</h3>
            <p className="text-sm text-muted-foreground">
              {conceptMap.nodes.length} concepts, {conceptMap.edges.length} connections
            </p>
          </div>
        </div>

        {/* Map Canvas */}
        <div className="flex-1 relative overflow-hidden">
          <MapContent />
        </div>
      </div>

      {/* Fullscreen Dialog */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] p-0">
          <DialogHeader className="absolute top-4 left-4 z-10 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-border">
            <DialogTitle className="flex items-center gap-2">
              <Network className="w-5 h-5" />
              Concept Map - {conceptMap.nodes.length} concepts
            </DialogTitle>
          </DialogHeader>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-10 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsFullscreen(false)}
          >
            <X className="w-4 h-4" />
          </Button>
          <div className="w-full h-full">
            <MapContent height="100%" />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
