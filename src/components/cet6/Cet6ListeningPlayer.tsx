import {
  FastForward,
  Headphones,
  Pause,
  Play,
  Repeat,
  Rewind,
  Volume2,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const SPEEDS = [0.75, 1, 1.25, 1.5] as const;

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '00:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function Cet6ListeningPlayer({
  audioUrl,
  title,
  segmentIndex,
  totalSegments,
  onPrevSegment,
  onNextSegment,
}: {
  audioUrl: string | null;
  title: string;
  segmentIndex: number;
  totalSegments: number;
  onPrevSegment?: () => void;
  onNextSegment?: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState<number>(1);
  const [loop, setLoop] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  useEffect(() => {
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setAudioError(null);
    const el = audioRef.current;
    if (el) {
      el.pause();
      el.currentTime = 0;
      el.playbackRate = speed;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioUrl]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  }, [speed]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = loop;
    }
  }, [loop]);

  function togglePlay() {
    const el = audioRef.current;
    if (!el || !audioUrl) return;
    if (el.paused) {
      el.play()
        .then(() => setPlaying(true))
        .catch(() => setAudioError('音频加载失败，请确认本地开发服务已启动'));
    } else {
      el.pause();
      setPlaying(false);
    }
  }

  function skip(delta: number) {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = Math.max(0, Math.min(el.duration || 0, el.currentTime + delta));
    setCurrentTime(el.currentTime);
  }

  if (!audioUrl) {
    return (
      <div className="rounded-2xl bg-zinc-500/[0.06] border border-zinc-500/15 px-4 py-3 text-xs text-zinc-500 flex items-center gap-2">
        <Headphones className="w-4 h-4" />
        当前听力段落无关联音频，可展开下方听力原文辅助练习。
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white/90 dark:bg-[#141418] border border-zinc-200/90 dark:border-white/[0.09] p-4 space-y-3 shadow-sm">
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => setPlaying(false)}
        onError={() => {
          setPlaying(false);
          setAudioError('音频流加载失败');
        }}
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0">
            <Volume2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold truncate">{title}</div>
            <div className="text-[11px] font-mono text-zinc-500">
              第 {segmentIndex} / {totalSegments} 段原声真题音频 · 支持拖动与倍速精听
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`px-2 py-1 rounded-lg font-mono text-[11px] font-bold transition-colors cursor-pointer ${
                speed === s
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950'
                  : 'bg-zinc-500/10 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-500/18'
              }`}
            >
              {s}x
            </button>
          ))}
          <button
            onClick={() => setLoop((v) => !v)}
            title="单段循环复听"
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              loop
                ? 'bg-amber-500/15 border-amber-500/35 text-amber-600 dark:text-amber-300'
                : 'bg-zinc-500/10 border-transparent text-zinc-500 dark:text-zinc-400'
            }`}
          >
            <Repeat className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Controls & Scrub Bar */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => skip(-5)}
            className="p-2 rounded-xl bg-zinc-500/10 hover:bg-zinc-500/18 text-zinc-600 dark:text-zinc-300 cursor-pointer"
            title="快退 5 秒"
          >
            <Rewind className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 flex items-center justify-center shadow-sm cursor-pointer transition-transform active:scale-95"
            title={playing ? '暂停' : '播放听力音频'}
          >
            {playing ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>
          <button
            onClick={() => skip(5)}
            className="p-2 rounded-xl bg-zinc-500/10 hover:bg-zinc-500/18 text-zinc-600 dark:text-zinc-300 cursor-pointer"
            title="快进 5 秒"
          >
            <FastForward className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-1 flex items-center gap-2.5 min-w-0">
          <span className="font-mono text-[11px] text-zinc-500 w-10 text-right shrink-0">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={Math.min(currentTime, duration || 100)}
            onChange={(e) => {
              const val = Number(e.target.value);
              if (audioRef.current) audioRef.current.currentTime = val;
              setCurrentTime(val);
            }}
            className="flex-1 accent-amber-500 cursor-pointer h-1.5"
          />
          <span className="font-mono text-[11px] text-zinc-500 w-10 shrink-0">
            {formatTime(duration)}
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-1 shrink-0">
          <button
            onClick={onPrevSegment}
            disabled={!onPrevSegment}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-500/10 hover:bg-zinc-500/18 disabled:opacity-35 text-[11px] font-semibold cursor-pointer"
          >
            上一段
          </button>
          <button
            onClick={onNextSegment}
            disabled={!onNextSegment}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-500/10 hover:bg-zinc-500/18 disabled:opacity-35 text-[11px] font-semibold cursor-pointer"
          >
            下一段
          </button>
        </div>
      </div>

      {audioError && <div className="text-xs text-rose-500">{audioError}</div>}
    </div>
  );
}
