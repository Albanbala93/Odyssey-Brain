-- Seed data mirroring apps/web/src/domain/capabilities-catalog.ts and
-- apps/web/src/domain/missions.ts. Keep these in sync by hand until Phase 2
-- adds a script that generates one from the other.

insert into capabilities (id, slug, label_fr, description_fr) values
  ('cap-introduce-yourself', 'introduce_yourself', 'Se présenter avec aisance', 'Se présenter de façon claire et naturelle face à un interlocuteur.'),
  ('cap-describe-role', 'describe_role', 'Décrire son rôle', 'Expliquer ce que l''on fait professionnellement de façon concise.'),
  ('cap-present-idea', 'present_idea', 'Présenter une idée', 'Exposer une idée ou une recommandation avec une structure claire.'),
  ('cap-give-opinion', 'give_opinion', 'Donner son avis', 'Exprimer et justifier un point de vue.'),
  ('cap-ask-clarification', 'ask_clarification', 'Demander une clarification', 'Demander poliment une précision quand on n''a pas compris.'),
  ('cap-participate-meeting', 'participate_meeting', 'Prendre la parole en réunion', 'Intervenir de façon pertinente pendant une réunion.'),
  ('cap-disagree-politely', 'disagree_politely', 'Exprimer un désaccord poliment', 'Contester une idée sans être conflictuel.'),
  ('cap-handle-objections', 'handle_objections', 'Gérer une objection', 'Répondre calmement à une objection ou une critique.'),
  ('cap-network-informally', 'network_informally', 'Réseauter de façon informelle', 'Engager une conversation informelle avec un inconnu.'),
  ('cap-present-with-structure', 'present_with_structure', 'Présenter son travail avec structure', 'Structurer une présentation de son travail ou d''un projet.'),
  ('cap-answer-interview', 'answer_interview_questions', 'Répondre à des questions d''entretien', 'Répondre de façon structurée à une question d''entretien d''embauche.'),
  ('cap-solve-travel-problem', 'solve_travel_problem', 'Résoudre un problème en voyage', 'Gérer un imprévu pratique (hôtel, transport, restaurant) en anglais.')
on conflict (id) do nothing;

