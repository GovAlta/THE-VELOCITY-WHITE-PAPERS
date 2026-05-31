/* build-stubs.mjs — generates structural placeholder paper JSONs in EN + FR.
   Each stub has real inventory metadata (from structure.md), the real abstract,
   a 3-slide TL;DR presentation, and a marked-as-placeholder body so it is
   obvious to a future writer that the body has not been written. */

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const SITE = resolve(__dirname, '..');

const papers = [
  { id: 'wp-02', num: '02', tier: 'Conceptual', title: 'The Cyber Imperative',
    fr_title: "L'impératif cyber",
    subtitle: 'Fortress walls and rising tides. The cybersecurity driver, given its own dedicated treatment.',
    fr_subtitle: "Remparts et marées montantes. Le moteur cybersécurité, traité à part entière.",
    abstract: 'As legacy systems age into vendor rust-out and lose support, the fortress walls are breaking down while in parallel the sophistication of the enemy is growing. One missing board can sink the ship because all the water rushes in. This reframes the modernization conversation from eventually to now.',
    fr_abstract: "À mesure que les systèmes hérités vieillissent et perdent leur soutien, les remparts cèdent pendant que la sophistication de l'adversaire augmente. Une seule planche manquante peut couler le navire. Le sujet de la modernisation passe d'« un jour » à « maintenant ».",
    sections: [
      ['01','The fortress walls metaphor', 'La métaphore des remparts'],
      ['02','Vendor rust-out and unsupported platforms', 'Obsolescence des fournisseurs et plateformes non prises en charge'],
      ['03','Threat sophistication, plotted', "Sophistication des menaces, en graphique"],
      ['04','Why this driver gets its own paper', "Pourquoi ce moteur a son propre livre blanc"],
      ['05','From eventually to now', "D'« un jour » à « maintenant »"]
    ],
    tldr_caption_en: 'Paper 2 · Cybersecurity', tldr_caption_fr: 'Livre 2 · Cybersécurité'
  },
  { id: 'wp-03', num: '03', tier: 'Conceptual', title: 'The Wisdom of Crowds',
    fr_title: 'La sagesse des foules',
    subtitle: 'Red tape reduction through AI benchmarking of legislation, regulation, and policy across jurisdictions.',
    fr_subtitle: "Réduction de la paperasse par étalonnage automatisé des lois, règlements et politiques entre administrations.",
    abstract: 'A methodology and open-source toolset for pan-Canadian benchmarking of legislation, regulation, and policy using AI. A form of self-reflection on the proper function of government that was not previously possible.',
    fr_abstract: "Une méthodologie et un outil libre pour étalonner les lois, règlements et politiques à l'échelle pancanadienne grâce à l'IA. Une réflexion sur le fonctionnement du gouvernement qui n'était pas possible auparavant.",
    repo: 'https://github.com/alberta-velocity/wisdom-of-crowds',
    sections: [
      ['01','The benchmarking method', "La méthode d'étalonnage"],
      ['02','Outliers, duplicates, silences', 'Anomalies, doublons, silences'],
      ['03','The open-source toolset', "L'outil libre"],
      ['04','How peer jurisdictions can adopt it', "Comment les autres administrations peuvent l'adopter"]
    ],
    tldr_caption_en: 'Paper 3 · Red tape reduction', tldr_caption_fr: 'Livre 3 · Réduction de la paperasse'
  },
  { id: 'wp-04', num: '04', tier: 'Conceptual', title: 'From Vibes to Designs',
    fr_title: 'Des ambiances aux conceptions',
    subtitle: 'The pivot from problem to philosophy of solution. Why both vibe coding and rigid master plans fail.',
    fr_subtitle: "Le pivot du problème vers une philosophie de solution. Pourquoi le « vibe coding » et les plans maîtres rigides échouent tous deux.",
    abstract: 'Argues against vibe coding, where AI takes on the large share of work and humans are along for the ride, because unconstrained it just exacerbates the snowflake problem at greater speed. Argues equally against rigid hierarchical master plans, which fail through the curse of knowledge when applied to a chaotic and complex system. Sets up what the next two papers answer: there is a third way.',
    fr_abstract: "S'oppose au « vibe coding », où l'IA fait l'essentiel du travail pendant que l'humain suit, parce qu'il aggrave le problème des flocons de neige à plus grande vitesse. S'oppose aussi aux plans maîtres rigides, qui échouent par la malédiction de la connaissance dans un système chaotique. Annonce une troisième voie, développée dans les deux livres suivants.",
    sections: [
      ['01','The vibe-coding failure mode', "L'échec du vibe coding"],
      ['02','The master-plan failure mode', "L'échec du plan maître"],
      ['03','The curse of knowledge', 'La malédiction de la connaissance'],
      ['04','Toward a third way', 'Vers une troisième voie']
    ],
    tldr_caption_en: 'Paper 4 · Philosophy', tldr_caption_fr: 'Livre 4 · Philosophie'
  },
  { id: 'wp-05', num: '05', tier: 'Conceptual', title: 'Ecosystem Architecture',
    fr_title: 'Architecture en écosystème',
    subtitle: 'Forest vs lawn. Permaculture vs English garden. Architecture suited to its place.',
    fr_subtitle: "Forêt contre pelouse. Permaculture contre jardin anglais. L'architecture adaptée à son milieu.",
    abstract: 'Instead of building a single monolithic organism, curate the conditions for success. Establish not static code but dynamic systems that can function and interoperate within a set of constraints, borrowed from nature. The architectural concept being reached for is vernacular, architecture suited to its place. The human element remains in the drivers seat as the architect of comprehensive vision.',
    fr_abstract: "Plutôt que de construire un organisme monolithique unique, on cultive les conditions du succès. On établit non du code statique mais des systèmes dynamiques capables de fonctionner et d'interopérer dans un cadre de contraintes inspirées de la nature. Le concept architectural visé est vernaculaire, adapté à son milieu. L'humain reste l'architecte de la vision d'ensemble.",
    sections: [
      ['01','Forest vs English lawn', 'Forêt contre pelouse anglaise'],
      ['02','Permaculture and constraints', 'Permaculture et contraintes'],
      ['03','Fractal symmetry, vernacular detail', 'Symétrie fractale, détail vernaculaire'],
      ['04','The human remains the architect', "L'humain reste l'architecte"]
    ],
    tldr_caption_en: 'Paper 5 · Architecture', tldr_caption_fr: 'Livre 5 · Architecture'
  },
  { id: 'wp-06', num: '06', tier: 'Conceptual', title: 'Observability Without Suppressing Creative Intelligence',
    fr_title: "Observabilité sans étouffer l'intelligence créative",
    subtitle: 'How to implement sufficient control without strangling the inherent intelligence of the system.',
    fr_subtitle: "Comment exercer un contrôle suffisant sans étouffer l'intelligence du système.",
    abstract: 'If you over-constrain, the system is limited by your own intelligence. We need an environment where the cost of mistakes is mitigated, but not so mitigated that it eliminates the potential for novel solutions. Sets the philosophical groundwork that Nexus and the Velocity Game Engine operationalize.',
    fr_abstract: "Si l'on contraint trop, le système est limité par notre propre intelligence. Il faut un environnement où le coût des erreurs est atténué sans pour autant éliminer le potentiel de solutions originales. Pose le socle philosophique que Nexus et le moteur Velocity mettent en pratique.",
    sections: [
      ['01','The over-constraint failure mode', "L'échec de la contrainte excessive"],
      ['02','Mitigated but not eliminated', 'Atténué, pas éliminé'],
      ['03','Human-in-the-loop and bias', 'Humain dans la boucle et biais'],
      ['04','What Nexus and the Game Engine operationalize', 'Ce que Nexus et le moteur Velocity mettent en œuvre']
    ],
    tldr_caption_en: 'Paper 6 · Control', tldr_caption_fr: 'Livre 6 · Contrôle'
  },
  { id: 'wp-07', num: '07', tier: 'Conceptual', title: 'The Compression Problem',
    fr_title: 'Le problème de compression',
    subtitle: 'Organizational design at agentic scale. Command and control vs delegation of authority.',
    fr_subtitle: "Conception organisationnelle à l'échelle agentique. Commandement central contre délégation de l'autorité.",
    abstract: 'All systems face an inability to compress the granular into the strategic. The flawed human framing is to treat command-and-control vs delegation as an either/or. In the agentic space, agents operate tens to hundreds of times faster than humans. The correct answer is to create sufficiently autonomous, isolated societies and compete the different models against each other through Nexus, then empirically decide.',
    fr_abstract: "Tous les systèmes peinent à compresser le détail vers le stratégique. Le cadrage humain défectueux oppose commandement central et délégation comme une alternative. Dans l'espace agentique, les agents opèrent des dizaines voire des centaines de fois plus vite que les humains. La bonne réponse est de créer des sociétés autonomes isolées, de mettre les modèles en compétition via Nexus, puis de trancher empiriquement.",
    sections: [
      ['01','Compression, defined', 'La compression, définie'],
      ['02','Command and control vs delegation', 'Commandement central contre délégation'],
      ['03','Why human bias forces a false choice', 'Pourquoi le biais humain force un faux choix'],
      ['04','Parallel sandboxes, empirical comparison', 'Bacs à sable parallèles, comparaison empirique']
    ],
    tldr_caption_en: 'Paper 7 · Organization', tldr_caption_fr: 'Livre 7 · Organisation'
  },
  { id: 'wp-08', num: '08', tier: 'Technical', title: 'The Well-Built Harness',
    fr_title: 'Le harnais bien conçu',
    subtitle: 'An opinionated stack and harness for agentic development, as of May 2026.',
    fr_subtitle: "Une pile et un harnais opiniâtres pour le développement agentique, en date de mai 2026.",
    abstract: 'Walks through the standard harness, built around Claude Code as the present template, with skill files, hooks, integrations. The opinionated stack: Next.js, Node.js, Postgres, Alberta.ca themes, common architectures. An enterprise-grade Hello World that solves many of the most complex challenges along the path. Released alongside: the generic harness as a template and an Alberta.ca example harness.',
    fr_abstract: "Décrit le harnais standard, bâti autour de Claude Code, avec ses fichiers de compétences, ses hooks et ses intégrations. La pile opiniâtre : Next.js, Node.js, Postgres, thèmes Alberta.ca, architectures communes. Un Hello World de calibre entreprise qui résout une grande partie des défis du parcours. Publié en parallèle : un harnais générique comme gabarit et un exemple Alberta.ca.",
    repo: 'https://github.com/alberta-velocity/velocity-harness',
    sections: [
      ['01','What a harness is for', 'À quoi sert un harnais'],
      ['02','Skills, hooks, integrations', 'Compétences, hooks, intégrations'],
      ['03','The opinionated stack', 'La pile opiniâtre'],
      ['04','The Alberta.ca example', "L'exemple Alberta.ca"],
      ['05','As of May 2026', 'En date de mai 2026']
    ],
    tldr_caption_en: 'Paper 8 · Harness', tldr_caption_fr: 'Livre 8 · Harnais'
  },
  { id: 'wp-09', num: '09', tier: 'Technical', title: 'Git Insights: X-Ray of the Estate',
    fr_title: 'Git Insights : radiographie du patrimoine',
    subtitle: 'A custom toolset for recursive, iterative scanning of the Government of Alberta enterprise GitHub instance.',
    fr_subtitle: "Un outil sur mesure pour balayer de façon récursive et itérative l'instance GitHub d'entreprise du gouvernement de l'Alberta.",
    abstract: 'A taking-stock exercise that maps the technical estate, cybersecurity posture, and human estate. Architecture, languages, database types, CI/CD, automation, documentation; vulnerabilities and exposure; top contributors by language and ministry. Published alongside the paper: scan findings that reinforce the critical sense of urgency stated in Paper 1.',
    fr_abstract: "Un inventaire qui cartographie le patrimoine technique, la posture cybersécurité et le patrimoine humain. Architectures, langages, types de bases de données, CI/CD, automatisation, documentation ; vulnérabilités et exposition ; principaux contributeurs par langage et par ministère. Publié avec le livre blanc : les résultats du balayage qui confirment l'urgence du livre 1.",
    repo: 'https://github.com/alberta-velocity/git-insights',
    sections: [
      ['01','What the X-ray covers', 'Ce que la radiographie couvre'],
      ['02','Technical estate', 'Patrimoine technique'],
      ['03','Cybersecurity posture', 'Posture cybersécurité'],
      ['04','Human estate', 'Patrimoine humain'],
      ['05','Findings that reinforce urgency', "Résultats qui confirment l'urgence"]
    ],
    tldr_caption_en: 'Paper 9 · X-ray', tldr_caption_fr: 'Livre 9 · Radiographie'
  },
  { id: 'wp-10', num: '10', tier: 'Technical', title: 'Git Insights Ministry',
    fr_title: 'Git Insights Ministère',
    subtitle: 'From analysis to synthesis. Ministry-scale rebuild architecture from hundreds of systems at once.',
    fr_subtitle: "De l'analyse à la synthèse. Architecture de reconstruction à l'échelle d'un ministère, à partir de centaines de systèmes simultanément.",
    abstract: 'Where Paper 9 was analysis, this is synthesis. Operates at the ministry scale, not one or two or ten systems but hundreds at once. Looks for patterns of business functions, endpoints, dependencies, interactions, and interoperability, then proposes a modular, reusable, government-owned compute architecture for that ministry.',
    fr_abstract: "Là où le livre 9 était de l'analyse, celui-ci est de la synthèse. Opère à l'échelle d'un ministère, sur des centaines de systèmes à la fois. Cherche les motifs de fonctions d'affaires, d'extrémités, de dépendances, d'interactions et d'interopérabilité, puis propose une architecture de calcul modulaire et réutilisable, propriété du gouvernement.",
    repo: 'https://github.com/alberta-velocity/git-insights-ministry',
    status: 'Forthcoming',
    sections: [
      ['01','From analysis to synthesis', "De l'analyse à la synthèse"],
      ['02','Ministry-scale patterns', "Motifs à l'échelle d'un ministère"],
      ['03','Modular, reusable architecture', "Architecture modulaire et réutilisable"],
      ['04','Sequencing for actual modernization', "Séquencement de la modernisation réelle"]
    ],
    tldr_caption_en: 'Paper 10 · Synthesis', tldr_caption_fr: 'Livre 10 · Synthèse'
  },
  { id: 'wp-11', num: '11', tier: 'Technical', title: 'The Business Functions of Government',
    fr_title: "Les fonctions d'affaires du gouvernement",
    subtitle: 'What are the repeatable, codified business functions of government, as evidenced by the code that runs today?',
    fr_subtitle: "Quelles sont les fonctions d'affaires répétables et codifiées du gouvernement, selon le code qui tourne aujourd'hui ?",
    abstract: 'Extracts the actual business logic buried inside the existing code base and presents it in a system-agnostic and ministry-agnostic way. Presented visually at high level with downloadable JSON metadata for use in other tools. The artifact that reveals the commonalities hidden in all those siloed snowflake systems.',
    fr_abstract: "Extrait la logique d'affaires enfouie dans le code existant et la présente d'une façon neutre par rapport au système et au ministère. Présentation visuelle de haut niveau avec métadonnées JSON téléchargeables. L'artefact qui révèle les points communs cachés dans tous ces systèmes en flocons isolés.",
    repo: 'https://github.com/alberta-velocity/business-functions',
    status: 'Forthcoming',
    sections: [
      ['01','Extracting business logic from code', "Extraire la logique d'affaires du code"],
      ['02','System-agnostic and ministry-agnostic presentation', "Présentation neutre par rapport au système et au ministère"],
      ['03','The downloadable JSON', "Le JSON téléchargeable"],
      ['04','What the artifact reveals', "Ce que l'artefact révèle"]
    ],
    tldr_caption_en: 'Paper 11 · Business functions', tldr_caption_fr: "Livre 11 · Fonctions d'affaires"
  },
  { id: 'wp-12', num: '12', tier: 'Technical', title: 'Nexus: The Secure Agentic Sandbox',
    fr_title: 'Nexus : le bac à sable agentique sécurisé',
    subtitle: 'A virtualized safe environment for agentic operators to work without degrading security posture.',
    fr_subtitle: "Un environnement virtualisé sécuritaire où les agents peuvent travailler sans dégrader la posture de sécurité.",
    abstract: 'The operating environment built by the Government of Alberta that allows a virtualized safe environment for agentic operators to work without degrading our security posture. A secure sandbox where agents can be iterative, make mistakes, try different things, install architectures, and where the parallel-model competition described in Paper 7 actually runs.',
    fr_abstract: "L'environnement d'exploitation bâti par le gouvernement de l'Alberta qui offre un espace virtualisé sécuritaire pour les agents, sans dégrader la posture de sécurité. Un bac à sable où les agents peuvent itérer, se tromper, essayer, installer des architectures, et où la compétition parallèle de modèles décrite au livre 7 a réellement lieu.",
    repo: 'https://github.com/alberta-velocity/nexus',
    status: 'Forthcoming',
    sections: [
      ['01','Why a sandbox is needed', 'Pourquoi un bac à sable est nécessaire'],
      ['02','How Nexus isolates agents', 'Comment Nexus isole les agents'],
      ['03','Iteration, mistakes, recovery', 'Itération, erreurs, rétablissement'],
      ['04','Parallel-model competition in practice', 'Compétition parallèle de modèles en pratique']
    ],
    tldr_caption_en: 'Paper 12 · Sandbox', tldr_caption_fr: 'Livre 12 · Bac à sable'
  },
  { id: 'wp-13', num: '13', tier: 'Technical', title: 'The Velocity Game Engine',
    fr_title: 'Le moteur Velocity',
    subtitle: 'Gamification and score keeping. A project management system that replaces Jira-style tooling and uses a point-based system to observe progress.',
    fr_subtitle: "Ludification et pointage. Un système de gestion de projet qui remplace les outils de type Jira et utilise un système de points pour suivre la progression.",
    abstract: 'A reward system for progress and a penalty system for mistakes. Designed to observe hundreds of human workers and thousands of agentic workers across a backlog of over 600 themes to enhance or build at any time. Centralizes knowledge for independent audit of agents and project delivery. Includes a deliberate caution on Goodharts Law.',
    fr_abstract: "Un système de récompense pour la progression et de pénalité pour les erreurs. Conçu pour suivre des centaines de travailleurs humains et des milliers d'agents sur un arriéré de plus de 600 thèmes à toute heure. Centralise la connaissance pour permettre un audit indépendant des agents et de la livraison. Inclut une mise en garde explicite contre la loi de Goodhart.",
    repo: 'https://github.com/alberta-velocity/velocity-game-engine',
    status: 'Forthcoming',
    sections: [
      ['01','Reward and penalty', 'Récompense et pénalité'],
      ['02','Critical gates that send you backward', 'Portes critiques qui font reculer'],
      ['03','Auditing agents and humans', 'Audit des agents et des humains'],
      ['04','Goodharts Law, watched honestly', 'La loi de Goodhart, surveillée honnêtement']
    ],
    tldr_caption_en: 'Paper 13 · Measurement', tldr_caption_fr: 'Livre 13 · Mesure'
  },
  { id: 'wp-14', num: '14', tier: 'Technical', title: 'The Four Approaches: Modernization at Scale',
    fr_title: 'Les quatre approches : moderniser à grande échelle',
    subtitle: 'Patch and remediate. Drop-in replacement. Refactor and modernize. Agentic. The tactical playbook for choosing the right tool.',
    fr_subtitle: "Corriger et remédier. Remplacement direct. Refactoriser et moderniser. Approche agentique. Le manuel tactique pour choisir le bon outil.",
    abstract: 'The tactical playbook. Four approaches for applying the harnesses and tooling described in earlier papers, plus the orchestration layer that coordinates them across hundreds of agents and multiple projects at speed without chaos.',
    fr_abstract: "Le manuel tactique. Quatre approches pour appliquer les harnais et outils décrits précédemment, plus la couche d'orchestration qui les coordonne entre des centaines d'agents et plusieurs projets, à grande vitesse et sans chaos.",
    status: 'Forthcoming',
    sections: [
      ['01','Patch and Remediate', 'Corriger et remédier'],
      ['02','Drop-in Replacement', 'Remplacement direct'],
      ['03','Refactor and Modernize', 'Refactoriser et moderniser'],
      ['04','Agentic', 'Approche agentique'],
      ['05','Orchestration across approaches', "Orchestration entre les approches"]
    ],
    tldr_caption_en: 'Paper 14 · Playbook', tldr_caption_fr: 'Livre 14 · Manuel'
  },
  { id: 'wp-15', num: '15', tier: 'Policy & People', title: 'Governance for Confidence',
    fr_title: 'Gouvernance pour la confiance',
    subtitle: 'Observability for non-technical stakeholders. Frameworks that translate agentic activity into terms ministers, deputy ministers, auditors, and the public can act on.',
    fr_subtitle: "Observabilité pour parties prenantes non techniques. Cadres qui traduisent l'activité agentique en termes exploitables par les ministres, sous-ministres, vérificateurs et le public.",
    abstract: 'A practical companion to the conceptual Paper 6. How does a non-technical ministry gain confidence that what they are getting is, in fact, what they were told they would get? Frameworks for observability and reporting that translate agentic activity into terms ministers, deputy ministers, auditors, and the public can act on.',
    fr_abstract: "Un compagnon pratique du livre 6, plus conceptuel. Comment un ministère non technique peut-il avoir confiance que ce qu'il reçoit correspond bien à ce qui lui a été promis ? Cadres d'observabilité et de reddition de comptes qui traduisent l'activité agentique en termes exploitables.",
    status: 'Draft',
    sections: [
      ['01','The ministers question', 'La question du ministre'],
      ['02','Translating agentic activity', "Traduire l'activité agentique"],
      ['03','Audit and assurance', 'Audit et assurance'],
      ['04','Reporting cadence', 'Cadence des rapports']
    ],
    tldr_caption_en: 'Paper 15 · Governance', tldr_caption_fr: 'Livre 15 · Gouvernance'
  },
  { id: 'wp-16', num: '16', tier: 'Policy & People', title: 'The Future of Technology and Innovation',
    fr_title: "L'avenir de Technologie et innovation",
    subtitle: 'A policy statement on how government itself will operate differently as agents become more capable.',
    fr_subtitle: "Un énoncé de politique sur la manière dont le gouvernement lui-même fonctionnera différemment à mesure que les agents gagnent en capacité.",
    abstract: 'IT decision-making today is housed centrally within Technology and Innovation, which is solving a legacy problem. We do not want centralization to become the next legacy problem. As agents become more autonomous and capable, there is no reason a business function in any ministry could not work directly with a rule-following agent to achieve the same outcomes as any IT practitioner.',
    fr_abstract: "Les décisions TI sont aujourd'hui centralisées chez Technologie et innovation, ce qui répond à un problème hérité. Nous ne voulons pas que la centralisation devienne le prochain problème hérité. À mesure que les agents gagnent en autonomie et en capacité, il n'y a aucune raison qu'une fonction d'affaires dans n'importe quel ministère ne puisse pas travailler directement avec un agent respectant les règles pour obtenir les mêmes résultats qu'un praticien TI.",
    status: 'Draft',
    sections: [
      ['01','Why centralization was the right first answer', 'Pourquoi la centralisation était la bonne première réponse'],
      ['02','Why it cannot remain the answer', 'Pourquoi elle ne peut rester la réponse'],
      ['03','Ministry-driven, agent-enabled work', "Travail piloté par les ministères, rendu possible par les agents"],
      ['04','What this means for Technology and Innovation', "Ce que cela signifie pour Technologie et innovation"]
    ],
    tldr_caption_en: 'Paper 16 · Policy', tldr_caption_fr: 'Livre 16 · Politique'
  },
  { id: 'wp-companion-workforce', num: 'P', tier: 'Policy & People', title: 'Workforce Culture and Talent',
    fr_title: 'Culture du milieu de travail et talent',
    subtitle: 'Placeholder. Government cannot afford to be an anachronism with respect to its workplace environment.',
    fr_subtitle: "À déterminer. Le gouvernement ne peut se permettre d'être un anachronisme côté milieu de travail.",
    abstract: 'Carried forward as a possible additional paper or as material to be woven through others. Government is reasonably constrained on compensation, so to get talent, we need to meet them where their expectations are. Decision pending on standalone vs absorbed into the AI Academy or Future of T&I paper.',
    fr_abstract: "Conservé comme livre additionnel possible ou comme matériau à intégrer aux autres. Le gouvernement est raisonnablement contraint sur la rémunération, donc pour attirer les talents, il faut rejoindre leurs attentes. Décision en attente : livre autonome ou absorbé dans le livre 16.",
    status: 'Placeholder',
    sections: [
      ['01','The talent constraint', 'La contrainte du talent'],
      ['02','Meeting expectations', "Rejoindre les attentes"],
      ['03','Open structural question', "Question structurelle ouverte"]
    ],
    tldr_caption_en: 'Companion · Placeholder', tldr_caption_fr: 'Compagnon · À déterminer'
  }
];

