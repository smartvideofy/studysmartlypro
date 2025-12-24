import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowLeft,
  Save,
  MoreHorizontal,
  Image,
  Mic,
  Link as LinkIcon,
  Sparkles,
  Layers,
  Tag,
  Folder,
  Clock,
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Quote,
  Code
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { cn } from "@/lib/utils";

const toolbarButtons = [
  { icon: Bold, label: "Bold" },
  { icon: Italic, label: "Italic" },
  { icon: Heading1, label: "Heading 1" },
  { icon: Heading2, label: "Heading 2" },
  { icon: List, label: "Bullet List" },
  { icon: ListOrdered, label: "Numbered List" },
  { icon: Quote, label: "Quote" },
  { icon: Code, label: "Code" },
];

const sampleContent = `
# Organic Chemistry - Reactions & Mechanisms

## Introduction
Organic chemistry is the study of carbon-containing compounds. Understanding reaction mechanisms is crucial for predicting products and designing synthesis routes.

## Types of Reactions

### 1. Substitution Reactions
In substitution reactions, an atom or group in a molecule is replaced by another atom or group.

**SN1 Mechanism:**
- Two-step process
- Carbocation intermediate
- Racemization occurs

**SN2 Mechanism:**
- One-step concerted process
- Backside attack
- Inversion of configuration

### 2. Elimination Reactions
Elimination reactions involve the removal of atoms or groups from a molecule to form a double bond.

### 3. Addition Reactions
Addition reactions add atoms or groups to a double or triple bond.

## Key Concepts to Remember
- Nucleophiles are electron-rich species that attack electrophiles
- Leaving groups must be stable after they leave
- Steric hindrance affects reaction rates
`;

export default function NoteEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("Organic Chemistry - Reactions & Mechanisms");
  const [content, setContent] = useState(sampleContent);
  const [selectedFolder, setSelectedFolder] = useState("Chemistry");
  const [tags, setTags] = useState(["organic", "reactions", "mechanisms"]);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
    }, 1000);
  };

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon-sm"
              onClick={() => navigate("/notes")}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Last saved 2 mins ago</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Sparkles className="w-4 h-4" />
              AI Summarize
            </Button>
            <Button variant="outline" size="sm">
              <Layers className="w-4 h-4" />
              Generate Flashcards
            </Button>
            <Button 
              variant="hero" 
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isSaving ? "Saving..." : "Save"}
            </Button>
            <Button variant="ghost" size="icon-sm">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr,280px] gap-6">
          {/* Main Editor */}
          <Card variant="elevated" className="p-6">
            {/* Title */}
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled Note"
              className="text-2xl font-display font-bold border-0 px-0 focus-visible:ring-0 mb-4"
            />

            {/* Toolbar */}
            <div className="flex items-center gap-1 pb-4 mb-4 border-b border-border overflow-x-auto">
              {toolbarButtons.map((btn) => (
                <Button
                  key={btn.label}
                  variant="ghost"
                  size="icon-sm"
                  title={btn.label}
                >
                  <btn.icon className="w-4 h-4" />
                </Button>
              ))}
              <div className="w-px h-6 bg-border mx-2" />
              <Button variant="ghost" size="icon-sm" title="Add Image">
                <Image className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon-sm" title="Add Audio">
                <Mic className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon-sm" title="Add Link">
                <LinkIcon className="w-4 h-4" />
              </Button>
            </div>

            {/* Content Area */}
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start writing your notes..."
              className="w-full min-h-[500px] resize-none bg-transparent border-0 focus:outline-none text-foreground placeholder:text-muted-foreground font-mono text-sm leading-relaxed"
            />
          </Card>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Folder */}
            <Card variant="elevated" className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Folder className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Folder</span>
              </div>
              <select 
                value={selectedFolder}
                onChange={(e) => setSelectedFolder(e.target.value)}
                className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="Chemistry">Chemistry</option>
                <option value="Biology">Biology</option>
                <option value="Mathematics">Mathematics</option>
                <option value="History">History</option>
              </select>
            </Card>

            {/* Tags */}
            <Card variant="elevated" className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Tags</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                    <button 
                      className="ml-1 hover:text-destructive"
                      onClick={() => setTags(tags.filter(t => t !== tag))}
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
              <Input 
                placeholder="Add tag..." 
                className="h-8 text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.currentTarget.value) {
                    setTags([...tags, e.currentTarget.value]);
                    e.currentTarget.value = "";
                  }
                }}
              />
            </Card>

            {/* AI Actions */}
            <Card variant="gradient" className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium">AI Actions</span>
              </div>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Sparkles className="w-4 h-4 text-accent" />
                  Summarize Note
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Layers className="w-4 h-4 text-primary" />
                  Generate Flashcards
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
