import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

export default function Index(): JSX.Element {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title}`}
      description="Tasenor developer documentation">
        <Heading as="h1" className={styles.banner}>
          Welcome to Tasenor Project
        </Heading>
      <main className={styles.content}>
        TODO: Content
      </main>
    </Layout>
  );
}
