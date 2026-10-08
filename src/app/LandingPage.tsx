import Image from 'next/image';
import Link from 'next/link';
import { PricingForm } from './PricingForm';
import styles from './landing.module.css';

const features = [
  ['Live visibility', 'One calm console for time, activity, screenshots, and application usage.'],
  ['Meaningful activity', 'Averaged activity gives managers useful context instead of noisy second-by-second scores.'],
  ['Privacy controls', 'Each company chooses screenshot timing, retention, permissions, and idle policy.'],
  ['Focused roles', 'Employees, company admins, and platform owners each get the controls they need.'],
  ['Simple onboarding', 'Invite your team, install the Windows app, and begin tracking in minutes.'],
  ['Billing clarity', 'Seat-based subscriptions, payment status, and billing history stay visible.'],
];

export default function LandingPage() {
  return <main className={styles.main}>
    <header className={styles.header}>
      <Link href="/" aria-label="SigmaTracker home"><Image src="/logo.png" alt="SigmaTracker" width={172} height={40} priority /></Link>
      <nav><a href="#product">Product</a><a href="#workflow">Workflow</a><a href="#pricing">Pricing</a></nav>
      <div className={styles.headerActions}><Link href="/login">Log in</Link><a className={styles.primary} href="#pricing">Start now</a></div>
    </header>

    <section className={styles.hero}>
      <div className={styles.copy}><p className={styles.eyebrow}>TIME INTELLIGENCE FOR MODERN TEAMS</p><h1>Know where work goes. Help it move forward.</h1><p>SigmaTracker brings time, activity, and progress into one respectful workspace, without turning management into micromanagement.</p><div className={styles.actions}><a className={styles.primary} href="#pricing">Create your workspace</a><a className={styles.secondary} href="#download">Download for Windows</a></div><small>Role-based access <i /> Live reporting <i /> Configurable privacy</small></div>
      <ProductPreview />
    </section>

    <section className={styles.proof}><div><b>One workspace</b><span>for your whole company</span></div><div><b>Three focused roles</b><span>employee, admin, platform owner</span></div><div><b>Windows desktop app</b><span>built into the daily workflow</span></div></section>

    <section id="product" className={styles.section}><div className={styles.lead}><p className={styles.eyebrow}>BUILT FOR CLARITY</p><h2>Everything a team needs to understand the workday.</h2><p>Give managers timely context and give employees a simple tool that stays out of the way while they work.</p></div><div className={styles.features}>{features.map(([title, text], i) => <article key={title}><span>0{i + 1}</span><h3>{title}</h3><p>{text}</p></article>)}</div></section>

    <section id="workflow" className={styles.workflow}><div className={styles.lead}><p className={styles.eyebrow}>A CLEAR START</p><h2>From sign-up to insight in three steps.</h2></div><div className={styles.steps}><article><span>01</span><h3>Create your workspace</h3><p>Choose seats and set the policies that fit your team.</p></article><article><span>02</span><h3>Invite your people</h3><p>Employees receive web access and the native desktop tracker.</p></article><article><span>03</span><h3>Review real work</h3><p>Use timesheets, activity, and screenshots to guide better conversations.</p></article></div></section>

    <section id="download" className={styles.download}><div><p className={styles.eyebrow}>THE DESKTOP EXPERIENCE</p><h2>A tracker that feels at home on Windows.</h2><p>Start, pause, review your day, and stay informed from the SigmaTracker desktop app.</p><a href="/SigmaTracker.msi" download="SigmaTracker.msi" className={styles.primary}>Download MSI installer</a></div><div className={styles.desktopApp}><Image src="/app-icon.png" alt="SigmaTracker app icon" width={100} height={100}/><div><b>SigmaTracker for Windows</b><span>Live sync with your workspace</span></div></div></section>

    <section id="pricing" className={styles.pricing}><div className={styles.lead}><p className={styles.eyebrow}>SIMPLE PRICING</p><h2>Only pay for the people you manage.</h2><p>$1 per employee, per month. Start when you are ready.</p></div><PricingForm /></section>
    <footer><Image src="/logo.png" alt="SigmaTracker" width={160} height={37}/><span>Time intelligence for teams that care about better work.</span><span>Copyright {new Date().getFullYear()} SigmaTracker</span></footer>
  </main>;
}

function ProductPreview() {
  return <div className={styles.product}><div className={styles.window}><span><Image src="/app-icon.png" alt="" width={18} height={18}/> SigmaTracker</span><em>--</em></div><div className={styles.productBody}><aside><b>S</b><span className={styles.active}>Overview</span><span>Timesheets</span><span>Screenshots</span><span>App usage</span><span>Reports</span></aside><div className={styles.dashboard}><div className={styles.dashboardTop}><div><b>Good morning, Arefin</b><small>October 08, 2026</small></div><span>Live tracking</span></div><div className={styles.metrics}><Metric label="TIME LOGGED" value="06:42:18" note="+12% this week"/><Metric label="AVG. ACTIVITY" value="84%" note="Healthy focus"/></div><div className={styles.chart}><b>Team activity</b><div>{[35,55,48,78,65,91,74,86,60,70].map((height, index) => <i key={index} style={{height: `${height}%`}}/>)}</div></div><div className={styles.pulse}><b>Team pulse</b><p><span>MA</span>Mukto Arefin <em>92%</em></p><p><span>SR</span>Sarah Rahman <em>86%</em></p><p><span>TK</span>Tanvir Khan <em>78%</em></p></div></div></div></div>;
}
function Metric({ label, value, note }: {label:string;value:string;note:string}) { return <div><small>{label}</small><strong>{value}</strong><em>{note}</em></div>; }
