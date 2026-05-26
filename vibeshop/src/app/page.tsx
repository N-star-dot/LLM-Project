"use client";

import { useState, useCallback } from "react";
import { VibeInput } from "@/components/VibeInput";
import { ThinkingState } from "@/components/ThinkingState";
import { MoodBoard } from "@/components/MoodBoard";
import { Room3D } from "@/components/Room3D";
import { VibeContext, CuratedProduct, StyleProfile } from "@/lib/types";

type AppState = "input" | "thinking" | "board" | "room";
type ThinkingStep = "idle" | "vision" | "vision_done" | "aesthetic" | "search" | "curate" | "done";

export default function Home() {
  const [appState, setAppState] = useState<AppState>("input");
  const [thinkingStep, setThinkingStep] = useState<ThinkingStep>("idle");
  const [styleProfile, setStyleProfile] = useState<StyleProfile | null>(null);
  const [searchCount, setSearchCount] = useState(0);
  const [curateCount, setCurateCount] = useState(0);
  const [vibeContext, setVibeContext] = useState<VibeContext | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<CuratedProduct | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [extractedVibe, setExtractedVibe] = useState<string | null>(null);
  const [hasImage, setHasImage] = useState(false);

  const processStream = useCallback(async (body: Record<string, unknown>) => {
    setAppState("thinking");
    setThinkingStep("idle");
    setStyleProfile(null);
    setSearchCount(0);
    setCurateCount(0);
    setError(null);
    setExtractedVibe(null);

    try {
      const res = await fetch("/api/vibe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error("Failed to fetch vibe results");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const json = JSON.parse(line.slice(6));

          switch (json.event) {
            case "thinking":
              if (json.data.step === "vision") {
                setThinkingStep("vision");
              } else if (json.data.step === "vision_done") {
                setThinkingStep("vision_done");
                setExtractedVibe(json.data.extractedVibe);
              } else if (json.data.step === "aesthetic") {
                setThinkingStep("aesthetic");
                setStyleProfile(json.data.profile);
              } else if (json.data.step === "search") {
                setThinkingStep("search");
                setSearchCount(json.data.count);
              } else if (json.data.step === "curate") {
                setThinkingStep("curate");
                setCurateCount(json.data.count);
              }
              break;
            case "error":
              throw new Error(json.data.message);
            case "result":
              setThinkingStep("done");
              setVibeContext(json.data as VibeContext);
              setTimeout(() => setAppState("board"), 600);
              break;
            case "done":
              break;
          }
        }
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Something went wrong");
      setAppState("input");
    }
  }, []);

  const handleSubmit = useCallback((vibe: string) => {
    setHasImage(false);
    processStream({ vibe });
  }, [processStream]);

  const handleSubmitWithImage = useCallback((imageBase64: string, mimeType: string, vibe?: string) => {
    setHasImage(true);
    processStream({ imageBase64, imageMimeType: mimeType, vibe: vibe || "" });
  }, [processStream]);

  const handleSubmitWithVideo = useCallback((frames: string[], vibe?: string) => {
    setHasImage(true);
    processStream({ videoFrames: frames, vibe: vibe || "" });
  }, [processStream]);

  const handleReset = useCallback(() => {
    setAppState("input");
    setVibeContext(null);
    setSelectedProduct(null);
    setThinkingStep("idle");
    setError(null);
    setExtractedVibe(null);
    setHasImage(false);
  }, []);

  return (
    <>
      {/* 3D Room overlay */}
      {appState === "room" && selectedProduct && vibeContext && (
        <Room3D
          product={selectedProduct}
          context={vibeContext}
          onBack={() => {
            setSelectedProduct(null);
            setAppState("board");
          }}
        />
      )}

      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="w-full px-6 py-4 flex items-center justify-between">
          <button onClick={handleReset} className="flex items-center gap-2 group">
            <span className="text-xl font-light tracking-tight text-white group-hover:text-white/80 transition-colors">
              VibeShop
            </span>
            <span className="text-xs text-white/20 font-mono">by Wayfair</span>
          </button>

          {vibeContext && appState === "board" && (
            <button
              onClick={handleReset}
              className="text-xs text-white/30 hover:text-white/60 transition-colors"
            >
              New search
            </button>
          )}
        </header>

        {/* Main */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
          {/* Input state */}
          {appState === "input" && (
            <div className="w-full max-w-2xl text-center">
              <h1 className="text-5xl font-light text-white tracking-tight mb-2">
                Shop by vibe.
              </h1>
              <p className="text-white/30 text-lg mb-10">
                Drop a photo or room video, or describe how you want your space to feel.
              </p>
              <VibeInput
                onSubmit={handleSubmit}
                onSubmitWithImage={handleSubmitWithImage}
                onSubmitWithVideo={handleSubmitWithVideo}
                disabled={false}
              />
              {error && (
                <p className="mt-4 text-red-400/80 text-sm">{error}</p>
              )}
            </div>
          )}

          {/* Thinking state */}
          {appState === "thinking" && (
            <ThinkingState
              step={thinkingStep}
              profile={styleProfile}
              searchCount={searchCount}
              curateCount={curateCount}
              extractedVibe={extractedVibe}
              hasImage={hasImage}
            />
          )}

          {/* Mood board */}
          {appState === "board" && vibeContext && (
            <MoodBoard
              context={vibeContext}
              onProductClick={(product) => {
                setSelectedProduct(product);
                setAppState("room");
              }}
              onReset={handleReset}
            />
          )}
        </main>
      </div>
    </>
  );
}
