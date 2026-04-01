'use client';

import Link from 'next/link';
import { User, LogIn, Search } from 'lucide-react';
import styles from './Navbar.module.css';

interface NavbarProps {
  user?: { email?: string; displayName?: string } | null;
}

export default function Navbar({ user }: NavbarProps) {
  return (
    <header className={styles.navbar}>
      <div className={styles.left}>
        {/* Breadcrumb or page title goes here in the future */}
      </div>

      <div className={styles.center}>
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search modules, tools, topics..."
            className={styles.searchInput}
            id="global-search"
            disabled
          />
          <kbd className={styles.searchKbd}>⌘K</kbd>
        </div>
      </div>

      <div className={styles.right}>
        {user ? (
          <Link href="/profile" className={styles.userBtn}>
            <User size={18} />
            <span className={styles.userName}>{user.displayName || user.email}</span>
          </Link>
        ) : (
          <Link href="/login" className={styles.loginBtn}>
            <LogIn size={18} />
            <span>Sign In</span>
          </Link>
        )}
      </div>
    </header>
  );
}
