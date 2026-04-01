 import { useNavigate } from "react-router-dom";
 import { motion, AnimatePresence } from "framer-motion";
 import { Sparkles, Clock } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Progress } from "@/components/ui/progress";
 import { useTrialStatus } from "@/hooks/useSubscription";
 import { cn } from "@/lib/utils";
 
 export function TrialBanner() {
   const navigate = useNavigate();
   const { isOnTrial, trialDaysRemaining, trialEndDate } = useTrialStatus();
 
   if (!isOnTrial) return null;
 
   const urgency = trialDaysRemaining <= 1 ? 'high' : trialDaysRemaining <= 2 ? 'medium' : 'low';
   
   // Calculate progress (7 days total trial)
   const totalTrialDays = 3;
   const daysUsed = totalTrialDays - trialDaysRemaining;
   const progressPercent = Math.min(100, (daysUsed / totalTrialDays) * 100);
 
   return (
     <motion.div
       initial={{ opacity: 0, y: -10 }}
       animate={{ opacity: 1, y: 0 }}
       className={cn(
         "flex flex-col gap-2 px-4 py-3 text-sm border-b",
        urgency === 'high' && "bg-destructive/10 border-destructive/20 text-destructive",
        urgency === 'medium' && "bg-warning/10 border-warning/20 text-warning-foreground",
         urgency === 'low' && "bg-primary/10 border-primary/20"
       )}
     >
       {/* Top row: Icon, text, and CTA */}
       <div className="flex items-center justify-between gap-4">
         <div className="flex items-center gap-2 min-w-0">
           <motion.div
             animate={urgency === 'high' ? { scale: [1, 1.2, 1] } : {}}
             transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
           >
             {urgency === 'high' ? (
               <Clock className="w-4 h-4 shrink-0" />
             ) : (
               <Sparkles className="w-4 h-4 shrink-0" />
             )}
           </motion.div>
           <span className="font-medium truncate">
             {trialDaysRemaining === 0
               ? "Your trial ends today!"
               : trialDaysRemaining === 1
               ? "Your trial ends tomorrow!"
               : `${trialDaysRemaining} days left in your Pro trial`}
           </span>
         </div>
         
         <Button
           size="sm"
           variant={urgency === 'high' ? 'destructive' : 'default'}
           onClick={() => navigate('/pricing')}
           className="h-7 text-xs shrink-0"
         >
           Subscribe Now
         </Button>
       </div>
       
       {/* Progress bar */}
       <div className="flex items-center gap-3">
         <div className="flex-1 relative">
           <Progress 
             value={progressPercent} 
             className={cn(
               "h-1.5",
               urgency === 'high' && "[&>div]:bg-destructive",
              urgency === 'medium' && "[&>div]:bg-warning",
               urgency === 'low' && "[&>div]:bg-primary"
             )}
           />
         </div>
         <span className="text-xs text-muted-foreground whitespace-nowrap">
           Day {daysUsed} of {totalTrialDays}
         </span>
       </div>
     </motion.div>
   );
 }