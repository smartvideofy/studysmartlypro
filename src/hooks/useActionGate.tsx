import { useNavigate } from "react-router-dom";
import { useIsBlocked } from "./useSubscription";
import { toast } from "sonner";

export function useActionGate() {
  const { isBlocked, isLoading } = useIsBlocked();
  const navigate = useNavigate();

  const guardAction = (action: () => void) => {
    if (isBlocked) {
      toast.error("You've used your free study set", {
        description: "Upgrade to Pro to upload more materials. Everything you've made stays available.",
        action: { label: "Upgrade", onClick: () => navigate("/pricing") },
      });
      return;
    }
    action();
  };

  return { guardAction, isExpired: isBlocked, isLoading };
}
