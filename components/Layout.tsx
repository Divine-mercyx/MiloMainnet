import React from 'react';
import { Sidebar } from './Sidebar';
import { RightPanel } from './RightPanel';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onNavigate: (view: string) => void;
  isMobileMenuOpen: boolean;
  onMobileMenuClose: () => void;
  network: 'mainnet' | 'testnet'; // Add network prop
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  currentView, 
  onNavigate,
  isMobileMenuOpen,
  onMobileMenuClose,
  network // Destructure network prop
}) => {
  return (
    <div className="flex h-screen w-full bg-[#F8F9FA] relative">
       {/* Background decorative elements */}
       <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
           <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-teal-100/30 rounded-full blur-[100px]"></div>
           <div className="absolute bottom-[-10%] right-[20%] w-[600px] h-[600px] bg-indigo-100/30 rounded-full blur-[100px]"></div>
       </div>

      <div className="z-10 flex w-full h-full md:my-4 md:mx-6 md:h-[calc(100vh-32px)] md:w-[calc(100vw-48px)] shadow-none md:shadow-2xl rounded-none md:rounded-[32px] overflow-hidden bg-white/40 backdrop-blur-sm border-0 md:border border-white/50">
        <Sidebar 
          currentView={currentView} 
          onNavigate={onNavigate} 
          isOpen={isMobileMenuOpen}
          onClose={onMobileMenuClose}
          network={network} // Pass network prop to Sidebar
        />
        <main className="flex-1 relative flex flex-col bg-slate-50/30 w-full">
            {children}
        </main>
        <RightPanel />
      </div>
    </div>
  );
};