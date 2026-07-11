// ---------------------------------------------------------------------------
// EVIDENCE LIBRARY CONTENT (spec §5.4, build-loop §6, §7).
//
// Every load-bearing figure below was web-verified against a named source on
// 2026-07-11 (see `verification` per entry). Nothing is fabricated. Where a
// figure is topline/manufacturer data not yet peer-reviewed, it carries a
// 'preliminary' verification and the UI shows a "verify with source" badge.
//
// This library is EDUCATION, not medical advice, and contains NO dosing
// instructions for any non-prescribed compound. Every entry ends with
// questions for the prescriber. Reviewed-by-human recommended before daily use.
// ---------------------------------------------------------------------------

export type Strength = 'Strong' | 'Moderate' | 'Emerging' | 'Insufficient'
export type Verification = 'verified' | 'preliminary' | 'unverified'

export interface Citation {
  text: string
  url?: string
}

export interface EvidenceEntry {
  id: string
  category: 'drug' | 'maintenance' | 'lean-mass' | 'supplement' | 'peptide'
  title: string
  strength: Strength
  verification: Verification
  /** Plain-English summary. Numbers here are the verified ones. */
  summary: string
  keyNumbers?: { label: string; value: string }[]
  citations: Citation[]
  /** Shown when verification !== 'verified'. */
  caveat?: string
  regulatory?: string
  askYourDoctor: string[]
}

