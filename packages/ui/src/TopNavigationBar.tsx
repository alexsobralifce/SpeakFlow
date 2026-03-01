import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NavItem {
  id: string;
  label: string;
  href: string;
}

export interface TopNavigationBarProps {
  logo?: React.ReactNode;
  items: NavItem[];
  activeItemId?: string;
  userAvatar?: React.ReactNode;
  className?: string;
}

export function TopNavigationBar({ logo, items, activeItemId, userAvatar, className }: TopNavigationBarProps) {
  return (
    <header
      className={cn("sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-neutral-100", className)}
      role="banner"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer">
              {logo || <div className="w-8 h-8 rounded-lg bg-primary-500" />}
              <span className="font-display font-bold text-xl text-neutral-900 tracking-tight">SpeakFlow</span>
            </div>
            <nav className="hidden md:ml-10 md:flex md:space-x-8" role="navigation">
              {items.map((item) => {
                const isActive = item.id === activeItemId;
                return (
                  <a
                    key={item.id}
                    href={item.href}
                    className={cn(
                      "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors",
                      isActive
                        ? "border-primary-500 text-neutral-900"
                        : "border-transparent text-neutral-600 hover:text-neutral-900 hover:border-neutral-300"
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {item.label}
                  </a>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-neutral-600 hover:text-primary-500 transition-colors">
              <span className="sr-only">Notifications</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            {userAvatar}
          </div>
        </div>
      </div>
    </header>
  );
}
