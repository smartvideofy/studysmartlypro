import { useEffect, useState } from "react";
import { emitDailyActivity, readingActivityForTab, READ_DWELL_SECONDS } from "@/lib/recordActivity";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  FileText,
  Lightbulb,
  MessageSquare,
  Brain,
  Network,
  Settings,
  Download,
  Eye,
  EyeOff,
  AlertTriangle,
  Loader2,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStudyMaterial, type StudyMaterial } from "@/hooks/useStudyMaterials";
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
import { isPlaceholderContent, rebuildMaterial } from "@/lib/rebuildMaterial";
import { cn } from "@/lib/utils";

interface StudyTab {
  value: string;
  label: string;
  icon: LucideIcon;
  /** Reading tabs get a comfortable line length; the map and chat use the full width. */
  wide?: boolean;
}

const STUDY_TABS: StudyTab[] = [
  { value: "tutor-notes", label: "Notes", icon: BookOpen },
  { value: "summaries", label: "Summary", icon: FileText },
  { value: "flashcards", label: "Flashcards", icon: Lightbulb },
  { value: "questions", label: "Quiz", icon: Brain },
  { value: "concept-map", label: "Concept map", icon: Network, wide: true },
  { value: "chat", label: "Ask AI", icon: MessageSquare },
];

const TRIGGER_CLASS =
  "rounded-none border-b-2 border-transparent bg-transparent px-3 py-3 gap-2 text-sm text-muted-foreground " +
  "data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none";

function StudyTabContent({ material, tab }: { material: StudyMaterial; tab: StudyTab }) {
  const body = (() => {
    switch (tab.value) {
      case "tutor-notes":
        return <TutorNotesTab materialId={material.id} />;
      case "summaries":
        return <SummariesTab materialId={material.id} />;
      case "flashcards":
        return <FlashcardsTab materialId={material.id} />;
      case "questions":
        return <PracticeQuestionsTab materialId={material.id} />;
      case "concept-map":
        return <ConceptMapTab materialId={material.id} />;
      default:
        return <AIChatTab materialId={material.id} extractedContent={material.extracted_content} />;
    }
  })();
  return (
    <TabsContent value={tab.value} className="m-0 h-full">
      <div className={cn("h-full w-full", !tab.wide && "mx-auto max-w-4xl")}>{body}</div>
    </TabsContent>
  );
}

/** Shown on materials whose study content was generated from the file name (see rebuildMaterial). */
function RebuildBanner({ material }: { material: StudyMaterial }) {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);

  const rebuild = async () => {
    setBusy(true);
    try {
      await rebuildMaterial(material.id, queryClient);
      toast.success("Your study set was rebuilt from your file.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't rebuild. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-4 mt-4 flex flex-col gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 sm:flex-row sm:items-center">
      <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
      <div className="flex-1 text-sm">
        <p className="font-medium text-foreground">These notes weren't made from your file</p>
        <p className="text-muted-foreground">
          A bug stopped us reading this document, so the notes and cards were guessed from its name. It's fixed: rebuild
          them from the real content (about a minute).
        </p>
      </div>
      <Button onClick={rebuild} disabled={busy} className="gap-2 shrink-0">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        Rebuild from my file
      </Button>
    </div>
  );
}

export default function MaterialWorkspace() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("tutor-notes");
  const [showOriginal, setShowOriginal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const { data: material, isLoading } = useStudyMaterial(id || "");

  // Reading notes, summaries or the concept map for 30s counts as studying (once per material per day).
  const materialId = material?.id;
  useEffect(() => {
    const type = readingActivityForTab(activeTab);
    if (!type || !materialId) return;
    const t = setTimeout(() => {
      void emitDailyActivity({ activityType: type, materialId, durationSeconds: READ_DWELL_SECONDS });
    }, READ_DWELL_SECONDS * 1000);
    return () => clearTimeout(t);
  }, [activeTab, materialId]);

  if (isLoading) {
    return (
      <DashboardLayout title="Loading…">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!material) {
    return (
      <DashboardLayout title="Not found">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Material not found</h2>
            <Button onClick={() => navigate("/materials")}>Back to materials</Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (material.processing_status !== "completed") {
    return <ProcessingStatus material={material} />;
  }

  const needsRebuild = isPlaceholderContent(material.extracted_content);

  const actions = (
    <div className="flex items-center gap-1 shrink-0">
      <Button
        variant={showOriginal ? "secondary" : "ghost"}
        size="sm"
        className="gap-2"
        onClick={() => setShowOriginal((v) => !v)}
        aria-pressed={showOriginal}
      >
        {showOriginal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        <span className={cn(isMobile && "sr-only")}>{showOriginal ? "Hide file" : "Original file"}</span>
      </Button>
      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setShowExportModal(true)} aria-label="Export" title="Export">
        <Download className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        onClick={() => navigate(`/materials/${material.id}/settings`)}
        aria-label="Material settings"
        title="Material settings"
      >
        <Settings className="w-4 h-4" />
      </Button>
    </div>
  );

  // Labels collapse to icons only when the original file panel squeezes the tab bar.
  const labelClass = !isMobile && showOriginal ? "hidden 2xl:inline" : "";

  const tools = (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center gap-2 border-b border-border px-2 sm:px-4">
        <div className="flex-1 min-w-0 overflow-x-auto scrollbar-hide">
          <TabsList className="h-auto w-max justify-start gap-1 rounded-none bg-transparent p-0">
            {STUDY_TABS.map(({ value, label, icon: Icon }) => (
              <TabsTrigger key={value} value={value} className={TRIGGER_CLASS} title={label}>
                <Icon className="w-4 h-4" />
                <span className={labelClass}>{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {!isMobile && actions}
      </div>

      {needsRebuild && <RebuildBanner material={material} />}

      <div className="flex-1 overflow-hidden min-h-0">
        {STUDY_TABS.map((tab) => (
          <StudyTabContent key={tab.value} material={material} tab={tab} />
        ))}
      </div>
    </Tabs>
  );

  return (
    <DashboardLayout title={material.title} materialId={material.id} activeStudyTab={activeTab} onStudyTabChange={setActiveTab}>
      {isMobile ? (
        <div className="flex flex-col h-[calc(100dvh-11rem)] -mx-4 overflow-hidden pb-safe">
          <div className="flex items-center justify-end gap-1 px-2 py-1 border-b border-border">{actions}</div>
          {showOriginal ? (
            <div className="flex-1 overflow-hidden">
              <MaterialViewer material={material} />
            </div>
          ) : (
            tools
          )}
        </div>
      ) : (
        <div className="flex h-[calc(100vh-7rem)] -m-6 mt-0 overflow-hidden">
          <div className="flex-1 min-w-0 flex flex-col">{tools}</div>
          {showOriginal && (
            <aside className="w-[42%] min-w-[340px] max-w-[760px] border-l border-border" aria-label="Original file">
              <MaterialViewer material={material} />
            </aside>
          )}
        </div>
      )}

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
