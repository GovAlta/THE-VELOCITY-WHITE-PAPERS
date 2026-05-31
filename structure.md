The Velocity White Papers — Foundational Structure
A living, open-source collection from the Government of Alberta on how to transform four years of IT technical debt into a modern government in four years.

Purpose of This Document
This is the structural foundation for the Velocity White Papers site — an inventory of the papers, their recommended reading sequence, their tier (Conceptual / Technical / Policy & People), the GitHub repositories released alongside them, and the cross-cutting elements that make the site itself function as a platform rather than a document.
The collection sits at 16 papers with one placeholder. Conceptual papers establish the why and the philosophy. Technical papers are the playbook — the actual tools, measurements, and frameworks to execute. Policy & People papers make it real for government and for the workforce.

Reading Pathways

Sequential reading is the recommended path — each paper builds on what comes before.
Each paper links laterally to the other relevant papers so readers can jump ahead or sideways without losing context.
A lightweight cookie tracks which papers a reader has visited, surfaces what's new since their last visit, and flags unread sections.
Papers are downloadable as both Markdown and JSON so readers can feed them into their own AI tooling.
The full site is published via GitHub Pages and is itself open source — the entire site can be cloned and adapted.


Tier 1 — The Conceptual Foundation (the Why)
Paper 1 — The Two-Billion-Dollar Ship of Theseus
Tag: Conceptual · Sequence: 1 of 16 · GitHub repo: —
The introductory paper. Lays out why this is at least a two-billion-dollar problem — and credibly much higher when you consider that a single ERP system alone runs roughly a billion, and individual transportation, health, or mainframe modernizations each clear $100M.
Core argument: code and infrastructure have been built by more than 8,000 GitHub committers across many languages, many database types, on cloud and on prem, over an extended period. Each application was built down to a specific set of business users. There is no consistency between them. They have never been built with a unifying overall vision. This lack of vision has fragmented government's ability to operate as a single organization. Each system is a snowflake; each ministry has been a silo.
The realization isn't new — predecessors saw this and formed Technology and Innovation as the centralizing response. But centralization of code is a first step, not a solution. The patterns of development haven't changed. The complexity has surpassed human ability to overcome through traditional project-based approaches. No amount of money or time, in isolation, is credible to unpack this. You cannot stop the proper functioning of government simply to redesign it.
We are left with the Ship of Theseus — replacing one plank at a time over generations and hoping the ship maintains its proper bearing.
This paper introduces the four critical drivers that anchor the rest of the collection:

Cost (woven throughout)
Service delivery (woven throughout)
Cybersecurity (Paper 2)
Red tape reduction (Paper 3)


Paper 2 — The Cyber Imperative: Fortress Walls and Rising Tides
Tag: Conceptual · Sequence: 2 of 16 · GitHub repo: —
The cybersecurity driver, given its own dedicated treatment. As legacy systems age into vendor rust-out and lose support, the fortress walls are breaking down — while in parallel the sophistication of the enemy is growing.
Returning to the ship analogy: one missing board can sink the ship because all the water rushes in. You need a tight ship with no small amount of bailing out to keep it dry and afloat as it continues on its journey.
This reframes the modernization conversation from eventually to now. It is not just about efficiency or capability — it is critical infrastructure defense.

Paper 3 — The Wisdom of Crowds: Red Tape Reduction Through AI Benchmarking
Tag: Conceptual · Sequence: 3 of 16 · GitHub repo: ✅ (open source comparison tooling)
A methodology and an open-source toolset for pan-Canadian benchmarking of legislation, regulation, and policy using artificial intelligence — a form of self-reflection on the proper function of government that was not previously possible.
Allows a government to compare its statutes against peer jurisdictions and identify where it is an outlier, where it is duplicative, where it is silent. The accompanying repository lets other governments do the same.

