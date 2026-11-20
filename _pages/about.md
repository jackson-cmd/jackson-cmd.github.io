---
permalink: /
title: "About"
author_profile: true
redirect_from:
  - /about/
  - /about.html
---

I am a Ph.D. student in Computer Science at [Texas A&M University](https://www.tamu.edu/), advised by [Prof. Nitesh Saxena](https://engineering.tamu.edu/cse/profiles/saxena-nitesh.html) in the [SPIES Lab](https://spies.engr.tamu.edu/).

My research focuses on the security of **LLM agents that act with real authority**: agents that delete files, move money, and place trades on behalf of their users. I work on three kinds of agents:

- **Rogue AI agents.** Coding and assistant agents keep making the news for deleting production databases or sending money nobody approved, often with no attacker involved. [ROGUE-AI](/publication/2026-11-rogue-ai) rebuilds reported agent incidents offline, each next to a control without the blamed cause, to test what actually went wrong and which defenses stop it.
- **Trading agents.** LLM trading agents read the same news feeds and copy the same few published designs, so one fake headline can push many of them into the same trade at once. I study how fabricated news steers them ([Fake News, Real Crashes](/publication/2026-10-fake-news-real-crashes)) and how academic trading agents fail under market stress and attack ([Trading Agents or Market Crashers?](/publication/2026-09-trading-agents-market-crashers)).
- **Options-trading agents.** Agents now place options orders at retail brokers, where a wrong strike or expiry can mean unbounded loss. [Unbounded Losses, Unchecked Inputs](/publication/2026-10-options-trading-agents) measures which safeguards these agents actually enforce.

Across all three, I look at the whole agent rather than only its model (the harness, tools, skills, and memory), study attacks such as prompt injection, indirect prompt injection, and memory poisoning, and build defenses that hold once agents are deployed.

Before Texas A&M, I earned my M.S. in Electrical and Computer Engineering from [Carnegie Mellon University](https://www.cmu.edu/), where I worked in [CyLab](https://www.cylab.cmu.edu/) on TypeScript taint analysis and vulnerability discovery across the npm ecosystem. I completed my B.A. in Computer Science with a Minor in Statistics at the [University of Minnesota, Twin Cities](https://twin-cities.umn.edu/).

Background
======
Alongside my security research, I specialize in options: pricing models, strategy analysis, 0DTE options arbitrage, and automated quantitative trading. I am a Certified Futures and Options Analyst (CFOA), having **earned a perfect score on the exam** and received special congratulations from the organizers.

I build and run a fully automated trading agent designed around robustness and security from the ground up. Running on a real-time Benzinga news feed, it has repeatedly entered positions **about 15 minutes before the news reached mainstream outlets** and profited as the market caught up. The agent is private, but I am happy to share the ideas behind it: in historical backtests, asymmetric spread strategies that **keep losses small and let gains run** have generated excess returns. I have also built a four-leg options strategy designed to profit from event volatility and the implied volatility (IV) crush that follows.

As Warren Buffett put it, "you only find out who is swimming naked when the tide goes out." In a bull market everyone looks like a genius; lasting profits come only from managing risk through bear markets and extreme events. That is why **risk control comes first and profit second**, and why **closing a position is always better than hedging it**. I hold LLM agents to the same standard: robustness and security matter most when conditions turn adversarial.

**The market is a random walk; controlling risk and staying alive is your only alpha.**
