import { useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Folder, Loader2 } from "lucide-react";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useCreateFolder, useUpdateFolder, Folder as FolderType } from "@/hooks/useNotes";

const folderSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(50, "Name must be less than 50 characters"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
});

type FolderFormValues = z.infer<typeof folderSchema>;

const colorOptions = [
  "#6366f1", // Indigo
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#ef4444", // Red
  "#f97316", // Orange
  "#eab308", // Yellow
  "#22c55e", // Green
  "#14b8a6", // Teal
  "#3b82f6", // Blue
  "#6b7280", // Gray
];

interface CreateFolderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folder?: FolderType | null;
}

export function CreateFolderModal({ open, onOpenChange, folder }: CreateFolderModalProps) {
  const createFolder = useCreateFolder();
  const updateFolder = useUpdateFolder();
  const isEditing = !!folder;

  const form = useForm<FolderFormValues>({
    resolver: zodResolver(folderSchema),
    defaultValues: {
      name: folder?.name || "",
      color: folder?.color || "#6366f1",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: folder?.name || "",
        color: folder?.color || "#6366f1",
      });
    }
  }, [folder, open, form]);

  const onSubmit = async (values: FolderFormValues) => {
    try {
      if (isEditing && folder) {
        await updateFolder.mutateAsync({
          id: folder.id,
          name: values.name,
          color: values.color,
        });
      } else {
        await createFolder.mutateAsync({
          name: values.name,
          color: values.color,
        });
      }
      form.reset();
      onOpenChange(false);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const isLoading = createFolder.isPending || updateFolder.isPending;
  const selectedColor = form.watch("color");

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange}>
      <ResponsiveModalHeader>
        <div className="flex items-center gap-3 mb-2">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${selectedColor}20` }}
          >
            <Folder className="w-5 h-5" style={{ color: selectedColor }} />
          </div>
          <div className="text-left">
            <ResponsiveModalTitle>
              {isEditing ? "Edit Folder" : "Create New Folder"}
            </ResponsiveModalTitle>
            <ResponsiveModalDescription>
              {isEditing 
                ? "Update your folder details" 
                : "Organize your notes into folders"
              }
            </ResponsiveModalDescription>
          </div>
        </div>
      </ResponsiveModalHeader>

      <ResponsiveModalBody>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Folder Name *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Chemistry, History" 
                      {...field} 
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <div className="flex flex-wrap gap-2">
                      {colorOptions.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => field.onChange(color)}
                          className={`w-9 h-9 md:w-8 md:h-8 rounded-lg transition-all min-w-[36px] ${
                            field.value === color 
                              ? "ring-2 ring-offset-2 ring-primary scale-110" 
                              : "hover:scale-105"
                          }`}
                          style={{ backgroundColor: color }}
                          disabled={isLoading}
                        />
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <ResponsiveModalFooter className="pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
                className="flex-1 md:flex-none"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1 md:flex-none">
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isEditing ? "Saving..." : "Creating..."}
                  </>
                ) : (
                  isEditing ? "Save Changes" : "Create Folder"
                )}
              </Button>
            </ResponsiveModalFooter>
          </form>
        </Form>
      </ResponsiveModalBody>
    </ResponsiveModal>
  );
}