Paper 4 — From Vibes to Designs
Tag: Conceptual · Sequence: 4 of 16 · GitHub repo: —
The pivot paper. Moves the reader from problem to philosophy of solution.
Argues against vibe coding — where AI takes on the large share of work and humans are along for the ride. Left unconstrained, this just exacerbates the snowflake problem at greater speed.
But equally argues against the opposite failure mode: applying our legacy understanding of rigid, hierarchical, monolithic, master-plan architecture to a chaotic and complex system. This is the curse of knowledge — try to put a systemic view on a complex system and the edge cases kill you. You end up creating another snowflake monster, unable to address the situations you are actually dealing with, out of date or inconsistent in its implementation.
Important fairness: this is not a revisionist takedown of past work. Those were very smart people working over an extended period to build what was needed at the day. In that mass of code, there is genius baked in that a monolithic, static, hierarchical master plan will fail to capture.
The paper sets up what the next two papers answer: there is a third way.

Paper 5 — Ecosystem Architecture: Forest vs Lawn
Tag: Conceptual · Sequence: 5 of 16 · GitHub repo: —
The architectural philosophy paper. Instead of building a single monolithic organism, curate the conditions for success. Establish not static code but dynamic systems that can function and interoperate within a set of constraints — borrowed, for argument's sake, from nature.
Core analogies:

Forest vs English lawn. A forest has logic, hierarchy, and structure but is unique and specific to its context. An English lawn resists the nature of its organic participants — the grass, the trees, the birds — and forces them into a rigid hierarchy. It has beauty, but it does not leverage what the tree wants to be, what the grass wants to be.
Permaculture vs English garden.
Capitalist adaptive vs communist master plan. The story of a colleague who grew up under communism: you could drive an hour to the next identical master-planned town, walk to the same door on the same street, and use the same key. We must avoid that.
Fractal symmetry. Overarching visual coherence at the macro level, but as you zoom in, fractal-level detail unique to context — not dead and empty copies.

The architectural concept being reached for is vernacular — architecture suited to its place.
Strong claim: the human element remains strictly in the driver's seat as the architect of comprehensive vision. If we leave design decisions to an AI model with limited context and no overarching design, we will perpetuate the exact problem we are trying to solve.
We are living in the wreckage — in the bones — of decisions made forty years ago. The ghost of former decisions is part of the technical debt we have accrued. The architecture we build now must be resilient to the next cabinet decision, not destroyed by it.

Paper 6 — Observability and Control Without Suppressing Creative Intelligence
Tag: Conceptual · Sequence: 6 of 16 · GitHub repo: —
How do you implement sufficient control to be confident the system is doing what it is intended to do — without strangling the inherent intelligence and creativity of the system?
If you over-constrain, the system is limited by your own intelligence. As we move into AGI-like or ASI-like capability, we should expect the machine to be in many ways superior, if not in raw intelligence then at least in its persistence on how it solves problems. To let it operate at its potential, we need an environment where the cost of mistakes is mitigated — but not so mitigated that it eliminates the potential for novel solutions.
Government often falls into this trap through procurement: we believe we understand the problem so well that we are just seeking an implementer, while industry may have a superior approach we never considered. If we are overly prescriptive in how, we become the jailers of our own mind.
Human-in-the-loop is paramount — but it is also where bias enters. Our human bias made the broken system. We should expect that a different kind of intelligent solution will be needed to ensure this does not happen again.
This paper sets the philosophical groundwork that Nexus (Paper 11) and Velocity Game Engine (Paper 12) operationalize.

Paper 7 — The Compression Problem: Organizational Design at Agentic Scale
Tag: Conceptual · Sequence: 7 of 16 · GitHub repo: —
All systems face an inability to compress the granular into the strategic. At the human level there are always a thousand things going on. For leaders — human or agentic — to make decisions, tactical information must be compressed into thematic heuristic metadata, examined with enough detail to drive insightful decisions that solve numerous instances at once, then deployed back down into the operating environment, with the impact observed.
Two organizational archetypes:

Command and control — a central digital chief architect as the key meta-level decision maker.
Delegation of authority — agents at every level with enough of the picture to make autonomous decisions and justify them through documentation and architecture.

The flawed human framing is to treat this as an either/or. The opportunity cost of choosing wrong would paralyze a traditional organization. But in the agentic space, agents operate tens to hundreds of times faster than humans. The correct answer is to create sufficiently autonomous, isolated societies — and compete the different models against each other through Nexus, then empirically decide.
In traditional government, rebuilding an enterprise system takes years of planning and you get one shot. Failure is an embarrassing fiasco. That paradigm no longer applies. Through Nexus we can parallelize, and on Monday morning observe which model was most effective — without leaning into human bias for or against centralization.
The truth is often in the middle. A hybrid model with an overarching philosophical framework guiding decision-making, paired with local autonomy, is likely the best solution — and reflects how human governments already layer decision-making across provincial, municipal, and program levels. Vision meeting local insight, accelerated by speed.
A small aside in the paper: fans of simulation theory may find some parallel in the conceptual framework around running competing realities to find optimal outcomes. That is a topic for a different paper.
A note of caution: in our drive to have sufficient governance on AI, we must be careful that the governance itself is not ardently steeped in human bias.

Tier 2 — The Technical Playbook (the How)
Paper 8 — The Well-Built Harness
Tag: Technical · Sequence: 8 of 16 · GitHub repo: ✅ (generic harness + Alberta.ca example harness)
The first technical paper, opening with an explicit acknowledgement: this is a point in time as of May 2026. Assumptions and methods will continue to change as foundational frontier models change, as our skill in using them grows, and as the situations we encounter call for different tools.
Walks through the standard harness — built around Claude Code as the present template — with skill files, hooks, integrations. The opinionated stack: Next.js, Node.js, Postgres, Alberta.ca themes, common architectures. Functions as an enterprise-grade Hello World that solves a great number of the most complex challenges along the path.
The point is the pattern, not the harness. Not whether the harness is complete for all edge cases — whether it is a starting point that prevents the human from re-explaining itself, and creates a rational space with infinite permeability and creativity while constraining enough to enable a conversation of quality.
Released alongside the paper: the generic harness as a template and an Alberta.ca example harness as an adaptation reference.

Paper 9 — Git Insights: X-Ray of the Estate
Tag: Technical · Sequence: 9 of 16 · GitHub repo: ✅
A custom toolset using Claude Code-style agents to orchestrate, paired with SDK-driven sub-agents for recursive, iterative scanning of the Government of Alberta enterprise GitHub instance.
A taking-stock exercise that maps:

Technical estate — architecture, languages, database types, CI/CD, automation, documentation
Cybersecurity posture — vulnerabilities, exposure
Human estate — who is contributing, top contributors by language, deepest domain knowledge by ministry, who is participating most significantly

Published alongside the paper: scan findings that reinforce the critical sense of urgency stated in Paper 1, and the necessity of modernization at speed — hence velocity.

Paper 10 — Git Insights Ministry: From Analysis to Synthesis
Tag: Technical · Sequence: 10 of 16 · GitHub repo: ✅
The companion product to Git Insights. Where Paper 9 was analysis — cracks and structure — this one is synthesis.
Operates at the ministry scale, not one or two or ten systems, but hundreds at once. Looks for the patterns of business functions, endpoints, dependencies, interactions, and interoperability — then proposes a modular, reusable, government-owned compute architecture for that ministry.
The output is the conceptual rebuild architecture from which actual modernization can be sequenced.

Paper 11 — The Business Functions of Government
Tag: Technical · Sequence: 11 of 16 · GitHub repo: ✅ (downloadable JSON)
Extracts the actual business logic buried inside the existing code base and presents it in a system-agnostic and ministry-agnostic way. What are the repeatable, codified business functions of government, as evidenced by the code that runs today?
Presented visually at high level, with downloadable JSON metadata for use in other tools. Presented as a subset, not a comprehensive piece — a solid foundation for understanding and a demonstration of what the tool signifies.
This is the artifact that reveals the commonalities hidden in all those siloed snowflake systems.

