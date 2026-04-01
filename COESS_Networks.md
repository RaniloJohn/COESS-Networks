# COESS Networks — Full-Stack Platform Implementation Plan

A gamified, module-based networking education platform inspired by TryHackMe. Students learn subnetting, VLSM, OSI model, and build network topologies with a simulated CLI — all in the browser.

---

## Understanding Summary

- **What:** A gamified learning platform for networking education with interactive tools (subnet/VLSM calculators, topology builder, simulated CLI, OSI visualizer)
- **Why:** Free alternative to Cisco Packet Tracer and paid platforms for practicing subnetting and network design
- **Who:** COESS CPE students initially (~20-50), designed to scale publicly to any networking student
- **Architecture:** Next.js App Router + Supabase (PostgreSQL + Auth) on Vercel Hobby tier
- **Budget:** $0/month (free tiers only)
- **Timeline:** Ship when ready — no deadline

---

## Design Reference: SubnetLab Pro Edition

The UI should follow the aesthetic of **SubnetLab Pro Edition** (see screenshot provided by user). Key design patterns to replicate:

| Element | SubnetLab Pattern | Our Implementation |
|:--------|:-----------------|:-------------------|
| **Theme** | Deep navy/charcoal dark background (`#0a0e1a`-ish) | CSS custom properties for dark theme |
| **Sidebar** | Left sidebar with categorized nav (Calculator, Learn, Courses, Interactive Tools) | Persistent sidebar with module categories |
| **Badges** | Color-coded difficulty badges (BEG=green, INT=blue, EXP=orange, CCNA/CCNP/CCIE) | Difficulty badges on modules/tasks |
| **Results Grid** | Card grid showing network/broadcast/hosts/wildcard/class | Replicate for subnet calculator results |
| **32-Bit Visual Map** | Binary representation with color-coded network vs host bits | Interactive binary visualizer in calculator |
| **Step-by-Step** | Numbered steps showing the subnetting math process | Tutorial mode in both calculators |
| **Address Checker** | "Check if an IP is in this subnet" widget | Add to subnet calculator |
| **Quick Examples** | Clickable preset chips (192.168.1.0/24, 10.0.0.0/8, etc.) | Implement as example buttons |
| **Typography** | Monospace for IPs, clean sans-serif for labels | `JetBrains Mono` for code/IPs, `Inter` for UI |
| **Accent Colors** | Cyan/teal highlights, yellow for icons, green/blue/orange for badges | CSS token system |
| **Actions** | Share + Export PDF buttons | Share topology link, export results |

### Color Palette (derived from SubnetLab)
```css
:root {
  --bg-primary: #0d1117;      /* Deep dark background */
  --bg-secondary: #161b22;    /* Card/panel background */
  --bg-tertiary: #1c2333;     /* Sidebar background */
  --border: #30363d;          /* Subtle borders */
  --text-primary: #e6edf3;    /* Primary text */
  --text-secondary: #8b949e;  /* Muted text */
  --accent-cyan: #00d4ff;     /* Primary accent */
  --accent-green: #3fb950;    /* Success / BEG badge */
  --accent-blue: #58a6ff;     /* Info / INT badge */
  --accent-orange: #d29922;   /* Warning / EXP badge */
  --accent-red: #f85149;      /* Error / CCIE badge */
  --accent-purple: #bc8cff;   /* XP / progress */
  --accent-yellow: #f0c000;   /* Icons / highlights */
}
```

## Tech Stack

