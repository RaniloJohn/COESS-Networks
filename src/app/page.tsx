import Link from 'next/link';
import {
  Calculator,
  GitBranch,
  Layers,
  Cpu,
  Terminal,
  BookOpen,
  Sparkles,
  ArrowRight,
  Network,
  Binary,
  Globe,
  Zap,
} from 'lucide-react';
import styles from './page.module.css';

const quickTools = [
  {
    title: 'IPv4 Subnet Calculator',
    description: 'Calculate subnets with step-by-step binary breakdowns',
    href: '/tools/subnet',
    icon: <Calculator size={24} />,
    badge: 'BEG',
    badgeType: 'beginner' as const,
    color: 'cyan',
  },
  {
    title: 'VLSM Planner',
    description: 'Design efficient variable-length subnet topologies',
    href: '/tools/vlsm',
    icon: <GitBranch size={24} />,
    badge: 'INT',
    badgeType: 'intermediate' as const,
    color: 'blue',
  },
  {
    title: 'Topology Builder',
    description: 'Drag-and-drop network design with simulated CLI',
    href: '/topology',
    icon: <Cpu size={24} />,
    badge: 'LIVE',
    badgeType: 'live' as const,
    color: 'purple',
  },
  {
    title: 'OSI Visualizer',
    description: 'Interactive 7-layer model with data encapsulation',
    href: '/modules/osi-model',
    icon: <Layers size={24} />,
    badge: 'BEG',
    badgeType: 'beginner' as const,
    color: 'green',
  },
];

const modules = [
  {
    title: 'Networking Basics',
    description: 'What is a network? LAN, WAN, MAN, and core devices.',
    href: '/modules/networking-basics',
    icon: <Globe size={20} />,
    difficulty: 'Beginner',
    tasks: 4,
    xp: 40,
  },
  {
    title: 'OSI Model',
    description: 'Interactive layer-by-layer breakdown with encapsulation flow.',
    href: '/modules/osi-model',
    icon: <Layers size={20} />,
    difficulty: 'Beginner',
    tasks: 4,
    xp: 50,
  },
  {
    title: 'IP Addressing & Subnetting',
    description: 'IPv4 structure, subnet masks, and hands-on calculations.',
    href: '/modules/subnetting',
    icon: <Binary size={20} />,
    difficulty: 'Intermediate',
    tasks: 5,
    xp: 80,
  },
  {
    title: 'VLSM',
    description: 'Variable Length Subnet Masking with real-world campus designs.',
    href: '/modules/vlsm',
    icon: <Network size={20} />,
    difficulty: 'Intermediate',
    tasks: 4,
    xp: 80,
  },
  {
    title: 'Building Topologies',
    description: 'Hands-on labs: build, configure, and test network designs.',
    href: '/modules/topologies',
    icon: <Cpu size={20} />,
    difficulty: 'Intermediate',
    tasks: 4,
    xp: 100,
  },
  {
    title: 'Network Commands',
    description: 'Master ping, traceroute, ipconfig in our simulated CLI.',
    href: '/modules/network-commands',
    icon: <Terminal size={20} />,
    difficulty: 'Intermediate',
    tasks: 5,
    xp: 100,
  },
];

export default function HomePage() {
  return (
    <div className={styles.page}>
      {/* ── Hero Section ── */}
      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <Sparkles size={14} />
            <span>Interactive Networking Lab</span>
          </div>
          <h1 className={styles.heroTitle}>
            Master Networking,<br />
            <span className={styles.heroGradient}>One Subnet at a Time</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Practice subnetting, build topologies, and simulate network commands — all in your browser. 
            No downloads, no cost, no excuses.
          </p>
          <div className={styles.heroActions}>
            <Link href="/modules" className={styles.btnPrimary}>
              <BookOpen size={18} />
              Start Learning
            </Link>
            <Link href="/tools/subnet" className={styles.btnSecondary}>
              <Zap size={18} />
              Try Calculator
            </Link>
          </div>
        </div>
      </section>

      {/* ── Quick Tools Grid ── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Quick Access Tools</h2>
          <p className={styles.sectionSubtitle}>Jump straight into the tools you need</p>
        </div>
        <div className={styles.toolsGrid}>
          {quickTools.map((tool) => (
            <Link key={tool.href} href={tool.href} className={`${styles.toolCard} ${styles[`tool${tool.color}`]}`}>
              <div className={styles.toolIcon}>{tool.icon}</div>
              <div className={styles.toolContent}>
                <div className={styles.toolHeader}>
                  <h3 className={styles.toolTitle}>{tool.title}</h3>
                  <span className={`badge badge-${tool.badgeType}`}>{tool.badge}</span>
                </div>
                <p className={styles.toolDesc}>{tool.description}</p>
              </div>
              <ArrowRight size={16} className={styles.toolArrow} />
            </Link>
          ))}
        </div>
      </section>

      {/* ── Modules Grid ── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Learning Modules</h2>
          <p className={styles.sectionSubtitle}>TryHackMe-style rooms — learn at your own pace, earn XP</p>
        </div>
        <div className={styles.modulesGrid}>
          {modules.map((mod) => (
            <Link key={mod.href} href={mod.href} className={styles.moduleCard}>
              <div className={styles.moduleIcon}>{mod.icon}</div>
              <div className={styles.moduleContent}>
                <h3 className={styles.moduleTitle}>{mod.title}</h3>
                <p className={styles.moduleDesc}>{mod.description}</p>
                <div className={styles.moduleMeta}>
                  <span className={`badge badge-${mod.difficulty.toLowerCase()}`}>{mod.difficulty}</span>
                  <span className={styles.moduleStats}>{mod.tasks} tasks · {mod.xp} XP</span>
                </div>
              </div>
              {/* Progress bar placeholder */}
              <div className={styles.progressTrack}>
                <div className={styles.progressFill} style={{ width: '0%' }} />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