Paper 12 — Nexus: The Secure Agentic Sandbox
Tag: Technical · Sequence: 12 of 16 · GitHub repo: ✅
The operating environment built by the Government of Alberta that allows a virtualized safe environment for agentic operators to work without degrading our security posture.
A secure sandbox where agents can be iterative, make mistakes, try different things, install architectures, and where the parallel-model competition described in Paper 7 actually runs. The paper describes how Nexus works, why it was built, the gap it fills, and how it enables the emergent intelligence of AGI or AGI-like systems to take on problems beyond any individual human engineer.

Paper 13 — Gamification and Score Keeping: The Velocity Game Engine
Tag: Technical · Sequence: 13 of 16 · GitHub repo: ✅
The Velocity Game Engine — a project management system that replaces Jira-style tooling and uses a point-based system for humans to observe progress across hundreds of critical projects being implemented by AI.

Reward system for progress.
Penalty system for mistakes — if you fail to achieve critical gates (user acceptance, cybersecurity acceptance, etc.), you slide back and lose points.
Designed to observe hundreds of human workers and thousands of agentic workers across a backlog of over 600 themes to enhance or build at any time.
Centralizes knowledge for independent audit of agents and project delivery.

Without measurement there can be no true insight. With a system of measurement, you can finally ask: why did this agent work over that one? Why is this model better than the other? Why is this human more proficient at AI use than that one?
Includes a deliberate caution on Goodhart's Law — as soon as a metric becomes a target, it ceases to be a good measure. The paper will articulate the discipline required to keep velocity metrics honest and tied to outcomes that matter, not activity for its own sake.

Paper 14 — The Four Approaches: Modernization at Scale
Tag: Technical · Sequence: 14 of 16 · GitHub repo: —
The tactical playbook. Four approaches for applying the harnesses and tooling described in earlier papers:

Patch and Remediate — existing technological assets.
Drop-in Replacement — use an opinionated stack (as in the harness) to create like-for-like replacements with minimal change impact.
Refactor and Modernize — consolidate hundreds of disparate systems into a modular, reusable government-scale architecture.
Agentic — de-emphasize the common application pattern and the front-end/UX, move to an agent-driven system.

The paper helps teams choose the right tool for the right situation.
This paper also incorporates orchestration — how the four approaches are operationally coordinated across hundreds of agents, multiple projects, and the various harnesses at speed, without chaos.

Note: orchestration could alternatively be split into its own short paper if the operational depth warrants it. Flagging as a structural decision.


Paper 15 — Governance for Confidence: Observability for Non-Technical Stakeholders
Tag: Policy & People · Sequence: 15 of 16 · GitHub repo: —
A practical companion to the conceptual Paper 6. How does a non-technical ministry gain confidence that what they are getting is, in fact, what they were told they would get?
Frameworks for observability and reporting that translate agentic activity into terms ministers, deputy ministers, auditors, and the public can act on.

Paper 16 — The Future of Technology and Innovation
Tag: Policy & People · Sequence: 16 of 16 · GitHub repo: — · Co-author: Minister Nate Glubish
The closing policy paper. IT decision-making today is housed centrally within Technology and Innovation — which is solving a legacy problem. We do not want centralization to become the next legacy problem.
As agents become more autonomous and capable of following the opinionated rules and frameworks laid out across this collection, there is no reason a business function in any ministry could not work directly with a rule-following agent to achieve the same outcomes as any IT practitioner — because the work is being done by agents. Why stymie the ability of a ministry to implement meaningful technical change because of organizational rigidity?
This paper makes that future explicit. It is a policy statement about how government itself will operate differently.

