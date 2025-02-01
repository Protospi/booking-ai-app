import React, { useEffect, useRef, useState } from 'react';

interface AudioPlayerProps {
  audioUrl: string;
}

export default function AudioPlayer({ audioUrl }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
    });

    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
      const progress = (audio.currentTime / audio.duration) * 100;
      setProgress(progress);
    });

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    });

    return () => {
      audio.pause();
      audio.remove();
    };
  }, [audioUrl]);

  const formatTime = (time: number) => {
    if (!isFinite(time) || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        if (progress >= 100) {
          audioRef.current.currentTime = 0;
          setCurrentTime(0);
          setProgress(0);
        }
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="flex flex-col gap-1 min-w-[240px] max-w-[260px]">
      <div className="flex items-center gap-3">
        <button
          onClick={togglePlay}
          className="p-2 rounded-full bg-zinc-700 text-white hover:bg-zinc-600 transition-colors"
        >
          {isPlaying ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="6" y="4" width="4" height="16"></rect>
              <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          )}
        </button>
        <div className="flex-1 flex flex-col justify-center gap-1 pt-4">
          <div className="h-1.5 bg-zinc-700/50 rounded-full overflow-hidden w-[220px]">
            <div 
              className="h-full bg-white transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-end text-[10px] text-zinc-400 px-0.5">
            <span>{formatTime(progress >= 100 ? duration : currentTime)}</span>
          </div>
        </div>
      </div>
    </div>
  );
} 