| Layer | Technology | Rationale |
|:------|:-----------|:----------|
| **Framework** | Next.js 14+ (App Router, TypeScript) | Native Vercel integration, SSR/SSG, API routes |
| **Styling** | Vanilla CSS + CSS Modules | Max flexibility, no dependency overhead |
| **Topology Canvas** | React Flow (@xyflow/react) | Purpose-built node-based graph editor with custom nodes, edges, zoom/pan, minimap |
| **Terminal Emulator** | @xterm/xterm | Industry-standard browser terminal (used by VS Code). Client-only via `next/dynamic` |
| **Subnetting Engine** | Custom TypeScript (client-side) | Full control over tutorial step-by-step logic, no dependency needed for basic IP math |
| **Network Icons** | Lucide React + Custom SVGs from [network-icons-svg](https://github.com/bwks/network-icons-svg) | Vendor-neutral, scalable, consistent style |
| **State Management** | Zustand | Lightweight, perfect for topology state and simulation engine |
| **Database** | Supabase (PostgreSQL) | Free tier, built-in Auth, RLS, real-time |
| **Auth** | Supabase Auth (Google, GitHub, Email) | Zero-config social auth |
| **Content** | MDX files in repo | Version-controlled tutorials with embedded React components |
| **Deployment** | Vercel Hobby (free) | Auto-deploy from GitHub `main` branch |
| **Validation** | Zod | Runtime type validation for API routes |

---

## Database Schema (PostgreSQL via Supabase)

### Entity Relationship

```mermaid
erDiagram
    USERS ||--|| PROFILES : has
    USERS ||--o{ TASK_COMPLETIONS : completes
    USERS ||--o{ SAVED_TOPOLOGIES : saves
    MODULES ||--o{ TASKS : contains
    TASKS ||--o{ TASK_COMPLETIONS : tracked_by

    USERS {
        uuid id PK
        text email
        timestamptz created_at
    }
    PROFILES {
        uuid id PK FK
        text display_name
        int total_xp
        text avatar_url
        timestamptz updated_at
    }
    MODULES {
        uuid id PK
        text slug UK
        text title
        text description
        text icon
        int order_index
        text difficulty
        int total_xp
    }
    TASKS {
        uuid id PK
        uuid module_id FK
        text slug UK
        text title
        text description
        text type
        int xp_reward
        int order_index
        jsonb content_meta
    }
    TASK_COMPLETIONS {
        uuid id PK
        uuid user_id FK
        uuid task_id FK
        int xp_earned
        jsonb answer_data
        timestamptz completed_at
    }
    SAVED_TOPOLOGIES {
        uuid id PK
        uuid user_id FK
        text name
        text description
        jsonb topology_data
        boolean is_public
        timestamptz created_at
        timestamptz updated_at
    }
```

### SQL Schema

```sql
-- Profiles (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name text,
  avatar_url text,
  total_xp integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable" ON public.profiles
  FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Modules (seeded, not user-created)
CREATE TABLE public.modules (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  icon text NOT NULL, -- Lucide icon name
  order_index integer NOT NULL,
  difficulty text CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  total_xp integer DEFAULT 0
);

ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Modules are public" ON public.modules FOR SELECT USING (true);

-- Tasks within modules
CREATE TABLE public.tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id uuid REFERENCES public.modules(id) ON DELETE CASCADE,
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  type text CHECK (type IN ('tutorial', 'calculator', 'lab', 'visualizer', 'quiz')),
  xp_reward integer DEFAULT 10,
  order_index integer NOT NULL,
  content_meta jsonb DEFAULT '{}'::jsonb -- MDX file path, tool config, etc.
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tasks are public" ON public.tasks FOR SELECT USING (true);

-- Task completions (XP tracking)
CREATE TABLE public.task_completions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE,
  xp_earned integer NOT NULL,
  answer_data jsonb DEFAULT '{}'::jsonb,
  completed_at timestamptz DEFAULT now(),
  UNIQUE(user_id, task_id) -- Prevent duplicate completions
);

ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own completions" ON public.task_completions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own completions" ON public.task_completions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Auto-update profile total_xp on completion
CREATE OR REPLACE FUNCTION update_user_xp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET total_xp = (
    SELECT COALESCE(SUM(xp_earned), 0)
    FROM public.task_completions
    WHERE user_id = NEW.user_id
  ), updated_at = now()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_task_completed
AFTER INSERT ON public.task_completions
FOR EACH ROW EXECUTE FUNCTION update_user_xp();

-- Saved topologies
CREATE TABLE public.saved_topologies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  topology_data jsonb NOT NULL, -- React Flow nodes + edges + device configs
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.saved_topologies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own topologies" ON public.saved_topologies
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public topologies are viewable" ON public.saved_topologies
  FOR SELECT USING (is_public = true);
```

---

## Module Content Structure (V1)

The platform ships with these learning modules. Students can explore any module freely (no locked gates).

| # | Module | Difficulty | Tasks | Total XP |
|:--|:-------|:-----------|:------|:---------|
| 1 | **Networking Basics** | Beginner | What is a Network?, Network Types (LAN/WAN/MAN), Network Devices Overview, IP Address Basics | 40 XP |
| 2 | **OSI Model** | Beginner | Interactive 7-Layer Visualizer, Layer-by-Layer Breakdown, Protocol Mapping, Data Encapsulation Flow | 50 XP |
| 3 | **IP Addressing & Subnetting** | Intermediate | IPv4 Structure Tutorial, Subnet Mask Explained, Subnet Calculator Tool, Practice: Subnet a /24, Practice: Subnet a /16 | 80 XP |
| 4 | **VLSM** | Intermediate | Why VLSM?, VLSM Algorithm Tutorial, VLSM Calculator Tool, Practice: Design a Campus Network | 80 XP |
| 5 | **Building Topologies** | Intermediate | Topology Builder Intro, Build a Simple LAN, Build a Multi-Subnet Network, Configure Device IPs | 100 XP |
| 6 | **Network Commands** | Intermediate | Integrated CLI Terminal (inside Topology), ping & Connectivity, ipconfig / ifconfig, traceroute, Troubleshoot a Broken Network | 100 XP |

---

## Architecture: Core Systems Design

### 1. Topology Builder (React Flow)

```
┌─────────────────────────────────────────────┐
│                Topology Canvas               │
│  ┌──────┐    ┌──────┐    ┌──────┐           │
│  │Router│────│Switch│────│  PC  │           │
│  │ Node │    │ Node │    │ Node │           │
│  └──────┘    └──────┘    └──────┘           │
│                                              │
│  [Device Palette]  [Properties Panel]        │
│  - Router          - Device Name             │
│  - Switch          - Interfaces[]            │
│  - PC              - IP / Subnet Mask        │
│  - Server          - Default Gateway         │
│  - Firewall                                  │
│                                              │
│  [Integrated Terminal]                       │
│  - Collapsible bottom panel (xterm.js)       │
│  - Context-aware CLI for selected device     │
└─────────────────────────────────────────────┘
```

**Custom Node Types:**
- `RouterNode` — Multiple interfaces (fa0/0, fa0/1, etc.), routing table
- `SwitchNode` — Port connections, VLAN support (future)
- `PCNode` — Single interface, IP config, default gateway
- `ServerNode` — Single interface, services (future)

**Topology Data Model (stored as JSON):**
```typescript
interface TopologyData {
  nodes: DeviceNode[];
  edges: Connection[];
  metadata: { name: string; description: string; };
}

interface DeviceNode {
  id: string;
  type: 'router' | 'switch' | 'pc' | 'server';
  position: { x: number; y: number };
  data: {
    label: string;
    interfaces: NetworkInterface[];
    routingTable?: RoutingEntry[]; // Routers only
  };
}

interface NetworkInterface {
  name: string;         // e.g., "fa0/0" or "eth0"
  ipAddress?: string;   // e.g., "192.168.1.1"
  subnetMask?: string;  // e.g., "255.255.255.0"
  connectedTo?: string; // edge ID
  isUp: boolean;
}

interface Connection {
  id: string;
  source: string;      // node ID
  sourceHandle: string; // interface name
  target: string;
  targetHandle: string;
}
```

### 2. Network Simulation Engine (Client-Side TypeScript)

The simulation engine is a **pure TypeScript graph traversal engine** that evaluates network reachability based on the topology configuration. No backend compute needed.

```
┌──────────────────────────────────────────────────┐
│              NetworkSimulationEngine              │
│                                                   │
│  simulatePing(sourceId, destIP) → PingResult      │
│  simulateTraceroute(sourceId, destIP) → Hop[]     │
│  getInterfaceConfig(deviceId) → InterfaceInfo[]   │
│                                                   │
│  Internal:                                        │
│  ├── buildAdjacencyGraph(topology) → Graph        │
│  ├── findNextHop(currentDevice, destIP) → Device  │
│  ├── isOnSameSubnet(ip1, mask, ip2) → boolean     │
│  └── calculateRoute(src, dst) → Path              │
└──────────────────────────────────────────────────┘
```

**Ping Simulation Logic:**
1. Source device checks if destination IP is on a directly connected subnet
2. If yes → check if a device on that subnet has that IP → success/fail
3. If no → check routing table for matching route / default gateway
4. Follow next-hop chain through the graph until destination is reached or TTL expires
5. Return formatted result: `Reply from 192.168.1.1: bytes=32 time<1ms TTL=128`

### 3. Simulated CLI (xterm.js)

Click any device in the topology → a terminal panel opens at the bottom.

**Supported Commands (V1):**

| Command | Example | Behavior |
|:--------|:--------|:---------|
| `ping <ip>` | `ping 192.168.1.1` | Runs simulation engine, shows 4 replies or timeout |
| `ipconfig` | `ipconfig` | Shows all interfaces with IP, mask, gateway |
| `traceroute <ip>` | `traceroute 10.0.0.1` | Shows hop-by-hop path from simulation engine |
| `hostname` | `hostname` | Shows device label |
| `show ip route` | `show ip route` | (Routers only) Shows routing table |
| `help` | `help` | Lists available commands |
| `clear` | `clear` | Clears terminal screen |

### 4. OSI Model Visualizer

An interactive, animated visualization of the 7 OSI layers:
- Vertical stack of 7 layers with icons and descriptions
- Click a layer → expands with detailed explanation, protocols, and examples
- **Data Encapsulation Animation:** Shows a "message" traveling down through layers, getting wrapped with headers at each layer (Application → Segment → Packet → Frame → Bits)
- Built as a React component with CSS animations (no heavy library needed)

### 5. Subnet & VLSM Calculators

**Subnet Calculator:**
- Input: IP address + CIDR notation (e.g., `192.168.1.0/24`)
- Output: Network address, broadcast address, first/last usable host, total hosts, wildcard mask, binary representation
- **Tutorial Mode:** Step-by-step walkthrough showing the binary math behind each calculation

**VLSM Calculator:**
- Input: Parent network + list of departments with host requirements
- Output: Optimally sorted subnets (largest to smallest), allocated CIDR blocks, waste analysis
- **Tutorial Mode:** Shows the sorting algorithm and allocation step-by-step

Both calculators run entirely **client-side** using a custom TypeScript `IPMath` utility class.

---

## Project Structure

```
coess-networks/
├── public/
│   └── icons/                    # Network device SVGs
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Root layout with nav + auth provider
│   │   ├── page.tsx              # Landing / dashboard
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── modules/
│   │   │   ├── page.tsx          # Module grid (TryHackMe-style)
│   │   │   └── [slug]/
│   │   │       ├── page.tsx      # Module detail with task list
│   │   │       └── [taskSlug]/
│   │   │           └── page.tsx  # Individual task (tutorial/tool/lab)
│   │   ├── topology/
│   │   │   ├── page.tsx          # Topology builder (sandbox mode)
│   │   │   └── [id]/page.tsx     # Load saved topology
│   │   ├── tools/
│   │   │   ├── subnet/page.tsx   # Standalone subnet calculator
│   │   │   └── vlsm/page.tsx     # Standalone VLSM calculator
│   │   ├── profile/
│   │   │   └── page.tsx          # User profile + XP + progress
│   │   └── api/
│   │       ├── topologies/route.ts
│   │       └── progress/route.ts
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Footer.tsx
│   │   ├── topology/
│   │   │   ├── TopologyCanvas.tsx      # React Flow wrapper
│   │   │   ├── DevicePalette.tsx       # Drag source panel
│   │   │   ├── PropertiesPanel.tsx     # Device config panel
│   │   │   ├── nodes/
│   │   │   │   ├── RouterNode.tsx
│   │   │   │   ├── SwitchNode.tsx
│   │   │   │   └── PCNode.tsx
│   │   │   └── edges/
│   │   │       └── EthernetEdge.tsx
│   │   ├── terminal/
│   │   │   └── SimulatedTerminal.tsx   # xterm.js wrapper
│   │   ├── calculators/
│   │   │   ├── SubnetCalculator.tsx
│   │   │   └── VLSMCalculator.tsx
│   │   ├── osi/
│   │   │   └── OSIVisualizer.tsx
│   │   ├── modules/
│   │   │   ├── ModuleCard.tsx
│   │   │   ├── TaskList.tsx
│   │   │   └── ProgressBar.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Input.tsx
│   │       └── Modal.tsx
│   ├── lib/
│   │   ├── engine/
│   │   │   ├── ip-math.ts              # Subnet/VLSM calculation engine
│   │   │   ├── network-simulator.ts     # Ping/traceroute simulation
│   │   │   └── command-parser.ts        # CLI command parsing
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   └── middleware.ts
│   │   ├── store/
│   │   │   ├── topology-store.ts        # Zustand store for topology state
│   │   │   └── user-store.ts
│   │   └── types/
│   │       ├── topology.ts
│   │       ├── module.ts
│   │       └── network.ts
│   ├── content/
│   │   └── modules/                     # MDX tutorial files
│   │       ├── networking-basics/
│   │       ├── osi-model/
│   │       ├── subnetting/
│   │       ├── vlsm/
│   │       ├── topologies/
│   │       └── network-commands/
│   └── styles/
│       ├── globals.css
│       ├── variables.css                # Design tokens
│       ├── topology.module.css
│       └── terminal.module.css
├── supabase/
│   ├── schema.sql
│   └── seed.sql                         # Module + task seed data
├── .env.local
├── next.config.js
├── package.json
└── tsconfig.json
```

---

## Resolved Design Decisions

| # | Question | Decision | Rationale |
|:--|:---------|:---------|:----------|
| 1 | **Landing Page Style** | **Hybrid** — SubnetLab-style sidebar with tools + TryHackMe module grid as main content | Matches the SubnetLab reference design the user provided |
| 2 | **Network Icons** | **Vendor-neutral** Lucide + custom SVGs | User confirmed icon library approach |
| 3 | **Routing Tables** | **Auto-generated** from directly connected subnets | Keep V1 scope manageable; manual config is V2 |

---

## Implementation Phases

### Phase 1: Project Foundation (Days 1-3)
- Initialize Next.js project with TypeScript
- Set up CSS design system (variables, tokens, dark theme)
- Configure Supabase project (database + auth)
- Set up GitHub repo + Vercel deployment
- Build layout shell (navbar, sidebar, responsive grid)
- Implement Supabase auth (login, signup, session management)

### Phase 2: Core Engine (Days 4-8)
- Build `ip-math.ts` — the subnet/VLSM calculation engine
- Build Subnet Calculator UI with tutorial step-by-step mode
- Build VLSM Calculator UI with tutorial mode
- Write unit tests for IP math engine
- Create the `IPMath` utility: binary conversion, subnet validation, VLSM allocation

### Phase 3: Module System & Content (Days 9-13)
- Set up MDX content pipeline (`next-mdx-remote` or `@next/mdx`)
- Build module grid page (TryHackMe-style cards with progress)
- Build task detail page (renders MDX content + embedded tools)
- Implement XP system (task completion → XP tracking → profile update)
- Write initial tutorial content for Modules 1-4
- Build OSI Model Visualizer component

### Phase 4: Topology Builder (Days 14-22)
- Integrate React Flow canvas
- Build custom device nodes (Router, Switch, PC)
- Build Device Palette (drag-to-add)
- Build Properties Panel (edit interfaces, IPs, gateways)
- Implement save/load topology to Supabase
- Build topology data validation with Zod

### Phase 5: Simulation Engine & CLI Integration (In Progress)
- Build `network-simulator.ts` — adjacency graph, reachability, routing
- Build `command-parser.ts` — parse CLI input into actions
- Integrate xterm.js as `SimulatedTerminal` **within the Topology workspace**
- Implement `ping`, `ipconfig`, `traceroute`, `hostname`, `help`, `clear`
- Implement **Context Switching**: Clicking a device updates the terminal session
- Write Module 5-6 lab content (to be performed directly in the sandbox)

### Phase 6: Polish & Launch (Days 31-35)
- Landing page design (hero, features section, CTA)
- User profile page (XP, completion stats, saved topologies)
- Responsive design pass (mobile-friendly module pages)
- Performance optimization (code splitting, lazy loading topology/terminal)
- SEO meta tags on all pages
- Final testing pass

---

## Decision Log

| # | Decision | Alternatives Considered | Rationale |
|:--|:---------|:----------------------|:----------|
| 1 | **Next.js App Router** | Vite + React, Remix | Native Vercel integration, SSR for SEO, API routes as serverless functions |
| 2 | **React Flow** for topology | Konva.js, Custom Canvas, Excalidraw fork | Purpose-built for node graphs, custom nodes, built-in zoom/pan/minimap, active maintenance |
| 3 | **xterm.js** for terminal | Custom div-based terminal | Industry standard (VS Code uses it), proper terminal emulation, addon ecosystem |
| 4 | **Client-side simulation engine** | Server-side compute, WebAssembly | Zero latency, no server cost, graph traversal is lightweight enough for client |
| 5 | **Supabase** for database + auth | Firebase, PlanetScale, Neon | PostgreSQL (relational), built-in auth with social logins, RLS for security, generous free tier |
| 6 | **Zustand** for state | Redux, Jotai, Context API | Minimal boilerplate, perfect for topology state, great devtools |
| 7 | **Vanilla CSS + Modules** | Tailwind, Styled Components | Max control, no build dependency, consistent with user's existing projects |
| 8 | **MDX for tutorials** | Database-stored content, CMS | Version controlled, can embed React components, no CMS cost |
| 9 | **Lucide + custom SVGs** for icons | React Icons, Cisco icons, AI-generated | Vendor-neutral, consistent style, free, scalable |
| 10 | **No offline mode** | Service Worker + next-pwa | Reduces complexity significantly, students have internet in class |
| 11 | **Open module exploration** | Locked progression | Student-friendly, reduces friction, students know what they want to learn |
| 12 | **No animated packets** | Visual packet traversal | CLI text output is more realistic, dramatically simpler to implement |

---

## Verification Plan

### Automated Tests
- Unit tests for `ip-math.ts`: subnet calculations, VLSM allocation, binary conversion
- Unit tests for `network-simulator.ts`: ping reachability, routing logic, subnet matching
- Unit tests for `command-parser.ts`: command parsing, argument validation

### Manual Verification
- **Subnet Calculator:** Verify outputs against known-good subnetting results
- **VLSM Calculator:** Compare output with manual VLSM calculations from CCNA textbooks
- **Topology Builder:** Build a 3-router, 2-switch, 4-PC topology, assign IPs, verify connections persist on save/load
- **Simulated CLI:** Ping across subnets, verify routing through intermediate routers, test unreachable scenarios
- **Auth Flow:** Sign up, login, logout with Google and email
- **XP System:** Complete tasks, verify XP increments correctly on profile
- **Browser Testing:** Run in Chrome, Firefox, Edge to ensure cross-browser compatibility

### Deployment Verification
- Verify Vercel deployment from GitHub push
- Confirm Supabase environment variables are correctly set
- Test auth flow on production URL

---

## 🔄 Model Handoff Protocol

This section ensures **any AI model** (stronger or weaker) can continue this project from any point. When switching models, tell the new model:

> "Continue working on COESS Networks. Read the implementation plan and task checklist."

### How It Works

1. **`implementation_plan.md`** (this file) — The full architectural blueprint. Never changes during implementation unless a major design pivot is needed. Any model should read this first.

2. **`task.md`** — The granular execution checklist. Each item is:
   - **Atomic** — one clear action per checkbox
   - **Self-contained** — includes the file path, what to create, and what it should do
   - **Ordered** — items are sequenced by dependency
   - Uses `[ ]` (todo), `[/]` (in progress), `[x]` (done)

3. **Progress State** — The task.md file has a "Current State" header at the top that is updated after each work session:
   ```markdown
   ## Current State
   - **Last completed:** Phase 2, Task 4 (VLSM Calculator UI)
   - **Currently working on:** Phase 3, Task 1 (MDX pipeline setup)
   - **Blockers:** None
   - **Key files modified recently:** src/lib/engine/ip-math.ts, src/components/calculators/SubnetCalculator.tsx
   ```

### Rules for Any Model Picking This Up

1. **Read `implementation_plan.md` first** — understand the architecture
2. **Read `task.md`** — find the first unchecked `[ ]` item
3. **Don't re-architect** — follow the plan unless something is technically impossible
4. **Update task.md** after completing each item — mark `[x]` and update "Current State"
5. **If stuck**, mark the task as `[!]` with a note explaining what went wrong

### Key File Locations (Quick Reference for Any Model)

| What | Where |
|:-----|:------|
| Project root | `d:\coess-networks\` |
| Implementation plan | This file |
| Task checklist | `task.md` (same directory as this file) |
| Subnet engine | `src/lib/engine/ip-math.ts` |
| Network simulator | `src/lib/engine/network-simulator.ts` |
| CLI parser | `src/lib/engine/command-parser.ts` |
| Topology store | `src/lib/store/topology-store.ts` |
| Supabase client | `src/lib/supabase/client.ts` |
| Design tokens | `src/styles/variables.css` |
| Database schema | `supabase/schema.sql` |
