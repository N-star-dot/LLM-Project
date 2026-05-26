'use client';

import { useState, useRef, useCallback } from 'react';
import { Sparkles, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MAX_VIDEO_SIZE = 50 * 1024 * 1024;
const FRAME_POSITIONS = [0.25, 0.4, 0.6, 0.75];

interface MediaData {
  type: 'image' | 'video';
  base64: string;
  mimeType: string;
  preview: string;
  name: string;
  frames?: string[];
}

function extractVideoFrames(file: File): Promise<{ frames: string[]; preview: string }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;

    const url = URL.createObjectURL(file);
    video.src = url;

    video.onloadedmetadata = () => { video.currentTime = 0; };

    video.onloadeddata = async () => {
      const duration = video.duration;
      if (!duration || duration === Infinity) {
        URL.revokeObjectURL(url);
        reject(new Error('Could not read video duration'));
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = Math.min(video.videoWidth, 800);
      canvas.height = Math.round(canvas.width * (video.videoHeight / video.videoWidth));
      const ctx = canvas.getContext('2d')!;

      const frames: string[] = [];
      let preview = '';

      for (let i = 0; i < FRAME_POSITIONS.length; i++) {
        const time = duration * FRAME_POSITIONS[i];
        await new Promise<void>((res) => {
          video.onseeked = () => {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            frames.push(dataUrl.split(',')[1]);
            if (i === 0) preview = dataUrl;
            res();
          };
          video.currentTime = time;
        });
      }

      URL.revokeObjectURL(url);
      resolve({ frames, preview });
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load video'));
    };
  });
}

interface VibeInputCardProps {
  onGenerate: (vibe: string) => void;
  onGenerateWithImage: (imageBase64: string, mimeType: string, vibe?: string) => void;
  onGenerateWithVideo: (frames: string[], vibe?: string) => void;
  disabled: boolean;
}

export function VibeInputCard({ onGenerate, onGenerateWithImage, onGenerateWithVideo, disabled }: VibeInputCardProps) {
  const [vibe, setVibe] = useState('');
  const [media, setMedia] = useState<MediaData | null>(null);
  const [processing, setProcessing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    if (file.type.match(/^image\/(jpeg|png|webp)$/)) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        setMedia({ type: 'image', base64, mimeType: file.type, preview: result, name: file.name });
      };
      reader.readAsDataURL(file);
      return;
    }

    if (file.type.match(/^video\/(mp4|quicktime|webm)$/) || file.name.match(/\.(mp4|mov|webm)$/i)) {
      if (file.size > MAX_VIDEO_SIZE) { alert('Video must be under 50MB'); return; }
      setProcessing(true);
      try {
        const { frames, preview } = await extractVideoFrames(file);
        setMedia({ type: 'video', base64: '', mimeType: 'image/jpeg', preview, name: file.name, frames });
      } catch { alert('Could not process video.'); }
      finally { setProcessing(false); }
    }
  }, []);

  function handleSubmit() {
    if (disabled || processing) return;
    if (media?.type === 'video' && media.frames) {
      onGenerateWithVideo(media.frames, vibe.trim() || undefined);
    } else if (media?.type === 'image') {
      onGenerateWithImage(media.base64, media.mimeType, vibe.trim() || undefined);
    } else if (vibe.trim()) {
      onGenerate(vibe.trim());
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  function clearMedia() {
    setMedia(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const canSubmit = !disabled && !processing && (!!media || !!vibe.trim());

  return (
    <div className="bg-card rounded-2xl p-6 shadow-sm border border-border/50">
      <div className="space-y-4">
        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onClick={() => !disabled && !processing && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
            dragging ? 'border-primary/40 bg-primary/5' : media ? 'border-border bg-surface-soft/30' : 'border-border/50 hover:border-primary/30 hover:bg-surface-soft/20'
          } ${disabled || processing ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm,.mov"
            className="hidden"
            onChange={(e) => { const file = e.target.files?.[0]; if (file) processFile(file); }}
          />

          {processing ? (
            <div className="flex items-center justify-center gap-3 py-2">
              <div className="flex gap-1">
                <span className="thinking-dot w-1.5 h-1.5 rounded-full bg-accent" />
                <span className="thinking-dot w-1.5 h-1.5 rounded-full bg-accent" />
                <span className="thinking-dot w-1.5 h-1.5 rounded-full bg-accent" />
              </div>
              <span className="text-sm text-muted-foreground">Extracting frames...</span>
            </div>
          ) : media ? (
            <div className="flex items-center gap-4">
              <img src={media.preview} alt="Preview" className="w-16 h-16 object-cover rounded-lg border border-border/30" />
              <div className="text-left flex-1">
                <p className="text-sm text-foreground">{media.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {media.type === 'video' ? `${media.frames?.length} frames extracted` : 'Image ready'}
                </p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); clearMedia(); }} className="text-muted-foreground hover:text-foreground transition-colors text-sm px-2 py-1">
                Remove
              </button>
            </div>
          ) : (
            <div className="py-2">
              <Upload className="mx-auto mb-2 w-6 h-6 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                Drop a photo or room video, or <span className="text-foreground/60 underline underline-offset-2">browse</span>
              </p>
              <p className="text-xs text-muted-foreground/40 mt-1">JPG, PNG, WebP, MP4, MOV, WebM</p>
            </div>
          )}
        </div>

        {/* Text input */}
        <div>
          <label htmlFor="vibe-input" className="block text-sm text-muted-foreground mb-2">
            {media ? 'Add extra details (optional)...' : 'Describe your vibe or room...'}
          </label>
          <textarea
            id="vibe-input"
            value={vibe}
            onChange={(e) => setVibe(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
            placeholder="e.g. Cozy Japandi living room, small apartment, under $1,500"
            disabled={disabled}
            className="w-full min-h-[80px] bg-surface-soft/50 border border-border rounded-xl p-4 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none disabled:opacity-50"
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12 font-medium"
        >
          {disabled ? 'Analyzing...' : processing ? 'Processing...' : 'Generate My Room'}
          <Sparkles className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
