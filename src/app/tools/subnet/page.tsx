import type { Metadata } from 'next';
import SubnetCalculator from '@/components/calculators/SubnetCalculator';

export const metadata: Metadata = {
  title: 'IPv4 Subnet Calculator — COESS Networks',
  description: 'Calculate subnets with step-by-step binary breakdowns. Get network address, broadcast, host range, wildcard mask, and IP class instantly.',
};

export default function SubnetPage() {
  return <SubnetCalculator />;
}
