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
  "SoulScope uses a sustained vowel capture followed by guided speech prompts instead of one unstructured clip.",
  "The scan starts with a short held ahh or ohh for pitch stability, jitter, shimmer, and resonance support, then moves into everyday expression, relationships, emotional weight, body awareness, and future orientation.",
  "We analyze voiced speech, note the breaks between speaking, and map pitch center, resonance patterns, note balance, and recovery signals across the full response set.",
  "The report is reflective and educational. It is not a diagnosis and it does not replace clinical evaluation.",
];

export const GUIDED_SCAN_QUESTIONS: GuidedScanQuestion[] = [
  {
    id: "sustained_vowel",
    title: "Prompt 1",
    rangeLabel: "Foundation",
    prompt:
      "Hold an ahhh or ohhh sound steadily for five seconds.",
    rationale:
      "Captures a sustained vowel, which is especially useful for jitter, shimmer, HNR, pitch stability, and resonance support.",
    durationMs: 5000,
    captureKind: "sustained_vowel",
  },
  {
    id: "simple_joy",
    title: "Prompt 2",
    rangeLabel: "Opening",
    prompt: "Let's start simple. Tell me about something you enjoy doing.",
    rationale:
      "Opens with natural, low-pressure speech so the scan can hear your everyday expression.",
    durationMs: 10000,
    captureKind: "guided_speech",
  },
  {
    id: "liked_in_people",
    title: "Prompt 3",
    rangeLabel: "Reflection",
    prompt: "What do you like most about the people in your life?",
    rationale:
      "Captures values, affection, and how your voice organizes around appreciation.",
    durationMs: 10000,
    captureKind: "guided_speech",
  },
  {
    id: "current_weight",
    title: "Prompt 4",
    rangeLabel: "Depth",
    prompt: "Let's go a little deeper. What's been weighing on you lately?",
    rationale:
      "Introduces stress-related content and listens for changes in tension, pace, and support.",
    durationMs: 10000,
    captureKind: "guided_speech",
  },
  {
    id: "felt_emotion",
    title: "Prompt 5",
    rangeLabel: "Feeling",
    prompt: "How does this make you feel?",
    rationale:
      "Focuses the voice on emotional naming and affective expression.",
    durationMs: 10000,
    captureKind: "guided_speech",
  },
  {
    id: "body_location",
    title: "Prompt 6",
    rangeLabel: "Body",
    prompt: "Where do you feel that the most?",
    rationale:
      "Brings the response into body awareness and somatic language.",
    durationMs: 10000,
    captureKind: "guided_speech",
  },
  {
    id: "goal_dream",
    title: "Prompt 7",
    rangeLabel: "Future",
    prompt: "Last one. Tell me about a goal or dream you have.",
    rationale:
      "Closes on aspiration and forward energy, which helps contrast weight with direction.",
    durationMs: 10000,
    captureKind: "guided_speech",
  },
];

export const RESEARCH_REFERENCES: ResearchReference[] = [
  {
    title: "AI-driven speech biomarkers for disease diagnosis and monitoring: a systematic review and meta-analysis",
    url: "https://pubmed.ncbi.nlm.nih.gov/41062257/",
    type: "review",
    note:
      "Systematic review of 96 studies reporting that device, language, task, and feature choices materially affect speech-biomarker performance.",
  },
  {
    title: "Speech and Voice Quality as Digital Biomarkers in Depression: A Systematic Review",
    url: "https://pubmed.ncbi.nlm.nih.gov/40410060/",
    type: "review",
    note:
      "Review reporting promising acoustic markers for mood disorders, while also emphasizing bias and generalizability limits.",
  },
  {
    title: "The Fundamental Frequency of Voice as a Potential Stress Biomarker: A Systematic Review and Meta-Analysis",
    url: "https://pubmed.ncbi.nlm.nih.gov/41102940/",
    type: "review",
    note:
      "Meta-analysis showing stress-related changes in voice, with stronger effects reported during spontaneous speech tasks.",
  },
  {
    title: "Sustained vowels and continuous speech in the auditory-perceptual evaluation of dysphonia severity",
    url: "https://pubmed.ncbi.nlm.nih.gov/22832675/",
    type: "study",
    note:
      "Supports collecting more than one speech task because sustained vowels and continuous speech capture different aspects of voice behavior.",
  },
  {
    title: "Computerized analysis of speech and voice for Parkinson's disease: A systematic review",
    url: "https://pubmed.ncbi.nlm.nih.gov/36183641/",
    type: "review",
    note:
      "Summarizes task design, feature extraction, and reporting issues across Parkinson speech studies.",
  },
  {
    title: "Oxford Parkinson's Disease Detection Dataset",
    url: "https://archive.ics.uci.edu/dataset/174",
    type: "dataset",
    note:
      "Public benchmark dataset of biomedical voice measurements used in Parkinson-related voice biomarker research.",
  },
  {
    title: "Oxford Parkinson's Disease Telemonitoring Dataset",
    url: "https://archive.ics.uci.edu/ml/datasets/parkinsons%2Btelemonitoring",
    type: "dataset",
    note:
      "Home-captured voice dataset designed for remote symptom monitoring and longitudinal modeling.",
  },
  {
    title: "mPower Public Researcher Portal",
    url: "https://www.synapse.org/Synapse:syn4993293",
    type: "dataset",
    note:
      "Large smartphone-based Parkinson research program with active phonation tasks and mobile sensor data.",
  },
];

export const VALIDATION_NOTE =
  "SoulScope stores adjacent speech-biomarker literature and public dataset references with each scan. We did not identify peer-reviewed validation for proprietary VAH organ-frequency or chakra-mapping claims, so the product is framed around measurable vocal features and non-diagnostic correlations.";
