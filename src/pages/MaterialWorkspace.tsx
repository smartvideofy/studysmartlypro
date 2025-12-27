import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Settings, 
  Maximize2, 
  Minimize2,
  BookOpen,
  FileText,
  Lightbulb,
  MessageSquare,
  Brain,
  Network
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStudyMaterial } from "@/hooks/useStudyMaterials";
import MaterialViewer from "@/components/materials/MaterialViewer";
import TutorNotesTab from "@/components/materials/tabs/TutorNotesTab";
import SummariesTab from "@/components/materials/tabs/SummariesTab";
import FlashcardsTab from "@/components/materials/tabs/FlashcardsTab";
import PracticeQuestionsTab from "@/components/materials/tabs/PracticeQuestionsTab";
import ConceptMapTab from "@/components/materials/tabs/ConceptMapTab";
import AIChatTab from "@/components/materials/tabs/AIChatTab";
import ProcessingStatus from "@/components/materials/ProcessingStatus";

export default function MaterialWorkspace() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("tutor-notes");
  const [isViewerExpanded, setIsViewerExpanded] = useState(false);
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);

  const { data: material, isLoading } = useStudyMaterial(id || "");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading material...</p>
        </div>
      </div>
    );
  }

  if (!material) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Material not found</h2>
          <Button onClick={() => navigate("/materials")}>
            Back to Materials
          </Button>
        </div>
      </div>
    );
  }

  // Show processing status if not completed
  if (material.processing_status !== "completed") {
    return <ProcessingStatus material={material} />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border h-14 flex items-center px-4 gap-4">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate("/materials")}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        <div className="flex-1 min-w-0">
          <h1 className="font-display font-semibold truncate">{material.title}</h1>
          {material.subject && (
            <p className="text-xs text-muted-foreground">{material.subject}</p>
          )}
        </div>

        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate("/settings")}
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </Button>
      </header>

      {/* Main Content - Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Material Viewer */}
        <motion.div
          initial={false}
          animate={{ 
            width: isViewerExpanded ? "100%" : isPanelExpanded ? "0%" : "50%",
            opacity: isPanelExpanded ? 0 : 1
          }}
          transition={{ duration: 0.3 }}
          className="relative border-r border-border overflow-hidden"
        >
          <div className="absolute top-2 right-2 z-10">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 bg-background/80 backdrop-blur-sm"
              onClick={() => setIsViewerExpanded(!isViewerExpanded)}
            >
              {isViewerExpanded ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </Button>
          </div>
          
          <MaterialViewer material={material} />
        </motion.div>

        {/* Right Panel - Study Tools */}
        <motion.div
          initial={false}
          animate={{ 
            width: isPanelExpanded ? "100%" : isViewerExpanded ? "0%" : "50%",
            opacity: isViewerExpanded ? 0 : 1
          }}
          transition={{ duration: 0.3 }}
          className="flex flex-col overflow-hidden"
        >
          <div className="absolute top-2 left-2 z-10">
            {!isViewerExpanded && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 bg-background/80 backdrop-blur-sm"
                onClick={() => setIsPanelExpanded(!isPanelExpanded)}
              >
                {isPanelExpanded ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </Button>
            )}
          </div>

          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col"
          >
            <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent p-0 h-auto">
              <TabsTrigger 
                value="tutor-notes" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 gap-2"
              >
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">Tutor Notes</span>
              </TabsTrigger>
              <TabsTrigger 
                value="summaries"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 gap-2"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Summaries</span>
              </TabsTrigger>
              <TabsTrigger 
                value="flashcards"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 gap-2"
              >
                <Lightbulb className="w-4 h-4" />
                <span className="hidden sm:inline">Flashcards</span>
              </TabsTrigger>
              <TabsTrigger 
                value="questions"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 gap-2"
              >
                <Brain className="w-4 h-4" />
                <span className="hidden sm:inline">Questions</span>
              </TabsTrigger>
              <TabsTrigger 
                value="concept-map"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 gap-2"
              >
                <Network className="w-4 h-4" />
                <span className="hidden sm:inline">Map</span>
              </TabsTrigger>
              <TabsTrigger 
                value="chat"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="hidden sm:inline">AI Chat</span>
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto">
              <TabsContent value="tutor-notes" className="m-0 h-full">
                <TutorNotesTab materialId={material.id} />
              </TabsContent>
              <TabsContent value="summaries" className="m-0 h-full">
                <SummariesTab materialId={material.id} />
              </TabsContent>
              <TabsContent value="flashcards" className="m-0 h-full">
                <FlashcardsTab materialId={material.id} />
              </TabsContent>
              <TabsContent value="questions" className="m-0 h-full">
                <PracticeQuestionsTab materialId={material.id} />
              </TabsContent>
              <TabsContent value="concept-map" className="m-0 h-full">
                <ConceptMapTab materialId={material.id} />
              </TabsContent>
              <TabsContent value="chat" className="m-0 h-full">
                <AIChatTab materialId={material.id} extractedContent={material.extracted_content} />
              </TabsContent>
            </div>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
