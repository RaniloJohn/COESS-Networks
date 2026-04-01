import type { Metadata } from 'next';
import VLSMCalculator from '@/components/calculators/VLSMCalculator';

export const metadata: Metadata = {
  title: 'VLSM Calculator — COESS Networks',
  description: 'Variable Length Subnet Masking (VLSM) calculator. Divide a parent network into subnets of varying sizes with maximum efficiency.',
};

export default function VLSMPage() {
  return <VLSMCalculator />;
}
