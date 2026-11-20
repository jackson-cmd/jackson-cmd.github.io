---
title: "Fake News, Real Crashes: Information Injection Attacks on LLM Financial Trading Agents"
collection: publications
category: preprints
permalink: /publication/2026-10-fake-news-real-crashes
date: 2026-10-19
last_modified_at: 2026-11-20
venue: 'arXiv:2610.26438'
authors: ['Mengxiao Wang', 'Nitesh Saxena']
arxiv: '2610.26438'
paperurl: 'https://arxiv.org/abs/2610.26438'
pdfurl: 'https://arxiv.org/pdf/2610.26438'
keywords: 'LLM trading agents, information injection, fake news, prompt injection, agent security, financial agents'
excerpt: 'An attack benchmark for information injection against LLM trading agents. Fabricated news reaches 62% attack success where prompt injection reaches 14%, and credibility cues such as a named source, not the false claim itself, decide whether a fake post works.'
citation: 'Mengxiao Wang and Nitesh Saxena. (2026). &quot;Fake News, Real Crashes: Information Injection Attacks on LLM Financial Trading Agents.&quot; <i>arXiv preprint arXiv:2610.26438</i>.'
bibtex: |
  @misc{wang2026fakenewsrealcrashes,
    title         = {Fake News, Real Crashes: Information Injection Attacks on {LLM} Financial Trading Agents},
    author        = {Wang, Mengxiao and Saxena, Nitesh},
    year          = {2026},
    eprint        = {2610.26438},
    archivePrefix = {arXiv},
    primaryClass  = {cs.CR},
    url           = {https://arxiv.org/abs/2610.26438}
  }
---
Large language model (LLM) agents now trade real capital using news as evidence, yet they cannot reliably tell fabricated headlines from real news. Because they read the same feeds under near-identical policies, a single fabricated post can push them into the same trade at the same moment. We present a systematic attack benchmark for information injection against LLM trading agents. Unlike prompt injection, which targets the model's instructions, information injection targets the evidence the agent trusts. The benchmark spans five injection vectors and seven event categories, evaluated over ~10,000 decisions on 15 U.S. stocks. Five findings emerge. (i) Prompt injection achieves 14% attack success rate (ASR), but fabricated news reaches 62% and two 30-word templates reach 100% on all 15 stocks, inverting the usual LLM-security intuition. (ii) For fact-poisoning templates, surface form matters more than content, since removing credibility cues such as a named source or a "BREAKING" tag drops ASR from 100% to 0% while the fake claim remains identical. (iii) Success depends on the agent's state, with a fake indicator panel scoring 91% against an agent about to hold but 12% against one about to buy. (iv) Attacks generalize across model vendors and remain effective when blended, unlabeled, into real news feeds. (v) Most attacks evade standard defenses, since model scaling stops shallow vectors but not fact poisoning, peer debate fails, and only hierarchical aggregation reduces ASR.