function makeContent(p, locale) {
  const isFr = locale === 'fr';
  const title    = isFr ? (p.fr_title || p.title) : p.title;
  const subtitle = isFr ? (p.fr_subtitle || p.subtitle) : p.subtitle;
  const abstract = isFr ? (p.fr_abstract || p.abstract) : p.abstract;
  const sections = (p.sections || []).map(([n, en, fr]) => ({ n, title: isFr ? fr : en }));

  const placeholderHeading = isFr ? 'Contenu à venir' : 'Content forthcoming';
  const placeholderBody = isFr
    ? "Le contenu intégral de ce livre blanc est à venir. La structure est en place. Les sections, le résumé et les métadonnées sont alignés avec la fiche d'inventaire et la présentation TL;DR. Le corps sera rédigé à partir des transcriptions et des documents de référence, et non généré automatiquement."
    : 'The full body of this paper is forthcoming. The structure is in place. Sections, abstract, and metadata are aligned with the inventory and the TL;DR presentation. The body will be written from the source transcripts and reference documents, not auto-generated.';

  const tldrCaption = isFr ? p.tldr_caption_fr : p.tldr_caption_en;
  const tldrTitle   = isFr ? 'Le livre blanc en bref' : 'The paper, in brief';
  const audioDir = 'public/audio/' + locale + '/' + p.id + '-tldr';

  const tldr = {
    id: p.id + '-tldr',
    title: tldrTitle,
    locale,
    slides: [
      {
        id: '01',
        title,
        audio_file: audioDir + '/01.mp3',
        visual: 'title',
        caption: tldrCaption,
        subcaption: subtitle,
        text: title + '. ' + subtitle
      },
      {
        id: '02',
        title: isFr ? 'Le résumé' : 'The abstract',
        audio_file: audioDir + '/02.mp3',
        visual: 'quote',
        visual_config: {
          text: abstract.length > 280 ? abstract.slice(0, 270) + '…' : abstract,
          cite: isFr ? ('Livre ' + p.num + ' — ' + title) : ('Paper ' + p.num + ' — ' + title)
        },
        text: abstract
      },
      {
        id: '03',
        title: isFr ? 'Plan du livre blanc' : 'How the paper is laid out',
        audio_file: audioDir + '/03.mp3',
        visual: 'list',
        caption: isFr ? 'Sections' : 'Sections',
        visual_config: {
          items: sections.map(s => ({ label: '§' + s.n, desc: s.title }))
        },
        text: (isFr ? 'Plan en ' : 'A plan in ') + sections.length + (isFr ? ' sections. ' : ' sections. ')
              + sections.map(s => s.title).join('. ') + '.'
      }
    ]
  };

  return {
    id: p.id,
    num: p.num,
    sequence: p.id === 'wp-companion-workforce' ? 'TBD' : (parseInt(p.num, 10) + ' of 16'),
    tier: p.tier,
    title,
    subtitle,
    track: p.track || (isFr ? 'À placer' : 'TBD'),
    authors: isFr ? ["Ministère de la Technologie et de l'Innovation"] : ['Ministry of Technology and Innovation'],
    published: null,
    reading_min: null,
    status: p.status || 'Draft',
    tags: [],
    repo: p.repo || null,
    abstract,
    hero_image: {
      src: 'public/images/' + p.id + '/hero.jpg',
      alt: isFr ? ('Image éditoriale pour : ' + title) : ('Editorial image for: ' + title),
      prompt: 'An editorial cover image for the whitepaper titled "' + p.title + '". ' + p.subtitle + ' Muted Alberta cream palette with navy and rust accents. Archival print quality, no text, no logos.'
    },
    audio: {
      src: 'public/audio/' + locale + '/' + p.id + '.mp3',
      duration_sec: null
    },
    tldr_presentation: tldr,
    embedded_presentations: [],
    sections,
    blocks: [
      { type: 'section_heading', n: '01', title: sections[0]?.title || (isFr ? 'Introduction' : 'Introduction') },
      { type: 'paragraph', text: '<strong>' + placeholderHeading + '.</strong> ' + placeholderBody }
    ],
    _meta: {
      placeholder: true,
      written_by: 'structural-stub',
      notes: isFr
        ? "Stub structurel. Le corps doit être rédigé à partir des sources humaines (transcripts, technical-reference) — ne pas auto-générer."
        : 'Structural stub. Body to be written from human sources (transcripts, technical-reference) — do not auto-generate.'
    }
  };
}

const papersDir = resolve(SITE, 'data/papers');
mkdirSync(papersDir, { recursive: true });

let wrote = 0, skipped = 0;
for (const p of papers) {
  for (const loc of ['en', 'fr']) {
    const path = resolve(papersDir, p.id + '.' + loc + '.json');
    if (existsSync(path)) { console.log('skip ' + path); skipped++; continue; }
    writeFileSync(path, JSON.stringify(makeContent(p, loc), null, 2));
    console.log('wrote ' + path);
    wrote++;
  }
}
console.log('\nDone. ' + wrote + ' wrote, ' + skipped + ' skipped.');
