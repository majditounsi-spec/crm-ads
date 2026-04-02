import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface WhiteLabelConfig {
  // Branding
  companyName: string;
  subtitle: string;
  logoUrl: string; // URL or data URI
  faviconUrl: string;
  userInitials: string;

  // Theme
  theme: string; // preset key
  primaryHue: number;
  primarySaturation: number;
  primaryLightness: number;
  accentColor: string; // 'violet' | 'blue' | 'emerald' | 'rose' | 'amber' | 'cyan'
  sidebarStyle: 'dark' | 'light' | 'gradient';
  borderRadius: number; // 0-20px

  // Features
  showGoogleAds: boolean;
  showMetaAds: boolean;
  showSEO: boolean;
  showFilmFoto: boolean;
  showWebb: boolean;
}

const defaultConfig: WhiteLabelConfig = {
  companyName: 'MarketFlow',
  subtitle: 'CRM för Mediabyrå',
  logoUrl: '',
  faviconUrl: '',
  userInitials: 'MT',
  theme: 'default',
  primaryHue: 250,
  primarySaturation: 80,
  primaryLightness: 60,
  accentColor: 'violet',
  sidebarStyle: 'dark',
  borderRadius: 14,
  showGoogleAds: true,
  showMetaAds: true,
  showSEO: true,
  showFilmFoto: true,
  showWebb: true,
};

const STORAGE_KEY = 'marketflow_whitelabel';

// Pre-built theme presets
export const themePresets: Record<string, { name: string; description: string; primary: [number, number, number]; accent: string; sidebar: 'dark' | 'light' | 'gradient' }> = {
  default: {
    name: 'MarketFlow Indigo',
    description: 'Standard violet/indigo-tema',
    primary: [250, 80, 60],
    accent: 'violet',
    sidebar: 'dark',
  },
  ocean: {
    name: 'Ocean Blue',
    description: 'Professionellt blått tema',
    primary: [210, 85, 55],
    accent: 'blue',
    sidebar: 'dark',
  },
  emerald: {
    name: 'Emerald Growth',
    description: 'Fräscht grönt tema',
    primary: [160, 75, 42],
    accent: 'emerald',
    sidebar: 'dark',
  },
  sunset: {
    name: 'Sunset Rose',
    description: 'Varmt rosa/orange tema',
    primary: [340, 75, 55],
    accent: 'rose',
    sidebar: 'dark',
  },
  midnight: {
    name: 'Midnight Pro',
    description: 'Mörkt elegant tema',
    primary: [230, 70, 55],
    accent: 'blue',
    sidebar: 'dark',
  },
  minimal: {
    name: 'Minimal Light',
    description: 'Rent, minimalistiskt tema',
    primary: [220, 15, 40],
    accent: 'cyan',
    sidebar: 'light',
  },
  agency: {
    name: 'Creative Agency',
    description: 'Kreativt tema med gradient-sidebar',
    primary: [280, 80, 55],
    accent: 'violet',
    sidebar: 'gradient',
  },
  amber: {
    name: 'Amber Energy',
    description: 'Energiskt gult/orange tema',
    primary: [35, 90, 50],
    accent: 'amber',
    sidebar: 'dark',
  },
};

interface WhiteLabelContextType {
  config: WhiteLabelConfig;
  updateConfig: (updates: Partial<WhiteLabelConfig>) => void;
  resetConfig: () => void;
  applyPreset: (presetKey: string) => void;
}

const WhiteLabelContext = createContext<WhiteLabelContextType>({
  config: defaultConfig,
  updateConfig: () => {},
  resetConfig: () => {},
  applyPreset: () => {},
});

export function useWhiteLabel() {
  return useContext(WhiteLabelContext);
}

function applyThemeToDOM(config: WhiteLabelConfig) {
  const root = document.documentElement;

  // Primary color
  root.style.setProperty('--primary', `${config.primaryHue} ${config.primarySaturation}% ${config.primaryLightness}%`);
  root.style.setProperty('--ring', `${config.primaryHue} ${config.primarySaturation}% ${config.primaryLightness}%`);
  root.style.setProperty('--accent', `${config.primaryHue} ${config.primarySaturation}% 95%`);
  root.style.setProperty('--accent-foreground', `${config.primaryHue} ${config.primarySaturation}% 38%`);

  // Border radius
  root.style.setProperty('--radius', `${config.borderRadius / 16}rem`);

  // Sidebar style
  if (config.sidebarStyle === 'light') {
    root.style.setProperty('--sidebar-background', '228 25% 97%');
    root.style.setProperty('--sidebar-foreground', '228 30% 30%');
    root.style.setProperty('--sidebar-accent', '228 18% 92%');
    root.style.setProperty('--sidebar-accent-foreground', '228 30% 8%');
    root.style.setProperty('--sidebar-border', '228 16% 88%');
    root.style.setProperty('--sidebar-muted', '228 10% 60%');
  } else if (config.sidebarStyle === 'gradient') {
    root.style.setProperty('--sidebar-background', `${config.primaryHue} 40% 12%`);
    root.style.setProperty('--sidebar-foreground', `${config.primaryHue} 14% 78%`);
    root.style.setProperty('--sidebar-accent', `${config.primaryHue} 30% 18%`);
    root.style.setProperty('--sidebar-accent-foreground', '0 0% 100%');
    root.style.setProperty('--sidebar-border', `${config.primaryHue} 30% 20%`);
    root.style.setProperty('--sidebar-muted', `${config.primaryHue} 15% 45%`);
  } else {
    root.style.setProperty('--sidebar-background', '232 30% 10%');
    root.style.setProperty('--sidebar-foreground', '228 14% 75%');
    root.style.setProperty('--sidebar-accent', '232 24% 16%');
    root.style.setProperty('--sidebar-accent-foreground', '0 0% 100%');
    root.style.setProperty('--sidebar-border', '232 24% 18%');
    root.style.setProperty('--sidebar-muted', '232 15% 40%');
  }

  root.style.setProperty('--sidebar-primary', `${config.primaryHue} ${config.primarySaturation}% ${config.primaryLightness}%`);
  root.style.setProperty('--sidebar-ring', `${config.primaryHue} ${config.primarySaturation}% ${config.primaryLightness}%`);

  // Update favicon
  if (config.faviconUrl) {
    const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
    if (link) link.href = config.faviconUrl;
  }

  // Update page title
  document.title = `${config.companyName} – ${config.subtitle}`;
}

export function WhiteLabelProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<WhiteLabelConfig>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return { ...defaultConfig, ...JSON.parse(stored) };
    } catch {}
    return defaultConfig;
  });

  useEffect(() => {
    applyThemeToDOM(config);
  }, [config]);

  const updateConfig = (updates: Partial<WhiteLabelConfig>) => {
    setConfig(prev => {
      const next = { ...prev, ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const resetConfig = () => {
    localStorage.removeItem(STORAGE_KEY);
    setConfig(defaultConfig);
  };

  const applyPreset = (presetKey: string) => {
    const preset = themePresets[presetKey];
    if (!preset) return;
    updateConfig({
      theme: presetKey,
      primaryHue: preset.primary[0],
      primarySaturation: preset.primary[1],
      primaryLightness: preset.primary[2],
      accentColor: preset.accent,
      sidebarStyle: preset.sidebar,
    });
  };

  return (
    <WhiteLabelContext.Provider value={{ config, updateConfig, resetConfig, applyPreset }}>
      {children}
    </WhiteLabelContext.Provider>
  );
}
