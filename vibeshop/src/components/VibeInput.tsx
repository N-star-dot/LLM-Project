"use client";

import { useState, useRef, useCallback } from "react";

const SUGGESTIONS = [
  "dark academia library with warm lighting and velvet textures",
  "Japandi minimalism, neutral tones, natural wood",
  "coastal grandmother — linen, light blues, wicker, relaxed",
  "maximalist grandmillennial with bold patterns and antique pieces",
  "mid-century modern den with warm wood and clean lines",
  "industrial loft with exposed brick and raw metals",
];

const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
const FRAME_POSITIONS = [0.25, 0.4, 0.6, 0.75];

interface MediaData {
  type: "image" | "video";
  base64: string;
  mimeType: string;
  preview: string;
  name: string;
  frames?: string[];
}

function extractVideoFrames(file: File): Promise<{ frames: string[]; preview: string }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;

    const url = URL.createObjectURL(file);
    video.src = url;

    video.onloadedmetadata = () => {
      video.currentTime = 0;
    };

    video.onloadeddata = async () => {
      const duration = video.duration;
      if (!duration || duration === Infinity) {
        URL.revokeObjectURL(url);
        reject(new Error("Could not read video duration"));
        return;
      }

      const canvas = document.createElement("canvas");
      canvas.width = Math.min(video.videoWidth, 800);
      canvas.height = Math.round(canvas.width * (video.videoHeight / video.videoWidth));
      const ctx = canvas.getContext("2d")!;

      const frames: string[] = [];
      let preview = "";

      for (let i = 0; i < FRAME_POSITIONS.length; i++) {
        const time = duration * FRAME_POSITIONS[i];
        await new Promise<void>((res) => {
          video.onseeked = () => {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
            frames.push(dataUrl.split(",")[1]);
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
      reject(new Error("Failed to load video"));
    };
  });
}

export function VibeInput({
  onSubmit,
  onSubmitWithImage,
  onSubmitWithVideo,
  disabled,
}: {
  onSubmit: (vibe: string) => void;
  onSubmitWithImage: (imageBase64: string, mimeType: string, vibe?: string) => void;
  onSubmitWithVideo: (frames: string[], vibe?: string) => void;
  disabled: boolean;
}) {
  const [value, setValue] = useState("");
  const [media, setMedia] = useState<MediaData | null>(null);
  const [processing, setProcessing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    if (file.type.match(/^image\/(jpeg|png|webp)$/)) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1];
        setMedia({
          type: "image",
          base64,
          mimeType: file.type,
          preview: result,
          name: file.name,
        });
      };
      reader.readAsDataURL(file);
      return;
    }

    if (file.type.match(/^video\/(mp4|quicktime|webm)$/) || file.name.match(/\.(mp4|mov|webm)$/i)) {
      if (file.size > MAX_VIDEO_SIZE) {
        alert("Video must be under 50MB");
        return;
      }
      setProcessing(true);
      try {
        const { frames, preview } = await extractVideoFrames(file);
        setMedia({
          type: "video",
          base64: "",
          mimeType: "image/jpeg",
          preview,
          name: file.name,
          frames,
        });
      } catch {
        alert("Could not process video. Try a different file.");
      } finally {
        setProcessing(false);
      }
    }
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (disabled || processing) return;
    if (media?.type === "video" && media.frames) {
      onSubmitWithVideo(media.frames, value.trim() || undefined);
    } else if (media?.type === "image") {
      onSubmitWithImage(media.base64, media.mimeType, value.trim() || undefined);
    } else if (value.trim()) {
      onSubmit(value.trim());
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragging(true);
  }

  function clearMedia() {
    setMedia(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const canSubmit = !disabled && !processing && (!!media || !!value.trim());

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setDragging(false)}
        onClick={() => !disabled && !processing && fileInputRef.current?.click()}
        className={`relative mb-4 border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
          dragging
            ? "border-white/40 bg-white/10"
            : media
              ? "border-white/20 bg-white/5"
              : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/5"
        } ${disabled || processing ? "opacity-50 pointer-events-none" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm,.mov"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) processFile(file);
          }}
        />

        {processing ? (
          <div className="flex items-center justify-center gap-3 py-2">
            <div className="flex gap-1">
              <span className="thinking-dot w-1.5 h-1.5 rounded-full bg-white/60" />
              <span className="thinking-dot w-1.5 h-1.5 rounded-full bg-white/60" />
              <span className="thinking-dot w-1.5 h-1.5 rounded-full bg-white/60" />
            </div>
            <span className="text-sm text-white/40">Extracting frames from video...</span>
          </div>
        ) : media ? (
          <div className="flex items-center gap-4">
            <img
              src={media.preview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-white/10"
            />
            <div className="text-left flex-1">
              <p className="text-sm text-white/70">{media.name}</p>
              <p className="text-xs text-white/30 mt-1">
                {media.type === "video"
                  ? `${media.frames?.length} frames extracted — click "Find my vibe" to analyze`
                  : `Image ready — click "Find my vibe" to analyze`}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearMedia();
              }}
              className="text-white/30 hover:text-white/60 transition-colors text-sm px-2 py-1"
            >
              Remove
            </button>
          </div>
        ) : (
          <div>
            <svg className="mx-auto mb-2 text-white/20" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
            <p className="text-sm text-white/30">
              Drop a photo or room video, or{" "}
              <span className="text-white/50 underline underline-offset-2">browse</span>
            </p>
            <p className="text-xs text-white/15 mt-1">JPG, PNG, WebP, MP4, MOV, WebM</p>
          </div>
        )}
      </div>

      {/* Text input */}
      <form onSubmit={handleSubmit} className="relative">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder={media ? "Add extra details (optional)..." : "...or describe the vibe, aesthetic, or feeling you want"}
          disabled={disabled}
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-lg text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 resize-none transition-all disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!canSubmit}
          className="absolute bottom-4 right-4 bg-white text-black px-5 py-2 rounded-xl text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {disabled ? "Thinking..." : processing ? "Processing..." : "Find my vibe"}
        </button>
      </form>

      {/* Suggestions (only show when no media) */}
      {!media && (
        <div className="mt-6 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => {
                setValue(s);
                if (!disabled) onSubmit(s);
              }}
              disabled={disabled}
              className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white/80 hover:border-white/20 transition-all disabled:opacity-30"
            >
              {s.length > 40 ? s.slice(0, 40) + "..." : s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
