"use client";

import ScanWizard from "../components/ScanWizard";

const differentiators = [
  {
    icon: "🔬",
    title: "On-device sensing",
    text: "Uses your phone’s camera PPG, mic, and accelerometer to capture HRV, breath, and micro tremors during the ritual.",
  },
  {
    icon: "🧠",
    title: "AI spiritual interpretation",
    text: "Translates nervous-system data into chakra resonance, shadow signatures, and emotional armor with compassionate language.",
  },
  {
    icon: "🎧",
    title: "Instant healing plans",
    text: "Auto-generates balancing sound, somatic resets, and daily rituals tuned to your dominant frequency band.",
  },
];

const revealSections = [
  {
    title: "Your Nervous System Pattern",
    copy:
      "Are you hypervigilant, shutdown, overgiving, bracing? Your phone’s sensors track HRV, reactivity spikes, and recovery curves to show the truth.",
    bullets: ["Hypervigilant or collapsed states", "Relationship dysregulation cues", "Breath rhythm + micro tremor data"],
  },
  {
    title: "Your Soul Resonance",
    copy:
      "Your voice reveals suppressed emotion, hidden grief, collapsed power. Vocal harmonics expose where you’re lying to yourself or afraid to speak.",
    bullets: ["Confidence vs suppression markers", "Where truth is stuck in the throat", "Power leaks across phrases"],
  },
  {
    title: "Your Shadow Map",
    copy:
      "Recovery lag, breath holding, and voice instability identify shadow types like abandonment, control, worthiness, rage suppression, people-pleasing.",
    bullets: ["Primary shadow archetype", "Triggering relationship wound", "Somatic symptom pairing"],
  },
  {
    title: "Your Core Frequency",
    copy:
      "Your dominant harmonic is the signature you were born with. It informs how you love, protect, create, and the sound therapy you need to come home.",
    bullets: ["Body, soul, and mind resonance scores", "Dominant frequency band for soundwork", "Recalibration target for daily rituals"],
  },
];

const healingPlan = [
  {
    icon: "🎧",
    title: "Balancing Sound Sequence",
    text: "Custom binaural + biofield audio tuned to your dominant band, emotional blocks, and energetic misalignments.",
  },
  {
    icon: "💗",
    title: "Somatic Reset Exercises",
    text: "Grounding, tremor releases, breath pacing, nervous-system bridging, and safety anchoring tied to your pattern.",
  },
  {
    icon: "🔥",
    title: "Shadow Integration Prompts",
    text: "Guided journaling + micro rituals aimed at the specific emotions and survival strategies your body flagged.",
  },
  {
    icon: "🌙",
    title: "Chakra Frequency Map",
    text: "Vocal resonance + HRV data paints which chakras are over/under expressed and how to rebalance them.",
  },
  {
    icon: "✍️",
    title: "Daily Alignment Ritual",
    text: "Phone-friendly cues to re-enter coherence using breath, sound, and micro-movements anywhere.",
  },
  {
    icon: "⭐",
    title: "Frequency Recalibration Plan",
    text: "A 1–4 week plan with checkpoints, not generic affirmations, so you know when your biology is back online.",
  },
];

const testimonials = [
  "“Finally, something tells me the truth.”",
  "“I understand myself for the first time.”",
  "“This explains why I keep repeating the same patterns.”",
  "“I feel seen — not judged.”",
  "“I didn’t know my body was holding all this.”",
];

const audiences = [
  "Spiritual people who want science",
  "Trauma survivors wanting clarity",
  "Overwhelmed women craving nervous-system answers",
  "People who feel too much",
  "People who feel nothing",
  "Seekers, intuitives, healers, mothers, empaths",
];

const offers = [
  {
    name: "SoulScope Scan",
    price: "$97",
    highlights: [
      "Full bio-sign scan using phone sensors",
      "Voice resonance + shadow type",
      "Core frequency + chakra snapshot",
      "Personalized healing plan + sound sequence",
    ],
  },
  {
    name: "Soul Recalibration Program",
    price: "$497",
    highlights: ["4-week guided plan based on your data", "Somatic + sound coaching", "Accountability + live tune-ins"],
  },
  {
    name: "VIP Nervous System Decode",
    price: "$999",
    highlights: ["Private deep-dive session", "Integration blueprint", "1:1 support + advanced analytics"],
  },
];