export const EVIDENCE: EvidenceEntry[] = [
  {
    id: 'retatrutide-p2',
    category: 'drug',
    title: 'Retatrutide — Phase 2 obesity trial',
    strength: 'Moderate',
    verification: 'verified',
    summary:
      'Retatrutide is a triple hormone-receptor agonist (GLP-1, GIP and glucagon). In its ' +
      'phase 2 obesity trial the highest dose produced the largest weight loss yet reported ' +
      'for this drug class at 48 weeks. Because this is a single phase 2 trial over 48 weeks, ' +
      'the evidence is promising rather than settled — the phase 3 TRIUMPH programme is what ' +
      'will confirm it.',
    keyNumbers: [
      { label: '12 mg at 48 weeks', value: '−24.2% body weight' },
      { label: 'Placebo at 48 weeks', value: '−2.1%' },
      { label: '12 mg at 24 weeks', value: '−17.5%' },
    ],
    citations: [
      {
        text:
          'Jastreboff AM, Kaplan LM, Frías JP, et al. Triple–Hormone-Receptor Agonist ' +
          'Retatrutide for Obesity — A Phase 2 Trial. N Engl J Med. 2023;389(6):514–526.',
        url: 'https://www.nejm.org/doi/full/10.1056/NEJMoa2301972',
      },
    ],
    askYourDoctor: [
      'How does my prescribed titration compare with the trial schedule?',
      'What weight-loss trajectory is realistic for me over my 6 months?',
      'Which side effects should prompt me to call you rather than wait?',
    ],
  },
  {
    id: 'triumph-status',
    category: 'drug',
    title: 'TRIUMPH programme — phase 3 status (2026)',
    strength: 'Emerging',
    verification: 'preliminary',
    summary:
      'TRIUMPH is retatrutide’s phase 3 programme. TRIUMPH-1 topline results were announced ' +
      'by the manufacturer in May 2026 and look consistent with the strong phase 2 data, but ' +
      'they are a press release, not yet a peer-reviewed publication. The headline number also ' +
      'depends on which "estimand" is quoted: the treatment-regimen (intention-to-treat) figure ' +
      'is lower than the efficacy (on-treatment) figure. TRIUMPH-2, -3 and -4 (diabetes, ' +
      'cardiovascular disease, knee osteoarthritis) are ongoing.',
    keyNumbers: [
      { label: '12 mg at 80 wk (treatment-regimen)', value: '≈ −25%' },
      { label: '12 mg at 80 wk (efficacy estimand)', value: '≈ −28%' },
      { label: 'BMI ≥35 subgroup, up to 104 wk', value: 'up to ≈ −30%' },
    ],
    citations: [
      {
        text:
          'Eli Lilly investor news release, TRIUMPH-1 topline, 21 May 2026 (full data pending ' +
          'peer review / ADA 2026). Secondary coverage: AJMC, The Pharmaceutical Journal.',
        url: 'https://investor.lilly.com/news-releases',
      },
    ],
    caveat:
      'Preliminary — manufacturer topline only, not yet peer-reviewed. Exact percentages are ' +
      'provisional and differ by estimand. Verify against the published paper when it appears.',
    askYourDoctor: [
      'Given these are early results, what do you expect for someone on my plan?',
      'Are there phase 3 safety signals I should know about?',
    ],
  },
  {
    id: 'surmount-1',
    category: 'drug',
    title: 'Tirzepatide — SURMOUNT-1',
    strength: 'Strong',
    verification: 'verified',
    summary:
      'The large phase 3 trial of tirzepatide (the drug you are transitioning from) for obesity. ' +
      'At the top dose, average weight loss at 72 weeks was substantial. Two figures are quoted ' +
      'in the literature: the treatment-regimen estimand (everyone randomised) and the efficacy ' +
      'estimand (those who stayed on treatment) — both are shown below.',
    keyNumbers: [
      { label: '15 mg at 72 wk (treatment-regimen)', value: '−20.9%' },
      { label: '15 mg at 72 wk (efficacy estimand)', value: '−22.5%' },
      { label: 'Placebo', value: '−3.1%' },
    ],
    citations: [
      {
        text:
          'Jastreboff AM, Aronne LJ, Ahmad NN, et al; SURMOUNT-1 Investigators. Tirzepatide ' +
          'Once Weekly for the Treatment of Obesity. N Engl J Med. 2022;387(3):205–216.',
        url: 'https://www.nejm.org/doi/full/10.1056/NEJMoa2206038',
      },
    ],
    askYourDoctor: [
      'How should my results on tirzepatide inform what we expect on retatrutide?',
    ],
  },
  {
    id: 'surmount-4',
    category: 'maintenance',
    title: 'SURMOUNT-4 — what happens if you stop',
    strength: 'Strong',
    verification: 'verified',
    summary:
      'This randomised-withdrawal trial is the single clearest reason the app has a "maintenance ' +
      'rehearsal" phase. After 36 weeks of tirzepatide (average −20.9%), people who switched to ' +
      'placebo regained weight while those who continued kept losing slowly. The gap after ' +
      'withdrawal was about 19 percentage points. Stopping the drug without established habits ' +
      'means most of the loss comes back.',
    keyNumbers: [
      { label: 'Weeks 36→88, continued', value: '−5.5% (further loss)' },
      { label: 'Weeks 36→88, switched to placebo', value: '+14.0% (regain)' },
      { label: 'Difference', value: '19.4 percentage points' },
    ],
    citations: [
      {
        text:
          'Aronne LJ, Sattar N, Horn DB, et al. Continued Treatment With Tirzepatide for ' +
          'Maintenance of Weight Reduction… SURMOUNT-4 Randomized Clinical Trial. JAMA. ' +
          '2024;331(1):38–48.',
        url: 'https://jamanetwork.com/journals/jama/fullarticle/2812936',
      },
    ],
    askYourDoctor: [
      'What is our plan for the transition off the drug at the end of my 6 months?',
      'Is a slower taper or a maintenance dose an option for me?',
    ],
  },
  {
    id: 'step1-extension',
    category: 'maintenance',
    title: 'STEP 1 extension — regain after semaglutide',
    strength: 'Strong',
    verification: 'verified',
    summary:
      'A prespecified extension of the STEP 1 semaglutide trial followed people after they ' +
      'stopped the drug. Within about a year off treatment they regained roughly two-thirds of ' +
      'the weight they had lost, and the metabolic improvements reversed in step. The lesson is ' +
      'not "the drug failed" — it is that the period while you are ON the drug is when the ' +
      'keep-it-off habits have to be built.',
    keyNumbers: [
      { label: 'Regained within ~1 year of stopping', value: '≈ two-thirds of loss' },
      { label: 'Week 68 (on drug)', value: '−17.3%' },
      { label: 'Week 120 (52 wk off drug)', value: '≈ −5.6% net' },
    ],
    citations: [
      {
        text:
          'Wilding JPH, Batterham RL, Davies M, et al. Weight regain and cardiometabolic ' +
          'effects after withdrawal of semaglutide: the STEP 1 trial extension. Diabetes Obes ' +
          'Metab. 2022;24(8):1553–1564.',
        url: 'https://dom-pubs.onlinelibrary.wiley.com/doi/10.1111/dom.14725',
      },
    ],
    askYourDoctor: [
      'What maintenance support (dietitian, follow-up) can I line up before I stop?',
    ],
  },
  {
    id: 'lean-mass-lost',
    category: 'lean-mass',
    title: 'How much muscle you can lose on a GLP-1',
    strength: 'Moderate',
    verification: 'verified',
    summary:
      'Body-composition substudies show that a meaningful share of the weight lost on these ' +
      'drugs is lean (fat-free) mass — roughly a quarter to two-fifths, depending on the study. ' +
      'This is broadly what any large weight loss does, but it is exactly why protein and ' +
      'resistance training matter so much here. (The semaglutide-vs-tirzepatide difference below ' +
      'comes from separate trials, so read it as indicative, not head-to-head.)',
    keyNumbers: [
      { label: 'Tirzepatide (SURMOUNT-1 DXA)', value: '≈ 25–26% of loss was lean' },
      { label: 'Semaglutide (STEP 1 DXA)', value: '≈ 40% of loss was lean soft tissue' },
    ],
    citations: [
      {
        text:
          'Look M, et al. Body composition changes during weight reduction with tirzepatide in ' +
          'SURMOUNT-1. Diabetes Obes Metab. 2025. doi:10.1111/dom.16275.',
        url: 'https://dom-pubs.onlinelibrary.wiley.com/doi/10.1111/dom.16275',
      },
      {
        text:
          'Wilding JPH, et al. Once-Weekly Semaglutide in Adults with Overweight or Obesity ' +
          '(STEP 1). N Engl J Med. 2021;384(11):989–1002 (and body-composition analyses).',
        url: 'https://www.nejm.org/doi/full/10.1056/NEJMoa2032183',
      },
    ],
    caveat:
      'DXA substudies have smaller samples than the parent trials, and the two drugs’ figures ' +
      'come from different studies — treat the comparison as indicative.',
    askYourDoctor: [
      'Would a DXA or body-composition scan be worthwhile to track my lean mass?',
      'Is my protein target right for protecting muscle during rapid loss?',
    ],
  },
  {
    id: 'protein-resistance',
    category: 'lean-mass',
    title: 'Protein + resistance training preserve muscle',
    strength: 'Strong',
    verification: 'verified',
    summary:
      'The countermeasure to lean-mass loss is well evidenced. A meta-regression found the ' +
      'benefit of protein to training-induced muscle plateaus around 1.6 g/kg/day (with a ' +
      'confidence range up to ~2.2), which is where the app’s default protein band comes from. ' +
      'A separate trial showed that even in a sharp calorie deficit, higher protein plus intense ' +
      'training built lean mass while stripping fat. Your exact target is something to set with ' +
      'your clinician — the band is a protective floor, not a score.',
    keyNumbers: [
      { label: 'Protein benefit plateau', value: '≈ 1.62 g/kg/day (up to ~2.2)' },
      { label: 'Deficit + training at 2.4 g/kg', value: 'gained lean, lost fat' },
    ],
    citations: [
      {
        text:
          'Morton RW, et al. Protein supplementation and resistance training: systematic review, ' +
          'meta-analysis and meta-regression. Br J Sports Med. 2018;52(6):376–384.',
        url: 'https://bjsm.bmj.com/content/52/6/376',
      },
      {
        text:
          'Longland TM, et al. Higher vs lower dietary protein during an energy deficit with ' +
          'intense exercise… Am J Clin Nutr. 2016;103(3):738–746.',
        url: 'https://doi.org/10.3945/ajcn.115.119339',
      },
    ],
    caveat:
      'These cohorts were healthy/younger adults, not GLP-1 patients — extrapolation is ' +
      'reasonable but not directly trial-proven in this setting.',
    askYourDoctor: [
      'What daily protein target do you recommend for me specifically?',
      'Any reason resistance training 2–3×/week would not be safe for me?',
    ],
  },
  {
    id: 'creatine',
    category: 'supplement',
    title: 'Creatine monohydrate',
    strength: 'Strong',
    verification: 'verified',
    summary:
      'The most-studied sports supplement. Combined with resistance training it reliably ' +
      'supports lean body mass and strength — useful context while you are defending muscle in a ' +
      'deficit. It is a dietary supplement, not a peptide or a drug. Any decision to use it, and ' +
      'any amount, is a conversation for you and your clinician; the app does not prescribe.',
    citations: [
      {
        text:
          'Kreider RB, et al. International Society of Sports Nutrition position stand: safety ' +
          'and efficacy of creatine. J Int Soc Sports Nutr. 2017;14:18.',
        url: 'https://jissn.biomedcentral.com/articles/10.1186/s12970-017-0173-z',
      },
    ],
    regulatory: 'Widely available dietary supplement in most regions.',
    askYourDoctor: [
      'Is creatine appropriate alongside my medication and kidney health?',
    ],
  },
  {
    id: 'vitamin-d',
    category: 'supplement',
    title: 'Vitamin D',
    strength: 'Strong',
    verification: 'verified',
    summary:
      'Strong evidence for correcting a deficiency; the muscle and strength benefit is mostly ' +
      'seen in people who are actually low, with little added benefit if you are already ' +
      'replete. A blood test tells you which camp you are in — worth asking about.',
    citations: [
      {
        text: 'Sizar O, et al. Vitamin D Deficiency. StatPearls, NCBI Bookshelf (2024).',
        url: 'https://www.ncbi.nlm.nih.gov/books/NBK532266/',
      },
    ],
    regulatory: 'Over-the-counter supplement.',
    askYourDoctor: [
      'Should we check my vitamin D level before I supplement?',
    ],
  },
  {
    id: 'omega-3',
    category: 'supplement',
    title: 'Omega-3 (EPA/DHA)',
    strength: 'Emerging',
    verification: 'verified',
    summary:
      'Omega-3s do not raise baseline muscle protein synthesis but may enhance the muscle-' +
      'building response to protein and training, especially in older adults. Evidence is mixed, ' +
      'so this sits at "emerging" for muscle support.',
    citations: [
      {
        text:
          'Smith GI, et al. Dietary omega-3 fatty acid supplementation increases the rate of ' +
          'muscle protein synthesis… Am J Clin Nutr. 2011;93(2):402–412.',
        url: 'https://doi.org/10.3945/ajcn.110.005611',
      },
    ],
    regulatory: 'Over-the-counter supplement.',
    askYourDoctor: ['Would omega-3 interact with anything I take?'],
  },
  {
    id: 'magnesium',
    category: 'supplement',
    title: 'Magnesium',
    strength: 'Insufficient',
    verification: 'verified',
    summary:
      'Popular, but the evidence for a muscle or body-composition benefit is weak. There is some ' +
      'signal for glycaemic control and sleep/mood, and correcting a genuine deficiency is ' +
      'reasonable — but do not expect it to preserve lean mass.',
    citations: [
      {
        text:
          'Linus Pauling Institute Micronutrient Information Center, Magnesium. Oregon State ' +
          'University.',
        url: 'https://lpi.oregonstate.edu/mic/minerals/magnesium',
      },
    ],
    regulatory: 'Over-the-counter supplement.',
    askYourDoctor: ['Is there a reason to check my magnesium level?'],
  },
  {
    id: 'ancillary-peptides',
    category: 'peptide',
    title: 'Other peptides people ask about',
    strength: 'Insufficient',
    verification: 'unverified',
    summary:
      'People on GLP-1 programmes often hear about ancillary peptides marketed for fat loss, ' +
      'muscle, or recovery. For weight management specifically, the human evidence for these is ' +
      'mostly emerging or insufficient, and many are not approved for this use — some are sold ' +
      'only as "research chemicals," which carries real quality and safety uncertainty. This app ' +
      'deliberately gives no dosing information for any compound your doctor has not prescribed. ' +
      'If you are curious about one, the right move is to bring the specific name to your ' +
      'prescriber and decide together.',
    citations: [],
    caveat:
      'No specific compound, dose, or protocol is endorsed here. Regulatory status varies by ' +
      'country and many are unapproved for weight management. Verify anything you are considering ' +
      'with your prescriber and a credible source.',
    regulatory:
      'Varies widely; many discussed peptides are unapproved for weight management and/or sold ' +
      'without pharmaceutical-grade oversight.',
    askYourDoctor: [
      'I read about [name] — is there any real evidence, and is it safe with my medication?',
      'If it is not approved for this, what are the risks of the versions sold online?',
    ],
  },
]

export const STRENGTH_ORDER: Record<Strength, number> = {
  Strong: 0,
  Moderate: 1,
  Emerging: 2,
  Insufficient: 3,
}
