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

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-rim z-50">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 px-4 py-1.5 transition-colors duration-200',
                isActive ? 'text-brand' : 'text-subtle'
              )}
            >
              <item.icon size={20} />
              <span className="text-[10px] font-sans">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
