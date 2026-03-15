import { Download, Smartphone, Wifi, WifiOff, Zap, Share, Plus, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { SEOHead } from '@/components/seo/SEOHead';
import { motion } from 'framer-motion';

const features = [
  { icon: Zap, title: 'Lightning Fast', description: 'Loads instantly, even on slow networks' },
  { icon: WifiOff, title: 'Works Offline', description: 'Study your flashcards without internet' },
  { icon: Smartphone, title: 'Home Screen', description: 'Launch like a native app from your phone' },
];

export default function InstallPage() {
  const { canInstall, isInstalled, isIOS, install } = usePWAInstall();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <SEOHead
        title="Install Studily"
        description="Install Studily on your device for offline access, fast loading, and a native app experience."
        url="/install"
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8 text-center"
      >
        <div className="space-y-3">
          <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
            <Download className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Install Studily</h1>
          <p className="text-muted-foreground">
            Get the full app experience — fast, offline-ready, and always one tap away.
          </p>
        </div>

        <div className="grid gap-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * (i + 1) }}
            >
              <Card className="border-border/50">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <f.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-sm text-foreground">{f.title}</p>
                    <p className="text-xs text-muted-foreground">{f.description}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {isInstalled ? (
          <div className="bg-primary/10 text-primary rounded-xl p-4 text-sm font-medium">
            ✅ Studily is already installed on this device!
          </div>
        ) : canInstall ? (
          <Button size="lg" className="w-full text-base h-12" onClick={install}>
            <Download className="w-5 h-5 mr-2" /> Install Studily
          </Button>
        ) : isIOS ? (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4 space-y-3">
              <p className="text-sm font-semibold text-foreground">Install on iPhone / iPad</p>
              <div className="space-y-2 text-left">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">1</div>
                  Tap <Share className="w-4 h-4 inline text-primary" /> <span className="font-medium text-foreground">Share</span> in Safari
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">2</div>
                  Tap <Plus className="w-4 h-4 inline text-primary" /> <span className="font-medium text-foreground">Add to Home Screen</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">3</div>
                  Tap <span className="font-medium text-foreground">Add</span> to confirm
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground mb-1">Install from your browser</p>
              <p>Open the browser menu and tap <span className="font-medium text-foreground">"Install app"</span> or <span className="font-medium text-foreground">"Add to Home Screen"</span>.</p>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
