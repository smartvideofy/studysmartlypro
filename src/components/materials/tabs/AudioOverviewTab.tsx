import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Headphones, 
  Play, 
  Pause,
  Volume2,
  VolumeX,
  Loader2,
  FileText,
  Sparkles,
  RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface AudioOverviewTabProps {
  materialId: string;
}

type Style = 'deep_dive' | 'brief' | 'debate' | 'critique';

const STYLES: { value: Style; label: string; description: string }[] = [
  { value: 'deep_dive', label: 'Deep Dive', description: 'Comprehensive exploration' },
  { value: 'brief', label: 'Brief', description: 'Quick 2-3 min summary' },
  { value: 'debate', label: 'Debate', description: 'Multiple perspectives' },
  { value: 'critique', label: 'Critique', description: 'Critical analysis' },
];

export default function AudioOverviewTab({ materialId }: AudioOverviewTabProps) {
  const [style, setStyle] = useState<Style>('deep_dive');
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [script, setScript] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl]);

  const generateAudio = async () => {
    setIsGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error("Please sign in to generate audio");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-audio-overview`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ materialId, style }),
        }
      );

      if (response.status === 429) {
        toast.error("Rate limited. Please try again later.");
        return;
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setScript(data.script);
      if (data.audioUrl) {
        setAudioUrl(data.audioUrl);
        toast.success(data.cached ? "Audio loaded!" : "Audio generated!");
      } else {
        toast.info("Script generated. Audio generation requires ElevenLabs API key.");
      }
    } catch (error) {
      console.error("Audio generation error:", error);
      toast.error("Failed to generate audio overview");
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    if (!audioRef.current) return;
    const newVolume = value[0];
    audioRef.current.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const changePlaybackRate = () => {
    if (!audioRef.current) return;
    const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    audioRef.current.playbackRate = nextRate;
    setPlaybackRate(nextRate);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Headphones className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Audio Overview</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowTranscript(!showTranscript)}
          disabled={!script}
        >
          <FileText className="w-4 h-4 mr-1" />
          {showTranscript ? "Hide" : "Show"} Script
        </Button>
      </div>

      {!audioUrl && !script ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-6"
          >
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Headphones className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Create Audio Overview</h3>
            <p className="text-muted-foreground text-sm max-w-sm mb-6">
              Generate a podcast-style discussion about your study material with two AI hosts.
            </p>
          </motion.div>

          {/* Style Selection */}
          <div className="grid grid-cols-2 gap-2 mb-6 w-full max-w-md">
            {STYLES.map((s) => (
              <Card
                key={s.value}
                className={cn(
                  "p-3 cursor-pointer transition-all hover:border-primary/50",
                  style === s.value && "border-primary bg-primary/5"
                )}
                onClick={() => setStyle(s.value)}
              >
                <p className="font-medium text-sm">{s.label}</p>
                <p className="text-xs text-muted-foreground">{s.description}</p>
              </Card>
            ))}
          </div>

          <Button
            onClick={generateAudio}
            disabled={isGenerating}
            className="gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Audio
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          {/* Audio Player */}
          {audioUrl && (
            <Card className="p-6 mb-4 bg-gradient-to-br from-primary/5 to-transparent">
              <audio ref={audioRef} src={audioUrl} preload="metadata" />
              
              <div className="flex items-center gap-4 mb-4">
                <Button
                  size="icon"
                  variant="default"
                  className="h-12 w-12 rounded-full"
                  onClick={togglePlay}
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5 ml-0.5" />
                  )}
                </Button>

                <div className="flex-1">
                  <Slider
                    value={[currentTime]}
                    max={duration || 100}
                    step={1}
                    onValueChange={handleSeek}
                    className="cursor-pointer"
                  />
                  <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={toggleMute}
                  >
                    {isMuted ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </Button>
                  <Slider
                    value={[isMuted ? 0 : volume]}
                    max={1}
                    step={0.1}
                    onValueChange={handleVolumeChange}
                    className="w-24"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={changePlaybackRate}
                    className="text-xs"
                  >
                    {playbackRate}x
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setAudioUrl(null);
                      setScript(null);
                    }}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Transcript */}
          {showTranscript && script && (
            <ScrollArea className="flex-1 rounded-lg border border-border">
              <div className="p-4">
                <h4 className="text-sm font-medium mb-3 text-muted-foreground">Script</h4>
                <div className="space-y-3 text-sm">
                  {script.split('\n').filter(Boolean).map((line, i) => {
                    const isHost1 = line.toLowerCase().includes('[host1]') || line.toLowerCase().includes('alex');
                    const isHost2 = line.toLowerCase().includes('[host2]') || line.toLowerCase().includes('jordan');
                    
                    return (
                      <div
                        key={i}
                        className={cn(
                          "p-3 rounded-lg",
                          isHost1 && "bg-primary/10 border-l-2 border-primary",
                          isHost2 && "bg-secondary border-l-2 border-accent",
                          !isHost1 && !isHost2 && "text-muted-foreground italic"
                        )}
                      >
                        {line}
                      </div>
                    );
                  })}
                </div>
              </div>
            </ScrollArea>
          )}

          {!showTranscript && !audioUrl && script && (
            <div className="flex-1 flex items-center justify-center">
              <Card className="p-6 text-center max-w-sm">
                <FileText className="w-12 h-12 text-primary/50 mx-auto mb-4" />
                <h4 className="font-medium mb-2">Script Generated</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Audio generation requires an ElevenLabs API key. 
                  View the script to read the content.
                </p>
                <Button variant="outline" onClick={() => setShowTranscript(true)}>
                  View Script
                </Button>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
