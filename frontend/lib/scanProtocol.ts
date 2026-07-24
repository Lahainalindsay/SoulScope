export type GuidedScanQuestion = {
  id: string;
  title: string;
  rangeLabel: string;
  prompt: string;
  rationale: string;
  durationMs: number;
  captureKind: "sustained_vowel" | "guided_speech";
};

export type ResearchReference = {
  title: string;
  url: string;
  type: "review" | "study" | "dataset";
  note: string;
};

export const SCAN_OVERVIEW_LINES = [
  "Answer three guided prompts, each recorded for 30 seconds.",
  "Speak continuously for the full recording window. There are no right answers.",
  "You will have 10 seconds to settle between prompts.",
  "SoulScope observes patterns in timing, steadiness, rhythm, energy, and expression.",
  "Your reflection is for self-understanding, not diagnosis.",
];

export const GUIDED_SCAN_QUESTIONS: GuidedScanQuestion[] = [
  {
    id: "open_self_intro",
    title: "Prompt 1",
    rangeLabel: "About you",
    prompt: "Please tell me about yourself, whatever comes to mind.",
    rationale: "Keep speaking for the full 30 seconds in your normal voice.",
    durationMs: 30000,
    captureKind: "guided_speech",
  },
  {
    id: "current_weight",
    title: "Prompt 2",
    rangeLabel: "What is weighing on you",
    prompt: "Tell me about something that has been troubling or weighing on you.",
    rationale: "Share only what feels manageable, and keep speaking until the timer ends.",
    durationMs: 30000,
    captureKind: "guided_speech",
  },
  {
    id: "future_hope",
    title: "Prompt 3",
    rangeLabel: "Hope and direction",
    prompt: "Tell me about something you hope for in the future, even if it still feels far away.",
    rationale: "Close with a future-oriented response and keep speaking for the full 30 seconds.",
    durationMs: 30000,
    captureKind: "guided_speech",
  },
];

export const RESEARCH_REFERENCES: ResearchReference[] = [
  {
    title: "AI-driven speech biomarkers for disease diagnosis and monitoring: a systematic review and meta-analysis",
    url: "https://pubmed.ncbi.nlm.nih.gov/41062257/",
    type: "review",
    note: "Systematic review of 96 studies reporting that device, language, task, and feature choices materially affect speech-biomarker performance.",
  },
  {
    title: "Speech and Voice Quality as Digital Biomarkers in Depression: A Systematic Review",
    url: "https://pubmed.ncbi.nlm.nih.gov/40410060/",
    type: "review",
    note: "Review reporting promising acoustic markers for mood disorders, while also emphasizing bias and generalizability limits.",
  },
  {
    title: "The Fundamental Frequency of Voice as a Potential Stress Biomarker: A Systematic Review and Meta-Analysis",
    url: "https://pubmed.ncbi.nlm.nih.gov/41102940/",
    type: "review",
    note: "Meta-analysis showing stress-related changes in voice, with stronger effects reported during spontaneous speech tasks.",
  },
  {
    title: "Sustained vowels and continuous speech in the auditory-perceptual evaluation of dysphonia severity",
    url: "https://pubmed.ncbi.nlm.nih.gov/22832675/",
    type: "study",
    note: "Supports collecting more than one speech task because sustained vowels and continuous speech capture different aspects of voice behavior.",
  },
  {
    title: "Computerized analysis of speech and voice for Parkinson's disease: A systematic review",
    url: "https://pubmed.ncbi.nlm.nih.gov/36183641/",
    type: "review",
    note: "Summarizes task design, feature extraction, and reporting issues across Parkinson speech studies.",
  },
  {
    title: "Oxford Parkinson's Disease Detection Dataset",
    url: "https://archive.ics.uci.edu/dataset/174",
    type: "dataset",
    note: "Public benchmark dataset of biomedical voice measurements used in Parkinson-related voice biomarker research.",
  },
  {
    title: "Oxford Parkinson's Disease Telemonitoring Dataset",
    url: "https://archive.ics.uci.edu/ml/datasets/parkinsons%2Btelemonitoring",
    type: "dataset",
    note: "Home-captured voice dataset designed for remote symptom monitoring and longitudinal modeling.",
  },
  {
    title: "mPower Public Researcher Portal",
    url: "https://www.synapse.org/Synapse:syn4993293",
    type: "dataset",
    note: "Large smartphone-based Parkinson research program with active phonation tasks and mobile sensor data.",
  },
];

export const VALIDATION_NOTE =
  "SoulScope is grounded in measurable vocal features and cautious, non-diagnostic observation. Research references are maintained internally to support responsible calibration.";
