import { useState } from "react";
import { Loader2, Lock, Globe, Users } from "lucide-react";
import {
  ResponsiveModal,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
  ResponsiveModalFooter,
  ResponsiveModalBody,
} from "@/components/ui/responsive-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useCreateGroup } from "@/hooks/useGroups";

interface CreateGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateGroupModal({ open, onOpenChange }: CreateGroupModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  
  const createGroup = useCreateGroup();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) return;
    
    await createGroup.mutateAsync({
      name: name.trim(),
      description: description.trim() || undefined,
      is_private: isPrivate,
    });
    
    setName("");
    setDescription("");
    setIsPrivate(false);
    onOpenChange(false);
  };

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange}>
      <form onSubmit={handleSubmit}>
        <ResponsiveModalHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <ResponsiveModalTitle>Create Study Group</ResponsiveModalTitle>
              <ResponsiveModalDescription>
                Create a new study group to collaborate with others.
              </ResponsiveModalDescription>
            </div>
          </div>
        </ResponsiveModalHeader>
        
        <ResponsiveModalBody>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="name">Group Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., AP Biology Study Group"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this group about?"
                rows={3}
              />
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
              <div className="flex items-center gap-3">
                {isPrivate ? (
                  <Lock className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <Globe className="w-5 h-5 text-muted-foreground" />
                )}
                <div>
                  <p className="font-medium text-sm">Private Group</p>
                  <p className="text-xs text-muted-foreground">
                    {isPrivate 
                      ? "Only invited members can join" 
                      : "Anyone can discover and join"}
                  </p>
                </div>
              </div>
              <Switch
                checked={isPrivate}
                onCheckedChange={setIsPrivate}
              />
            </div>
          </div>
        </ResponsiveModalBody>
        
        <ResponsiveModalFooter className="pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 md:flex-none"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!name.trim() || createGroup.isPending}
            className="flex-1 md:flex-none"
          >
            {createGroup.isPending && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            Create Group
          </Button>
        </ResponsiveModalFooter>
      </form>
    </ResponsiveModal>
  );
}
