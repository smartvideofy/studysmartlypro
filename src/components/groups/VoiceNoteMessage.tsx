import React, { useState, useRef, useEffect } from "react";
import { Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface VoiceNoteMessageProps {
  audioUrl: string;
  duration: number;
  isMe: boolean;
}

const PLAYBACK_SPEEDS = [1, 1.5, 2];

export function VoiceNoteMessage({ audioUrl, duration, isMe }: VoiceNoteMessageProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  // Generate fake waveform data for visualization
  useEffect(() => {
    const data = Array.from({ length: 30 }, () => Math.random() * 0.8 + 0.2);
    setWaveformData(data);
  }, []);

  // Get signed URL for audio
  useEffect(() => {
    const getSignedUrl = async () => {
      const { data } = await supabase.storage
        .from("group-attachments")
        .createSignedUrl(audioUrl, 3600);
      
      if (data?.signedUrl) {
        setSignedUrl(data.signedUrl);
      }
    };

    if (audioUrl) {
      getSignedUrl();
    }
  }, [audioUrl]);

  useEffect(() => {
    if (!signedUrl) return;

    const audio = new Audio(signedUrl);
    audioRef.current = audio;

    audio.addEventListener("loadedmetadata", () => {
      setTotalDuration(audio.duration);
    });

    audio.addEventListener("timeupdate", () => {
      setCurrentTime(audio.currentTime);
      setProgress((audio.currentTime / audio.duration) * 100);
    });

    audio.addEventListener("ended", () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    });

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, [signedUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.playbackRate = playbackSpeed;
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const cycleSpeed = () => {
    const currentIndex = PLAYBACK_SPEEDS.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % PLAYBACK_SPEEDS.length;
    const newSpeed = PLAYBACK_SPEEDS[nextIndex];
    setPlaybackSpeed(newSpeed);
    
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = clickPosition * audioRef.current.duration;
  };

  return (
    <div className={cn(
      "flex items-center gap-2 min-w-[180px] max-w-[250px]",
      isMe ? "flex-row" : "flex-row"
    )}>
      {/* Play/Pause Button */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-10 w-10 rounded-full shrink-0",
          isMe 
            ? "bg-white/20 hover:bg-white/30 text-white" 
            : "bg-primary/10 hover:bg-primary/20 text-primary"
        )}
        onClick={togglePlay}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 fill-current" />
        ) : (
          <Play className="w-4 h-4 fill-current ml-0.5" />
        )}
      </Button>

      {/* Waveform and Progress */}
      <div className="flex-1 flex flex-col gap-1">
        {/* Waveform */}
        <div 
          className="flex items-center gap-[2px] h-6 cursor-pointer"
          onClick={handleWaveformClick}
        >
          {waveformData.map((height, index) => {
            const isPlayed = (index / waveformData.length) * 100 <= progress;
            return (
              <div
                key={index}
                className={cn(
                  "w-[3px] rounded-full transition-colors",
                  isMe
                    ? isPlayed ? "bg-white" : "bg-white/40"
                    : isPlayed ? "bg-primary" : "bg-primary/30"
                )}
                style={{ height: `${height * 24}px` }}
              />
            );
          })}
        </div>

        {/* Duration and Speed */}
        <div className="flex items-center justify-between text-[10px]">
          <span className={isMe ? "text-white/70" : "text-muted-foreground"}>
            {formatTime(currentTime)} / {formatTime(totalDuration)}
          </span>
          <button
            onClick={cycleSpeed}
            className={cn(
              "font-medium px-1.5 py-0.5 rounded",
              isMe 
                ? "text-white/70 hover:bg-white/10" 
                : "text-muted-foreground hover:bg-secondary"
            )}
          >
            {playbackSpeed}x
          </button>
        </div>
      </div>
    </div>
  );
}
