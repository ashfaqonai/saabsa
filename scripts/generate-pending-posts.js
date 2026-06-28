#!/usr/bin/env node
/**
 * Generate 90 scheduled blog posts in _posts/pending/ for daily publishing.
 * Topics cover Patientree AI, DataXPipe, Lease Exit, and Saabsa services.
 *
 *   node scripts/generate-pending-posts.js
 *   node scripts/generate-pending-posts.js --force   # overwrite existing pending files
 */

const fs = require('fs');
const path = require('path');

const PENDING_DIR = path.join(__dirname, '..', '_posts', 'pending');

const PRODUCTS = {
    patientree: { name: 'Patientree AI', url: 'https://www.patientree.com', category: 'Healthcare Technology' },
    dataxpipe: { name: 'DataXPipe', url: 'https://www.dataxpipe.com/', category: 'Data Engineering' },
    leasexit: { name: 'Lease Exit', url: 'https://leasexit.com/', category: 'Consumer Legal Tech' },
    saabsa: { name: 'Saabsa Solutions', url: 'https://www.saabsa.com/contact.html', category: 'Company News' },
    ai: { name: 'Saabsa Solutions', url: 'https://www.saabsa.com/services.html', category: 'AI & Automation' },
};

/** @type {{ title: string, slug: string, product: keyof PRODUCTS, imageKeyword: string, angle: string }[]} */
const TOPICS = [
    // Patientree AI (01–25)
    { title: 'The $0 AI Clinic Launch: How Small Practices Get Online Without Upfront Cost', slug: 'zero-cost-ai-clinic-launch-for-small-practices', product: 'patientree', imageKeyword: 'medical clinic technology', angle: 'launching a modern clinic website and AI tools without a large upfront invoice' },
    { title: 'Self-Scheduling UX: Fewer Abandons, More Booked Visits', slug: 'self-scheduling-ux-fewer-abandons-more-visits', product: 'patientree', imageKeyword: 'online appointment booking', angle: 'designing patient self-scheduling flows that convert' },
    { title: 'SMS vs Email for Appointment Reminders: What Converts in 2026', slug: 'sms-vs-email-appointment-reminders-2026', product: 'patientree', imageKeyword: 'patient text message reminder', angle: 'choosing reminder channels that reduce no-shows' },
    { title: 'HIPAA-Compliant Scheduling Software: What Clinics Must Verify', slug: 'hipaa-compliant-scheduling-software-checklist', product: 'patientree', imageKeyword: 'healthcare compliance', angle: 'security and compliance checks before adopting scheduling software' },
    { title: 'Prior Authorization Workflows for Outpatient Clinics', slug: 'prior-authorization-workflows-outpatient-clinics', product: 'patientree', imageKeyword: 'medical prior authorization', angle: 'streamlining prior auth without adding staff burden' },
    { title: 'Remote Patient Monitoring Enrollment: A Playbook for Clinics', slug: 'remote-patient-monitoring-enrollment-playbook', product: 'patientree', imageKeyword: 'remote patient monitoring', angle: 'enrolling patients in RPM programs efficiently' },
    { title: 'Chronic Care Management Time Tracking Best Practices', slug: 'chronic-care-management-time-tracking', product: 'patientree', imageKeyword: 'chronic care management', angle: 'documenting CCM minutes for compliant billing' },
    { title: 'Patient Portal Adoption Strategies That Actually Work', slug: 'patient-portal-adoption-strategies-that-work', product: 'patientree', imageKeyword: 'patient portal healthcare', angle: 'driving portal usage beyond the initial signup' },
    { title: 'Digital Intake Before the Visit: A 2026 Clinic Guide', slug: 'digital-intake-before-the-visit-2026-guide', product: 'patientree', imageKeyword: 'digital patient intake', angle: 'collecting forms and consent before patients arrive' },
    { title: 'AI Scribes and Ambient Documentation for Outpatient Clinics', slug: 'ai-scribes-ambient-documentation-outpatient', product: 'patientree', imageKeyword: 'AI medical documentation', angle: 'reducing documentation time without compromising note quality' },
    { title: 'Revenue Cycle Automation with AI for Small Practices', slug: 'revenue-cycle-automation-ai-small-practices', product: 'patientree', imageKeyword: 'medical billing automation', angle: 'using AI to tighten coding, claims, and collections' },
    { title: 'No-Show Risk Scoring for Outpatient Practices', slug: 'no-show-risk-scoring-outpatient-practices', product: 'patientree', imageKeyword: 'missed medical appointment', angle: 'predicting and preventing missed appointments' },
    { title: 'Preventive Care Recall Campaigns That Close Gaps', slug: 'preventive-care-recall-campaigns-close-gaps', product: 'patientree', imageKeyword: 'preventive healthcare outreach', angle: 'automated outreach for screenings and follow-ups' },
    { title: 'Secure Care Team Messaging for Outpatient Clinics', slug: 'secure-care-team-messaging-outpatient', product: 'patientree', imageKeyword: 'healthcare team communication', angle: 'HIPAA-safe messaging for care coordination' },
    { title: 'Hybrid Telehealth Scheduling Workflows in 2026', slug: 'hybrid-telehealth-scheduling-workflows-2026', product: 'patientree', imageKeyword: 'telehealth appointment', angle: 'blending in-person and virtual visit scheduling' },
    { title: 'Copay Collection at Check-In: Scripts and Systems', slug: 'copay-collection-at-check-in-best-practices', product: 'patientree', imageKeyword: 'medical front desk payment', angle: 'collecting copays consistently at arrival' },
    { title: 'Referral Tracking Dashboards for Specialty Clinics', slug: 'referral-tracking-dashboards-specialty-clinics', product: 'patientree', imageKeyword: 'medical referral management', angle: 'visibility from referral intake to completed visit' },
    { title: 'Good Faith Estimate Workflows Under Federal Rules', slug: 'good-faith-estimate-workflows-federal-rules', product: 'patientree', imageKeyword: 'healthcare price transparency', angle: 'delivering estimates patients can understand and trust' },
    { title: 'Behavioral Health Screening Cadence in Primary Care', slug: 'behavioral-health-screening-primary-care', product: 'patientree', imageKeyword: 'behavioral health screening', angle: 'embedding PHQ and related screens into routine visits' },
    { title: 'Immunization Registry Reporting for Outpatient Clinics', slug: 'immunization-registry-reporting-clinics', product: 'patientree', imageKeyword: 'vaccination records healthcare', angle: 'reporting immunizations to state registries accurately' },
    { title: 'SDOH Screening in Primary Care Workflows', slug: 'sdoh-screening-primary-care-workflows', product: 'patientree', imageKeyword: 'social determinants health', angle: 'capturing social needs data during routine care' },
    { title: 'Multi-Location Clinic Operations with AI Automation', slug: 'multi-location-clinic-operations-ai-automation', product: 'patientree', imageKeyword: 'multi location medical clinic', angle: 'standardizing scheduling and intake across sites' },
    { title: 'Patientree AI vs Legacy Scheduling: What Clinics Gain', slug: 'patientree-ai-vs-legacy-scheduling-comparison', product: 'patientree', imageKeyword: 'modern clinic software', angle: 'comparing AI-native scheduling to legacy tools' },
    { title: 'AI Triage Chatbots for Clinics: Safety Limits and Guardrails', slug: 'ai-triage-chatbots-clinics-safety-limits', product: 'patientree', imageKeyword: 'healthcare chatbot', angle: 'deploying FAQ and triage bots without clinical risk' },
    { title: 'Local SEO for Multi-Location Healthcare Practices', slug: 'local-seo-multi-location-healthcare-practices', product: 'patientree', imageKeyword: 'local medical practice marketing', angle: 'helping each location rank in local search' },

    // DataXPipe (26–50)
    { title: 'What Is a Data Pipeline Catalog and Why Teams Need One', slug: 'what-is-a-data-pipeline-catalog', product: 'dataxpipe', imageKeyword: 'data catalog dashboard', angle: 'centralizing pipeline metadata for discoverability' },
    { title: 'Declarative Pipeline Specs vs Script-Only ETL', slug: 'declarative-pipeline-specs-vs-script-etl', product: 'dataxpipe', imageKeyword: 'data pipeline code', angle: 'when specs beat ad-hoc scripts for maintainability' },
    { title: 'Data Lineage: From Source Tables to Dashboards', slug: 'data-lineage-source-to-dashboard', product: 'dataxpipe', imageKeyword: 'data lineage diagram', angle: 'tracing data flow for trust and debugging' },
    { title: 'Data Quality Checks You Can Automate Today', slug: 'data-quality-checks-automate-today', product: 'dataxpipe', imageKeyword: 'data quality monitoring', angle: 'embedding validation into pipeline runs' },
    { title: 'Run History and Observability for Data Pipelines', slug: 'run-history-observability-data-pipelines', product: 'dataxpipe', imageKeyword: 'data pipeline monitoring', angle: 'tracking runs, failures, and performance over time' },
    { title: 'Building a System of Record for Data Assets', slug: 'system-of-record-for-data-assets', product: 'dataxpipe', imageKeyword: 'data engineering team', angle: 'treating pipelines and datasets as managed products' },
    { title: 'ETL vs ELT: Choosing the Right Pattern in 2026', slug: 'etl-vs-elt-choosing-pattern-2026', product: 'dataxpipe', imageKeyword: 'ETL data warehouse', angle: 'matching extract-load-transform choices to your stack' },
    { title: 'Schema Evolution Without Breaking Production Pipelines', slug: 'schema-evolution-without-breaking-pipelines', product: 'dataxpipe', imageKeyword: 'database schema change', angle: 'handling upstream schema changes safely' },
    { title: 'Idempotent Pipeline Design Patterns', slug: 'idempotent-pipeline-design-patterns', product: 'dataxpipe', imageKeyword: 'data pipeline architecture', angle: 'making reruns and backfills safe' },
    { title: 'Backfill Strategies for Large Datasets', slug: 'backfill-strategies-large-datasets', product: 'dataxpipe', imageKeyword: 'big data processing', angle: 'reprocessing historical data without overloading systems' },
    { title: 'DataXPipe: Turning Declarative Specs into Runnable Artifacts', slug: 'dataxpipe-declarative-specs-to-artifacts', product: 'dataxpipe', imageKeyword: 'data pipeline automation', angle: 'how DataXPipe generates runnable pipeline code from specs' },
    { title: 'Unit Testing Data Pipelines Before Production', slug: 'unit-testing-data-pipelines-before-production', product: 'dataxpipe', imageKeyword: 'software testing data', angle: 'catching logic errors before they hit prod' },
    { title: 'Cost Optimization for Cloud Data Pipelines', slug: 'cost-optimization-cloud-data-pipelines', product: 'dataxpipe', imageKeyword: 'cloud computing cost', angle: 'right-sizing compute and storage for batch and stream jobs' },
    { title: 'Real-Time vs Batch: Choosing Pipeline Architecture', slug: 'real-time-vs-batch-pipeline-architecture', product: 'dataxpipe', imageKeyword: 'real time data streaming', angle: 'matching latency requirements to engineering cost' },
    { title: 'Metadata-Driven Pipeline Generation', slug: 'metadata-driven-pipeline-generation', product: 'dataxpipe', imageKeyword: 'metadata management', angle: 'using metadata to drive codegen and governance' },
    { title: 'Data Contracts Between Engineering and Analytics', slug: 'data-contracts-engineering-analytics', product: 'dataxpipe', imageKeyword: 'data team collaboration', angle: 'formalizing expectations on schema and freshness' },
    { title: 'Orchestrating Dependencies in Complex Data DAGs', slug: 'orchestrating-dependencies-complex-data-dags', product: 'dataxpipe', imageKeyword: 'workflow orchestration', angle: 'managing upstream/downstream pipeline relationships' },
    { title: 'Handling PHI in Healthcare Data Pipelines', slug: 'handling-phi-healthcare-data-pipelines', product: 'dataxpipe', imageKeyword: 'healthcare data security', angle: 'de-identification, access control, and audit for PHI' },
    { title: 'CDC Patterns for Operational Data Stores', slug: 'cdc-patterns-operational-data-stores', product: 'dataxpipe', imageKeyword: 'change data capture', angle: 'streaming database changes into analytics layers' },
    { title: 'Dimensional Modeling in the Pipeline Layer', slug: 'dimensional-modeling-pipeline-layer', product: 'dataxpipe', imageKeyword: 'data warehouse modeling', angle: 'building star schemas as part of pipeline design' },
    { title: 'Data Mesh vs Centralized Pipeline Catalog', slug: 'data-mesh-vs-centralized-pipeline-catalog', product: 'dataxpipe', imageKeyword: 'data mesh architecture', angle: 'balancing domain ownership with central visibility' },
    { title: 'Incident Response for Broken Data Pipelines', slug: 'incident-response-broken-data-pipelines', product: 'dataxpipe', imageKeyword: 'data outage', angle: 'playbooks for diagnosing and fixing pipeline failures' },
    { title: 'SLAs for Data Freshness and Quality', slug: 'slas-data-freshness-quality', product: 'dataxpipe', imageKeyword: 'service level agreement', angle: 'setting and monitoring data delivery commitments' },
    { title: 'Migrating Legacy ETL to Declarative Specs', slug: 'migrating-legacy-etl-declarative-specs', product: 'dataxpipe', imageKeyword: 'legacy system migration', angle: 'incrementally modernizing brittle ETL jobs' },
    { title: 'DataXPipe vs Hand-Rolled Scripts: When to Standardize', slug: 'dataxpipe-vs-hand-rolled-pipeline-scripts', product: 'dataxpipe', imageKeyword: 'data engineering tools', angle: 'deciding when a catalog-backed platform pays off' },

    // Lease Exit (51–75)
    { title: 'How to Break a Lease Legally: Options Ranked by Cost', slug: 'how-to-break-a-lease-legally-options-ranked', product: 'leasexit', imageKeyword: 'apartment lease signing', angle: 'comparing exit paths from cheapest to most expensive' },
    { title: 'Early Lease Termination Fees: What Tenants Should Know', slug: 'early-lease-termination-fees-tenant-guide', product: 'leasexit', imageKeyword: 'rental agreement contract', angle: 'understanding fee structures before you sign an exit' },
    { title: 'Subletting vs Lease Assignment: Which Saves More Money', slug: 'subletting-vs-lease-assignment-cost-comparison', product: 'leasexit', imageKeyword: 'sublet apartment', angle: 'choosing between sublet and assignment strategies' },
    { title: 'Lease Exit Calculator: Estimating Your True Cost to Leave', slug: 'lease-exit-calculator-true-cost-to-leave', product: 'leasexit', imageKeyword: 'calculator rent apartment', angle: 'modeling fees, rent owed, and deposit recovery' },
    { title: 'Negotiating with Landlords: Scripts That Work', slug: 'negotiating-with-landlords-lease-exit-scripts', product: 'leasexit', imageKeyword: 'landlord tenant meeting', angle: 'conversation frameworks for mutual exit agreements' },
    { title: 'Military Clause and Lease Breaking Rights', slug: 'military-clause-lease-breaking-rights', product: 'leasexit', imageKeyword: 'military relocation', angle: 'SCR A protections and required documentation' },
    { title: 'Job Relocation and Lease Exit Strategies', slug: 'job-relocation-lease-exit-strategies', product: 'leasexit', imageKeyword: 'moving boxes new job', angle: 'timing your exit when work takes you elsewhere' },
    { title: 'Domestic Violence Lease-Break Protections by State', slug: 'domestic-violence-lease-break-protections', product: 'leasexit', imageKeyword: 'safe housing', angle: 'legal protections and documentation requirements' },
    { title: 'When Landlords Breach: Tenant Remedies and Exit Paths', slug: 'landlord-breach-tenant-remedies-exit-paths', product: 'leasexit', imageKeyword: 'tenant rights', angle: 'constructive eviction and repair-and-deduct options' },
    { title: 'Lease Buyout Negotiation Tactics for Renters', slug: 'lease-buyout-negotiation-tactics-renters', product: 'leasexit', imageKeyword: 'rent negotiation', angle: 'structuring a lump-sum exit both sides accept' },
    { title: 'Breaking a Lease in NYC: A Practical Tenant Guide', slug: 'breaking-a-lease-in-nyc-practical-guide', product: 'leasexit', imageKeyword: 'New York City apartment', angle: 'city-specific rules, costs, and common exit paths' },
    { title: 'Breaking a Lease in California: Tenant Rights Explained', slug: 'breaking-a-lease-in-california-tenant-rights', product: 'leasexit', imageKeyword: 'California apartment', angle: 'California notice rules and fee limitations' },
    { title: 'Breaking a Lease in Texas: What the Law Allows', slug: 'breaking-a-lease-in-texas-what-law-allows', product: 'leasexit', imageKeyword: 'Texas apartment rental', angle: 'Texas-specific termination and liability rules' },
    { title: 'Breaking a Lease in Florida: Costs and Options', slug: 'breaking-a-lease-in-florida-costs-options', product: 'leasexit', imageKeyword: 'Florida rental home', angle: 'hurricane clauses, fees, and assignment rules' },
    { title: 'AI Lease Advisors: How They Help Renters Decide', slug: 'ai-lease-advisors-help-renters-decide', product: 'leasexit', imageKeyword: 'AI assistant mobile', angle: 'using AI to rank exit options with real numbers' },
    { title: 'Credit Impact of Breaking a Lease Early', slug: 'credit-impact-breaking-lease-early', product: 'leasexit', imageKeyword: 'credit score report', angle: 'protecting your credit when exiting early' },
    { title: 'Security Deposit Recovery After Early Move-Out', slug: 'security-deposit-recovery-early-move-out', product: 'leasexit', imageKeyword: 'apartment keys handover', angle: 'documenting condition and disputing unfair withholds' },
    { title: 'Roommate Lease Exit When One Person Leaves', slug: 'roommate-lease-exit-one-person-leaves', product: 'leasexit', imageKeyword: 'roommates apartment', angle: 'handling joint leases when one roommate moves out' },
    { title: 'Corporate Lease Exit for Relocating Employees', slug: 'corporate-lease-exit-relocating-employees', product: 'leasexit', imageKeyword: 'corporate relocation', angle: 'employer-assisted exit programs and tax considerations' },
    { title: 'Month-to-Month Conversion vs Breaking a Fixed Term', slug: 'month-to-month-vs-breaking-fixed-term-lease', product: 'leasexit', imageKeyword: 'month to month rental', angle: 'when conversion beats paying a break fee' },
    { title: 'Lease Exit Letters: Templates and Timing', slug: 'lease-exit-letters-templates-timing', product: 'leasexit', imageKeyword: 'writing letter document', angle: 'drafting notices that satisfy lease and state law' },
    { title: 'Rental History After Early Lease Termination', slug: 'rental-history-after-early-termination', product: 'leasexit', imageKeyword: 'rental application', angle: 'explaining early exits to future landlords' },
    { title: 'Lease Exit vs Rent Default: Protecting Your Record', slug: 'lease-exit-vs-rent-default-protecting-record', product: 'leasexit', imageKeyword: 'late rent payment', angle: 'avoiding eviction filings while exiting early' },
    { title: 'Commercial vs Residential Lease Exit Differences', slug: 'commercial-vs-residential-lease-exit', product: 'leasexit', imageKeyword: 'commercial office lease', angle: 'how business leases differ from apartment exits' },
    { title: 'Lease Exit Planning: 90 Days Before You Move', slug: 'lease-exit-planning-90-days-before-move', product: 'leasexit', imageKeyword: 'moving planning calendar', angle: 'a quarter-ahead checklist for a clean exit' },

    // Saabsa / cross-product (76–90)
    { title: 'Building Multi-Product SaaS Platforms: Lessons from Saabsa', slug: 'building-multi-product-saas-lessons-from-saabsa', product: 'saabsa', imageKeyword: 'software product team', angle: 'shipping Patientree, DataXPipe, and Lease Exit from one engineering culture' },
    { title: 'How Saabsa Solutions Approaches AI Product Development', slug: 'saabsa-solutions-ai-product-development-approach', product: 'saabsa', imageKeyword: 'AI product development', angle: 'from prototype to production with guardrails' },
    { title: 'Custom Software vs Off-the-Shelf for Growing Businesses', slug: 'custom-software-vs-off-the-shelf-growing-business', product: 'saabsa', imageKeyword: 'business software decision', angle: 'when build beats buy for scaling organizations' },
    { title: 'Choosing a Development Partner for AI-Powered Products', slug: 'choosing-development-partner-ai-products', product: 'saabsa', imageKeyword: 'technology consulting meeting', angle: 'evaluating partners for healthcare, data, and consumer apps' },
    { title: 'From MVP to Enterprise: Scaling SaaS Architecture', slug: 'mvp-to-enterprise-scaling-saas-architecture', product: 'saabsa', imageKeyword: 'cloud architecture diagram', angle: 'architecture patterns that survive growth' },
    { title: 'HIPAA and SOC 2 Controls Shared Across Product Teams', slug: 'hipaa-soc2-shared-controls-product-teams', product: 'saabsa', imageKeyword: 'compliance audit', angle: 'reusing security controls across regulated products' },
    { title: 'Why Saabsa Built Patientree, DataXPipe, and Lease Exit', slug: 'why-saabsa-built-patientree-dataxpipe-leasexit', product: 'saabsa', imageKeyword: 'technology startup vision', angle: 'the product portfolio strategy behind three distinct markets' },
    { title: 'Data Engineering Services: When to Build vs Buy Pipelines', slug: 'data-engineering-services-build-vs-buy', product: 'saabsa', imageKeyword: 'data engineering consulting', angle: 'combining DataXPipe with custom engineering engagements' },
    { title: 'AI Consulting ROI: Measuring Outcomes in 90 Days', slug: 'ai-consulting-roi-measuring-90-days', product: 'ai', imageKeyword: 'business analytics ROI', angle: 'short-cycle pilots that prove automation value' },
    { title: 'Cross-Industry Lessons from Healthcare and Legal Tech', slug: 'cross-industry-lessons-healthcare-legal-tech', product: 'saabsa', imageKeyword: 'innovation technology', angle: 'what Patientree and Lease Exit teach shared platform teams' },
    { title: 'Product-Led Growth for B2B SaaS in 2026', slug: 'product-led-growth-b2b-saas-2026', product: 'saabsa', imageKeyword: 'SaaS growth chart', angle: 'self-serve trials and activation for business software' },
    { title: 'Integrating AI into Existing Business Workflows', slug: 'integrating-ai-existing-business-workflows', product: 'ai', imageKeyword: 'workflow automation office', angle: 'embedding models without disrupting operations' },
    { title: 'Cloud-Native Architecture for New SaaS Products', slug: 'cloud-native-architecture-new-saas-products', product: 'saabsa', imageKeyword: 'cloud native kubernetes', angle: 'foundational choices for reliability and scale' },
    { title: 'Security-First Design for Consumer and B2B Apps', slug: 'security-first-design-consumer-b2b-apps', product: 'saabsa', imageKeyword: 'application security', angle: 'threat modeling across healthcare and consumer legal products' },
    { title: 'The Future of the Saabsa Solutions Product Portfolio', slug: 'future-saabsa-solutions-product-portfolio', product: 'saabsa', imageKeyword: 'future technology', angle: 'where Patientree, DataXPipe, and Lease Exit are headed next' },
];

