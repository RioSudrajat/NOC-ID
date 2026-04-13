"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface AppSidebarProps {
  navItems: NavItem[];
  portalName: ReactNode;
  portalLabel: ReactNode;
  infoCard?: ReactNode;
  collapsedIcon?: ReactNode;
  /** Number of nav items to show in mobile header (default: 4) */
  mobileNavCount?: number;
  /**
   * When true, uses inline Tailwind classes for active nav links
   * instead of the .sidebar-link.active CSS class.
   */
  useInlineActiveStyle?: boolean;
}

export function AppSidebar({
  navItems,
  portalName,
  portalLabel,
  infoCard,
  collapsedIcon,
  mobileNavCount = 4,
  useInlineActiveStyle = false,
}: AppSidebarProps) {
  const pathname = usePathname();
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);

  const isNavActive = (item: NavItem) => {
    if (useInlineActiveStyle) {
      return pathname === item.href || (item.href !== navItems[0]?.href && pathname.startsWith(item.href));
    }
    return pathname === item.href;
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col min-h-screen p-5 border-r relative transition-all duration-300 ease-in-out shrink-0 ${
          isLeftCollapsed ? "w-20 items-center" : "w-64"
        }`}
        style={{
          background: "var(--solana-dark-2)",
          borderColor: "rgba(94, 234, 212,0.4)",
          boxShadow: "2px 0 20px rgba(0,0,0,0.4)",
          zIndex: 40,
        }}
      >
        <button
          onClick={() => setIsLeftCollapsed(!isLeftCollapsed)}
          className="absolute -right-3 top-8 rounded-full p-1.5 text-white z-10 transition-transform hover:scale-110 shadow-lg cursor-pointer"
          style={{ background: "var(--solana-purple)" }}
        >
          {isLeftCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>

        {/* Logo */}
        <Link
          href="/"
          className={`flex items-center gap-3 mb-8 ${isLeftCollapsed ? "justify-center" : ""}`}
        >
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
            <Image src="/noc_logo.png" alt="NOC Logo" width={36} height={36} className="object-contain" />
          </div>
          {!isLeftCollapsed && (
            <span className="font-bold text-lg whitespace-nowrap overflow-hidden transition-opacity">
              {portalName}
            </span>
          )}
        </Link>

        {/* Info card / collapsed icon */}
        {!isLeftCollapsed ? (
          infoCard && <div className="mb-6">{infoCard}</div>
        ) : (
          collapsedIcon && <div className="mb-6">{collapsedIcon}</div>
        )}

        {/* Nav links */}
        <nav className={`flex flex-col ${useInlineActiveStyle ? "gap-1" : "gap-2"} flex-1 w-full`}>
          {navItems.map((item) => {
            const active = isNavActive(item);

            if (useInlineActiveStyle) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center p-3 rounded-xl transition-colors ${
                    active
                      ? "bg-teal-500/10 text-teal-400"
                      : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                  } ${isLeftCollapsed ? "justify-center" : "gap-3"}`}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  {!isLeftCollapsed && (
                    <span className="whitespace-nowrap text-sm">{item.label}</span>
                  )}
                </Link>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link flex items-center p-3 rounded-xl transition-colors ${
                  active ? "active" : ""
                } ${isLeftCollapsed ? "justify-center" : "gap-3"}`}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!isLeftCollapsed && (
                  <span className="whitespace-nowrap">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Back link */}
        <Link
          href="/"
          className={`mt-4 flex items-center p-3 rounded-xl transition-colors ${
            useInlineActiveStyle
              ? "text-gray-400 hover:bg-white/5 hover:text-gray-200"
              : "sidebar-link"
          } ${isLeftCollapsed ? "justify-center" : "gap-3"}`}
        >
          <ChevronLeft className="w-5 h-5 shrink-0" />
          {!isLeftCollapsed && (
            <span className={`whitespace-nowrap ${useInlineActiveStyle ? "text-sm" : ""}`}>
              Back to Home
            </span>
          )}
        </Link>
      </aside>

      {/* Mobile header */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4"
        style={{
          background: "rgba(14,14,26,0.95)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(94, 234, 212,0.1)",
        }}
      >
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
            <Image src="/noc_logo.png" alt="NOC Logo" width={32} height={32} className="object-contain" />
          </div>
          <span className="font-bold text-sm">{portalLabel}</span>
        </Link>
        <div className="flex items-center gap-2">
          {navItems.slice(0, mobileNavCount).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="p-2 rounded-lg transition-colors"
              style={{
                background:
                  pathname === item.href
                    ? "rgba(94, 234, 212,0.15)"
                    : "transparent",
                color:
                  pathname === item.href
                    ? "var(--solana-green)"
                    : "var(--solana-text-muted)",
              }}
            >
              <item.icon className="w-5 h-5" />
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
