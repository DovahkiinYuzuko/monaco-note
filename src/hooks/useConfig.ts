import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';

export interface SavedTab {
  name: string;
  path: string | null;
  cache_id: string | null;
}

export interface AppConfig {
  editor_font_family: string;
  editor_font_size: number;
  preview_font_family: string;
  preview_font_size: number;
  theme: 'vs-dark' | 'light';
  save_tabs: boolean;
  last_split_ratio: number;
  lang: 'ja' | 'en';
  saved_tabs?: SavedTab[];
  snippets: Record<string, string>;
  open_external_browser: boolean;
  default_encoding: string;
}

export const defaultConfig: AppConfig = {
  editor_font_family: 'system-ui',
  editor_font_size: 16,
  preview_font_family: 'system-ui',
  preview_font_size: 16,
  theme: 'vs-dark',
  save_tabs: true,
  last_split_ratio: 50,
  lang: 'ja',
  saved_tabs: [],
  snippets: {
    'date': '${currentDate}'
  },
  open_external_browser: true,
  default_encoding: 'UTF-8'
};

export function useConfig() {
  const [config, setConfigState] = useState<AppConfig>(defaultConfig);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadConfig = useCallback(async () => {
    try {
      const loadedConfig = await invoke<AppConfig>('load_config');
      if (loadedConfig) {
        setConfigState(prev => ({ ...prev, ...loadedConfig }));
      }
    } catch (e) {
      console.error('Failed to load config', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const setConfig = useCallback(async (newConfig: Partial<AppConfig>) => {
    setConfigState(prev => {
      const updatedConfig = { ...prev, ...newConfig };
      invoke('save_config', { config: updatedConfig }).catch(e => {
        console.error('Failed to save config', e);
      });
      return updatedConfig;
    });
  }, []);

  return { config, setConfig, isLoaded, reloadConfig: loadConfig };
}
