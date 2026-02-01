"use client";

import { ReactNode, useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Settings, 
  Bell, 
  User,
  Activity,
  Menu,
  X
} from 'lucide-react';
import MobileStatsBar from './MobileStatsBar';

interface TradingLayoutProps {
  header: ReactNode;
  chart: ReactNode;
  positions: ReactNode;
  orderForm: ReactNode;
  accountInfo: ReactNode;
  onOpenPlans?: () => void;
}

export default function TradingLayout({
  header,
  chart,
  positions,
  orderForm,
  accountInfo,
  onOpenPlans
}: TradingLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-bg-primary text-text-primary overflow-hidden">
      {/* Mobile Header */}
      <header className="lg:hidden h-[60px] bg-bg-secondary border-b border-border-primary flex items-center justify-between px-4">
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 hover:bg-bg-hover rounded transition-colors"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        
        <div className="flex-1 px-4">
          {header}
        </div>
      </header>

      {/* Mobile Stats Bar */}
      <MobileStatsBar />

      {/* Desktop Header */}
      <header className="hidden lg:flex h-[60px] bg-bg-secondary border-b border-border-primary items-center px-4">
        {header}
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Left Sidebar - Tools */}
        <aside className="hidden lg:flex w-[60px] bg-bg-primary border-r border-border-primary flex-col items-center py-4 gap-4">
          <button className="w-10 h-10 flex items-center justify-center rounded hover:bg-bg-hover transition-colors text-text-secondary hover:text-text-primary">
            <BarChart3 className="w-5 h-5" />
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded hover:bg-bg-hover transition-colors text-text-secondary hover:text-text-primary">
            <TrendingUp className="w-5 h-5" />
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded hover:bg-bg-hover transition-colors text-text-secondary hover:text-text-primary">
            <Activity className="w-5 h-5" />
          </button>
          
          {/* Plans Button */}
          {onOpenPlans && (
            <button 
              onClick={onOpenPlans}
              className="w-10 h-10 flex items-center justify-center rounded hover:bg-bg-hover transition-colors text-accent hover:text-accent/80 relative group"
              title="Subscription Plans"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {/* Notification Badge */}
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full animate-pulse"></span>
            </button>
          )}
          
          {/* Spacer */}
          <div className="flex-1"></div>
          
          <button className="w-10 h-10 flex items-center justify-center rounded hover:bg-bg-hover transition-colors text-text-secondary hover:text-text-primary">
            <Bell className="w-5 h-5" />
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded hover:bg-bg-hover transition-colors text-text-secondary hover:text-text-primary">
            <Settings className="w-5 h-5" />
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded hover:bg-bg-hover transition-colors text-text-secondary hover:text-text-primary">
            <User className="w-5 h-5" />
          </button>
        </aside>

        {/* Mobile Content - Scrollable Vertical */}
        <main className="flex-1 overflow-y-auto lg:hidden">
          {/* Chart Section */}
          <div className="h-[400px] bg-bg-primary">
            {chart}
          </div>

          {/* Account Info Section */}
          <div className="bg-bg-secondary border-t border-border-primary">
            {accountInfo}
          </div>

          {/* Order Form Section */}
          <div className="bg-bg-secondary border-t border-border-primary">
            {orderForm}
          </div>

          {/* Positions Section */}
          <div className="bg-bg-secondary border-t border-border-primary">
            <div className="p-4">
              <h3 className="text-sm font-semibold mb-3">Open Positions</h3>
            </div>
            {positions}
          </div>
        </main>

        {/* Desktop Center - Chart & Positions */}
        <main className="hidden lg:flex flex-1 flex-col overflow-hidden">
          {/* Chart Area */}
          <div className="flex-1 bg-bg-primary overflow-hidden">
            {chart}
          </div>

          {/* Positions Table */}
          <div className="h-[200px] bg-bg-secondary border-t border-border-primary overflow-auto">
            {positions}
          </div>
        </main>

        {/* Desktop Right Sidebar - Orders & Account */}
        <aside className="hidden lg:flex w-[320px] bg-bg-secondary border-l border-border-primary flex-col overflow-hidden">
          {/* Account Info */}
          <div className="border-b border-border-primary">
            {accountInfo}
          </div>

          {/* Order Form */}
          <div className="flex-1 overflow-auto">
            {orderForm}
          </div>
        </aside>
      </div>
    </div>
  );
}
