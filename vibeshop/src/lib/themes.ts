export interface VibeTheme {
  name: string;
  keywords: string[];
  colors: {
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    muted: string;
    mutedForeground: string;
    accent: string;
    accentForeground: string;
    border: string;
    surface: string;
    surfaceSoft: string;
  };
  palette: { name: string; color: string }[];
}

export const vibeThemes: VibeTheme[] = [
  {
    name: 'japandi',
    keywords: ['japandi', 'japanese', 'zen', 'wabi-sabi', 'minimal japanese', 'muji'],
    colors: {
      background: '#F7F1E8',
      foreground: '#211A16',
      card: '#FFFDF8',
      cardForeground: '#211A16',
      primary: '#3A2D25',
      primaryForeground: '#FFFDF8',
      secondary: '#EFE4D5',
      secondaryForeground: '#3A2D25',
      muted: '#EFE4D5',
      mutedForeground: '#6E6257',
      accent: '#8C9A7B',
      accentForeground: '#FFFDF8',
      border: '#DDD0BE',
      surface: '#FFFDF8',
      surfaceSoft: '#EFE4D5',
    },
    palette: [
      { name: 'Warm Cream', color: '#F7F1E8' },
      { name: 'Soft Sage', color: '#8C9A7B' },
      { name: 'Natural Oak', color: '#D7B892' },
      { name: 'Deep Olive', color: '#4F5A37' },
      { name: 'Warm Brown', color: '#8A5F3D' },
      { name: 'Rich Earth', color: '#3A2D25' },
    ],
  },
  {
    name: 'gothic',
    keywords: ['gothic', 'dark', 'moody', 'victorian', 'dramatic', 'noir', 'dark academia', 'medieval'],
    colors: {
      background: '#0F0D0C',
      foreground: '#E8E4E0',
      card: '#1A1614',
      cardForeground: '#E8E4E0',
      primary: '#8B2635',
      primaryForeground: '#FAF8F7',
      secondary: '#2A2422',
      secondaryForeground: '#C4BCAF',
      muted: '#2A2422',
      mutedForeground: '#8A8078',
      accent: '#8B2635',
      accentForeground: '#FAF8F7',
      border: '#3A322E',
      surface: '#1A1614',
      surfaceSoft: '#242020',
    },
    palette: [
      { name: 'Midnight', color: '#0F0D0C' },
      { name: 'Blood Red', color: '#8B2635' },
      { name: 'Antique Gold', color: '#8B7355' },
      { name: 'Deep Plum', color: '#4A2040' },
      { name: 'Charcoal', color: '#2A2422' },
      { name: 'Bone', color: '#E8E4E0' },
    ],
  },
  {
    name: 'coastal',
    keywords: ['coastal', 'beach', 'ocean', 'nautical', 'hamptons', 'seaside', 'marine', 'mediterranean', 'coastal grandmother'],
    colors: {
      background: '#F5F8FA',
      foreground: '#1E3A4C',
      card: '#FFFFFF',
      cardForeground: '#1E3A4C',
      primary: '#2E6B8A',
      primaryForeground: '#FFFFFF',
      secondary: '#E8F1F5',
      secondaryForeground: '#2E6B8A',
      muted: '#E8F1F5',
      mutedForeground: '#5E7D8A',
      accent: '#D4A574',
      accentForeground: '#1E3A4C',
      border: '#C8D9E3',
      surface: '#FFFFFF',
      surfaceSoft: '#E8F1F5',
    },
    palette: [
      { name: 'Ocean Blue', color: '#2E6B8A' },
      { name: 'Sandy Beige', color: '#D4A574' },
      { name: 'Sea Foam', color: '#B8D4D8' },
      { name: 'Driftwood', color: '#8B7355' },
      { name: 'White Sand', color: '#F5F8FA' },
      { name: 'Deep Navy', color: '#1E3A4C' },
    ],
  },
  {
    name: 'industrial',
    keywords: ['industrial', 'loft', 'urban', 'warehouse', 'factory', 'exposed brick', 'concrete', 'metal'],
    colors: {
      background: '#E5E2DD',
      foreground: '#2C2C2C',
      card: '#F2F0EB',
      cardForeground: '#2C2C2C',
      primary: '#4A4A4A',
      primaryForeground: '#F2F0EB',
      secondary: '#D4D0C8',
      secondaryForeground: '#4A4A4A',
      muted: '#D4D0C8',
      mutedForeground: '#6E6E6E',
      accent: '#8B5A2B',
      accentForeground: '#F2F0EB',
      border: '#B8B4AC',
      surface: '#F2F0EB',
      surfaceSoft: '#D4D0C8',
    },
    palette: [
      { name: 'Concrete', color: '#9A9A9A' },
      { name: 'Rust', color: '#8B5A2B' },
      { name: 'Steel', color: '#4A4A4A' },
      { name: 'Aged Brick', color: '#8B4513' },
      { name: 'Warm Gray', color: '#E5E2DD' },
      { name: 'Black Iron', color: '#2C2C2C' },
    ],
  },
  {
    name: 'boho',
    keywords: ['boho', 'bohemian', 'eclectic', 'moroccan', 'global', 'artisan', 'cottagecore', 'maximalist'],
    colors: {
      background: '#FDF6F0',
      foreground: '#3D2C24',
      card: '#FFFBF7',
      cardForeground: '#3D2C24',
      primary: '#B85C38',
      primaryForeground: '#FFFBF7',
      secondary: '#F5E6D8',
      secondaryForeground: '#B85C38',
      muted: '#F5E6D8',
      mutedForeground: '#7A6558',
      accent: '#E0A96D',
      accentForeground: '#3D2C24',
      border: '#E5D4C4',
      surface: '#FFFBF7',
      surfaceSoft: '#F5E6D8',
    },
    palette: [
      { name: 'Terracotta', color: '#B85C38' },
      { name: 'Mustard', color: '#E0A96D' },
      { name: 'Desert Rose', color: '#C4857A' },
      { name: 'Sage', color: '#7D8570' },
      { name: 'Cream', color: '#FDF6F0' },
      { name: 'Warm Earth', color: '#3D2C24' },
    ],
  },
  {
    name: 'midcentury',
    keywords: ['mid-century', 'midcentury', 'retro', '60s', '70s', 'atomic', 'eames', 'danish'],
    colors: {
      background: '#FAF7F2',
      foreground: '#2D2926',
      card: '#FFFFFF',
      cardForeground: '#2D2926',
      primary: '#C85A35',
      primaryForeground: '#FFFFFF',
      secondary: '#F0E8D8',
      secondaryForeground: '#C85A35',
      muted: '#F0E8D8',
      mutedForeground: '#6A635A',
      accent: '#D4A03C',
      accentForeground: '#2D2926',
      border: '#DED5C5',
      surface: '#FFFFFF',
      surfaceSoft: '#F0E8D8',
    },
    palette: [
      { name: 'Burnt Orange', color: '#C85A35' },
      { name: 'Mustard Gold', color: '#D4A03C' },
      { name: 'Avocado', color: '#6B7E4A' },
      { name: 'Teak', color: '#8B5A2B' },
      { name: 'Cream', color: '#FAF7F2' },
      { name: 'Walnut', color: '#2D2926' },
    ],
  },
  {
    name: 'modern',
    keywords: ['modern', 'contemporary', 'sleek', 'clean', 'minimalist', 'minimal', 'simple', 'scandinavian', 'scandi', 'nordic'],
    colors: {
      background: '#FAFAFA',
      foreground: '#1A1A1A',
      card: '#FFFFFF',
      cardForeground: '#1A1A1A',
      primary: '#1A1A1A',
      primaryForeground: '#FFFFFF',
      secondary: '#F0F0F0',
      secondaryForeground: '#1A1A1A',
      muted: '#F0F0F0',
      mutedForeground: '#6E6E6E',
      accent: '#3B82F6',
      accentForeground: '#FFFFFF',
      border: '#E5E5E5',
      surface: '#FFFFFF',
      surfaceSoft: '#F0F0F0',
    },
    palette: [
      { name: 'Pure White', color: '#FFFFFF' },
      { name: 'Slate', color: '#64748B' },
      { name: 'Blue Accent', color: '#3B82F6' },
      { name: 'Warm Gray', color: '#9CA3AF' },
      { name: 'Light Gray', color: '#F0F0F0' },
      { name: 'Deep Black', color: '#1A1A1A' },
    ],
  },
  {
    name: 'rustic',
    keywords: ['rustic', 'farmhouse', 'country', 'cabin', 'lodge', 'cottage'],
    colors: {
      background: '#F5EDE4',
      foreground: '#3E2C23',
      card: '#FFFCF7',
      cardForeground: '#3E2C23',
      primary: '#6B4423',
      primaryForeground: '#FFFCF7',
      secondary: '#E8DDD0',
      secondaryForeground: '#6B4423',
      muted: '#E8DDD0',
      mutedForeground: '#7A6355',
      accent: '#8B5A2B',
      accentForeground: '#FFFCF7',
      border: '#D4C4B0',
      surface: '#FFFCF7',
      surfaceSoft: '#E8DDD0',
    },
    palette: [
      { name: 'Barn Wood', color: '#6B4423' },
      { name: 'Copper', color: '#8B5A2B' },
      { name: 'Sage Green', color: '#7D8570' },
      { name: 'Cream', color: '#F5EDE4' },
      { name: 'Stone', color: '#9A8B7A' },
      { name: 'Deep Brown', color: '#3E2C23' },
    ],
  },
  {
    name: 'luxury',
    keywords: ['luxury', 'glam', 'glamorous', 'elegant', 'sophisticated', 'opulent', 'art deco', 'gold'],
    colors: {
      background: '#1A1A1A',
      foreground: '#F5F0E8',
      card: '#2A2A2A',
      cardForeground: '#F5F0E8',
      primary: '#C9A962',
      primaryForeground: '#1A1A1A',
      secondary: '#3A3A3A',
      secondaryForeground: '#C9A962',
      muted: '#3A3A3A',
      mutedForeground: '#9A958D',
      accent: '#C9A962',
      accentForeground: '#1A1A1A',
      border: '#4A4A4A',
      surface: '#2A2A2A',
      surfaceSoft: '#3A3A3A',
    },
    palette: [
      { name: 'Gold', color: '#C9A962' },
      { name: 'Black Onyx', color: '#1A1A1A' },
      { name: 'Marble', color: '#F5F0E8' },
      { name: 'Emerald', color: '#2E5A47' },
      { name: 'Deep Purple', color: '#4A2050' },
      { name: 'Champagne', color: '#D4C5A9' },
    ],
  },
  {
    name: 'tropical',
    keywords: ['tropical', 'jungle', 'palm', 'caribbean', 'island', 'hawaiian', 'rainforest'],
    colors: {
      background: '#F5FAF5',
      foreground: '#1E3932',
      card: '#FFFFFF',
      cardForeground: '#1E3932',
      primary: '#2E7D5A',
      primaryForeground: '#FFFFFF',
      secondary: '#E5F2E8',
      secondaryForeground: '#2E7D5A',
      muted: '#E5F2E8',
      mutedForeground: '#5A7A6A',
      accent: '#E8A54B',
      accentForeground: '#1E3932',
      border: '#C8E0D0',
      surface: '#FFFFFF',
      surfaceSoft: '#E5F2E8',
    },
    palette: [
      { name: 'Palm Green', color: '#2E7D5A' },
      { name: 'Sunset Orange', color: '#E8A54B' },
      { name: 'Coral', color: '#E8847A' },
      { name: 'Ocean Teal', color: '#4A9A8A' },
      { name: 'Sand', color: '#F5E8D8' },
      { name: 'Deep Jungle', color: '#1E3932' },
    ],
  },
];

