import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface AppContextType {
  darkMode: boolean;
  toggleDark: () => void;
  lang: 'en' | 'kn';
  toggleLang: () => void;
}

const AppContext = createContext<AppContextType>({
  darkMode: false,
  toggleDark: () => {},
  lang: 'en',
  toggleLang: () => {},
});

export function AppProvider({ children }: { children: ReactNode }) {
  const [darkMode, setDarkMode] = useState(false);
  const [lang, setLang] = useState<'en' | 'kn'>('en');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const toggleDark = () => setDarkMode(d => !d);
  const toggleLang = () => setLang(l => (l === 'en' ? 'kn' : 'en'));

  return (
    <AppContext.Provider value={{ darkMode, toggleDark, lang, toggleLang }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
