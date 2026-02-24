import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Maximize2, 
  Minimize2,
  BookOpen,
  FileText,
  Lightbulb,
  MessageSquare,
  Brain,
  Network,
  Settings,
  Download,
  Eye,
  PenTool
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStudyMaterial } from "@/hooks/useStudyMaterials";
import { useIsMobile } from "@/hooks/use-mobile";
import MaterialViewer from "@/components/materials/MaterialViewer";
import TutorNotesTab from "@/components/materials/tabs/TutorNotesTab";
import SummariesTab from "@/components/materials/tabs/SummariesTab";
import FlashcardsTab from "@/components/materials/tabs/FlashcardsTab";
import PracticeQuestionsTab from "@/components/materials/tabs/PracticeQuestionsTab";
import ConceptMapTab from "@/components/materials/tabs/ConceptMapTab";
import AIChatTab from "@/components/materials/tabs/AIChatTab";
import ProcessingStatus from "@/components/materials/ProcessingStatus";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ExportModal from "@/components/materials/ExportModal";
import { PremiumGate, PremiumBadge } from "@/components/subscription/PremiumGate";
import { cn } from "@/lib/utils";

type MobilePanel = "viewer" | "tools";

export default function MaterialWorkspace() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("tutor-notes");
  const [isViewerExpanded, setIsViewerExpanded] = useState(false);
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("tools");

  const { data: material, isLoading } = useStudyMaterial(id || "");

  if (isLoading) {
    return (
      <DashboardLayout title="Loading...">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading material...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!material) {
    return (
      <DashboardLayout title="Not Found">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Material not found</h2>
            <Button onClick={() => navigate("/materials")}>
              Back to Materials
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show processing status if not completed
  if (material.processing_status !== "completed") {
    return <ProcessingStatus material={material} />;
  }

  // Mobile Layout
  if (isMobile) {
    return (
      <DashboardLayout 
        title={material.title}
        materialId={material.id}
        activeStudyTab={activeTab}
        onStudyTabChange={setActiveTab}
      >
        <div className="flex flex-col h-[calc(100dvh-9rem)] -mx-4 overflow-hidden pb-safe">
          {/* Mobile Panel Toggle */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-10">
            <Button
              variant={mobilePanel === "viewer" ? "default" : "outline"}
              onClick={() => setMobilePanel("viewer")}
              className="flex-1 gap-2 h-11 min-h-[44px]"
            >
              <Eye className="w-4 h-4" />
              Material
            </Button>
            <Button
              variant={mobilePanel === "tools" ? "default" : "outline"}
              onClick={() => setMobilePanel("tools")}
              className="flex-1 gap-2 h-11 min-h-[44px]"
            >
              <PenTool className="w-4 h-4" />
              Study Tools
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-11 w-11 min-h-[44px] min-w-[44px] shrink-0" 
              onClick={() => setShowExportModal(true)}
            >
              <Download className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-11 w-11 min-h-[44px] min-w-[44px] shrink-0" 
              onClick={() => navigate(`/materials/${material.id}/settings`)}
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>

          {/* Mobile Panels */}
          <AnimatePresence mode="wait">
            {mobilePanel === "viewer" ? (
              <motion.div
                key="viewer"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex-1 overflow-hidden"
              >
                <MaterialViewer material={material} />
              </motion.div>
            ) : (
              <motion.div
                key="tools"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                <Tabs 
                  value={activeTab} 
                  onValueChange={setActiveTab}
                  className="flex-1 flex flex-col"
                >
                  {/* Mobile Scrollable Tabs */}
                  <div className="border-b border-border overflow-x-auto scrollbar-hide">
                    <TabsList className="justify-start rounded-none bg-transparent p-0 h-auto w-max min-w-full">
                      <TabsTrigger 
                        value="tutor-notes" 
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 gap-2 touch-target"
                      >
                        <BookOpen className="w-4 h-4" />
                        <span className="text-xs">Notes</span>
                      </TabsTrigger>
                      <TabsTrigger 
                        value="summaries"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 gap-2 touch-target"
                      >
                        <FileText className="w-4 h-4" />
                        <span className="text-xs">Summary</span>
                      </TabsTrigger>
                      <TabsTrigger 
                        value="flashcards"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 gap-2 touch-target"
                      >
                        <Lightbulb className="w-4 h-4" />
                        <span className="text-xs">Cards</span>
                      </TabsTrigger>
                      <TabsTrigger 
                        value="questions"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 gap-2 touch-target"
                      >
                        <Brain className="w-4 h-4" />
                        <span className="text-xs">Quiz</span>
                      </TabsTrigger>
                      <TabsTrigger 
                        value="concept-map"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 gap-2 touch-target"
                      >
                        <Network className="w-4 h-4" />
                        <span className="text-xs">Map</span>
                      </TabsTrigger>
                      <TabsTrigger 
                        value="chat"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 gap-2 touch-target"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span className="text-xs">Chat</span>
                      </TabsTrigger>
                    </TabsList>
                  </div>

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
                      <PremiumGate feature="practiceQuestions">
                        <PracticeQuestionsTab materialId={material.id} />
                      </PremiumGate>
                    </TabsContent>
                    <TabsContent value="concept-map" className="m-0 h-full">
                      <PremiumGate feature="conceptMaps">
                        <ConceptMapTab materialId={material.id} />
                      </PremiumGate>
                    </TabsContent>
                    <TabsContent value="chat" className="m-0 h-full">
                      <AIChatTab materialId={material.id} extractedContent={material.extracted_content} />
                    </TabsContent>
                  </div>
                </Tabs>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <ExportModal
          open={showExportModal}
          onOpenChange={setShowExportModal}
          materialId={material.id}
          materialTitle={material.title}
          filePath={material.file_path}
        />
      </DashboardLayout>
    );
  }

  // Desktop Layout
  return (
    <DashboardLayout 
      title={material.title}
      materialId={material.id}
      activeStudyTab={activeTab}
      onStudyTabChange={setActiveTab}
    >
      {/* Main Content - Split View */}
      <div className="flex h-[calc(100vh-8rem)] -m-6 mt-0 overflow-hidden">
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
          className="flex flex-col overflow-hidden relative"
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
            <div className="flex items-center justify-between border-b border-border">
              <div className="overflow-x-auto scrollbar-hide flex-1 relative">
                <TabsList className="justify-start rounded-none bg-transparent p-0 h-auto w-max min-w-full">
                  <TabsTrigger value="tutor-notes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 py-3 gap-1.5">
                    <BookOpen className="w-4 h-4" />
                    <span className="text-xs">Notes</span>
                  </TabsTrigger>
                  <TabsTrigger value="summaries" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 py-3 gap-1.5">
                    <FileText className="w-4 h-4" />
                    <span className="text-xs">Summary</span>
                  </TabsTrigger>
                  <TabsTrigger value="flashcards" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 py-3 gap-1.5">
                    <Lightbulb className="w-4 h-4" />
                    <span className="text-xs">Cards</span>
                  </TabsTrigger>
                  <TabsTrigger value="questions" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 py-3 gap-1.5">
                    <Brain className="w-4 h-4" />
                    <span className="text-xs">Quiz</span>
                    <PremiumBadge className="hidden sm:inline-flex" />
                  </TabsTrigger>
                  <TabsTrigger value="concept-map" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 py-3 gap-1.5">
                    <Network className="w-4 h-4" />
                    <span className="text-xs">Map</span>
                    <PremiumBadge className="hidden sm:inline-flex" />
                  </TabsTrigger>
                  <TabsTrigger value="chat" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 py-3 gap-1.5">
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-xs">Chat</span>
                  </TabsTrigger>
                </TabsList>
              </div>
              <div className="flex gap-1 px-2">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowExportModal(true)}>
                  <Download className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/materials/${material.id}/settings`)}>
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>

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
                <PremiumGate feature="practiceQuestions">
                  <PracticeQuestionsTab materialId={material.id} />
                </PremiumGate>
              </TabsContent>
              <TabsContent value="concept-map" className="m-0 h-full">
                <PremiumGate feature="conceptMaps">
                  <ConceptMapTab materialId={material.id} />
                </PremiumGate>
              </TabsContent>
              <TabsContent value="chat" className="m-0 h-full">
                <AIChatTab materialId={material.id} extractedContent={material.extracted_content} />
              </TabsContent>
            </div>
          </Tabs>
        </motion.div>
      </div>

      <ExportModal
        open={showExportModal}
        onOpenChange={setShowExportModal}
        materialId={material.id}
        materialTitle={material.title}
        filePath={material.file_path}
      />
    </DashboardLayout>
  );
}