Companion Paper — Workforce Culture & Talent (Placeholder)
Tag: TBD · Sequence: TBD · GitHub repo: —
Carried forward from the conversation as a possible additional paper or as material to be woven through others.
The argument: government cannot afford to be an anachronism with respect to its workplace environment, or it will fail to attract the best talent. Government is reasonably constrained on compensation — so to get talent, we need to meet them where their expectations are. If people use the latest tools and technologies in their everyday lives, they will expect similar standards from their employer.
Decision pending: standalone paper, or absorbed into the AI Academy / Future of T&I papers.

Cross-Cutting Site Elements
These are not papers but they are part of the foundation. The site is a platform, not a document.
Open Source & Repositories

The site itself is open source, published via GitHub Pages. The entire site is cloneable and adaptable.
MIT license with explicit disclaimers: not responsible for decisions or costs incurred by adopters; shared in the spirit of national collaboration; users must evaluate and assess these tools in their own context.
No vendor or product is being advocated. For transparency, any vendors or models actually used in production will be disclosed.
Public repositories released alongside papers:

The Wisdom of Crowds — legislative comparison tooling (Paper 3)
The Well-Built Harness — generic + Alberta.ca example (Paper 8)
Git Insights (Paper 9)
Git Insights Ministry (Paper 10)
Business Functions of Government — system-agnostic JSON (Paper 11)
Nexus (Paper 12)
Velocity Game Engine (Paper 13)



Bilingual

All content translated into French via AI to engage nationally across Canada.

Downloadable Formats

Every paper downloadable as Markdown and JSON for feeding into other AI tooling.
Full site cloneable from GitHub.

Interactive & Multimedia

Rich interactive simulations baked into the papers — bot orchestration visualizations, observation dashboards, animated diagrams.
AI-generated imagery (OpenAI image models for current leading quality).
Text-to-speech audio narration of each paper.
JavaScript-based animations for in-content interactive visualizations.
Transparency principle: be explicit about which content is AI-generated vs human-authored vs real data.

Living Updates

Update section for new findings, new code, new evidence over the four-year cycle.
Cookie-based tracking of which papers a reader has visited, surfacing new content since last visit.
Glossary / Knowledge Base for the topics introduced across the collection.

Community

Velocity Discord (or equivalent) as an open forum for change makers — a feedback channel and a place for the modernization conversation to happen.
Public feedback mechanism on the site.


Summary Inventory
#TitleTierRepo1The Two-Billion-Dollar Ship of TheseusConceptual—2The Cyber Imperative: Fortress Walls and Rising TidesConceptual—3The Wisdom of CrowdsConceptual✅4From Vibes to DesignsConceptual—5Ecosystem Architecture: Forest vs LawnConceptual—6Observability and Control Without SuppressionConceptual—7The Compression ProblemConceptual—8The Well-Built HarnessTechnical✅9Git Insights: X-Ray of the EstateTechnical✅10Git Insights Ministry: From Analysis to SynthesisTechnical✅11The Business Functions of GovernmentTechnical✅12Nexus: The Secure Agentic SandboxTechnical✅13Gamification and Score Keeping: The Velocity Game EngineTechnical✅14The Four Approaches: Modernization at ScaleTechnical—15Governance for ConfidencePolicy & People—16The Future of Technology and InnovationPolicy & People——Workforce Culture & Talent (placeholder)TBD—
Count: 16 papers, 1 placeholder, 7 GitHub repositories.

Open Structural Decisions

Orchestration — currently absorbed into Paper 14. If operational depth warrants it, split into its own short technical paper (would push collection to 17).
Workforce Culture — standalone paper, or woven into AI Academy / Future of T&I? Decision pending.
Alberta AI Academy — referenced in conversation as already having a dedicated paper. If treated as a Velocity paper rather than a separate program document, would slot before Paper 15 and push collection to 17.
Reading sequence within tiers — confirm the Conceptual sequence (1 → 7) lands correctly: Problem → Cyber → Red Tape → Vibes vs Master Plan → Ecosystem → Observability → Compression. Alternate sequence could place Observability before Ecosystem Architecture.
