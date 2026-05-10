'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LuLayoutDashboard, LuPlus, LuHistory, LuSettings } from 'react-icons/lu';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Dashboard', icon: LuLayoutDashboard, href: '/' },
  { label: 'New Stalk', icon: LuPlus, href: '/stalk/new' },
  { label: 'History', icon: LuHistory, href: '/history' },
  { label: 'Settings', icon: LuSettings, href: '/settings' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="fixed top-0 left-0 w-[240px] h-screen bg-surface border-r border-rim flex flex-col px-4 py-6">
      {/* Logo */}
      <div className="px-3 mb-8">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-2.5 h-2.5 rounded-full bg-brand" />
          <span className="font-serif text-[16px] text-white tracking-[-0.02em]">
            Slot Stalker
          </span>
        </div>
        <p className="text-[11px] font-sans font-normal text-subtle pl-5">
          Dineout reservation agent
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-sans font-medium transition-colors duration-200',
                isActive
                  ? 'bg-surface-2 text-white border-l-2 border-brand'
                  : 'text-subtle hover:text-faint hover:bg-[#161616]'
              )}
            >
              <item.icon size={16} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Connection status */}
      <div className="px-3 pt-4 border-t border-rim">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-rim text-[11px] font-sans text-faint">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          Demo mode
        </div>
      </div>
    </div>
  );
}
