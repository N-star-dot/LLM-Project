'use client';

import { useState, useCallback, useEffect } from 'react';
import { Pencil } from 'lucide-react';
import { Header } from '@/components/roomscape/header';
import { VibeInputCard } from '@/components/roomscape/vibe-input-card';
import { PopularVibeCard } from '@/components/roomscape/popular-vibe-card';
import { VibeDNACard } from '@/components/roomscape/vibe-dna-card';
import { ColorPalette } from '@/components/roomscape/color-palette';
import { MaterialsRow } from '@/components/roomscape/material-chip';
import { AIExplanation } from '@/components/roomscape/ai-explanation';
import { ProductCard } from '@/components/roomscape/product-card';
import { ProductFilters, mapCategory } from '@/components/roomscape/product-filters';
import { BudgetRing } from '@/components/roomscape/budget-ring';
import { RoomRecipe, BudgetBreakdown } from '@/components/roomscape/room-recipe';
import { SidebarNav, MobileNav } from '@/components/roomscape/sidebar-nav';
import type { NavItem } from '@/components/roomscape/sidebar-nav';
import { FeatureBar } from '@/components/roomscape/feature-bar';
import { LoadingScreen } from '@/components/roomscape/loading-screen';
import { Room3D } from '@/components/Room3D';
import { Button } from '@/components/ui/button';
import { VibeContext, CuratedProduct, StyleProfile } from '@/lib/types';
import { detectTheme, applyTheme, defaultTheme, VibeTheme } from '@/lib/themes';

type ViewState = 'landing' | 'loading' | 'dashboard' | 'room';
type ThinkingStep = 'idle' | 'vision' | 'vision_done' | 'aesthetic' | 'search' | 'curate' | 'done';

