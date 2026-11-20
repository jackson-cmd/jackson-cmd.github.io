---
title: "Trading Agents or Market Crashers? Dissecting Robustness and Security Failures in Academic Financial LLM Trading Schemes"
collection: publications
category: preprints
permalink: /publication/2026-09-trading-agents-market-crashers
redirect_from:
  - /publication/2026-09-sok-trading-agents
date: 2026-09-17
last_modified_at: 2026-11-20
venue: 'arXiv:2609.19705'
authors: ['Mengxiao Wang', 'Nitesh Saxena']
arxiv: '2609.19705'
paperurl: 'https://arxiv.org/abs/2609.19705'
pdfurl: 'https://arxiv.org/pdf/2609.19705'
hfurl: 'https://huggingface.co/papers/2609.19705'
keywords: 'LLM trading agents, financial agents, agent security, flash crash, market manipulation, fake news'
excerpt: 'FARSIGHT rates 15 academic LLM trading agents on robustness to market stress and security against source manipulation, and checks the ratings against released code. In a simulated market driven by their decisions, one fake headline crashes the market in every run with 400 agents.'
citation: 'Mengxiao Wang and Nitesh Saxena. (2026). &quot;Trading Agents or Market Crashers? Dissecting Robustness and Security Failures in Academic Financial LLM Trading Schemes.&quot; <i>arXiv preprint arXiv:2609.19705</i>.'
bibtex: |
  @misc{wang2026tradingagentsmarketcrashers,
    title         = {Trading Agents or Market Crashers? Dissecting Robustness and Security Failures in Academic Financial {LLM} Trading Schemes},
    author        = {Wang, Mengxiao and Saxena, Nitesh},
    year          = {2026},
    eprint        = {2609.19705},
    archivePrefix = {arXiv},
    primaryClass  = {cs.CR},
    url           = {https://arxiv.org/abs/2609.19705}
  }
---
Large language model (LLM) agents already trade real capital, and builders copy a few published designs that share models and news feeds, so one shock reaches many agents at once. We present FARSIGHT (Financial Agent Robustness and Security Investigation and Global Holistic Taxonomy), a systematization that rates trading agents on robustness to market stress and on security against source manipulation, agent compromise, and agents acting as attackers, and checks the ratings against released code. Across 15 academic schemes, no paper describes a halt that skips LLM inference or combines source provenance with cross-source corroboration, and the 7 code releases enforce no stop-loss or position limit outside the LLM. Three LLMs sell whole positions on a fake headline and on real hoaxes, including the fake press release behind the 2000 Emulex crash. In a simulated market driven by these decisions, one fake headline crashes the market in all runs with 400 agents, and 400 agents that sell when prices fall nearly double a 2010-sized crash. The pause that U.S. exchanges apply to large stocks starts in no headline run, whereas automatic halts and hard loss limits outside the model remove both effects. Restated as a domain-independent threat model, FARSIGHT maps the same gaps onto agents in healthcare, law, software, and crypto, where compromised agents spread harm as worms and as cascades. We derive 14 open problems and urge deployers to corroborate sources, keep interrupts that bypass the model, and enforce loss limits outside it.
