import { useState, useMemo } from "react";
import { ReactFlow, Controls, Background, useNodesState, useEdgesState, Node, Edge, MarkerType, BackgroundVariant, Panel } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Network, Loader2 } from "lucide-react";
import { useNotebookConceptMap } from "@/hooks/useNotebookContent";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Props { notebookId: string; }

function ConceptNode({ data }: { data: { label: string; description?: string } }) {
  const [show, setShow] = useState(false);
  return (
    <TooltipProvider>
      <Tooltip open={show} onOpenChange={setShow}>
        <TooltipTrigger asChild>
          <div className="px-4 py-2 shadow-md rounded-lg border-2 border-primary/50 bg-card min-w-[120px] max-w-[180px] cursor-pointer transition-all hover:shadow-lg hover:border-primary" onClick={() => setShow(!show)}>
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-primary" /><span className="font-medium text-sm text-center leading-tight">{data.label}</span></div>
          </div>
        </TooltipTrigger>
        {data.description && <TooltipContent side="bottom" className="max-w-[250px]"><p className="text-sm">{data.description}</p></TooltipContent>}
      </Tooltip>
    </TooltipProvider>
  );
}

const nodeTypes = { concept: ConceptNode };

export default function NotebookConceptMapTab({ notebookId }: Props) {
  const { data: conceptMap, isLoading } = useNotebookConceptMap(notebookId);

  const { initialNodes, initialEdges } = useMemo(() => {
    if (!conceptMap?.nodes?.length) return { initialNodes: [], initialEdges: [] };
    const centerX = 400, centerY = 300;
    const radius = Math.min(300, 100 + conceptMap.nodes.length * 20);
    const nodes: Node[] = conceptMap.nodes.map((node, i) => {
      const angle = (i / conceptMap.nodes.length) * 2 * Math.PI;
      const r = radius * (0.7 + Math.random() * 0.3);
      return { id: node.id, type: "concept", position: { x: centerX + r * Math.cos(angle), y: centerY + r * Math.sin(angle) }, data: { label: node.label, description: node.description }, draggable: true };
    });
    const edges: Edge[] = conceptMap.edges.map((edge, i) => ({
      id: `e-${i}`, source: edge.source, target: edge.target, label: edge.label, type: "smoothstep", style: { stroke: "hsl(var(--primary))", strokeWidth: 2 },
      labelStyle: { fill: "hsl(var(--muted-foreground))", fontSize: 11 }, labelBgStyle: { fill: "hsl(var(--background))", fillOpacity: 0.8 },
      markerEnd: { type: MarkerType.ArrowClosed, color: "hsl(var(--primary))" },
    }));
    return { initialNodes: nodes, initialEdges: edges };
  }, [conceptMap]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  if (isLoading) return <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  if (!conceptMap?.nodes?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4"><Network className="w-8 h-8 text-primary" /></div>
        <h3 className="text-lg font-semibold mb-2">No combined concept map yet</h3>
        <p className="text-muted-foreground max-w-sm">A combined concept map will appear here once notebook processing completes.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div><h3 className="font-semibold">Combined Concept Map</h3><p className="text-sm text-muted-foreground">{conceptMap.nodes.length} concepts across all sources</p></div>
      </div>
      <div className="flex-1 relative overflow-hidden">
        <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} nodeTypes={nodeTypes} fitView proOptions={{ hideAttribution: true }} className="bg-secondary/20">
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="hsl(var(--border))" />
          <Controls className="bg-background border border-border rounded-lg shadow-lg" showInteractive={false} />
        </ReactFlow>
      </div>
    </div>
  );
}
