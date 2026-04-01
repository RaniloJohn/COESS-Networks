'use client';

import { useState, useCallback } from 'react';
import { Calculator, Copy, Check, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import {
  calculateSubnet,
  isValidIp,
  isValidPrefix,
  isIpInSubnet,
  generateSubnetTutorial,
} from '@/lib/engine/ip-math';
import type { SubnetResult, TutorialStep } from '@/lib/types/network';
import styles from './SubnetCalculator.module.css';

const QUICK_EXAMPLES = [
  '192.168.1.0/24',
  '10.0.0.0/8',
  '172.16.5.70/20',
  '192.168.1.128/25',
  '10.10.10.0/30',
];

export default function SubnetCalculator() {
  const [ipAddress, setIpAddress] = useState('192.168.10.0');
  const [prefix, setPrefix] = useState('26');
  const [result, setResult] = useState<SubnetResult | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialSteps, setTutorialSteps] = useState<TutorialStep[]>([]);
  const [checkIp, setCheckIp] = useState('');
  const [checkResult, setCheckResult] = useState<boolean | null>(null);

  const calculate = useCallback(() => {
    setError('');
    setCheckResult(null);

    if (!isValidIp(ipAddress)) {
      setError('Invalid IP address. Use format: x.x.x.x (0-255 each)');
      setResult(null);
      return;
    }

    const prefixNum = parseInt(prefix);
    if (!isValidPrefix(prefixNum)) {
      setError('Invalid prefix. Must be between 0 and 32.');
      setResult(null);
      return;
    }

    const res = calculateSubnet(ipAddress, prefixNum);
    setResult(res);
    setTutorialSteps(generateSubnetTutorial(ipAddress, prefixNum));
  }, [ipAddress, prefix]);

  const loadExample = (example: string) => {
    const [ip, pfx] = example.split('/');
    setIpAddress(ip);
    setPrefix(pfx);
    setError('');

    const res = calculateSubnet(ip, parseInt(pfx));
    setResult(res);
    setTutorialSteps(generateSubnetTutorial(ip, parseInt(pfx)));
  };

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  };

  const handleCheckIp = () => {
    if (!result || !isValidIp(checkIp)) return;
    setCheckResult(isIpInSubnet(checkIp, result.networkAddress, result.prefix));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') calculate();
  };

  // Calculate on initial render
  if (!result && isValidIp(ipAddress) && isValidPrefix(parseInt(prefix))) {
    const res = calculateSubnet(ipAddress, parseInt(prefix));
    setResult(res);
    setTutorialSteps(generateSubnetTutorial(ipAddress, parseInt(prefix)));
  }

  return (
    <div className={styles.calculator}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            <Calculator size={28} />
            IPv4 Subnet Calculator
          </h1>
          <p className={styles.subtitle}>
            Enter any IP address with a prefix to get full subnet details
          </p>
        </div>
      </div>

      <div className={styles.grid}>
        {/* ── Left Column: Input + Binary Map + Tutorial ── */}
        <div className={styles.leftCol}>
          {/* Input Section */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardLabel}>— INPUT</span>
              <span className={`badge badge-beginner`}>BEGINNER FRIENDLY</span>
            </div>
            <p className={styles.inputHint}>
              💡 Type an IP address like 192.168.1.0 and a prefix like /24 — or use the examples below.
            </p>

            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>IP ADDRESS</label>
                <input
                  id="ip-input"
                  type="text"
                  value={ipAddress}
                  onChange={(e) => setIpAddress(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className={styles.input}
                  placeholder="192.168.10.0"
                />
              </div>
              <div className={styles.inputGroupSmall}>
                <label className={styles.inputLabel}>PREFIX</label>
                <div className={styles.prefixInput}>
                  <span className={styles.prefixSlash}>/</span>
                  <input
                    id="prefix-input"
                    type="text"
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value.replace(/\D/g, ''))}
                    onKeyDown={handleKeyDown}
                    className={styles.input}
                    placeholder="24"
                    maxLength={2}
                  />
                </div>
              </div>
              <button onClick={calculate} className={styles.calcBtn} id="calculate-btn">
                Calculate
              </button>
            </div>

            {error && <p className={styles.error}>{error}</p>}

            {/* Quick Examples */}
            <div className={styles.examples}>
              <span className={styles.exampleLabel}>QUICK EXAMPLES</span>
              <div className={styles.exampleChips}>
                {QUICK_EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => loadExample(ex)}
                    className={styles.exampleChip}
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 32-Bit Visual Map */}
          {result && (
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>— 32-BIT VISUAL MAP</h3>
              <BinaryVisualMap
                binary={result.ipBinary.replace(/\./g, '')}
                networkBits={result.prefix}
                ip={result.ipAddress}
              />
              <div className={styles.bitLegend}>
                <span className={styles.legendNetwork}>■ Network bits</span>
                <span className={styles.legendHost}>■ Host bits</span>
              </div>
            </div>
          )}

          {/* Step-by-Step Tutorial */}
          {result && (
            <div className={styles.card}>
              <button
                className={styles.tutorialToggle}
                onClick={() => setShowTutorial(!showTutorial)}
              >
                <HelpCircle size={18} />
                <span>— STEP-BY-STEP EXPLANATION</span>
                {showTutorial ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              {showTutorial && (
                <div className={styles.tutorialSteps}>
                  {tutorialSteps.map((step) => (
                    <div key={step.step} className={styles.tutorialStep}>
                      <h4 className={styles.stepTitle}>
                        STEP {step.step} — {step.title.toUpperCase()}
                      </h4>
                      <p className={styles.stepText}>{step.explanation}</p>
                      {step.binary && (
                        <BinaryVisualMap
                          binary={step.binary.value}
                          networkBits={step.binary.networkBits}
                          ip=""
                          compact
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right Column: Results + Address Checker ── */}
        <div className={styles.rightCol}>
          {/* Results Grid */}
          {result && (
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>— RESULTS</h3>
              <div className={styles.resultsGrid}>
                <ResultCell
                  label="NETWORK ADDRESS"
                  value={result.networkAddress}
                  onCopy={() => copyToClipboard(result.networkAddress, 'network')}
                  copied={copied === 'network'}
                />
                <ResultCell
                  label="BROADCAST ADDRESS"
                  value={result.broadcastAddress}
                  onCopy={() => copyToClipboard(result.broadcastAddress, 'broadcast')}
                  copied={copied === 'broadcast'}
                />
                <ResultCell
                  label="FIRST USABLE HOST"
                  value={result.firstUsableHost}
                  onCopy={() => copyToClipboard(result.firstUsableHost, 'first')}
                  copied={copied === 'first'}
                />
                <ResultCell
                  label="LAST USABLE HOST"
                  value={result.lastUsableHost}
                  onCopy={() => copyToClipboard(result.lastUsableHost, 'last')}
                  copied={copied === 'last'}
                />
                <ResultCell label="USABLE HOSTS" value={result.usableHosts.toLocaleString()} />
                <ResultCell label="TOTAL IPS" value={result.totalIPs.toLocaleString()} />
                <ResultCell
                  label="SUBNET MASK"
                  value={result.subnetMask}
                  onCopy={() => copyToClipboard(result.subnetMask, 'mask')}
                  copied={copied === 'mask'}
                />
                <ResultCell label="WILDCARD MASK" value={result.wildcardMask} />
                <ResultCell label="IP CLASS" value={result.ipClass} />
                <ResultCell
                  label="CIDR NOTATION"
                  value={result.cidrNotation}
                  onCopy={() => copyToClipboard(result.cidrNotation, 'cidr')}
                  copied={copied === 'cidr'}
                />
                <ResultCell label="NETWORK (BINARY)" value={result.networkBinary} mono />
                <ResultCell label="MASK (BINARY)" value={result.maskBinary} mono />
              </div>
            </div>
          )}

          {/* Address Type Checker */}
          {result && (
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>— ADDRESS TYPE CHECKER</h3>
              <p className={styles.checkerLabel}>CHECK IF AN IP IS IN THIS SUBNET</p>
              <div className={styles.checkerRow}>
                <input
                  type="text"
                  value={checkIp}
                  onChange={(e) => {
                    setCheckIp(e.target.value);
                    setCheckResult(null);
                  }}
                  placeholder={result.firstUsableHost}
                  className={styles.input}
                  id="check-ip-input"
                  onKeyDown={(e) => e.key === 'Enter' && handleCheckIp()}
                />
                <button onClick={handleCheckIp} className={styles.checkBtn} id="check-ip-btn">
                  Check →
                </button>
              </div>
              {checkResult !== null && (
                <div className={`${styles.checkResult} ${checkResult ? styles.checkPass : styles.checkFail}`}>
                  {checkResult
                    ? `✅ ${checkIp} IS in subnet ${result.cidrNotation}`
                    : `❌ ${checkIp} is NOT in subnet ${result.cidrNotation}`}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-Components ──

function ResultCell({
  label,
  value,
  onCopy,
  copied,
  mono,
}: {
  label: string;
  value: string;
  onCopy?: () => void;
  copied?: boolean;
  mono?: boolean;
}) {
  return (
    <div className={styles.resultCell}>
      <span className={styles.resultLabel}>{label}</span>
      <div className={styles.resultValue}>
        <span className={mono ? styles.monoValue : styles.ipValue}>{value}</span>
        {onCopy && (
          <button onClick={onCopy} className={styles.copyBtn} title="Copy">
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        )}
      </div>
    </div>
  );
}

function BinaryVisualMap({
  binary,
  networkBits,
  ip,
  compact,
}: {
  binary: string;
  networkBits: number;
  ip: string;
  compact?: boolean;
}) {
  const bits = binary.replace(/\./g, '').split('');
  const octets = [
    bits.slice(0, 8),
    bits.slice(8, 16),
    bits.slice(16, 24),
    bits.slice(24, 32),
  ];

  const ipOctets = ip ? ip.split('.') : [];

  return (
    <div className={`${styles.binaryMap} ${compact ? styles.binaryMapCompact : ''}`}>
      {!compact && (
        <div className={styles.bitHeaders}>
          {Array.from({ length: 32 }, (_, i) => (
            <span key={i} className={styles.bitHeader}>
              {i % 8 === 0 ? i + 1 : ''}
            </span>
          ))}
        </div>
      )}
      <div className={styles.octetsRow}>
        {octets.map((octet, oi) => (
          <div key={oi} className={styles.octetGroup}>
            <div className={styles.octetBits}>
              {octet.map((bit, bi) => {
                const globalIndex = oi * 8 + bi;
                const isNetwork = globalIndex < networkBits;
                return (
                  <span
                    key={bi}
                    className={`${styles.bit} ${isNetwork ? styles.bitNetwork : styles.bitHost}`}
                  >
                    {bit}
                  </span>
                );
              })}
            </div>
            {!compact && ipOctets[oi] && (
              <span className={styles.octetDecimal}>{ipOctets[oi]}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