-- Missions: one row per apps/web/src/domain/missions.ts entry. `content`
-- carries the fields not itemized in the master brief's §9 table
-- (French title/description, scripted fallback turns, follow-up intents,
-- example debrief) so the row is a faithful mirror of the TS `Mission` type.
insert into missions (id, slug, title, description, target_capability_id, context_type, difficulty, estimated_minutes, opening_prompt, success_criteria, content, active) values
(
  'mission-introduce-yourself', 'introduce-yourself',
  'Introduce yourself to a new colleague',
  'Give a short, confident self-introduction the way you would on your first day in an international team.',
  'cap-introduce-yourself', 'meetings', 1, 6,
  '{"english":"Hi, I don''t think we''ve met. I''m Alex — I lead the product team here. And you?","french":"Salut, je ne crois pas qu''on se connaisse. Je suis Alex, je dirige l''équipe produit ici. Et toi ?","successKeywords":["i''m","i am","my name","i work"]}',
  '["The learner states their name","The learner gives at least one detail about themselves"]',
  '{"titleFr":"Te présenter à un nouveau collègue","descriptionFr":"Fais une courte présentation de toi-même, comme le premier jour dans une équipe internationale.","targetSituation":"First day with a new international team","followUpIntents":["Ask about the person''s team","Ask what they did before","Suggest getting coffee together"],"exampleDebrief":{"strength":"Tu t''es présenté clairement dès la première phrase.","improvement":"Ajoute un détail concret (ton rôle, ton équipe) pour rendre la présentation mémorable.","improvedExample":"I''m Camille, I just joined as a backend developer on the payments team."}}',
  true
),
(
  'mission-present-idea', 'present-an-idea',
  'Present an idea to a client',
  'Pitch a product idea in one or two sentences and explain why it matters to the client.',
  'cap-present-idea', 'clients', 2, 8,
  '{"english":"You''re meeting a client tomorrow. In one sentence, what idea do you want to present?","french":"Tu rencontres un client demain. En une phrase, quelle idée veux-tu présenter ?","successKeywords":["we","idea","propose","suggest"]}',
  '["The learner states the idea in one clear sentence","The learner gives at least one concrete benefit"]',
  '{"titleFr":"Présenter une idée à un client","descriptionFr":"Présente une idée produit en une ou deux phrases et explique pourquoi elle est utile au client.","targetSituation":"Client meeting, presenting a new concept","followUpIntents":["Ask about the client''s budget","Propose a follow-up meeting","Offer a smaller pilot version"],"exampleDebrief":{"strength":"Tu as formulé ton idée en une phrase claire.","improvement":"Relie systématiquement ton idée à un bénéfice concret pour le client.","improvedExample":"This would let your team cut onboarding time by half, starting next quarter."}}',
  true
),
(
  'mission-participate-meeting', 'participate-in-a-meeting',
  'Speak up in a team meeting',
  'Practice jumping into a meeting to share a quick update, the way real meetings actually feel.',
  'cap-participate-meeting', 'meetings', 3, 7,
  '{"english":"Okay, let''s do a quick round. Alex, can you give us a status update on your project?","french":"Ok, on fait un tour de table rapide. Alex, peux-tu nous donner un point sur ton projet ?","successKeywords":["progress","status","we","next"]}',
  '["The learner gives a status update without being asked twice","The learner names at least one concrete next step or need"]',
  '{"titleFr":"Prendre la parole en réunion d''équipe","descriptionFr":"Entraîne-toi à intervenir en réunion pour partager un point rapide, comme dans une vraie réunion.","targetSituation":"Weekly team sync","followUpIntents":["Ask for a specific deadline","Offer to help a teammate","Request more resources"],"exampleDebrief":{"strength":"Tu as pris la parole sans hésiter quand on t''a sollicité.","improvement":"Termine ton point par une action concrète ou une demande claire.","improvedExample":"I''m on track, but I''ll need design feedback by Thursday to stay on schedule."}}',
  true
),
(
  'mission-ask-clarification', 'ask-for-clarification',
  'Ask for clarification during a briefing',
  'Your manager gives instructions that are not fully clear. Practice asking for clarification naturally.',
  'cap-ask-clarification', 'meetings', 2, 5,
  '{"english":"So, can you handle the client report by end of week? You know, the usual format.","french":"Donc, tu peux gérer le rapport client d''ici la fin de semaine ? Le format habituel, tu vois.","successKeywords":["what do you mean","could you","which","clarify"]}',
  '["The learner explicitly asks for clarification instead of guessing"]',
  '{"titleFr":"Demander une clarification pendant un briefing","descriptionFr":"Ton manager donne des instructions pas totalement claires. Entraîne-toi à demander une clarification naturellement.","targetSituation":"Manager briefing on a new task","followUpIntents":["Ask for an example of the expected format","Confirm the deadline","Ask who else will review it"],"exampleDebrief":{"strength":"Tu as osé demander une précision plutôt que de deviner.","improvement":"Précise exactement ce qui te manque (format, longueur, délai) pour une réponse plus utile.","improvedExample":"When you say ''the usual format'', do you mean the two-page summary, or the full report?"}}',
  true
),
(
  'mission-give-opinion', 'give-your-opinion',
  'Give your opinion on a proposal',
  'A colleague proposes a change. Practice sharing your honest opinion and reasoning.',
  'cap-give-opinion', 'meetings', 3, 7,
  '{"english":"I think we should move our daily meeting to async messages instead. What do you think?","french":"Je pense qu''on devrait remplacer notre réunion quotidienne par des messages asynchrones. Qu''en penses-tu ?","successKeywords":["i think","in my opinion","i agree","i disagree"]}',
  '["The learner states a clear opinion","The learner gives at least one reason"]',
  '{"titleFr":"Donner ton avis sur une proposition","descriptionFr":"Un collègue propose un changement. Entraîne-toi à donner ton avis honnête et à le justifier.","targetSituation":"Discussing a proposed process change","followUpIntents":["Propose a trial period","Ask for the team''s feedback first","Suggest a hybrid approach"],"exampleDebrief":{"strength":"Tu as donné un avis clair sans détour.","improvement":"Ajoute toujours une raison concrète derrière ton opinion pour la rendre plus convaincante.","improvedExample":"I think it could work, mainly because it would give people more focus time in the morning."}}',
  true
),
(
  'mission-disagree-politely', 'disagree-politely',
  'Disagree with a suggestion politely',
  'A teammate suggests something you don''t fully agree with. Practice disagreeing without being harsh.',
  'cap-disagree-politely', 'meetings', 3, 7,
  '{"english":"I really think we should rebuild the whole dashboard from scratch. It''s the only clean option.","french":"Je pense vraiment qu''on devrait reconstruire tout le tableau de bord de zéro. C''est la seule option propre.","successKeywords":["i see your point","however","i''m not sure","but"]}',
  '["The learner disagrees without dismissing the other person","The learner proposes an alternative"]',
  '{"titleFr":"Exprimer un désaccord poliment","descriptionFr":"Un coéquipier suggère quelque chose avec lequel tu n''es pas totalement d''accord. Entraîne-toi à exprimer un désaccord sans être dur.","targetSituation":"Team disagreement on a technical choice","followUpIntents":["Suggest a middle-ground option","Ask for data before deciding","Propose a small test first"],"exampleDebrief":{"strength":"Tu as exprimé ton désaccord sans être abrupt.","improvement":"Commence par reconnaître le point de l''autre avant de proposer ton alternative.","improvedExample":"I see why a rebuild is tempting, but I think we could fix the core issue in two weeks instead."}}',
  true
),
(
  'mission-handle-objection', 'handle-an-objection',
  'Handle a client''s objection',
  'The client raises a concern about price. Practice responding calmly and constructively.',
  'cap-handle-objections', 'clients', 4, 8,
  '{"english":"Honestly, this seems too expensive compared to what we currently pay. Why should we switch?","french":"Honnêtement, ça semble trop cher par rapport à ce qu''on paie actuellement. Pourquoi devrions-nous changer ?","successKeywords":["understand","however","value","because"]}',
  '["The learner acknowledges the concern before responding","The learner offers a concrete reassurance or next step"]',
  '{"titleFr":"Gérer une objection d''un client","descriptionFr":"Le client soulève une préoccupation sur le prix. Entraîne-toi à répondre calmement et de façon constructive.","targetSituation":"Client pushes back on pricing","followUpIntents":["Offer a discount for a longer contract","Propose a phased rollout","Share a case study"],"exampleDebrief":{"strength":"Tu n''as pas paniqué face à l''objection, tu as répondu posément.","improvement":"Commence toujours par valider la préoccupation avant de la contrer.","improvedExample":"I understand the price is a real factor — let me show you what''s included that isn''t in your current plan."}}',
  true
),
(
  'mission-small-talk', 'small-talk-before-a-meeting',
  'Make small talk before a meeting starts',
  'Practice the informal minute of chat before a video call officially begins.',
  'cap-network-informally', 'networking', 2, 5,
  '{"english":"Hey, good to see you! How''s your week going so far?","french":"Hey, content de te voir ! Comment se passe ta semaine ?","successKeywords":["good","busy","how about you","and you"]}',
  '["The learner responds and asks a question back"]',
  '{"titleFr":"Faire la conversation avant le début d''une réunion","descriptionFr":"Entraîne-toi à la minute de discussion informelle avant qu''un appel vidéo ne commence officiellement.","targetSituation":"Waiting for others to join a video call","followUpIntents":["Ask about their weekend plans","Comment on the weather","Mention a shared project"],"exampleDebrief":{"strength":"Tu as relancé la conversation au lieu de répondre en une seule phrase.","improvement":"N''hésite pas à ajouter un détail personnel, ça rend l''échange plus naturel.","improvedExample":"Pretty good, thanks! I finally finished setting up my new apartment."}}',
  true
),
(
  'mission-networking-intro', 'networking-introduction',
  'Introduce your work at a networking event',
  'Someone new asks what you do. Practice a short, engaging answer.',
  'cap-describe-role', 'networking', 2, 6,
  '{"english":"So, what do you do?","french":"Alors, qu''est-ce que tu fais dans la vie ?","successKeywords":["i work","i''m a","i help","i build"]}',
  '["The learner explains their role in under two sentences"]',
  '{"titleFr":"Présenter ton travail lors d''un événement de réseautage","descriptionFr":"Quelqu''un que tu ne connais pas te demande ce que tu fais. Entraîne-toi à donner une réponse courte et engageante.","targetSituation":"Networking event, meeting someone new","followUpIntents":["Ask what the other person does","Suggest connecting on LinkedIn","Mention a recent project"],"exampleDebrief":{"strength":"Ta présentation était courte et facile à suivre.","improvement":"Ajoute qui tu aides ou ce que tu résous, pas seulement ton titre.","improvedExample":"I''m a product designer — I help small teams turn rough ideas into apps people actually enjoy using."}}',
  true
),
(
  'mission-present-work', 'present-your-work',
  'Present your work with structure',
  'Give a short, structured update on a project you''re working on.',
  'cap-present-with-structure', 'presentations', 3, 9,
  '{"english":"Go ahead, walk us through where the project stands.","french":"Vas-y, explique-nous où en est le projet.","successKeywords":["first","then","currently","next"]}',
  '["The learner organizes the update with a clear beginning, current status, and next steps"]',
  '{"titleFr":"Présenter ton travail avec structure","descriptionFr":"Fais un point court et structuré sur un projet sur lequel tu travailles.","targetSituation":"Project review presentation","followUpIntents":["Show a specific metric","Ask for more time","Propose a mitigation plan"],"exampleDebrief":{"strength":"Ta présentation suivait un ordre logique et facile à suivre.","improvement":"Mentionne toujours un risque ou un point de vigilance, même bref.","improvedExample":"We finished the design phase, we''re now building the core feature, and the main risk is the API integration timeline."}}',
  true
),
(
  'mission-job-interview', 'job-interview-answer',
  'Answer a job interview question',
  'Practice answering a classic, tricky interview question with structure and confidence.',
  'cap-answer-interview', 'interviews', 4, 8,
  '{"english":"Tell me about a time you faced a difficult challenge at work, and how you handled it.","french":"Parle-moi d''une fois où tu as fait face à un défi difficile au travail, et comment tu l''as géré.","successKeywords":["situation","i had to","i decided","result"]}',
  '["The learner describes a specific situation, not a generic statement","The learner mentions an outcome or lesson learned"]',
  '{"titleFr":"Répondre à une question d''entretien d''embauche","descriptionFr":"Entraîne-toi à répondre à une question classique et piégeuse d''entretien avec structure et confiance.","targetSituation":"Job interview","followUpIntents":["Give a concrete result or number","Ask about the team you''d be joining","Connect the answer back to the job"],"exampleDebrief":{"strength":"Tu as donné un exemple concret plutôt qu''une réponse générale.","improvement":"Termine toujours par le résultat obtenu, même approximatif.","improvedExample":"In the end, we shipped two weeks late but with zero critical bugs, which the client actually preferred."}}',
  true
),
(
  'mission-travel-problem', 'travel-problem-resolution',
  'Resolve a hotel booking problem while traveling',
  'Your hotel room isn''t what you booked. Practice explaining the issue and asking for a fix.',
  'cap-solve-travel-problem', 'travel', 2, 6,
  '{"english":"Welcome to the hotel! How can I help you today?","french":"Bienvenue à l''hôtel ! Comment puis-je vous aider aujourd''hui ?","successKeywords":["booked","reservation","problem","issue"]}',
  '["The learner clearly explains what is wrong with the booking"]',
  '{"titleFr":"Résoudre un problème de réservation d''hôtel en voyage","descriptionFr":"Ta chambre d''hôtel ne correspond pas à ta réservation. Entraîne-toi à expliquer le problème et à demander une solution.","targetSituation":"Hotel front desk, booking issue","followUpIntents":["Ask for a refund instead","Ask when the room will be ready","Request a late checkout"],"exampleDebrief":{"strength":"Tu as expliqué le problème de façon claire et polie.","improvement":"Précise toujours ce que tu attends comme solution (remboursement, échange, etc.).","improvedExample":"I booked a double room with a view, but I was given a single room facing the parking lot — could you fix this?"}}',
  true
)
on conflict (id) do nothing;
