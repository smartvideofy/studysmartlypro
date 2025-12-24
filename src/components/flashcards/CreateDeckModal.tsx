import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Layers, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useCreateDeck, useUpdateDeck, FlashcardDeck } from "@/hooks/useFlashcards";

const deckSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  subject: z.string().trim().max(50, "Subject must be less than 50 characters").optional(),
  description: z.string().trim().max(500, "Description must be less than 500 characters").optional(),
});

type DeckFormValues = z.infer<typeof deckSchema>;

interface CreateDeckModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deck?: FlashcardDeck | null;
  onSuccess?: (deckId: string) => void;
}

export function CreateDeckModal({ open, onOpenChange, deck, onSuccess }: CreateDeckModalProps) {
  const createDeck = useCreateDeck();
  const updateDeck = useUpdateDeck();
  const isEditing = !!deck;

  const form = useForm<DeckFormValues>({
    resolver: zodResolver(deckSchema),
    defaultValues: {
      name: deck?.name || "",
      subject: deck?.subject || "",
      description: deck?.description || "",
    },
  });

  const onSubmit = async (values: DeckFormValues) => {
    try {
      if (isEditing && deck) {
        await updateDeck.mutateAsync({
          id: deck.id,
          name: values.name,
          subject: values.subject || null,
          description: values.description || null,
        });
        onOpenChange(false);
      } else {
        const newDeck = await createDeck.mutateAsync({
          name: values.name,
          subject: values.subject,
          description: values.description,
        });
        form.reset();
        onOpenChange(false);
        onSuccess?.(newDeck.id);
      }
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const isLoading = createDeck.isPending || updateDeck.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Layers className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle>{isEditing ? "Edit Deck" : "Create New Deck"}</DialogTitle>
              <DialogDescription>
                {isEditing 
                  ? "Update your flashcard deck details" 
                  : "Create a new flashcard deck to start learning"
                }
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deck Name *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Spanish Vocabulary" 
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
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Languages, Science, History" 
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="What will you learn in this deck?" 
                      className="resize-none"
                      rows={3}
                      {...field} 
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isEditing ? "Saving..." : "Creating..."}
                  </>
                ) : (
                  isEditing ? "Save Changes" : "Create Deck"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
