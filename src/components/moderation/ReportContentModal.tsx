import { useState } from "react";
import { Loader2, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  RadioGroup, RadioGroupItem,
} from "@/components/ui/radio-group";
import {
  ResponsiveModal,
  ResponsiveModalBody,
  ResponsiveModalDescription,
  ResponsiveModalFooter,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
} from "@/components/ui/responsive-modal";
import { useReportContent, type ReportTargetType } from "@/hooks/useModeration";

const REASONS = [
  { value: "spam",       label: "Spam or scam" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "hate",       label: "Hate speech" },
  { value: "explicit",   label: "Sexual or explicit content" },
  { value: "violence",   label: "Violence or threats" },
  { value: "other",      label: "Something else" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentType: ReportTargetType;
  contentId: string;
  reportedUserId?: string;
}

export function ReportContentModal({
  open, onOpenChange, contentType, contentId, reportedUserId,
}: Props) {
  const [reason, setReason] = useState("spam");
  const [details, setDetails] = useState("");
  const report = useReportContent();

  const submit = async () => {
    await report.mutateAsync({
      contentType,
      contentId,
      reportedUserId,
      reason,
      details: details.trim() || undefined,
    });
    setDetails("");
    setReason("spam");
    onOpenChange(false);
  };

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange}>
      <ResponsiveModalHeader>
        <ResponsiveModalTitle className="flex items-center gap-2">
          <Flag className="w-4 h-4 text-destructive" /> Report {contentType}
        </ResponsiveModalTitle>
        <ResponsiveModalDescription>
          Reports are private and reviewed by our moderation team.
        </ResponsiveModalDescription>
      </ResponsiveModalHeader>

      <ResponsiveModalBody className="space-y-4">
        <div className="space-y-2">
          <Label>Reason</Label>
          <RadioGroup value={reason} onValueChange={setReason} className="space-y-1">
            {REASONS.map((r) => (
              <label
                key={r.value}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 cursor-pointer hover:bg-muted/60"
              >
                <RadioGroupItem value={r.value} id={`reason-${r.value}`} />
                <span className="text-sm">{r.label}</span>
              </label>
            ))}
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="report-details">Additional details (optional)</Label>
          <Textarea
            id="report-details"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Add any context that will help us review this report."
            maxLength={500}
            className="min-h-[100px]"
          />
        </div>
      </ResponsiveModalBody>

      <ResponsiveModalFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={report.isPending}>
          Cancel
        </Button>
        <Button
          onClick={submit}
          disabled={report.isPending}
          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
        >
          {report.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Submit report
        </Button>
      </ResponsiveModalFooter>
    </ResponsiveModal>
  );
}