export const defaultTheme = vibeThemes[0];

export function detectTheme(vibeQuery: string): VibeTheme {
  const query = vibeQuery.toLowerCase();

  for (const theme of vibeThemes) {
    for (const keyword of theme.keywords) {
      if (query.includes(keyword)) {
        return theme;
      }
    }
  }

  if (query.includes('cozy') || query.includes('warm') || query.includes('organic')) {
    return vibeThemes.find(t => t.name === 'japandi') || defaultTheme;
  }

  return defaultTheme;
}

export function applyTheme(theme: VibeTheme): void {
  const root = document.documentElement;

  root.style.setProperty('--background', theme.colors.background);
  root.style.setProperty('--foreground', theme.colors.foreground);
  root.style.setProperty('--card', theme.colors.card);
  root.style.setProperty('--card-foreground', theme.colors.cardForeground);
  root.style.setProperty('--primary', theme.colors.primary);
  root.style.setProperty('--primary-foreground', theme.colors.primaryForeground);
  root.style.setProperty('--secondary', theme.colors.secondary);
  root.style.setProperty('--secondary-foreground', theme.colors.secondaryForeground);
  root.style.setProperty('--muted', theme.colors.muted);
  root.style.setProperty('--muted-foreground', theme.colors.mutedForeground);
  root.style.setProperty('--accent', theme.colors.accent);
  root.style.setProperty('--accent-foreground', theme.colors.accentForeground);
  root.style.setProperty('--border', theme.colors.border);
  root.style.setProperty('--surface', theme.colors.surface);
  root.style.setProperty('--surface-soft', theme.colors.surfaceSoft);
  root.style.setProperty('--input', theme.colors.border);
  root.style.setProperty('--ring', theme.colors.primary);
}
