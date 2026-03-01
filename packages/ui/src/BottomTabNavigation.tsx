import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TabItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

export interface BottomTabNavigationProps {
  tabs: TabItem[];
  activeTabId: string;
  onChange: (id: string) => void;
  className?: string;
}

export function BottomTabNavigation({ tabs, activeTabId, onChange, className }: BottomTabNavigationProps) {
  return (
    <nav
      className={cn("fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-100 px-6 py-4 flex justify-between items-center shadow-[0_-4px_20px_rgba(0,0,0,0.02)] pb-safe", className)}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex flex-col items-center justify-center space-y-1 min-w-[64px] transition-colors focus:outline-none",
              isActive ? "text-primary-500" : "text-neutral-300 hover:text-neutral-600"
            )}
          >
            <div className={cn("p-1", isActive && "bg-primary-50 rounded-xl")}>
              {tab.icon}
            </div>
            <span className={cn("text-xs font-medium font-body", isActive && "font-bold")}>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
