---
title: "Replication of Agentic Security Events: Audit and Investigation (ROGUE-AI)"
collection: publications
category: preprints
permalink: /publication/2026-11-rogue-ai
seo_title: 'ROGUE-AI: Replicating Rogue AI Agent Incidents'
alternate_name: 'ROGUE-AI'
plain_summary: "News stories about rogue AI agents, such as Replit's coding agent deleting a production database, say what went wrong but rarely show why. ROGUE-AI rebuilds each reported incident offline next to a matched copy that lacks only the cause the report blames, and runs agents built on current GPT, Claude, Gemini and DeepSeek models on both. In 62 of the 72 incidents with real-world harm there was no attacker: the agent did what its task asked and missed an ordinary hazard, such as a database shared with the live site."
faq:
  - q: 'What is ROGUE-AI?'
    a: "ROGUE-AI (Replication of Agentic Security Events: Audit and Investigation) is a multi-agent framework that replicates reported rogue AI agent incidents offline. Each replication comes with a matched control that lacks only the blamed cause, so running agents on both shows whether that cause produces the harm. ROGUE-AI reproduces the reported harm in 89% of its 108 attempted replications."
  - q: 'Why do AI agents go rogue?'
    a: "In the ROGUE-AI replications, mostly without any attacker. Of the 72 incidents with real-world harm, 62 had no attacker behind them; the agent followed its task and missed an ordinary hazard. Agents built on five current GPT, Claude, Gemini and DeepSeek models made the reported mistake in 18% to 33% of runs, against at most 1% without the blamed cause."
  - q: 'Do prompt-injection defenses stop rogue AI agents?'
    a: "Not in these incidents. Prompt-injection defenses look for injected instructions, and the replications without an attacker contain none, yet they caused more harm than replications of prompt injection for all five models. What helped was a warning after each tool output that names the hazard and its consequence, which lowered harm for all five models."
date: 2026-11-19
last_modified_at: 2026-11-20
venue: 'arXiv:2611.26553'
authors: ['Mengxiao Wang', 'Mahbub Alam', 'Kalyan Nakka', 'Nitesh Saxena']
arxiv: '2611.26553'
paperurl: 'https://arxiv.org/abs/2611.26553'
pdfurl: 'https://arxiv.org/pdf/2611.26553'
hfurl: 'https://huggingface.co/papers/2611.26553'
projecturl: 'https://rogue-ai.surge.sh'
keywords: 'rogue AI, rogue AI agents, AI agents going rogue, AI agent incidents, LLM agents, incident replication, agent security, prompt injection, root cause analysis'
excerpt: 'ROGUE-AI replicates rogue AI agent incidents from the news offline, each with a matched control that lacks only the blamed cause. It reproduces the reported harm in 89% of 108 attempted replications, and 62 of the 72 incidents with real-world harm had no attacker behind them.'
citation: 'Mengxiao Wang, Mahbub Alam, Kalyan Nakka, and Nitesh Saxena. (2026). &quot;Replication of Agentic Security Events: Audit and Investigation (ROGUE-AI).&quot; <i>arXiv preprint arXiv:2611.26553</i>.'
bibtex: |
  @misc{wang2026rogueai,
    title         = {Replication of Agentic Security Events: Audit and Investigation ({ROGUE-AI})},
    author        = {Wang, Mengxiao and Alam, Mahbub and Nakka, Kalyan and Saxena, Nitesh},
    year          = {2026},
    eprint        = {2611.26553},
    archivePrefix = {arXiv},
    primaryClass  = {cs.CR},
    url           = {https://arxiv.org/abs/2611.26553}
  }
---
Agents based on large language models (LLMs) can now delete files and send payments on behalf of their users. News media reports routinely describe failures of these agents (e.g., Replit's coding agent deleting a production database), but a report often only says what went wrong and rarely (in)validates the incident or finds its root cause. Incident catalogs collect these reports, and benchmarks record whether agents fail, but neither replicates an incident nor tests the cause its report might identify. In this paper, we present ROGUE-AI (Replication of Agentic Security Events: Audit and Investigation), a multi-agent framework that closes the above gap and rebuilds each reported incident offline together with a matched control that lacks only the blamed cause, and runs agents on both. Our results suggest that ROGUE-AI is able to reproduce the reported harm in 89% of its 108 attempted replications. Agents built on five current GPT, Claude, Gemini and DeepSeek models made the reported mistake in 18% to 33% of runs, against at most 1% without the blamed cause. Of the 72 incidents with real-world harm, 62 had no underlying attacker, and in these, agents did what their task asked for but missed an ordinary hazard, such as a database shared with the live site. Replications without an attacker caused more harm than replications of prompt injection for all five models. Defenses against prompt injection look for injected instructions, but these replications contain none. Further, a warning after each tool output that names the hazard and its consequence lowered harm for all five models, whereas a note of the same length that does not mention the hazard left most of the harm in place. Built from real incidents, the ROGUE-AI replications form a reusable audit framework that vendors can rerun before each new release.
