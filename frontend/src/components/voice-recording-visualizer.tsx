"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

const BAR_COUNT = 32;

type Props = {
  /** Live microphone stream while recording */
  stream: MediaStream | null;
  /** When false, bars settle to idle height */
  active: boolean;
  className?: string;
};

/**
 * Live “tiles” bar visualizer from microphone frequency data (Web Audio Analyser).
 */
export function VoiceRecordingVisualizer({ stream, active, className }: Props) {
  const [levels, setLevels] = React.useState<number[]>(() =>
    Array.from({ length: BAR_COUNT }, () => 0.12),
  );
  const rafRef = React.useRef<number>(0);
  const ctxRef = React.useRef<AudioContext | null>(null);

  React.useEffect(() => {
    if (!stream || !active) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      const ctx = ctxRef.current;
      ctxRef.current = null;
      void ctx?.close();
      setLevels(Array.from({ length: BAR_COUNT }, () => 0.12));
      return;
    }

    const ctx = new AudioContext();
    ctxRef.current = ctx;
    void ctx.resume();

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.62;
    const source = ctx.createMediaStreamSource(stream);
    source.connect(analyser);

    const buffer = new Uint8Array(analyser.frequencyBinCount);
    const bucket = Math.max(1, Math.floor(buffer.length / BAR_COUNT));

    const tick = () => {
      analyser.getByteFrequencyData(buffer);
      const next: number[] = [];
      for (let i = 0; i < BAR_COUNT; i++) {
        let sum = 0;
        const start = i * bucket;
        const end = Math.min(start + bucket, buffer.length);
        for (let j = start; j < end; j++) sum += buffer[j]!;
        const avg = sum / (end - start) / 255;
        next.push(Math.min(1, Math.max(0.1, avg * 2.2)));
      }
      setLevels(next);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      source.disconnect();
      void ctx.close();
      ctxRef.current = null;
    };
  }, [stream, active]);

  return (
    <div
      className={cn(
        "flex h-[4.5rem] items-end justify-center gap-0.5 rounded-lg bg-muted/50 px-2 py-2 sm:h-[5.5rem] sm:gap-1 sm:px-3",
        className,
      )}
      aria-hidden
    >
      {levels.map((lv, i) => (
        <div
          key={i}
          className={cn(
            "w-1 shrink-0 rounded-full bg-primary transition-[height] duration-75 ease-out sm:w-1.5",
            active ? "opacity-100 shadow-sm shadow-primary/20" : "opacity-40",
          )}
          style={{
            height: `${Math.round(8 + lv * 52)}px`,
            minHeight: "6px",
            maxHeight: "100%",
          }}
        />
      ))}
    </div>
  );
}
