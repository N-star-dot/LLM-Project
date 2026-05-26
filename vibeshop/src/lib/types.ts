export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  rating: number;
  aesthetic_tags: string[];
  material_tags: string[];
  colors: string[];
  description: string;
  image_url: string;
  dimensions: { w: number; d: number; h: number };
  assembly_required: boolean;
}

export interface StyleProfile {
  aesthetic_name: string;
  color_palette: string[];
  primary_materials: string[];
  silhouette_style: string;
  mood_keywords: string[];
  anchoring_categories: string[];
  avoid: string[];
  lighting_profile: {
    type: string;
    color_temp: number;
    intensity: string;
    accent_color: string;
  };
}

export interface VibeContext {
  board_title: string;
  board_description: string;
  room_lighting: {
    type: string;
    color_temp: number;
    intensity: string;
    accent_color: string;
  };
  color_palette_hex: string[];
  products: CuratedProduct[];
}

export interface CuratedProduct extends Product {
  vibe_note: string;
  position_3d: { x: number; y: number; z: number };
  rotation_3d: { y: number };
}

export interface ThinkingStep {
  label: string;
  value: string;
  done: boolean;
}
