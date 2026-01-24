import { useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreditCard, Loader2 } from "lucide-react";
import {
  ResponsiveModal,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
  ResponsiveModalFooter,
  ResponsiveModalBody,
} from "@/components/ui/responsive-modal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useCreateFlashcard, useUpdateFlashcard, Flashcard } from "@/hooks/useFlashcards";

const flashcardSchema = z.object({
  front: z.string().trim().min(1, "Front side is required").max(1000, "Front side must be less than 1000 characters"),
  back: z.string().trim().min(1, "Back side is required").max(2000, "Back side must be less than 2000 characters"),
  hint: z.string().trim().max(500, "Hint must be less than 500 characters").optional(),
});

type FlashcardFormValues = z.infer<typeof flashcardSchema>;

interface FlashcardEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deckId: string;
  flashcard?: Flashcard | null;
}

export function FlashcardEditorModal({ open, onOpenChange, deckId, flashcard }: FlashcardEditorModalProps) {
  const createFlashcard = useCreateFlashcard();
  const updateFlashcard = useUpdateFlashcard();
  const isEditing = !!flashcard;

  const form = useForm<FlashcardFormValues>({
    resolver: zodResolver(flashcardSchema),
    defaultValues: {
      front: flashcard?.front || "",
      back: flashcard?.back || "",
      hint: flashcard?.hint || "",
    },
  });

  // Reset form when flashcard changes
  useEffect(() => {
    if (open) {
      form.reset({
        front: flashcard?.front || "",
        back: flashcard?.back || "",
        hint: flashcard?.hint || "",
      });
    }
  }, [flashcard, open, form]);

  const onSubmit = async (values: FlashcardFormValues) => {
    try {
      if (isEditing && flashcard) {
        await updateFlashcard.mutateAsync({
          id: flashcard.id,
          deck_id: deckId,
          front: values.front,
          back: values.back,
          hint: values.hint || null,
        });
      } else {
        await createFlashcard.mutateAsync({
          deck_id: deckId,
          front: values.front,
          back: values.back,
          hint: values.hint,
        });
        form.reset({ front: "", back: "", hint: "" });
      }
      onOpenChange(false);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const isLoading = createFlashcard.isPending || updateFlashcard.isPending;

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange} className="sm:max-w-lg">
      <ResponsiveModalHeader>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-accent" />
          </div>
          <div className="text-left">
            <ResponsiveModalTitle>{isEditing ? "Edit Flashcard" : "Add New Flashcard"}</ResponsiveModalTitle>
            <ResponsiveModalDescription>
              {isEditing 
                ? "Update your flashcard content" 
                : "Create a new flashcard for your deck"
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
              name="front"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Front Side (Question) *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter the question or term..." 
                      className="resize-none min-h-[100px]"
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
              name="back"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Back Side (Answer) *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter the answer or definition..." 
                      className="resize-none min-h-[100px]"
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
              name="hint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hint (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add a hint to help remember..." 
                      className="resize-none"
                      rows={2}
                      {...field} 
                      disabled={isLoading}
                    />
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
                    {isEditing ? "Saving..." : "Adding..."}
                  </>
                ) : (
                  isEditing ? "Save Changes" : "Add Card"
                )}
              </Button>
            </ResponsiveModalFooter>
          </form>
        </Form>
      </ResponsiveModalBody>
    </ResponsiveModal>
  );
}
