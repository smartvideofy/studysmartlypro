import { useState } from "react";
import { Loader2, Settings, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useUpdateGroup, useDeleteGroup, StudyGroup } from "@/hooks/useGroups";
import { Separator } from "@/components/ui/separator";

interface GroupSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: StudyGroup;
  onDelete: () => void;
}

export function GroupSettingsModal({ 
  open, 
  onOpenChange, 
  group,
  onDelete
}: GroupSettingsModalProps) {
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description || "");
  const [isPrivate, setIsPrivate] = useState(group.is_private);
  
  const updateGroup = useUpdateGroup();
  const deleteGroup = useDeleteGroup();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await updateGroup.mutateAsync({
      id: group.id,
      name: name.trim(),
      description: description.trim() || null,
      is_private: isPrivate,
    });
    onOpenChange(false);
  };

  const handleDelete = async () => {
    await deleteGroup.mutateAsync(group.id);
    onDelete();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Group Settings
          </DialogTitle>
          <DialogDescription>
            Update your group details and preferences.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Group Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter group name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this group about?"
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <Label htmlFor="private">Private Group</Label>
              <p className="text-xs text-muted-foreground">
                Only invited members can join
              </p>
            </div>
            <Switch
              id="private"
              checked={isPrivate}
              onCheckedChange={setIsPrivate}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateGroup.isPending}>
              {updateGroup.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>

        <Separator className="my-2" />

        {/* Danger Zone */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-destructive">Danger Zone</h4>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="w-full">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Group
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Group?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete "{group.name}" and all its messages, 
                  shared notes, and member data. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleteGroup.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Delete Group"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </DialogContent>
    </Dialog>
  );
}