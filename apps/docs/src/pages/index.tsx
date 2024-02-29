import Link from '@docusaurus/Link'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import Layout from '@theme/Layout'
import Heading from '@theme/Heading'

import styles from './index.module.css'

export default function Index(): JSX.Element {
  const {siteConfig} = useDocusaurusContext()
  return (
    <Layout
      title={`${siteConfig.title}`}
      description="Tasenor developer documentation"
    >
      <Heading as="h1" className={styles.banner}>
        The Tasenor Project
        <div className={styles['banner-subtitle']}>Pluginized Open Source Bookkeeping</div>
      </Heading>

      <main className={styles.content}>
        <div className={styles.box}>
          <div className={styles['box-title']}>For User</div>
          TODO: Brief Introduction. How to start.
          <div className={styles['link']}>
            <Link to="/docs/guides/getting-started/features/user"><div className={styles['box-link']}>Read More</div></Link>
          </div>
        </div>
        <div className={styles.box}>
          <div className={styles['box-title']}>For Developer</div>
          TODO: Brief Introduction. How to start.
          <div className={styles['link']}>
            <Link to="/docs/guides/getting-started/features/developer"><div className={styles['box-link']}>Read More</div></Link>
          </div>
        </div>
        <div className={styles.box}>
          <div className={styles['box-title']}>For Business</div>
          TODO: Brief Introduction. How to start.
          <div className={styles['link']}>
            <Link to="/docs/guides/getting-started/features/business"><div className={styles['box-link']}>Read More</div></Link>
          </div>
        </div>
      </main>
    </Layout>
  )
}
