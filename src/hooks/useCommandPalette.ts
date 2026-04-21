import { useState, useCallback } from 'react';

export interface Command {
  id: string;
  name: string;
  category?: string;
  shortcut?: string;
  action: () => void;
}

/**
 * コマンドパレットの表示状態のみを管理するシンプルなフック。
 * コマンドのリスト管理を呼び出し側に移譲することで、無限ループを回避します。
 */
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [initialSearch, setInitialSearch] = useState('');

  const openPalette = useCallback((search: string = '') => {
    setInitialSearch(search);
    setIsOpen(true);
  }, []);
  const closePalette = useCallback(() => setIsOpen(false), []);
  const togglePalette = useCallback((search: string = '') => {
    setIsOpen(prev => {
      if (!prev) setInitialSearch(search);
      return !prev;
    });
  }, []);

  return {
    isOpen,
    initialSearch,
    openPalette,
    closePalette,
    togglePalette
  };
}
