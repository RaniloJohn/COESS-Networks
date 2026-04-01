'use client';

import { useState, useCallback } from 'react';
import { Network, Plus, Trash2, Calculator, Info, AlertCircle } from 'lucide-react';
import { calculateVLSM, isValidIp, isValidPrefix } from '@/lib/engine/ip-math';
import type { VLSMResult, VLSMAllocation } from '@/lib/types/network';
import styles from './VLSMCalculator.module.css';

interface DepartmentInput {
  id: string;
  name: string;
  hosts: string;
}

export default function VLSMCalculator() {
  const [parentIp, setParentIp] = useState('192.168.1.0');
  const [parentPrefix, setParentPrefix] = useState('24');
  const [departments, setDepartments] = useState<DepartmentInput[]>([
    { id: '1', name: 'Engineering', hosts: '50' },
    { id: '2', name: 'Marketing', hosts: '20' },
    { id: '3', name: 'HR', hosts: '10' },
    { id: '4', name: 'Support', hosts: '10' },
  ]);
  const [result, setResult] = useState<VLSMResult | null>(null);
  const [error, setError] = useState('');

  const addDepartment = () => {
    setDepartments([
      ...departments,
      { id: Math.random().toString(36).substr(2, 9), name: '', hosts: '' },
    ]);
  };

  const removeDepartment = (id: string) => {
    if (departments.length > 1) {
      setDepartments(departments.filter((d) => d.id !== id));
    }
  };

  const updateDepartment = (id: string, field: keyof DepartmentInput, value: string) => {
    setDepartments(
      departments.map((d) => (d.id === id ? { ...d, [field]: value } : d))
    );
  };

  const calculate = useCallback(() => {
    setError('');
    setResult(null);

    if (!isValidIp(parentIp)) {
      setError('Invalid parent network IP.');
      return;
    }

    const prefixNum = parseInt(parentPrefix);
    if (!isValidPrefix(prefixNum)) {
      setError('Invalid parent prefix (0-32).');
      return;
    }

    const deptInputs = departments
      .filter((d) => d.name.trim() !== '' && !isNaN(parseInt(d.hosts)))
      .map((d) => ({
        name: d.name,
        hosts: parseInt(d.hosts),
      }));

    if (deptInputs.length === 0) {
      setError('Please add at least one department with host requirements.');
      return;
    }

    const res = calculateVLSM({
      networkAddress: parentIp,
      prefix: prefixNum,
      departments: deptInputs,
    });

    if (!res.success) {
      setError(res.error || 'VLSM calculation failed.');
    } else {
      setResult(res);
    }
  }, [parentIp, parentPrefix, departments]);

  // Initial calculation
  if (!result && !error && parentIp && parentPrefix) {
    calculate();
  }

  return (
    <div className={styles.calculator}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            <Calculator size={28} />
            VLSM Planner
          </h1>
          <p className={styles.subtitle}>
            Optimally allocate subnets of different sizes within a parent network
          </p>
        </div>
      </div>

      <div className={styles.grid}>
        {/* ── Left Column: Config ── */}
        <div className={styles.configCol}>
          {/* Parent Network Card */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>— PARENT NETWORK</h3>
            <div className={styles.parentRow}>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>NETWORK IP</label>
                <input
                  type="text"
                  value={parentIp}
                  onChange={(e) => setParentIp(e.target.value)}
                  className={styles.input}
                  placeholder="192.168.1.0"
                />
              </div>
              <div className={styles.inputGroupSmall}>
                <label className={styles.inputLabel}>PREFIX</label>
                <div className={styles.prefixInput}>
                  <span className={styles.prefixSlash}>/</span>
                  <input
                    type="text"
                    value={parentPrefix}
                    onChange={(e) => setParentPrefix(e.target.value.replace(/\D/g, ''))}
                    className={styles.input}
                    placeholder="24"
                    maxLength={2}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Departments Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>— DEPARTMENTS / SUBNETS</h3>
              <button onClick={addDepartment} className={styles.addBtn}>
                <Plus size={16} /> Add Subnet
              </button>
            </div>
            
            <div className={styles.deptList}>
              {departments.map((dept, index) => (
                <div key={dept.id} className={styles.deptRow}>
                  <div className={styles.deptInputGroup}>
                    <input
                      type="text"
                      value={dept.name}
                      onChange={(e) => updateDepartment(dept.id, 'name', e.target.value)}
                      className={styles.input}
                      placeholder={`Department ${index + 1}`}
                    />
                  </div>
                  <div className={styles.hostInputGroup}>
                    <input
                      type="text"
                      value={dept.hosts}
                      onChange={(e) => updateDepartment(dept.id, 'hosts', e.target.value.replace(/\D/g, ''))}
                      className={styles.input}
                      placeholder="Hosts"
                    />
                  </div>
                  <button
                    onClick={() => removeDepartment(dept.id)}
                    className={styles.removeBtn}
                    disabled={departments.length <= 1}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <button onClick={calculate} className={styles.calcBtn}>
              <Calculator size={18} /> Generate VLSM Plan
            </button>
            
            {error && (
              <div className={styles.errorAlert}>
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Right Column: Results ── */}
        <div className={styles.resultCol}>
          {result && result.success ? (
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>— ALLOCATION RESULTS</h3>
              
              <div className={styles.summaryGrid}>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>TOTAL AVAILABLE</span>
                  <span className={styles.summaryValue}>{result.totalAvailable} IPs</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>TOTAL ALLOCATED</span>
                  <span className={styles.summaryValue}>{result.totalAllocated} IPs</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>REMAINING SPACE</span>
                  <span className={styles.summaryValue}>{result.remainingAddresses} IPs</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>UTILIZATION</span>
                  <span className={styles.summaryValue}>
                    {((result.totalAllocated / result.totalAvailable) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>NAME</th>
                      <th>REQ</th>
                      <th>ALLOC</th>
                      <th>NETWORK</th>
                      <th>CIDR</th>
                      <th>MASK</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.allocations.map((alloc, i) => (
                      <tr key={i}>
                        <td className={styles.nameCell}>{alloc.name}</td>
                        <td className={styles.monoCell}>{alloc.hostsRequired}</td>
                        <td className={styles.monoCell}>{alloc.hostsAllocated}</td>
                        <td className={styles.ipCell}>{alloc.networkAddress}</td>
                        <td className={styles.monoCell}>/{alloc.prefix}</td>
                        <td className={styles.monoCell}>{alloc.subnetMask}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className={styles.infoBox}>
                <Info size={16} />
                <p>Allocations are optimally sorted from largest subnet to smallest to minimize address fragmentation.</p>
              </div>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <Network size={48} />
              </div>
              <p>Configure your parent network and departments, then click <strong>Generate</strong> to see the allocation plan.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