const founderStory = {
  headline: "The founder advantage",
  body:
    "“I built SoulScope because my own nervous system had been screaming for years — but no one could translate it. Not therapists, not healers, not anyone. So I created the tool I desperately needed. A system that listens to the signals, the breath, the voice, the tremor under the surface — and reflects the truth back with compassion, clarity, and power.”",
};

const taglines = [
  { title: "Spiritual intelligence meets biological data", copy: "Your spirit speaks through your signals." },
  { title: "Emotional shadow mapping", copy: "Your shadows leave fingerprints in the frequency." },
  { title: "Core frequency reading", copy: "Find the frequency you were born to return to." },
  { title: "Scientific yet sacred", copy: "Where ancient systems meet modern measurement." },
];

export default function HomePage() {
  return (
    <main className="page">
      <section className="hero">
        <p className="hero__eyebrow">SOULSCOPE™</p>
        <h1 className="hero__title">Decode your soul’s truth through your body’s signals.</h1>
        <p className="hero__subtitle">
          Your body knows. Your voice remembers. Your nervous system never lies. SoulScope turns the sensors already inside your phone into a nervous-system oracle that reveals your core frequency, shadow imprints, and healing path.
        </p>
        <div className="phone-app-banner">
          <p>Phone-native · Camera HRV · Microphone voice resonance · Breath & motion sensing · No extra hardware</p>
        </div>
        <div className="hero__cta">
          <button
            className="hero__cta-button"
            onClick={() => document.getElementById("wizard")?.scrollIntoView({ behavior: "smooth" })}
          >
            Start your scan
          </button>
          <span className="hero__cta-note">“What your intuition whispers, your signals reveal. SoulScope listens.”</span>
        </div>
      </section>

      <section className="panel">
        <p className="hero__eyebrow">World’s first nervous-system oracle</p>
        <h2 className="panel__title">Your biology meeting your spirit</h2>
        <div className="diff-grid">
          {differentiators.map((item) => (
            <article key={item.title}>
              <span className="diff-icon">{item.icon}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <p className="hero__eyebrow">SoulScope reveals</p>
        <h2 className="panel__title">All customized to your body, your soul, your energy, your truth.</h2>
        <div className="reveal-grid">
          {revealSections.map((section) => (
            <article key={section.title}>
              <h3>{section.title}</h3>
              <p>{section.copy}</p>
              <ul>
                {section.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <p className="hero__eyebrow">Why SoulScope is different</p>
        <div className="compare-grid">
          <article>
            <h3>Other apps</h3>
            <ul>
              <li>❌ Meditation apps calm you</li>
              <li>❌ Tarot apps guide you</li>
              <li>❌ Breathwork apps regulate you</li>
              <li>❌ Biofeedback devices measure you</li>
            </ul>
          </article>
          <article>
            <h3>SoulScope</h3>
            <p>Your body gives the data. Your soul gives the meaning. SoulScope gives the roadmap.</p>
            <ul>
              {taglines.map((tagline) => (
                <li key={tagline.title}>
                  <strong>{tagline.title}:</strong> {tagline.copy}
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className="panel">
        <p className="hero__eyebrow">Healing plan</p>
        <h2 className="panel__title">This is what they buy for</h2>
        <div className="healing-grid">
          {healingPlan.map((step) => (
            <article key={step.title}>
              <header>
                <span>{step.icon}</span>
                <h3>{step.title}</h3>
              </header>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <p className="hero__eyebrow">Testimonials</p>
        <div className="quote-grid">
          {testimonials.map((quote) => (
            <blockquote key={quote}>{quote}</blockquote>
          ))}
        </div>
      </section>

      <section className="panel">
        <p className="hero__eyebrow">Who it’s for</p>
        <div className="audience-grid">
          {audiences.map((audience) => (
            <span key={audience}>{audience}</span>
          ))}
        </div>
      </section>

      <section className="panel">
        <p className="hero__eyebrow">Offers</p>
        <div className="offer-grid">
          {offers.map((offer) => (
            <article className="offer-card" key={offer.name}>
              <header>
                <h3>{offer.name}</h3>
                <strong>{offer.price}</strong>
              </header>
              <ul>
                {offer.highlights.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <p className="hero__eyebrow">Founder advantage</p>
        <div className="founder-card">
          <h3>{founderStory.headline}</h3>
          <p>{founderStory.body}</p>
        </div>
      </section>

      <section className="panel" id="wizard">
        <p className="hero__eyebrow">Try the ritual</p>
        <h2 className="panel__title">SoulScope scan journey (phone-ready)</h2>
        <ScanWizard />
      </section>
    </main>
  );
}
