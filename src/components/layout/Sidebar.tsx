'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Network,
  Binary,
  Layers,
  MonitorSmartphone,
  Terminal,
  Calculator,
  GitBranch,
  Globe,
  BookOpen,
  Cpu,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import styles from './Sidebar.module.css';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: { text: string; type: 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'live' };
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navigation: NavSection[] = [
  {
    title: 'Calculator',
    items: [
      { label: 'IPv4 Calculator', href: '/tools/subnet', icon: <Calculator size={18} />, badge: { text: 'BEG', type: 'beginner' } },
      { label: 'VLSM Planner', href: '/tools/vlsm', icon: <Calculator size={18} />, badge: { text: 'INT', type: 'intermediate' } },
    ],
  },
  {
    title: 'Learn',
    items: [
      { label: 'Networking Basics', href: '/modules/networking-basics', icon: <Globe size={18} />, badge: { text: 'BEG', type: 'beginner' } },
      { label: 'OSI Model', href: '/modules/osi-model', icon: <Layers size={18} />, badge: { text: 'BEG', type: 'beginner' } },
      { label: 'Subnetting', href: '/modules/subnetting', icon: <Calculator size={18} />, badge: { text: 'INT', type: 'intermediate' } },
      { label: 'VLSM', href: '/modules/vlsm', icon: <Cpu size={18} />, badge: { text: 'INT', type: 'intermediate' } },
    ],
  },
  {
    title: 'Interactive Tools',
    items: [
      { label: 'Topology Builder', href: '/topology', icon: <Cpu size={18} />, badge: { text: 'LIVE', type: 'live' } },
      { label: 'Network Commands', href: '/modules/network-commands', icon: <Terminal size={18} />, badge: { text: 'INT', type: 'intermediate' } },
    ],
  },
  {
    title: 'Modules',
    items: [
      { label: 'All Modules', href: '/modules', icon: <BookOpen size={18} /> },
      { label: 'My Topologies', href: '/topology', icon: <MonitorSmartphone size={18} /> },
    ],
  },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const getBadgeClass = (type: string) => {
    switch (type) {
      case 'beginner': return styles.badgeBeginner;
      case 'intermediate': return styles.badgeIntermediate;
      case 'advanced': return styles.badgeAdvanced;
      case 'expert': return styles.badgeExpert;
      case 'live': return styles.badgeLive;
      default: return '';
    }
  };

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      {/* Logo */}
      <div className={styles.logo}>
        <Link href="/" className={styles.logoLink}>
          <Globe size={28} className={styles.logoIcon} />
          {!collapsed && (
            <div className={styles.logoText}>
              <span className={styles.logoTitle}>COESS Networks</span>
              <span className={styles.logoEdition}>PRO EDITION</span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        {navigation.map((section) => (
          <div key={section.title} className={styles.section}>
            {!collapsed && <h3 className={styles.sectionTitle}>{section.title}</h3>}
            <ul className={styles.navList}>
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                      title={collapsed ? item.label : undefined}
                    >
                      <span className={styles.navIcon}>{item.icon}</span>
                      {!collapsed && (
                        <>
                          <span className={styles.navLabel}>{item.label}</span>
                          {item.badge && (
                            <span className={`${styles.badge} ${getBadgeClass(item.badge.type)}`}>
                              {item.badge.text}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Collapse Toggle */}
      <button
        className={styles.collapseBtn}
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>
    </aside>
  );
}
