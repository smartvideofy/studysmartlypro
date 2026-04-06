import { useNavigate } from "react-router-dom";
import { useIsBlocked } from "./useSubscription";
import { toast } from "sonner";

export function useActionGate() {
  const { isBlocked, isLoading } = useIsBlocked();
  const navigate = useNavigate();

  const guardAction = (action: () => void) => {
    if (isBlocked) {
      toast.error("Subscribe to unlock this feature", {
        description: "Your trial has ended. Subscribe to create and generate new content.",
        action: { label: "View Plans", onClick: () => navigate("/pricing") },
      });
      return;
    }
    action();
  };

  return { guardAction, isExpired: isBlocked, isLoading };
}
