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
  "Begin with one comfortable voice sample, then answer a few guided prompts.",
  "Speak naturally. There are no right answers.",
  "SoulScope observes patterns in timing, steadiness, rhythm, energy, and expression.",
  "Your reflection is for self-understanding, not diagnosis.",
];

export const GUIDED_SCAN_QUESTIONS: GuidedScanQuestion[] = [
  {
    id: "sustained_vowel",
    title: "Prompt 1",
    rangeLabel: "Your voice",
    prompt: "Hold a comfortable ah sound for about five seconds.",
    rationale: "Use a natural pitch. You do not need to make it loud.",
    durationMs: 5000,
    captureKind: "sustained_vowel",
  },
  {
    id: "simple_joy",
    title: "Prompt 2",
    rangeLabel: "This moment",
    prompt: "Say your name, then describe where you are in this moment.",
    rationale: "Arrive in the scan with a simple, natural response.",
    durationMs: 10000,
    captureKind: "guided_speech",
  },
  {
    id: "liked_in_people",
    title: "Prompt 3",
    rangeLabel: "What matters",
    prompt: "What has been taking up the most space in your mind lately?",
    rationale: "Name what is present without needing to explain everything.",
    durationMs: 10000,
    captureKind: "guided_speech",
  },
  {
    id: "current_weight",
    title: "Prompt 4",
    rangeLabel: "Body awareness",
    prompt: "When you pause and notice your body, what stands out?",
    rationale: "Notice what is available in the present moment.",
    durationMs: 10000,
    captureKind: "guided_speech",
  },
  {
    id: "felt_emotion",
    title: "Prompt 5",
    rangeLabel: "Looking inward",
    prompt: "Is there something you have been holding back or finding difficult to express?",
    rationale: "Share only what feels manageable.",
    durationMs: 10000,
    captureKind: "guided_speech",
  },
  {
    id: "body_location",
    title: "Prompt 6",
    rangeLabel: "Support",
    prompt: "What feels supportive or grounding for you right now?",
    rationale: "Let the scan include what may help you feel more resourced.",
    durationMs: 10000,
    captureKind: "guided_speech",
  },
  {
    id: "goal_dream",
    title: "Prompt 7",
    rangeLabel: "Looking ahead",
    prompt: "What is something you would love to move toward next?",
    rationale: "Close with direction in your own words.",
    durationMs: 10000,
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
