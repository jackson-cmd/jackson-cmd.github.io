---
permalink: /research/
title: "Research"
author_profile: false
---

My research is on **agentic security in high-stakes domains**, where LLM agents act with real authority and a single wrong action can cause irreversible harm. Agents now delete files, send payments, and place trades on behalf of their users, and I study how they fail, with or without an attacker, and what keeps them safe once they are deployed.

A modern agent is more than its model: a harness wraps the model with prompts, tools, skills, and memory, and runs an agentic loop that plans, acts, and consumes untrusted inputs at every step. I study attacks across this stack (prompt injection, indirect prompt injection, prompt leaking, jailbreak, and memory poisoning) and defenses that hold in real systems. My current work covers three kinds of agents.

## Rogue AI Agents

News media regularly report AI agents going rogue, for example Replit's coding agent deleting a production database. A report usually says what went wrong but rarely confirms the incident or finds its root cause. Incident catalogs collect these reports and benchmarks record whether agents fail, yet neither replicates an incident or tests the cause its report blames.

[*ROGUE-AI*](/publication/2026-11-rogue-ai) closes this gap. It is a multi-agent framework that rebuilds each reported incident offline together with a matched control that lacks only the blamed cause, and then runs agents on both. ROGUE-AI reproduces the reported harm in 89% of its 108 attempted replications. Agents built on five current GPT, Claude, Gemini, and DeepSeek models made the reported mistake in 18% to 33% of runs, against at most 1% without the blamed cause. Most of the harm needed no attacker: of the 72 incidents with real-world harm, 62 had none, and the agents simply did what their task asked while missing an ordinary hazard, such as a database shared with the live site. Defenses against prompt injection look for injected instructions, and these replications contain none. What did help was a warning after each tool output that names the hazard and its consequence, which lowered harm for all five models. Because the replications come from real incidents, vendors can rerun them before each new release.

## LLM Trading Agents

LLM agents already trade real capital using news as evidence. Builders copy a few published designs that share models and news feeds, so one shock can reach many agents at once.

In [*Fake News, Real Crashes*](/publication/2026-10-fake-news-real-crashes), I study information injection: instead of attacking the model's instructions, the attacker plants false evidence in the news the agent trusts. Across about 10,000 decisions on 15 U.S. stocks, fabricated news reached a 62% attack success rate where prompt injection reached 14%, and two 30-word templates succeeded on all 15 stocks. For fact-poisoning posts, the form mattered more than the content: removing credibility cues such as a named source or a "BREAKING" tag dropped success from 100% to 0% while the false claim stayed the same. Model scaling stopped the shallow attacks but not fake facts, peer debate between agents did not help, and only hierarchical aggregation reduced success.

In [*Trading Agents or Market Crashers?*](/publication/2026-09-trading-agents-market-crashers), I rate 15 academic trading-agent designs on robustness to market stress and on security against source manipulation, agent compromise, and agents acting as attackers, and check the ratings against released code. None of the 7 code releases enforces a stop-loss or position limit outside the LLM. Three LLMs sold whole positions on a fake headline and on real hoaxes, including the fake press release behind the 2000 Emulex crash. In a simulated market driven by these decisions, one fake headline crashed the market in every run with 400 agents. The pause that U.S. exchanges apply to large stocks started in no headline run, whereas automatic halts and hard loss limits outside the model removed the crash.

## Options-Trading Agents

LLM agents now place options orders at retail brokers, and developers publish open-source options agents faster than anyone has examined them. With options, an attacker does not need to flip a buy into a sell: whoever writes the agent's inputs can move an order's strike, expiry, or legs while its direction stays correct, so checking the direction alone is not enough.

[*Unbounded Losses, Unchecked Inputs*](/publication/2026-10-options-trading-agents) is the first measurement of the options agents that brokers and developers ship. I screened 765 GitHub repositories, broker documentation, and the research literature, and scored 26 systems, including every broker-native agent interface and every open-source project with at least 20 stars, on 18 robustness and security safeguards. The ecosystem is new: 198 of the 215 eligible repositories were created in 2026. Of the 22 systems that can place orders, only 10 enforce a pre-trade limit outside the model, and none of the 26 authenticate their text sources or cross-check market data. Thirteen systems, including 6 of the 8 broker interfaces, can reach unbounded loss. Options agents therefore need loss limits enforced at the order boundary, not inside the model.

## A Common Thread

The three lines of work point to the same lesson. Agents fail on ordinary inputs, not only on clever attacks, and the protections that work, or that the measurements call for, sit around the model rather than inside it: hazard warnings in the harness, halts and loss limits outside the LLM, and checks at the point where an order or a destructive action leaves the agent.

## Earlier Work

Before agents, I worked on web and browser security and on prompt injection: the permission systems of Progressive Web Apps ([DSN 2026](/publication/2026-03-pwa-permissions)), securing the PWA installation lifecycle ([*GuardianPWA*](/publication/2025-09-guardian-pwa)), homoglyph attacks that exploit inconsistent ENS name normalization ([WWW 2025](/publication/2025-05-ens-normalization)), and detecting prompt injection by the intent of the injected task ([*PromptSleuth*](/publication/2025-08-promptsleuth)). The full list is on the [Publications](/publications/) page.
