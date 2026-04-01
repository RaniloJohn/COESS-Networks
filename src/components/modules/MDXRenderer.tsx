'use client';

import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import SubnetCalculator from '@/components/calculators/SubnetCalculator';
import VLSMCalculator from '@/components/calculators/VLSMCalculator';
import OSIVisualizer from '@/components/osi/OSIVisualizer';
import styles from './MDXRenderer.module.css';

interface MDXRendererProps {
  source: MDXRemoteSerializeResult;
}

const components = {
  SubnetCalculator: () => (
    <div className={styles.embeddedTool}>
      <SubnetCalculator />
    </div>
  ),
  VLSMCalculator: () => (
    <div className={styles.embeddedTool}>
      <VLSMCalculator />
    </div>
  ),
  OSIModel: () => (
    <div className={styles.embeddedTool}>
      <OSIVisualizer />
    </div>
  ),
  // Add other shared components here
  blockquote: (props: any) => (
    <blockquote className={styles.blockquote} {...props} />
  ),
  h1: (props: any) => <h1 className={styles.h1} {...props} />,
  h2: (props: any) => <h2 className={styles.h2} {...props} />,
  h3: (props: any) => <h3 className={styles.h3} {...props} />,
  p: (props: any) => <p className={styles.p} {...props} />,
  ul: (props: any) => <ul className={styles.ul} {...props} />,
  li: (props: any) => <li className={styles.li} {...props} />,
  code: (props: any) => <code className={styles.code} {...props} />,
  pre: (props: any) => <pre className={styles.pre} {...props} />,
};

export default function MDXRenderer({ source }: MDXRendererProps) {
  return (
    <div className={styles.content}>
      <MDXRemote {...source} components={components} />
    </div>
  );
}
