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
          Easy to use pure browser solution for bookkeeping.
          Use keyboard to use it as a desktop application or
          automate data flow processes to get transactions
          imported effortlessly.
          <div className={styles['link']}>
            <Link to="/docs/guides/getting-started/features/user"><div className={styles['box-link']}>Read More</div></Link>
          </div>
        </div>
        <div className={styles.box}>
          <div className={styles['box-title']}>For Developer</div>
          Open Source solution giving you all the power to extend
          and implement your unique bookkeeping business needs.
          Maybe earn money with plugins written by you?
          <div className={styles['link']}>
            <Link to="/docs/guides/getting-started/features/developer"><div className={styles['box-link']}>Read More</div></Link>
          </div>
        </div>
        <div className={styles.box}>
          <div className={styles['box-title']}>For Business</div>
          Choose your industry and geographical area.
          Become a partner and provide expertise in commercial
          support on the platform.
          <div className={styles['link']}>
            <Link to="/docs/guides/getting-started/features/business"><div className={styles['box-link']}>Read More</div></Link>
          </div>
        </div>
      </main>
    </Layout>
  )
}
