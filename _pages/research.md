---
permalink: /research/
title: "Research"
author_profile: true
---

My research is on the **security of large language model (LLM) agents in high-stakes domains**. High-stakes here means settings where a wrong output has irreversible cost — money moved on a market, a permission granted to malicious code, a user tricked into signing away funds. In those settings, the standard "safety" evaluation of an LLM is not enough: the agent is embedded in a system, and the attacker gets to touch the seams.

I work along three threads.

LLM Agent Attacks in Financial Trading
======
Autonomous LLM trading agents are being deployed on live and simulated markets faster than their failure modes are being catalogued. I study how targeted attacks — prompt injection, jailbreak, prompt leaking — carry over from the general LLM setting into trading, and how they compose with market microstructure to produce coordinated harm. Current work in this area:

* A systematization of the robustness and security failures reported across academic financial LLM trading schemes.
* Information-injection attacks against networks of trading agents, where the goal is to steer aggregate market behavior rather than break any single agent.

Defenses for LLM Agents
======
Building attack surface maps is only useful if it leads to defenses that hold up under adversarial pressure. I work on detection and mitigation of prompt injection that is grounded in *semantic intent* rather than surface pattern-matching, and on filter designs that can be layered without collapsing an agent&apos;s utility.

Emerging Systems Security
======
I also work on measurement and vulnerability studies of systems where LLMs are not (yet) the story:

* Progressive Web Application permission systems and their divergence from browser permission models.
* Homograph and homoglyph attacks against decentralized naming systems (Ethereum Name Service).
* TypeScript taint analysis at ecosystem scale (npm), which produced 30+ CVEs during my time at CMU CyLab.
