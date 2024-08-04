'use client';

import React from 'react';

export type Settings = {
  mounted: boolean;
};

const SettingsContext = React.createContext<Settings|undefined>(undefined);

export const useSettings = () =>
  React.useContext(SettingsContext)
  ?? (() => {
    throw new Error('useSettings() is called out of the context!');
  })();

const SettingsProvider: React.FC<React.PropsWithChildren> = ({
  children 
}) => {
  const [mounted, setMounted] = React.useState<boolean>(false);
  React.useEffect(() => setMounted(true), []);
  return (
    <SettingsContext.Provider
      value={{ 
        mounted,
       }}
    >
       {children}
    </SettingsContext.Provider>
  );
};

export default SettingsProvider;