const popularVibes = [
  { id: '1', name: 'Cozy Japandi', image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400&h=400&fit=crop' },
  { id: '2', name: 'Modern Organic', image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=400&h=400&fit=crop' },
  { id: '3', name: 'Dark Gothic', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop' },
  { id: '4', name: 'Warm Industrial', image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop' },
  { id: '5', name: 'Coastal Calm', image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=400&fit=crop' },
  { id: '6', name: 'Luxury Glam', image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=400&h=400&fit=crop' },
];

export default function Home() {
  const [viewState, setViewState] = useState<ViewState>('landing');
  const [activeNav, setActiveNav] = useState<NavItem>('moodboard');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState<CuratedProduct | null>(null);
  const [currentTheme, setCurrentTheme] = useState<VibeTheme>(defaultTheme);
  const [currentVibe, setCurrentVibe] = useState('');

  // Agent pipeline state
  const [thinkingStep, setThinkingStep] = useState<ThinkingStep>('idle');
  const [styleProfile, setStyleProfile] = useState<StyleProfile | null>(null);
  const [searchCount, setSearchCount] = useState(0);
  const [curateCount, setCurateCount] = useState(0);
  const [vibeContext, setVibeContext] = useState<VibeContext | null>(null);
  const [extractedVibe, setExtractedVibe] = useState<string | null>(null);
  const [hasImage, setHasImage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Apply theme on mount and changes
  useEffect(() => {
    applyTheme(currentTheme);
  }, [currentTheme]);

  const processStream = useCallback(async (body: Record<string, unknown>, vibeText: string) => {
    // Detect and apply theme immediately from the vibe text
    const theme = detectTheme(vibeText);
    setCurrentTheme(theme);
    setCurrentVibe(vibeText);

    setViewState('loading');
    setThinkingStep('idle');
    setStyleProfile(null);
    setSearchCount(0);
    setCurateCount(0);
    setError(null);
    setExtractedVibe(null);
    setVibeContext(null);

    try {
      const res = await fetch('/api/vibe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Failed to fetch vibe results');

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const json = JSON.parse(line.slice(6));

          switch (json.event) {
            case 'thinking':
              if (json.data.step === 'vision') {
                setThinkingStep('vision');
              } else if (json.data.step === 'vision_done') {
                setThinkingStep('vision_done');
                setExtractedVibe(json.data.extractedVibe);
                // Re-detect theme from actual extracted vibe
                const extractedTheme = detectTheme(json.data.extractedVibe);
                setCurrentTheme(extractedTheme);
              } else if (json.data.step === 'aesthetic') {
                setThinkingStep('aesthetic');
                setStyleProfile(json.data.profile);
              } else if (json.data.step === 'search') {
                setThinkingStep('search');
                setSearchCount(json.data.count);
              } else if (json.data.step === 'curate') {
                setThinkingStep('curate');
                setCurateCount(json.data.count);
              }
              break;
            case 'error':
              throw new Error(json.data.message);
            case 'result':
              setThinkingStep('done');
              setVibeContext(json.data as VibeContext);
              setTimeout(() => setViewState('dashboard'), 600);
              break;
            case 'done':
              break;
          }
        }
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setViewState('landing');
    }
  }, []);

  const handleGenerate = useCallback((vibe: string) => {
    setHasImage(false);
    processStream({ vibe }, vibe);
  }, [processStream]);

  const handleGenerateWithImage = useCallback((imageBase64: string, mimeType: string, vibe?: string) => {
    setHasImage(true);
    processStream({ imageBase64, imageMimeType: mimeType, vibe: vibe || '' }, vibe || 'analyzing image');
  }, [processStream]);

  const handleGenerateWithVideo = useCallback((frames: string[], vibe?: string) => {
    setHasImage(true);
    processStream({ videoFrames: frames, vibe: vibe || '' }, vibe || 'analyzing video');
  }, [processStream]);

  const handleVibeSelect = useCallback((vibe: { id: string; name: string; image: string }) => {
    setHasImage(false);
    processStream({ vibe: vibe.name }, vibe.name);
  }, [processStream]);

  const handleReset = useCallback(() => {
    setViewState('landing');
    setVibeContext(null);
    setSelectedProduct(null);
    setThinkingStep('idle');
    setError(null);
    setExtractedVibe(null);
    setHasImage(false);
    setCurrentTheme(defaultTheme);
    applyTheme(defaultTheme);
  }, []);

  // Derived data for dashboard
  const totalSpent = vibeContext?.products.reduce((sum, p) => sum + p.price, 0) ?? 0;
  const budget = 2000; // Reasonable default

  const filteredProducts = vibeContext?.products.filter(p => {
    if (selectedCategory === 'All') return true;
    return mapCategory(p.category) === selectedCategory;
  }) ?? [];

  // 3D Room overlay
  if (viewState === 'room' && selectedProduct && vibeContext) {
    return (
      <Room3D
        product={selectedProduct}
        context={vibeContext}
        onBack={() => {
          setSelectedProduct(null);
          setViewState('dashboard');
        }}
      />
    );
  }

  // Loading Screen — wired to real agent pipeline
  if (viewState === 'loading') {
    return (
      <LoadingScreen
        step={thinkingStep}
        profile={styleProfile}
        searchCount={searchCount}
        curateCount={curateCount}
        extractedVibe={extractedVibe}
        hasImage={hasImage}
      />
    );
  }

  // Landing Page
  if (viewState === 'landing') {
    return (
      <div className="min-h-screen flex flex-col bg-background transition-colors duration-500">
        <div className="flex-1 flex">
          {/* Left Side */}
          <div className="flex-1 p-6 lg:p-12 flex flex-col justify-center max-w-xl">
            <Header />

            <div className="mt-8 lg:mt-12 space-y-6">
              <div>
                <h1 className="font-serif text-4xl lg:text-5xl text-foreground leading-tight text-balance">
                  Roomscape
                </h1>
                <p className="text-lg lg:text-xl text-muted-foreground mt-2 leading-relaxed">
                  Shop by vibe. See it in your space. Love it at home.
                </p>
              </div>

              <p className="text-muted-foreground leading-relaxed">
                Describe your dream room and our AI agent will create a shoppable, interactive space that&apos;s uniquely you.
              </p>

              <VibeInputCard
                onGenerate={handleGenerate}
                onGenerateWithImage={handleGenerateWithImage}
                onGenerateWithVideo={handleGenerateWithVideo}
                disabled={false}
              />

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <div>
                <p className="text-sm text-muted-foreground mb-3">Popular vibes</p>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {popularVibes.map((vibe) => (
                    <PopularVibeCard key={vibe.id} vibe={vibe} onSelect={handleVibeSelect} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Side — Hero Image */}
          <div className="hidden lg:block flex-1 relative">
            <img
              src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1200&h=1600&fit=crop"
              alt="Beautiful room"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent" />
          </div>
        </div>

        <FeatureBar />
      </div>
    );
  }

  // Dashboard View
  return (
    <div className="min-h-screen flex pb-20 lg:pb-0 bg-background transition-colors duration-500">
      <SidebarNav activeItem={activeNav} onItemChange={setActiveNav} />
      <MobileNav activeItem={activeNav} onItemChange={setActiveNav} />

      <main className="flex-1 overflow-y-auto">
        {/* Moodboard Section */}
        {(activeNav === 'vibe' || activeNav === 'moodboard') && vibeContext && (
          <section className="p-6 lg:p-8 border-b border-border/50">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-serif text-2xl text-foreground">{vibeContext.board_title}</h2>
                <p className="text-muted-foreground">{vibeContext.board_description}</p>
              </div>
              <Button variant="outline" size="sm" className="rounded-lg" onClick={handleReset}>
                <Pencil className="w-4 h-4 mr-2" />
                New Vibe
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-4">
                {styleProfile && (
                  <VibeDNACard aestheticDNA={[
                    { name: styleProfile.aesthetic_name, percentage: 45 },
                    ...styleProfile.mood_keywords.slice(0, 3).map((kw, i) => ({
                      name: kw.charAt(0).toUpperCase() + kw.slice(1),
                      percentage: [25, 18, 12][i],
                    })),
                  ]} />
                )}
                <ColorPalette palette={
                  currentTheme.palette.length > 0
                    ? currentTheme.palette
                    : vibeContext.color_palette_hex.map((c, i) => ({ name: `Color ${i + 1}`, color: c }))
                } />
              </div>

              <div className="lg:col-span-2 space-y-4">
                {styleProfile && (
                  <MaterialsRow materials={styleProfile.primary_materials} />
                )}
                <AIExplanation
                  explanation={`This ${styleProfile?.aesthetic_name || 'curated'} aesthetic blends ${
                    styleProfile?.primary_materials.slice(0, 3).join(', ') || 'natural materials'
                  } with ${styleProfile?.color_palette.length || 0} carefully chosen colors to create a ${
                    styleProfile?.mood_keywords.slice(0, 2).join(', ') || 'balanced and timeless'
                  } space.`}
                />
              </div>
            </div>
          </section>
        )}

        {/* Products Section */}
        {(activeNav === 'products' || activeNav === 'moodboard') && vibeContext && (
          <section className="p-6 lg:p-8 border-b border-border/50">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="font-serif text-2xl text-foreground">Products for Your Vibe</h2>
                <p className="text-sm text-muted-foreground">{vibeContext.products.length} results</p>
              </div>
              <BudgetRing budget={budget} spent={totalSpent} />
            </div>

            <ProductFilters
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onView3D={() => {
                    setSelectedProduct(product);
                    setViewState('room');
                  }}
                />
              ))}
            </div>
          </section>
        )}

        {/* 3D Room Section (via sidebar nav) */}
        {activeNav === '3d-room' && vibeContext && (
          <section className="p-6 lg:p-8">
            <h2 className="font-serif text-2xl text-foreground mb-6">3D Room Preview</h2>
            <p className="text-muted-foreground mb-4">Click on a product above to view it in 3D.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {vibeContext.products.map((product) => (
                <button
                  key={product.id}
                  onClick={() => {
                    setSelectedProduct(product);
                    setViewState('room');
                  }}
                  className="bg-card rounded-xl border border-border/50 p-3 text-left hover:shadow-lg transition-all"
                >
                  <div className="aspect-square rounded-lg overflow-hidden bg-surface-soft mb-2">
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                  <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                  <p className="text-xs text-muted-foreground">${product.price}</p>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Recipe Section */}
        {activeNav === 'recipe' && vibeContext && (
          <section className="p-6 lg:p-8">
            <h2 className="font-serif text-2xl text-foreground mb-6">Your Room Recipe</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RoomRecipe
                title="Your Room Recipe"
                subtitle={currentVibe}
                products={vibeContext.products}
                budget={budget}
                spent={totalSpent}
              />
              <BudgetBreakdown budget={budget} spent={totalSpent} />
            </div>
          </section>
        )}

        {/* Saved Section */}
        {activeNav === 'saved' && (
          <section className="p-6 lg:p-8">
            <h2 className="font-serif text-2xl text-foreground mb-6">Saved Items</h2>
            <p className="text-muted-foreground">No saved items yet. Heart products to save them here.</p>
          </section>
        )}
      </main>
    </div>
  );
}
