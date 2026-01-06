import { ReactNode, createContext, useContext, useState } from 'react';
import { Sidebar } from './Sidebar';

interface LayoutContextType {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
}

const LayoutContext = createContext<LayoutContextType>({ collapsed: false, setCollapsed: () => {} });

export const useLayout = () => useContext(LayoutContext);

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <LayoutContext.Provider value={{ collapsed, setCollapsed }}>
      <div className="min-h-screen bg-background">
        <Sidebar />
        <main className={`transition-all duration-300 ${collapsed ? 'pl-20' : 'pl-64'}`}>
          <div className="p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </LayoutContext.Provider>
  );
}