function buildBodyHtml(topic) {
    const p = PRODUCTS[topic.product];
    const exploreLine = (topic.product === 'saabsa' || topic.product === 'ai')
        ? `<a href="${p.url}">${p.name}</a> builds Patientree AI, DataXPipe, and Lease Exit, plus custom engineering and AI consulting services.`
        : `<a href="${p.url}">${p.name}</a>, from Saabsa Solutions, helps teams move faster with less guesswork.`;
    return `<p><strong>${topic.title}</strong> explores practical approaches to ${topic.angle}. This guide focuses on measurable outcomes, clear ownership, and tooling that scales in 2026.</p>
<h2>Why this matters now</h2>
<p>Organizations are under pressure to deliver more with tighter budgets. Whether you run a clinic, a data platform team, or are navigating a lease, the goal is the same: reduce uncertainty and act on reliable information.</p>
<h2>What you'll learn</h2>
<ul>
  <li>How this topic fits into day-to-day decisions</li>
  <li>Quick wins you can implement in the next 30 days</li>
  <li>Common mistakes and how to avoid them</li>
  <li>When to use ${p.name} vs custom engineering support</li>
</ul>
<h2>Implementation checklist</h2>
<ol>
  <li>Define the outcome and baseline metrics</li>
  <li>Map stakeholders, data sources, and constraints</li>
  <li>Run a small pilot with clear success criteria</li>
  <li>Review results and expand what works</li>
  <li>Operationalize with documentation and monitoring</li>
</ol>
<h2>Explore ${p.name}</h2>
<p>${exploreLine} For tailored architecture, integration, or product work, <a href="https://www.saabsa.com/contact.html">contact Saabsa Solutions</a>.</p>
<p><em>Keyword focus:</em> ${topic.imageKeyword}.</p>`;
}

