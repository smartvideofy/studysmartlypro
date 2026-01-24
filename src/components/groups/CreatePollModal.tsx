import { useState } from "react";
import { Plus, Trash2, BarChart3 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useCreatePoll } from "@/hooks/useGroupPolls";

interface CreatePollModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
}

export function CreatePollModal({ open, onOpenChange, groupId }: CreatePollModalProps) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const createPoll = useCreatePoll();

  const handleAddOption = () => {
    if (options.length < 6) {
      setOptions([...options, ""]);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validOptions = options.filter(o => o.trim());
    if (!question.trim() || validOptions.length < 2) {
      return;
    }

    await createPoll.mutateAsync({
      groupId,
      question: question.trim(),
      options: validOptions,
      allowMultiple,
      isAnonymous,
    });

    // Reset form
    setQuestion("");
    setOptions(["", ""]);
    setAllowMultiple(false);
    setIsAnonymous(false);
    onOpenChange(false);
  };

  const isValid = question.trim() && options.filter(o => o.trim()).length >= 2;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Create Poll
          </DialogTitle>
          <DialogDescription>
            Ask the group a question and let them vote
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="question">Question</Label>
            <Input
              id="question"
              placeholder="What would you like to ask?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label>Options</Label>
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    maxLength={100}
                  />
                  {options.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveOption(index)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 6 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddOption}
                className="mt-2"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Option
              </Button>
            )}
          </div>

          <div className="space-y-3 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Allow multiple votes</p>
                <p className="text-xs text-muted-foreground">Members can select more than one option</p>
              </div>
              <Switch
                checked={allowMultiple}
                onCheckedChange={setAllowMultiple}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Anonymous voting</p>
                <p className="text-xs text-muted-foreground">Hide who voted for what</p>
              </div>
              <Switch
                checked={isAnonymous}
                onCheckedChange={setIsAnonymous}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isValid || createPoll.isPending}
              className="flex-1"
            >
              {createPoll.isPending ? "Creating..." : "Create Poll"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
