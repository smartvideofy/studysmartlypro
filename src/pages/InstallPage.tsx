import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Download, 
  Smartphone, 
  Zap, 
  WifiOff, 
  Bell, 
  ArrowLeft,
  Share,
  MoreVertical,
  Plus,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import PageTransition from '@/components/PageTransition';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallPage = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
  };

  const benefits = [
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Instant loading with cached content'
    },
    {
      icon: WifiOff,
      title: 'Works Offline',
      description: 'Study even without internet connection'
    },
    {
      icon: Bell,
      title: 'Stay Notified',
      description: 'Get reminders for your study sessions'
    },
    {
      icon: Smartphone,
      title: 'Native Feel',
      description: 'Full-screen experience like a real app'
    }
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <div className="container max-w-2xl mx-auto px-4 py-8">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Download className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Install Studily</h1>
            <p className="text-muted-foreground">
              Add Studily to your home screen for the best experience
            </p>
          </motion.div>

          {isInstalled ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 text-center mb-8"
            >
              <Check className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h2 className="text-xl font-semibold text-foreground mb-2">Already Installed!</h2>
              <p className="text-muted-foreground">
                Studily is installed on your device. Open it from your home screen.
              </p>
            </motion.div>
          ) : deferredPrompt ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8"
            >
              <Button onClick={handleInstall} size="lg" className="w-full gap-2 h-14 text-lg">
                <Download className="w-5 h-5" />
                Install Studily
              </Button>
            </motion.div>
          ) : (
            <Card className="mb-8">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4">
                  {isIOS ? 'Install on iPhone/iPad' : 'Install on Android'}
                </h2>
                
                {isIOS ? (
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-primary font-semibold">1</span>
                      </div>
                      <div>
                        <p className="font-medium">Tap the Share button</p>
                        <p className="text-sm text-muted-foreground">
                          Look for the <Share className="w-4 h-4 inline" /> icon at the bottom of Safari
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-primary font-semibold">2</span>
                      </div>
                      <div>
                        <p className="font-medium">Scroll down and tap "Add to Home Screen"</p>
                        <p className="text-sm text-muted-foreground">
                          Look for the <Plus className="w-4 h-4 inline" /> Add to Home Screen option
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-primary font-semibold">3</span>
                      </div>
                      <div>
                        <p className="font-medium">Tap "Add" to confirm</p>
                        <p className="text-sm text-muted-foreground">
                          Studily will appear on your home screen
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-primary font-semibold">1</span>
                      </div>
                      <div>
                        <p className="font-medium">Tap the menu button</p>
                        <p className="text-sm text-muted-foreground">
                          Look for <MoreVertical className="w-4 h-4 inline" /> in your browser's top right
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-primary font-semibold">2</span>
                      </div>
                      <div>
                        <p className="font-medium">Tap "Install app" or "Add to Home screen"</p>
                        <p className="text-sm text-muted-foreground">
                          The exact wording depends on your browser
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-primary font-semibold">3</span>
                      </div>
                      <div>
                        <p className="font-medium">Confirm the installation</p>
                        <p className="text-sm text-muted-foreground">
                          Studily will be added to your home screen and app drawer
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <h2 className="text-xl font-semibold mb-4">Why install Studily?</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardContent className="p-4 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <benefit.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{benefit.title}</h3>
                      <p className="text-sm text-muted-foreground">{benefit.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default InstallPage;
