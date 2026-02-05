 import { useNavigate } from "react-router-dom";
 import { motion } from "framer-motion";
 import { Sparkles, Clock } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { useTrialStatus } from "@/hooks/useSubscription";
 import { cn } from "@/lib/utils";
 
 export function TrialBanner() {
   const navigate = useNavigate();
   const { isOnTrial, trialDaysRemaining } = useTrialStatus();
 
   if (!isOnTrial) return null;
 
   const urgency = trialDaysRemaining <= 2 ? 'high' : trialDaysRemaining <= 4 ? 'medium' : 'low';
 
   return (
     <motion.div
       initial={{ opacity: 0, y: -10 }}
       animate={{ opacity: 1, y: 0 }}
       className={cn(
         "flex items-center justify-between px-4 py-2.5 text-sm border-b",
        urgency === 'high' && "bg-destructive/10 border-destructive/20 text-destructive",
        urgency === 'medium' && "bg-warning/10 border-warning/20 text-warning-foreground",
         urgency === 'low' && "bg-primary/10 border-primary/20"
       )}
     >
       <div className="flex items-center gap-2">
         {urgency === 'high' ? (
          <Clock className="w-4 h-4" />
         ) : (
          <Sparkles className="w-4 h-4" />
         )}
        <span className="font-medium">
           {trialDaysRemaining === 1
             ? "Your trial ends tomorrow!"
             : trialDaysRemaining === 0
             ? "Your trial ends today!"
             : `${trialDaysRemaining} days left in your Pro trial`}
         </span>
       </div>
       <Button
         size="sm"
         variant={urgency === 'high' ? 'destructive' : 'default'}
         onClick={() => navigate('/pricing')}
         className="h-7 text-xs"
       >
         Subscribe Now
       </Button>
     </motion.div>
   );
 }