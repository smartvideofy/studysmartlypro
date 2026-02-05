 import { useNavigate } from 'react-router-dom';
 import { motion } from 'framer-motion';
 import { Lock, BookOpen, Brain, Layers, Crown, Mail } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Card, CardContent } from '@/components/ui/card';
 import logoImage from '@/assets/logo.png';
 
 interface SubscriptionBlockProps {
   userName?: string;
 }
 
 export function SubscriptionBlock({ userName }: SubscriptionBlockProps) {
   const navigate = useNavigate();
   
   return (
     <div className="fixed inset-0 z-50 bg-background flex items-center justify-center p-4">
       <motion.div
         initial={{ opacity: 0, scale: 0.95 }}
         animate={{ opacity: 1, scale: 1 }}
         className="w-full max-w-lg"
       >
         <Card className="border-primary/20 shadow-xl bg-gradient-to-br from-background to-primary/5">
           <CardContent className="pt-8 pb-6 px-6">
             <div className="text-center space-y-6">
               {/* Logo */}
               <motion.div 
                 initial={{ scale: 0.8 }}
                 animate={{ scale: 1 }}
                 transition={{ delay: 0.1 }}
                 className="w-16 h-16 rounded-2xl overflow-hidden mx-auto shadow-lg"
               >
                 <img src={logoImage} alt="Studily" className="w-full h-full object-cover" />
               </motion.div>
               
               {/* Title */}
               <div className="space-y-2">
                 <h1 className="text-2xl font-bold font-display">
                   Your trial has ended
                 </h1>
                 <p className="text-muted-foreground">
                   {userName ? `Thanks for trying Studily, ${userName}!` : 'Thanks for trying Studily!'} 
                   {' '}To continue accessing your notes, flashcards, and AI study tools, choose a plan below.
                 </p>
               </div>
 
               {/* Features reminder */}
               <div className="bg-primary/5 rounded-xl p-4 text-left">
                 <p className="text-sm font-medium mb-3 text-center">Your progress is safe. Subscribe to access:</p>
                 <ul className="space-y-2 text-sm">
                   <li className="flex items-center gap-2">
                     <BookOpen className="w-4 h-4 text-primary flex-shrink-0" />
                     <span>All your study materials</span>
                   </li>
                   <li className="flex items-center gap-2">
                     <Layers className="w-4 h-4 text-primary flex-shrink-0" />
                     <span>Your flashcard decks</span>
                   </li>
                   <li className="flex items-center gap-2">
                     <Brain className="w-4 h-4 text-primary flex-shrink-0" />
                     <span>AI-powered study tools</span>
                   </li>
                 </ul>
               </div>
 
               {/* CTA */}
               <Button 
                 onClick={() => navigate('/pricing')}
                 variant="hero"
                 size="lg"
                 className="w-full"
               >
                 <Crown className="w-4 h-4 mr-2" />
                 Choose a Plan
               </Button>
               
               {/* Support */}
               <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                 <Mail className="w-3 h-3" />
                 Questions? <a href="mailto:support@getstudily.com" className="text-primary hover:underline">Contact support</a>
               </p>
             </div>
           </CardContent>
         </Card>
       </motion.div>
     </div>
   );
 }