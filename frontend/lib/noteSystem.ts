export type SoulScopeNoteProfile = {
  note: string;
  opposite: string;
  adjacentNotes: string[];
  color: string;
  activatingOrCalming: "activating" | "calming" | "balancing";
  frequencyRefs?: string[];
  emotionBalanced: string;
  emotionUnderactive: string;
  emotionOveractive: string;
  physicalCorrelates: string[];
  progression?: string[];
  support: string;
  notes?: string[];
  recommendedMusic?: string[];
  nutrients?: string[];
  lifestyleSuggestions?: string[];
  essentialOils?: string[];
  flowerEssences?: string[];
  foods?: string[];
  juices?: string[];
  symptomPatterns?: string[];
  abundancePatterns?: string[];
  referenceLinks?: string[];
};

export const NOTE_ORDER = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;

export const SOULSCOPE_NOTE_SYSTEM: SoulScopeNoteProfile[] = [
  {
    note: "C",
    opposite: "F#",
    adjacentNotes: ["B", "C#"],
    color: "#ef4444",
    activatingOrCalming: "balancing",
    emotionBalanced: "Grounded connection, mutual care, and relational steadiness.",
    emotionUnderactive: "May correlate with isolation, reduced support, guarded attachment, or difficulty receiving.",
    emotionOveractive: "May correlate with codependency, over-caretaking, enabling, and making others happy at your own expense.",
    physicalCorrelates: ["thyroid", "metabolism regulation", "small intestine", "lymphatics", "physical fatigue"],
    progression: [
      "Stage 1: thyroid imbalance or reduced metabolic steadiness.",
      "Stage 2: small-intestine strain, including gas or bloating.",
      "Stage 3: lymphatic sluggishness or reduced drainage.",
    ],
    abundancePatterns: [
      "Personal power, female sexuality, caring for self, and caring for others.",
      "Eye muscles with neighboring C#; blood problems; heart muscle; cancer; large body muscle strength.",
    ],
    support:
      "Support C with grounded self-support, reduced over-giving, steadier breath, and practices that rebuild reserve rather than relational overextension.",
  },
  {
    note: "C#",
    opposite: "G",
    adjacentNotes: ["C", "D"],
    color: "#f15a24",
    activatingOrCalming: "balancing",
    emotionBalanced: "Healthy sensitivity, emotional clarity, and measured responsiveness.",
    emotionUnderactive: "May correlate with emotional shutdown, numbness, or reluctance to reveal needs.",
    emotionOveractive: "May correlate with oversensitivity, overprotection, or defensive emotional patterning.",
    physicalCorrelates: ["sensitivity regulation"],
    abundancePatterns: [
      "Female and fertility-related patterns: lower back issues, hysterectomy history, child fertility, fertility drugs, fibroids, breast cancer.",
      "Tendons, ligaments, scar tissue, infections, inflammation, neck and shoulder problems, some digestive problems such as Crohn's disease with D.",
      "Dupuytren's syndrome, carpal tunnel syndrome, arthritis, endorphins, and finger muscles.",
      "Together with G, linked in your source notes to neck, shoulder, and fertility problems.",
    ],
    support: "Support C# with softened expression, safe pacing, and calm vocal disclosure without collapse or defense.",
    notes: ["Placeholder note profile pending fuller SoulScope mapping."],
  },
  {
    note: "D",
    opposite: "G#",
    adjacentNotes: ["C#", "D#"],
    color: "#f97316",
    activatingOrCalming: "activating",
    emotionBalanced: "Forward motion, practical action, and steady follow-through.",
    emotionUnderactive: "May correlate with hesitation, low initiative, or slowed momentum.",
    emotionOveractive: "May correlate with force, urgency, or pressure-driven action.",
    physicalCorrelates: ["drive", "movement", "action readiness"],
    abundancePatterns: [
      "Oxygenation of digestion, liver, anger, emotions, constipation when the note is full, and digestion of food.",
      "Male and female hormones, food allergies, and throat muscles.",
      "Source notes connect D / D# to Parkinson's disease, dementia, dopamine, amino acids that keep the brain clear, and catatonia.",
      "Missing D is linked in the source notes to multiple sclerosis; D is also cited in Parkinson's, IBS, Crohn's disease, and hormone problems.",
      "Together with G#, D is described as an important mineral and digestion balancer.",
    ],
    support: "Support D with paced action, confident projection, and movement that is structured rather than forced.",
    notes: ["Opposite-note link to G# has been defined by the current SoulScope model."],
  },
  {
    note: "D#",
    opposite: "A",
    adjacentNotes: ["D", "E"],
    color: "#f59e0b",
    activatingOrCalming: "activating",
    emotionBalanced: "Adaptability, responsiveness, and flexible change.",
    emotionUnderactive: "May correlate with rigidity, shutdown, or difficulty adjusting.",
    emotionOveractive: "May correlate with scattered responsiveness or reactive instability.",
    physicalCorrelates: ["adrenals", "stress-response spillover when neighboring E is imbalanced"],
    abundancePatterns: [
      "Paired with D around digestion, oxygenation, emotions, hormones, and food allergies.",
      "Paired with E in the source notes around hay fever and sinusitis.",
    ],
    support: "Support D# with gradual transitions, stable rhythm, and flexibility without overstimulation.",
    notes: ["Adjacent to E and may destabilize when E is heavily imbalanced."],
  },
  {
    note: "E",
    opposite: "A#",
    adjacentNotes: ["D#", "F"],
    color: "#eab308",
    activatingOrCalming: "activating",
    emotionBalanced: "Clear agency, coherent will, and stable self-direction.",
    emotionUnderactive: "May correlate with low drive, depletion, or reduced self-direction.",
    emotionOveractive: "May correlate with force, overcontrol, or pushing through depletion.",
    physicalCorrelates: ["candida / yeast imbalance", "adrenal spillover into adjacent notes"],
    abundancePatterns: [
      "Lungs, dairy allergies, and overabundant E with catarrh, bronchitis, and congested asthma.",
      "Emotionally represents the heart; too much E can reflect being stuck in a situation you do not like and cannot change.",
      "Lack of E is linked in the source notes to no joy, nervous asthma, or hay fever and sinusitis with D#.",
      "Important minerals and cigarette nicotine frequency are placed here in the source notes.",
      "A#/E are linked to jaw, face muscles, and TMJ; B or E or D can relate to high blood pressure.",
    ],
    support:
      "Support E with cleaner pacing, less forced effort, and restorative practices that reduce compensatory drive while stabilizing neighboring notes.",
    notes: ["When E is imbalanced, adjacent notes may also destabilize and affect adrenal load."],
  },
  {
    note: "F",
    opposite: "B",
    adjacentNotes: ["E", "F#"],
    color: "#22c55e",
    activatingOrCalming: "calming",
    emotionBalanced: "Warmth, nourishment, and steady replenishment.",
    emotionUnderactive: "May correlate with depletion, undernourishment, or reduced restorative capacity.",
    emotionOveractive:
      "May correlate with overconsumption, over-nurturing, or emotional upset triggered by pancreatic stress and sugar-driven imbalance.",
    physicalCorrelates: [
      "pancreas",
      "ears",
      "ear infections",
      "airborne allergies",
      "poor concentration linked to sugar stress",
    ],
    abundancePatterns: [
      "Kidneys, bladder, prostate, and male sexuality in the source notes.",
      "Low F / F# in men may indicate low sex drive or not enough sexual activity; lack may also show as emotional indecision or weak muscle tone.",
      "Too much F can indicate chemical allergies.",
      "The middle of the F band is described as containing corticosteroid-related themes and needing balance with B in rheumatic and arthritic conditions.",
      "High F / F# is described as high stress and acidic body states; when filtering fails, F and F# are linked to bladder and bowel malfunction, toxicity, and malabsorption.",
      "Substance P and extreme pain are placed near F in the source notes.",
    ],
    support:
      "Support F with healthier more natural foods, gentler replenishment, restorative sound, and practices that reduce sugar-driven strain.",
    notes: [
      "F connects with the ears and can show up through ear infections when imbalanced.",
      "Suffering from airborne allergies and poor concentration in school may reflect pancreatic stress from too much sugar.",
      "This is one example of physical problems initiating emotional upset.",
    ],
  },
  {
    note: "F#",
    opposite: "C",
    adjacentNotes: ["F", "G"],
    color: "#14b8a6",
    activatingOrCalming: "activating",
    emotionBalanced: "Clear regulation, mental steadiness, and measured control.",
    emotionUnderactive: "May correlate with reduced mental organization, fog, or unstable regulation.",
    emotionOveractive: "May correlate with control, mood swings, depression, irritability, and mental overload.",
    physicalCorrelates: ["brain", "mental regulation"],
    abundancePatterns: [
      "Filtering system for F; these two notes are described as especially important for life success in the source notes.",
      "No F# frequencies are linked there to prostate cancer in men.",
      "Adrenaline, cortisol, and sodium are placed here.",
      "High F / F# is described as high stress and acidity; paired with F around bladder / bowel malfunction and toxicity if the filtering system is not working.",
    ],
    support:
      "Support F# with down-regulation, slower pacing, less cognitive pressure, and calming tones that reduce overcontrol.",
    notes: ["Opposite of C in the current SoulScope model."],
  },
  {
    note: "G",
    opposite: "C#",
    adjacentNotes: ["F#", "G#"],
    color: "#3b82f6",
    activatingOrCalming: "activating",
    emotionBalanced: "Clear expression, communication, and social openness.",
    emotionUnderactive: "May correlate with withholding, muted speech, or fear of being heard.",
    emotionOveractive: "May correlate with overexplaining, vocal push, or anxious outward expression.",
    physicalCorrelates: ["liver"],
    abundancePatterns: [
      "Neurotransmitters, minerals, and the 'happy note' in the source notes.",
      "Lack of G / G# is linked there to apathetic depression; too much G / G# / A to manic depression and mental disorders.",
      "G / G# are described as chemical balancers with D / D# and as important for digestion and mineral balance.",
      "Thyroxin, caffeine, and some leg and buttock muscles are placed here; hormone use is said to need balance in G.",
      "Together with C#, linked in the source notes to neck, shoulder, and fertility problems.",
    ],
    support: "Support G with honest expression, forward resonance, and clearer communication without pressure.",
    notes: ["The liver vibrates at the note of G in the current SoulScope mapping."],
  },
  {
    note: "G#",
    opposite: "D",
    adjacentNotes: ["G", "A"],
    color: "#6366f1",
    activatingOrCalming: "activating",
    emotionBalanced: "Practical security, grounded planning, and stable self-support.",
    emotionUnderactive:
      "May correlate with inherited physical weakness, reduced groundedness, or low personal support. When the physical side is underactive, the emotional side may overwork to compensate.",
    emotionOveractive:
      "May correlate with financial fears, scarcity vigilance, and emotional compensation that keeps a weak physical pattern functioning, often creating stress in the emotional layer of the same note.",
    physicalCorrelates: [
      "gall bladder patterning",
      "inherited digestive weakness",
      "digestive support",
      "security-related stress load",
    ],
    abundancePatterns: [
      "More strongly connected to minerals than G in the source notes, although magnesium is placed in G.",
      "Complex neurotransmitter functions are placed here; excess G# is linked there to manic depression and schizophrenia.",
      "Chromium picolinate is placed in G# and paired with glutamic acid / glutamine for energy in the body.",
      "GABA is placed here and described as out of balance or missing in hyperactive autism.",
      "D and G# are described as out of balance in dementia and Alzheimer's disease.",
    ],
    support:
      "Support G# through nutritional support, lifestyle stabilization, stronger personal boundaries, and practices that reduce fear-based compensation so emotional stress no longer has to prop up the physical pattern. As physical support improves, the emotional layer can settle and personal strength can return.",
    notes: [
      "When the physical aspect of a note is underactive, it can be fueled by the emotional part of the same note, which then creates stress in the emotions.",
      "A female client showed poor physical support in G# and complained that she never had time for herself because she was always supporting others in her family.",
      "She had weak physical hits in G# on the voice print, but the same note showed clear emotional stress.",
      "In this example, she was compensating emotionally for an inherited physical weakness; her family history included relatives with gall bladder issues.",
      "Her emotions were effectively creating enough energy to keep her digestive system working.",
      "After nutritional and lifestyle changes strengthened the physical side of G#, her emotional stress diminished.",
      "As the physical part of the note balanced, she experienced more personal strength and power and gained the courage to speak her needs.",
    ],
  },
  {
    note: "A",
    opposite: "D#",
    adjacentNotes: ["G#", "A#"],
    color: "#8b5cf6",
    activatingOrCalming: "balancing",
    emotionBalanced: "Meaning, direction, and coherent future orientation.",
    emotionUnderactive: "May correlate with lack of inspiration or direction.",
    emotionOveractive: "May correlate with overreach, idealization, or pressure around purpose.",
    physicalCorrelates: ["vision and direction themes"],
    abundancePatterns: [
      "Eye problems and knees are linked here in the source notes.",
      "Together with A#, represents the immune system.",
      "Associated there with degeneration of body functions, calf muscles, lower legs, and degeneration of eyesight when missing.",
      "Also linked in the source notes to AIDS and to business acumen and success.",
      "Missing D and / or A is listed there in a multiple sclerosis profile; too much G / G# / A is linked to manic depression and mental disorders.",
    ],
    support: "Support A with expansive but calm toning, reflection, and grounded forward vision.",
    notes: ["Placeholder note profile pending fuller SoulScope mapping."],
  },
  {
    note: "A#",
    opposite: "E",
    adjacentNotes: ["A", "B"],
    color: "#ddd6fe",
    activatingOrCalming: "balancing",
    emotionBalanced: "Reflection, integration, receptivity, and the ability to accept support and love.",
    emotionUnderactive: "May correlate with reduced inner contact, low receptivity, fear of life, or difficulty trusting support from others.",
    emotionOveractive:
      "May correlate with workaholic tendencies, hypersensitivity to criticism, fear of being hurt or abandoned, and a pattern of treating others as more important than yourself.",
    physicalCorrelates: ["heart support", "circulatory rhythm", "immune support", "integration and processing themes"],
    abundancePatterns: [
      "Detoxifying both physically and emotionally in the source notes.",
      "Creative expression of E, the heart and joy, when E and A# are balanced.",
      "A# excess is linked there with attention deficit disorder; missing A# with epilepsy.",
      "Overabundant A# can mean excessive temper or emotional outbursts; low A# can indicate fear of conflict, anger, or inability to speak up for yourself.",
      "Described there as an antidote to Substance P and related to pain relief.",
      "A# / E are linked to jaw and face muscles and TMJ.",
    ],
    support:
      "Support A# with heart-centered nutritional support, stress reduction, reflective pacing, immune support, and practices that help the system accept rest, love, and balanced receptivity.",
    notes: [
      "Classical listening suggestions for A# include Beethoven's 7th Symphony, Schubert's Trout Quintet, Mozart's 23rd Piano Concerto, and Tchaikovsky's Piano Concerto No. 1, Op. 23.",
      "VoiceBio source note: ask your practitioner for more information or visit www.VoiceBio.com.",
      "Opposite note of E in the current SoulScope model.",
    ],
    recommendedMusic: [
      "7th Symphony - Beethoven",
      "Trout Quintet - Schubert",
      "23rd Piano Concerto - Mozart",
      "Piano Concerto No. 1, Op. 23 - Tchaikovsky",
    ],
    nutrients: [
      "NADH",
      "arachidonic acid",
      "pregnenolone",
      "vitamin K7",
      "asparagine",
      "biotin",
      "oleic fatty acid",
      "elaidic fatty acid",
    ],
    lifestyleSuggestions: [
      "Provide nutritional support for the heart, particularly CoQ10.",
      "Check your environment for EMF pollution.",
      "Alkalize the body.",
      "Use a high-fiber, whole-food, primarily plant-based diet.",
      "Avoid saturated fats, trans-fatty acids, and hydrogenated fats.",
      "Use essential fatty acids.",
      "Take measures to boost the immune system.",
      "Engage in mind-quieting activities such as meditation and journaling.",
      "Learn to trust and accept love from others.",
      "Reduce stress levels by balancing play with work.",
      "Resolve long-standing disagreements or issues.",
    ],
    essentialOils: ["goldenrod", "lavender", "ylang ylang", "tansy", "ginger", "thyme", "clove", "nutmeg", "helichrysum"],
    foods: [
      "brewer's yeast",
      "garlic",
      "wheat germ",
      "alfalfa",
      "buckwheat",
      "kelp",
      "sea vegetables",
      "sprouts",
      "millet",
      "all vegetables",
      "asparagus",
      "avocado",
      "apricot",
      "cherries",
      "apples",
      "sunflower seeds",
      "almonds",
      "olive oil",
      "onions",
      "salmon",
      "other cold-water fish",
    ],
    juices: ["Carrot 5 oz. / spinach 3 oz.", "Carrot 4 oz. / beet 2 oz. / spinach 2 oz."],
    symptomPatterns: [
      "severe headache",
      "radiating neck pain",
      "graying hair",
      "sensation of heart skipping, fluttering, or flip-flop rhythm",
      "recurrent palpitations",
      "chest discomfort",
      "fainting",
      "confusion",
      "dizziness",
      "sweating",
      "shortness of breath",
      "swollen legs or ankles",
      "vein problems",
      "tiny purplish-red pinpoint spots of bleeding under skin on arms, legs, eyes, or mouth",
      "bleeding under nails",
      "painless bumpy nodules on palms and soles",
      "fever",
      "muscle aches in lower back or thighs",
      "fatigue",
      "weakness",
      "night sweats",
    ],
    referenceLinks: ["www.VoiceBio.com"],
  },
  {
    note: "B",
    opposite: "F",
    adjacentNotes: ["A#", "C"],
    color: "#34d399",
    activatingOrCalming: "calming",
    emotionBalanced: "Healthy release, completion, and letting go.",
    emotionUnderactive: "May correlate with holding on, unresolved residue, blocked completion, and feeling emotionally isolated or unloved.",
    emotionOveractive:
      "May correlate with martyr syndrome, exhaustion, burden-carrying, and sustaining a practical life while feeling trapped, isolated, unloved, or opposed by the world.",
    physicalCorrelates: ["bowels", "carpal tunnel syndrome"],
    abundancePatterns: [
      "Represents the body electric, ears, hearing, and deafness in the source notes.",
      "Without B, minerals are said not to work as well; too much computer radiation is described as disturbing B, with water and daily showers suggested for energetic reset.",
      "Linked there to fine motor movements, high blood pressure, and disconnection from the body.",
      "Usually missing with cancer; B or E or D are each linked there to high blood pressure.",
      "Important arm muscles are placed in B; missing B in computer workers is linked there to grey hair, grey skin, fatigue, and poor digestion.",
      "Copper, iodine, oxytocin, and many vitamins are placed in B; when both B and C are totally missing in women, the source notes connect that pattern to cancer.",
    ],
    support:
      "Support B with forgiveness, release-oriented practices, attitude change, and lighter emotional load so the system can stop carrying unresolved strain. Forgiveness helped stabilize this issue in the B martyr-pattern example.",
    notes: [
      "B is linked to martyr syndrome in the current SoulScope model.",
      "One male client developed a B martyr pattern after growing up in a cold home where he felt isolated and unloved.",
      "He turned to comfort food, later chose a low-affection marriage, felt disappointed by his children, and believed there was no way out of his lack and limitation.",
      "Maintaining that martyr stance pulled physical energy from B and showed up as bowel problems and daily carpal tunnel syndrome.",
      "Physical remedies alone did not resolve the pattern; forgiveness and attitude change helped stabilize B emotionally and physically.",
    ],
  },
];

export function getSoulScopeNoteProfile(note: string) {
  return SOULSCOPE_NOTE_SYSTEM.find((entry) => entry.note === note) ?? SOULSCOPE_NOTE_SYSTEM[0];
}

export function getSoulScopeNoteColor(note: string) {
  return getSoulScopeNoteProfile(note).color;
}