function buildExcerpt(topic) {
    return `${topic.title}—a practical 2026 guide covering ${topic.angle}, with actionable steps for teams and individuals.`;
}

function main() {
    const force = process.argv.includes('--force');
    fs.mkdirSync(PENDING_DIR, { recursive: true });

    if (TOPICS.length !== 90) {
        throw new Error(`Expected 90 topics, got ${TOPICS.length}`);
    }

    let written = 0;
    let skipped = 0;

    TOPICS.forEach((topic, index) => {
        const num = String(index + 1).padStart(2, '0');
        const filename = `${num}-${topic.slug}.json`;
        const filepath = path.join(PENDING_DIR, filename);
        const p = PRODUCTS[topic.product];

        if (fs.existsSync(filepath) && !force) {
            skipped++;
            return;
        }

        const post = {
            title: topic.title,
            slug: topic.slug,
            excerpt: buildExcerpt(topic),
            category: p.category,
            bodyHtml: buildBodyHtml(topic),
            imageKeyword: topic.imageKeyword,
            product: topic.product,
        };

        fs.writeFileSync(filepath, JSON.stringify(post, null, 2) + '\n', 'utf8');
        written++;
    });

    const readme = `# Scheduled blog posts (90-day queue)

These JSON files publish **one per day** via GitHub Actions (\`publish-post.yml\`).

## Products covered
- **Patientree AI** (Healthcare Technology) — posts 01–25
- **DataXPipe** (Data Engineering) — posts 26–50
- **Lease Exit** (Consumer Legal Tech) — posts 51–75
- **Saabsa Solutions** (Company News / AI) — posts 76–90

## How publishing works
1. Cron runs daily at 16:20 UTC (10:20 AM CST).
2. \`scripts/publish-pending.js\` moves the oldest file from \`_posts/pending/\` to \`_posts/YYYY-MM-DD_slug.json\`.
3. Deploy workflow runs \`scripts/build-blog.js\` to regenerate HTML, posts.json, and sitemap.

## Commands
\`\`\`bash
# Regenerate pending queue (use --force to overwrite)
node scripts/generate-pending-posts.js

# Publish next post locally
node scripts/publish-pending.js
\`\`\`

## Notes
- Filenames are prefixed \`01-\` … \`90-\` to control publish order.
- Do not add date prefixes here; dates are assigned at publish time.
- Logic formerly in \`saabsa-auto-publisher-repo\` now lives in this repo.
`;

    fs.writeFileSync(path.join(PENDING_DIR, 'README.md'), readme, 'utf8');

    console.log(`Pending posts: ${written} written, ${skipped} skipped (${TOPICS.length} total)`);
}

main();
