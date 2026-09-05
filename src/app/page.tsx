import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import styles from './page.module.css';
import { PricingForm } from './PricingForm';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <main className={styles.main}>
      {/* Navigation Header */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <Image src="/logo.png" alt="SigmaTracker" width={180} height={40} priority />
        </div>
        <nav className={styles.nav}>
          <a href="#features">Features</a>
          <a href="#how-it-works">How it Works</a>
          <a href="#download">Download App</a>
          <a href="#pricing">Pricing</a>
          <div className={styles.navActions}>
            <Link href="/login">
              <Button variant="outline" size="sm">Log in</Button>
            </Link>
            <a href="#pricing">
              <Button variant="primary" size="sm">Start Free Trial</Button>
            </a>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.badge}>✨ The ultimate productivity suite</div>
          <h1 className={styles.title}>
            Next-Generation Time Tracking <br />
            <span className={styles.highlight}>For Modern Teams</span>
          </h1>
          <p className={styles.subtitle}>
            Monitor productivity, track activity natively, and capture automated screenshots seamlessly. 
            The premium solution for managing remote and in-office teams globally.
          </p>
          <div className={styles.actions}>
            <a href="#pricing">
              <Button size="lg" variant="primary">Get Started Now</Button>
            </a>
            <a href="#download">
              <Button size="lg" variant="outline">Download App</Button>
            </a>
          </div>
        </div>

        {/* Hero Dashboard Preview */}
        <div className={styles.dashboardPreview}>
          <div className={styles.glowEffect}></div>
          <Card className={styles.previewCard}>
            <div className={styles.previewHeader}>
              <div className={styles.previewTitle}>Live Dashboard Overview</div>
              <div className={styles.previewTabs}>
                <span className={styles.activeTab}>Summary</span>
                <span>Timesheet</span>
                <span>Screenshots</span>
              </div>
            </div>
            <div className={styles.previewBody}>
              <div className={styles.statBox}>
                <div className={styles.statLabel}>Total Time Logged</div>
                <div className={styles.statValue}>42h 30m</div>
                <div className={styles.statProgress}>
                  <div className={styles.statBar} style={{ width: '85%' }}></div>
                </div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statLabel}>Native Activity Level</div>
                <div className={styles.statValue}>94%</div>
                <div className={styles.statProgress}>
                  <div className={styles.statBar} style={{ width: '94%', backgroundColor: 'var(--success)' }}></div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Download Section */}
      <section id="download" className={styles.downloadSection}>
        <div className={styles.downloadContent}>
          <h2>Ready to supercharge your team's productivity?</h2>
          <p>Download our native desktop client for your operating system. Lightweight, secure, and blazing fast.</p>
          <div className={styles.downloadActions}>
            <a href="/SigmaTracker.msi" download="SigmaTracker.msi">
              <Button size="lg" variant="primary">
                💻 Windows Installer (.msi)
              </Button>
            </a>
            <a href="/SigmaTracker-mac.dmg" download="SigmaTracker-mac.dmg">
              <Button size="lg" variant="primary" style={{ background: '#1e293b', borderColor: '#334155' }}>
                🍏 macOS (.dmg)
              </Button>
            </a>
            <a href="/SigmaTracker-linux.AppImage" download="SigmaTracker-linux.AppImage">
              <Button size="lg" variant="primary" style={{ background: '#0f172a', borderColor: '#334155' }}>
                🐧 Linux (.AppImage)
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className={styles.featuresSection}>
        <div className={styles.sectionHeader}>
          <h2>Why choose SigmaTracker?</h2>
          <p>Everything you need to manage your remote workforce efficiently and transparently.</p>
        </div>
        
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>📸</div>
            <h3>Smart Screenshots</h3>
            <p>Automated randomized screenshots at set intervals. Keep your team accountable without micromanaging.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>⌨️</div>
            <h3>Native Activity Tracking</h3>
            <p>C++ powered background tracking precisely calculates mouse clicks and keystrokes for exact productivity percentages.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🔐</div>
            <h3>Role-Based Access</h3>
            <p>Super Admins, Company Admins, and Employees all get dedicated secure dashboards with tailored analytics.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>⏸️</div>
            <h3>Intelligent Auto-Pause</h3>
            <p>Automatically stops tracking when employees step away from their desk for a customized idle duration.</p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className={styles.howItWorksSection}>
        <div className={styles.sectionHeader}>
          <h2>How It Works</h2>
          <p>Get your entire company onboarded and tracking time in less than 3 minutes.</p>
        </div>
        
        <div className={styles.stepsContainer}>
          <div className={styles.step}>
            <div className={styles.stepNumber}>1</div>
            <h3>Create a Company</h3>
            <p>Subscribe using our dynamic Stripe checkout and instantly provision your workspace.</p>
          </div>
          <div className={styles.stepConnector}></div>
          <div className={styles.step}>
            <div className={styles.stepNumber}>2</div>
            <h3>Invite Employees</h3>
            <p>Add your remote workers through the Admin portal. They'll receive instant access credentials.</p>
          </div>
          <div className={styles.stepConnector}></div>
          <div className={styles.step}>
            <div className={styles.stepNumber}>3</div>
            <h3>Download & Track</h3>
            <p>Employees download the native app for their OS (Windows, Mac, or Linux), click start, and productivity is synced live!</p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className={styles.pricingSection}>
        <div className={styles.pricingHeader}>
          <h2>Simple, Transparent Pricing</h2>
          <p>Pay exactly for what you use. No hidden fees or complex enterprise tiers.</p>
        </div>
        <PricingForm />
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.logo}>
            <Image src="/logo.png" alt="SigmaTracker" width={180} height={40} className={styles.footerLogo} />
          </div>
          <p className={styles.copyright}>© {new Date().getFullYear()} SigmaTracker Inc. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
