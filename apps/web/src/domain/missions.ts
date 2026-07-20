import type { Mission } from "./types";

/**
 * Seed missions for the MVP (ODYSSEY_MASTER_PROMPT_CODEX.md §5.4 and §17).
 *
 * Each mission carries `scriptedTurns`, a deterministic three-turn script
 * used by the local (offline) coach provider so the full product loop works
 * with zero external API calls. When the OpenAI-backed coach provider is
 * wired in (Phase 3), `openingPrompt` and `scriptedTurns` remain the safe
 * fallback if the AI call fails or no key is configured.
 */
export const MISSIONS: Mission[] = [
  {
    id: "mission-introduce-yourself",
    slug: "introduce-yourself",
    title: "Introduce yourself to a new colleague",
    titleFr: "Te présenter à un nouveau collègue",
    description:
      "Give a short, confident self-introduction the way you would on your first day in an international team.",
    descriptionFr:
      "Fais une courte présentation de toi-même, comme le premier jour dans une équipe internationale.",
    targetSituation: "First day with a new international team",
    targetCapabilitySlug: "introduce_yourself",
    contextType: "meetings",
    estimatedMinutes: 6,
    difficulty: 1,
    openingPrompt: {
      english: "Hi, I don't think we've met. I'm Alex — I lead the product team here. And you?",
      french:
        "Salut, je ne crois pas qu'on se connaisse. Je suis Alex, je dirige l'équipe produit ici. Et toi ?",
      successKeywords: ["i'm", "i am", "my name", "i work"],
    },
    scriptedTurns: [
      {
        english: "Nice to meet you. What brought you to this company?",
        french: "Ravi de te rencontrer. Qu'est-ce qui t'a amené dans cette entreprise ?",
      },
      {
        english: "That's great. What are you looking forward to in this role?",
        french: "C'est génial. Qu'est-ce que tu attends avec impatience dans ce poste ?",
      },
    ],
    followUpIntents: [
      "Ask about the person's team",
      "Ask what they did before",
      "Suggest getting coffee together",
    ],
    successConditions: [
      "The learner states their name",
      "The learner gives at least one detail about themselves",
    ],
    exampleDebrief: {
      strength: "Tu t'es présenté clairement dès la première phrase.",
      improvement:
        "Ajoute un détail concret (ton rôle, ton équipe) pour rendre la présentation mémorable.",
      improvedExample: "I'm Camille, I just joined as a backend developer on the payments team.",
    },
    active: true,
  },
  {
    id: "mission-present-idea",
    slug: "present-an-idea",
    title: "Present an idea to a client",
    titleFr: "Présenter une idée à un client",
    description:
      "Pitch a product idea in one or two sentences and explain why it matters to the client.",
    descriptionFr:
      "Présente une idée produit en une ou deux phrases et explique pourquoi elle est utile au client.",
    targetSituation: "Client meeting, presenting a new concept",
    targetCapabilitySlug: "present_idea",
    contextType: "clients",
    estimatedMinutes: 8,
    difficulty: 2,
    openingPrompt: {
      english:
        "You're meeting a client tomorrow. In one sentence, what idea do you want to present?",
      french: "Tu rencontres un client demain. En une phrase, quelle idée veux-tu présenter ?",
      successKeywords: ["we", "idea", "propose", "suggest"],
    },
    scriptedTurns: [
      {
        english: "Good. Now explain briefly why this idea would be useful for the client.",
        french:
          "Bien. Explique maintenant brièvement pourquoi cette idée serait utile pour le client.",
      },
      {
        english:
          "The client says the concept sounds interesting but wants to know the timeline. What do you say?",
        french:
          "Le client trouve le concept intéressant mais veut connaître le délai. Que réponds-tu ?",
      },
    ],
    followUpIntents: [
      "Ask about the client's budget",
      "Propose a follow-up meeting",
      "Offer a smaller pilot version",
    ],
    successConditions: [
      "The learner states the idea in one clear sentence",
      "The learner gives at least one concrete benefit",
    ],
    exampleDebrief: {
      strength: "Tu as formulé ton idée en une phrase claire.",
      improvement: "Relie systématiquement ton idée à un bénéfice concret pour le client.",
      improvedExample:
        "This would let your team cut onboarding time by half, starting next quarter.",
    },
    active: true,
  },
  {
    id: "mission-participate-meeting",
    slug: "participate-in-a-meeting",
    title: "Speak up in a team meeting",
    titleFr: "Prendre la parole en réunion d'équipe",
    description:
      "Practice jumping into a meeting to share a quick update, the way real meetings actually feel.",
    descriptionFr:
      "Entraîne-toi à intervenir en réunion pour partager un point rapide, comme dans une vraie réunion.",
    targetSituation: "Weekly team sync",
    targetCapabilitySlug: "participate_meeting",
    contextType: "meetings",
    estimatedMinutes: 7,
    difficulty: 3,
    openingPrompt: {
      english:
        "Okay, let's do a quick round. Alex, can you give us a status update on your project?",
      french:
        "Ok, on fait un tour de table rapide. Alex, peux-tu nous donner un point sur ton projet ?",
      successKeywords: ["progress", "status", "we", "next"],
    },
    scriptedTurns: [
      {
        english: "Thanks. Is there anything blocking you right now?",
        french: "Merci. Est-ce qu'il y a un blocage en ce moment ?",
      },
      {
        english: "Understood. What do you need from the team to move forward?",
        french: "Compris. De quoi as-tu besoin de la part de l'équipe pour avancer ?",
      },
    ],
    followUpIntents: [
      "Ask for a specific deadline",
      "Offer to help a teammate",
      "Request more resources",
    ],
    successConditions: [
      "The learner gives a status update without being asked twice",
      "The learner names at least one concrete next step or need",
    ],
    exampleDebrief: {
      strength: "Tu as pris la parole sans hésiter quand on t'a sollicité.",
      improvement: "Termine ton point par une action concrète ou une demande claire.",
      improvedExample:
        "I'm on track, but I'll need design feedback by Thursday to stay on schedule.",
    },
    active: true,
  },
  {
    id: "mission-ask-clarification",
    slug: "ask-for-clarification",
    title: "Ask for clarification during a briefing",
    titleFr: "Demander une clarification pendant un briefing",
    description:
      "Your manager gives instructions that are not fully clear. Practice asking for clarification naturally.",
    descriptionFr:
      "Ton manager donne des instructions pas totalement claires. Entraîne-toi à demander une clarification naturellement.",
    targetSituation: "Manager briefing on a new task",
    targetCapabilitySlug: "ask_clarification",
    contextType: "meetings",
    estimatedMinutes: 5,
    difficulty: 2,
    openingPrompt: {
      english: "So, can you handle the client report by end of week? You know, the usual format.",
      french:
        "Donc, tu peux gérer le rapport client d'ici la fin de semaine ? Le format habituel, tu vois.",
      successKeywords: ["what do you mean", "could you", "which", "clarify"],
    },
    scriptedTurns: [
      {
        english:
          "Ah, good question. I mean the summary version, two pages max, with the Q3 numbers.",
        french:
          "Ah, bonne question. Je veux dire la version résumée, deux pages maximum, avec les chiffres du T3.",
      },
      {
        english: "Exactly. Does that work for you, or do you need more time?",
        french: "Exactement. Ça te convient, ou tu as besoin de plus de temps ?",
      },
    ],
    followUpIntents: [
      "Ask for an example of the expected format",
      "Confirm the deadline",
      "Ask who else will review it",
    ],
    successConditions: ["The learner explicitly asks for clarification instead of guessing"],
    exampleDebrief: {
      strength: "Tu as osé demander une précision plutôt que de deviner.",
      improvement:
        "Précise exactement ce qui te manque (format, longueur, délai) pour une réponse plus utile.",
      improvedExample:
        "When you say 'the usual format', do you mean the two-page summary, or the full report?",
    },
    active: true,
  },
  {
    id: "mission-give-opinion",
    slug: "give-your-opinion",
    title: "Give your opinion on a proposal",
    titleFr: "Donner ton avis sur une proposition",
    description:
      "A colleague proposes a change. Practice sharing your honest opinion and reasoning.",
    descriptionFr:
      "Un collègue propose un changement. Entraîne-toi à donner ton avis honnête et à le justifier.",
    targetSituation: "Discussing a proposed process change",
    targetCapabilitySlug: "give_opinion",
    contextType: "meetings",
    estimatedMinutes: 7,
    difficulty: 3,
    openingPrompt: {
      english:
        "I think we should move our daily meeting to async messages instead. What do you think?",
      french:
        "Je pense qu'on devrait remplacer notre réunion quotidienne par des messages asynchrones. Qu'en penses-tu ?",
      successKeywords: ["i think", "in my opinion", "i agree", "i disagree"],
    },
    scriptedTurns: [
      {
        english: "That's fair. What would you keep from the current format, if anything?",
        french:
          "C'est un point de vue valable. Qu'est-ce que tu garderais du format actuel, s'il y a quelque chose ?",
      },
      {
        english: "Good point. How would you convince the rest of the team?",
        french: "Bon point. Comment convaincrais-tu le reste de l'équipe ?",
      },
    ],
    followUpIntents: [
      "Propose a trial period",
      "Ask for the team's feedback first",
      "Suggest a hybrid approach",
    ],
    successConditions: [
      "The learner states a clear opinion",
      "The learner gives at least one reason",
    ],
    exampleDebrief: {
      strength: "Tu as donné un avis clair sans détour.",
      improvement:
        "Ajoute toujours une raison concrète derrière ton opinion pour la rendre plus convaincante.",
      improvedExample:
        "I think it could work, mainly because it would give people more focus time in the morning.",
    },
    active: true,
  },
  {
    id: "mission-disagree-politely",
    slug: "disagree-politely",
    title: "Disagree with a suggestion politely",
    titleFr: "Exprimer un désaccord poliment",
    description:
      "A teammate suggests something you don't fully agree with. Practice disagreeing without being harsh.",
    descriptionFr:
      "Un coéquipier suggère quelque chose avec lequel tu n'es pas totalement d'accord. Entraîne-toi à exprimer un désaccord sans être dur.",
    targetSituation: "Team disagreement on a technical choice",
    targetCapabilitySlug: "disagree_politely",
    contextType: "meetings",
    estimatedMinutes: 7,
    difficulty: 3,
    openingPrompt: {
      english:
        "I really think we should rebuild the whole dashboard from scratch. It's the only clean option.",
      french:
        "Je pense vraiment qu'on devrait reconstruire tout le tableau de bord de zéro. C'est la seule option propre.",
      successKeywords: ["i see your point", "however", "i'm not sure", "but"],
    },
    scriptedTurns: [
      {
        english: "Hmm, maybe. What would you do differently?",
        french: "Hmm, peut-être. Qu'est-ce que tu ferais différemment ?",
      },
      {
        english: "That could work. How long do you think your approach would take?",
        french: "Ça pourrait marcher. Combien de temps prendrait ton approche selon toi ?",
      },
    ],
    followUpIntents: [
      "Suggest a middle-ground option",
      "Ask for data before deciding",
      "Propose a small test first",
    ],
    successConditions: [
      "The learner disagrees without dismissing the other person",
      "The learner proposes an alternative",
    ],
    exampleDebrief: {
      strength: "Tu as exprimé ton désaccord sans être abrupt.",
      improvement:
        "Commence par reconnaître le point de l'autre avant de proposer ton alternative.",
      improvedExample:
        "I see why a rebuild is tempting, but I think we could fix the core issue in two weeks instead.",
    },
    active: true,
  },
  {
    id: "mission-handle-objection",
    slug: "handle-an-objection",
    title: "Handle a client's objection",
    titleFr: "Gérer une objection d'un client",
    description:
      "The client raises a concern about price. Practice responding calmly and constructively.",
    descriptionFr:
      "Le client soulève une préoccupation sur le prix. Entraîne-toi à répondre calmement et de façon constructive.",
    targetSituation: "Client pushes back on pricing",
    targetCapabilitySlug: "handle_objections",
    contextType: "clients",
    estimatedMinutes: 8,
    difficulty: 4,
    openingPrompt: {
      english:
        "Honestly, this seems too expensive compared to what we currently pay. Why should we switch?",
      french:
        "Honnêtement, ça semble trop cher par rapport à ce qu'on paie actuellement. Pourquoi devrions-nous changer ?",
      successKeywords: ["understand", "however", "value", "because"],
    },
    scriptedTurns: [
      {
        english: "Okay, I hear you. But what happens if we go over budget this quarter?",
        french:
          "D'accord, j'entends ça. Mais que se passe-t-il si on dépasse le budget ce trimestre ?",
      },
      {
        english: "That's reassuring. Can you send me something in writing to confirm this?",
        french: "C'est rassurant. Peux-tu m'envoyer quelque chose par écrit pour confirmer ça ?",
      },
    ],
    followUpIntents: [
      "Offer a discount for a longer contract",
      "Propose a phased rollout",
      "Share a case study",
    ],
    successConditions: [
      "The learner acknowledges the concern before responding",
      "The learner offers a concrete reassurance or next step",
    ],
    exampleDebrief: {
      strength: "Tu n'as pas paniqué face à l'objection, tu as répondu posément.",
      improvement: "Commence toujours par valider la préoccupation avant de la contrer.",
      improvedExample:
        "I understand the price is a real factor — let me show you what's included that isn't in your current plan.",
    },
    active: true,
  },
  {
    id: "mission-small-talk",
    slug: "small-talk-before-a-meeting",
    title: "Make small talk before a meeting starts",
    titleFr: "Faire la conversation avant le début d'une réunion",
    description: "Practice the informal minute of chat before a video call officially begins.",
    descriptionFr:
      "Entraîne-toi à la minute de discussion informelle avant qu'un appel vidéo ne commence officiellement.",
    targetSituation: "Waiting for others to join a video call",
    targetCapabilitySlug: "network_informally",
    contextType: "networking",
    estimatedMinutes: 5,
    difficulty: 2,
    openingPrompt: {
      english: "Hey, good to see you! How's your week going so far?",
      french: "Hey, content de te voir ! Comment se passe ta semaine ?",
      successKeywords: ["good", "busy", "how about you", "and you"],
    },
    scriptedTurns: [
      {
        english: "Nice. Did you do anything fun this weekend?",
        french: "Sympa. Tu as fait quelque chose d'amusant ce week-end ?",
      },
      {
        english: "That sounds fun. Looks like the others are joining — ready to start?",
        french: "Ça a l'air sympa. On dirait que les autres arrivent, prêt à commencer ?",
      },
    ],
    followUpIntents: [
      "Ask about their weekend plans",
      "Comment on the weather",
      "Mention a shared project",
    ],
    successConditions: ["The learner responds and asks a question back"],
    exampleDebrief: {
      strength: "Tu as relancé la conversation au lieu de répondre en une seule phrase.",
      improvement: "N'hésite pas à ajouter un détail personnel, ça rend l'échange plus naturel.",
      improvedExample: "Pretty good, thanks! I finally finished setting up my new apartment.",
    },
    active: true,
  },
  {
    id: "mission-networking-intro",
    slug: "networking-introduction",
    title: "Introduce your work at a networking event",
    titleFr: "Présenter ton travail lors d'un événement de réseautage",
    description: "Someone new asks what you do. Practice a short, engaging answer.",
    descriptionFr:
      "Quelqu'un que tu ne connais pas te demande ce que tu fais. Entraîne-toi à donner une réponse courte et engageante.",
    targetSituation: "Networking event, meeting someone new",
    targetCapabilitySlug: "describe_role",
    contextType: "networking",
    estimatedMinutes: 6,
    difficulty: 2,
    openingPrompt: {
      english: "So, what do you do?",
      french: "Alors, qu'est-ce que tu fais dans la vie ?",
      successKeywords: ["i work", "i'm a", "i help", "i build"],
    },
    scriptedTurns: [
      {
        english: "Oh interesting, what kind of companies do you work with?",
        french: "Oh intéressant, avec quel type d'entreprises travailles-tu ?",
      },
      {
        english: "Nice. Do you have a card, or how can I follow up with you?",
        french: "Sympa. Tu as une carte, ou comment je peux te recontacter ?",
      },
    ],
    followUpIntents: [
      "Ask what the other person does",
      "Suggest connecting on LinkedIn",
      "Mention a recent project",
    ],
    successConditions: ["The learner explains their role in under two sentences"],
    exampleDebrief: {
      strength: "Ta présentation était courte et facile à suivre.",
      improvement: "Ajoute qui tu aides ou ce que tu résous, pas seulement ton titre.",
      improvedExample:
        "I'm a product designer — I help small teams turn rough ideas into apps people actually enjoy using.",
    },
    active: true,
  },
  {
    id: "mission-present-work",
    slug: "present-your-work",
    title: "Present your work with structure",
    titleFr: "Présenter ton travail avec structure",
    description: "Give a short, structured update on a project you're working on.",
    descriptionFr: "Fais un point court et structuré sur un projet sur lequel tu travailles.",
    targetSituation: "Project review presentation",
    targetCapabilitySlug: "present_with_structure",
    contextType: "presentations",
    estimatedMinutes: 9,
    difficulty: 3,
    openingPrompt: {
      english: "Go ahead, walk us through where the project stands.",
      french: "Vas-y, explique-nous où en est le projet.",
      successKeywords: ["first", "then", "currently", "next"],
    },
    scriptedTurns: [
      {
        english: "Good structure. What's the biggest risk right now?",
        french: "Bonne structure. Quel est le plus gros risque en ce moment ?",
      },
      {
        english: "Understood. What do you need from us to keep it on track?",
        french: "Compris. De quoi as-tu besoin de notre part pour rester sur les rails ?",
      },
    ],
    followUpIntents: ["Show a specific metric", "Ask for more time", "Propose a mitigation plan"],
    successConditions: [
      "The learner organizes the update with a clear beginning, current status, and next steps",
    ],
    exampleDebrief: {
      strength: "Ta présentation suivait un ordre logique et facile à suivre.",
      improvement: "Mentionne toujours un risque ou un point de vigilance, même bref.",
      improvedExample:
        "We finished the design phase, we're now building the core feature, and the main risk is the API integration timeline.",
    },
    active: true,
  },
  {
    id: "mission-job-interview",
    slug: "job-interview-answer",
    title: "Answer a job interview question",
    titleFr: "Répondre à une question d'entretien d'embauche",
    description:
      "Practice answering a classic, tricky interview question with structure and confidence.",
    descriptionFr:
      "Entraîne-toi à répondre à une question classique et piégeuse d'entretien avec structure et confiance.",
    targetSituation: "Job interview",
    targetCapabilitySlug: "answer_interview_questions",
    contextType: "interviews",
    estimatedMinutes: 8,
    difficulty: 4,
    openingPrompt: {
      english:
        "Tell me about a time you faced a difficult challenge at work, and how you handled it.",
      french:
        "Parle-moi d'une fois où tu as fait face à un défi difficile au travail, et comment tu l'as géré.",
      successKeywords: ["situation", "i had to", "i decided", "result"],
    },
    scriptedTurns: [
      {
        english: "Interesting. What did you learn from that experience?",
        french: "Intéressant. Qu'as-tu appris de cette expérience ?",
      },
      {
        english: "Good. Why do you think that skill matters for this role?",
        french: "Bien. Pourquoi penses-tu que cette compétence est importante pour ce poste ?",
      },
    ],
    followUpIntents: [
      "Give a concrete result or number",
      "Ask about the team you'd be joining",
      "Connect the answer back to the job",
    ],
    successConditions: [
      "The learner describes a specific situation, not a generic statement",
      "The learner mentions an outcome or lesson learned",
    ],
    exampleDebrief: {
      strength: "Tu as donné un exemple concret plutôt qu'une réponse générale.",
      improvement: "Termine toujours par le résultat obtenu, même approximatif.",
      improvedExample:
        "In the end, we shipped two weeks late but with zero critical bugs, which the client actually preferred.",
    },
    active: true,
  },
  {
    id: "mission-travel-problem",
    slug: "travel-problem-resolution",
    title: "Resolve a hotel booking problem while traveling",
    titleFr: "Résoudre un problème de réservation d'hôtel en voyage",
    description:
      "Your hotel room isn't what you booked. Practice explaining the issue and asking for a fix.",
    descriptionFr:
      "Ta chambre d'hôtel ne correspond pas à ta réservation. Entraîne-toi à expliquer le problème et à demander une solution.",
    targetSituation: "Hotel front desk, booking issue",
    targetCapabilitySlug: "solve_travel_problem",
    contextType: "travel",
    estimatedMinutes: 6,
    difficulty: 2,
    openingPrompt: {
      english: "Welcome to the hotel! How can I help you today?",
      french: "Bienvenue à l'hôtel ! Comment puis-je vous aider aujourd'hui ?",
      successKeywords: ["booked", "reservation", "problem", "issue"],
    },
    scriptedTurns: [
      {
        english: "I see. Let me check — could you tell me the name on the reservation?",
        french: "Je vois. Laissez-moi vérifier — pouvez-vous me donner le nom sur la réservation ?",
      },
      {
        english:
          "Thank you. I can offer you an upgraded room at no extra cost — would that work for you?",
        french:
          "Merci. Je peux vous proposer une chambre surclassée sans coût supplémentaire — est-ce que ça vous convient ?",
      },
    ],
    followUpIntents: [
      "Ask for a refund instead",
      "Ask when the room will be ready",
      "Request a late checkout",
    ],
    successConditions: ["The learner clearly explains what is wrong with the booking"],
    exampleDebrief: {
      strength: "Tu as expliqué le problème de façon claire et polie.",
      improvement:
        "Précise toujours ce que tu attends comme solution (remboursement, échange, etc.).",
      improvedExample:
        "I booked a double room with a view, but I was given a single room facing the parking lot — could you fix this?",
    },
    active: true,
  },
];

export function getMissionBySlug(slug: string): Mission | undefined {
  return MISSIONS.find((m) => m.slug === slug);
}

export function getMissionById(id: string): Mission | undefined {
  return MISSIONS.find((m) => m.id === id);
}
