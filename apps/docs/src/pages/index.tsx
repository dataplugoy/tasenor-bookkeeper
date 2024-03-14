import Link from '@docusaurus/Link'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import Layout from '@theme/Layout'
import Heading from '@theme/Heading'

import styles from './index.module.css'

export default function Index(): JSX.Element {
  const { siteConfig } = useDocusaurusContext()
  return (
    <Layout
      title={`${siteConfig.title}`}
      description="Tasenor developer documentation"
    >
      <Heading as="h1" className={styles.banner}>
        <div></div>
        <img src="logo.png" alt="Tasenor Logo"/>
        <div>
          <div className={styles['banner-title']}>The Tasenor Project</div>
          <div className={styles['banner-subtitle']}>Pluginized Open Source Bookkeeping</div>
        </div>
      </Heading>

      <main className={styles.content}>
        <div className={styles.box}>
          <div className={styles['box-title']}>For User</div>
          An easy-to-use pure browser solution for bookkeeping. Use the keyboard just like in a desktop
          application or automate data flow processes for effortless transaction imports.
          <div className={styles['link']}>
            <Link to="/docs/guides/getting-started/features/user-features"><div className={styles['box-link']}>Read More</div></Link>
          </div>
        </div>
        <div className={styles.box}>
          <div className={styles['box-title']}>For Developer</div>
          Open Source solution giving you all the power to extend and implement your unique bookkeeping business needs. Consider making money by leasing your written plug-ins.
          <div className={styles['link']}>
            <Link to="/docs/guides/getting-started/features/developer-features"><div className={styles['box-link']}>Read More</div></Link>
          </div>
        </div>
        <div className={styles.box}>
          <div className={styles['box-title']}>For Business</div>
          Choose your industry and geographical area. Join us as a partner and provide commercial support expertise on the platform.
          <div className={styles['link']}>
            <Link to="/docs/guides/getting-started/features/business-features"><div className={styles['box-link']}>Read More</div></Link>
          </div>
        </div>
      </main>
    </Layout>
  )
}
