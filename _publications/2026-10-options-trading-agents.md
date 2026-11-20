---
title: "Unbounded Losses, Unchecked Inputs: Measuring the Safeguards of LLM Options-Trading Agents"
collection: publications
category: preprints
permalink: /publication/2026-10-options-trading-agents
date: 2026-10-16
last_modified_at: 2026-11-20
venue: 'arXiv:2610.24289'
authors: ['Mengxiao Wang', 'Nitesh Saxena']
arxiv: '2610.24289'
paperurl: 'https://arxiv.org/abs/2610.24289'
pdfurl: 'https://arxiv.org/pdf/2610.24289'
keywords: 'LLM agents, options trading, trading agents, agent security, measurement, pre-trade risk limits'
excerpt: 'The first measurement of the LLM options-trading agents that brokers and developers ship. Of 26 systems scored on 18 safeguards, 13 can reach unbounded loss and none authenticates its text sources or cross-checks market data.'
citation: 'Mengxiao Wang and Nitesh Saxena. (2026). &quot;Unbounded Losses, Unchecked Inputs: Measuring the Safeguards of LLM Options-Trading Agents.&quot; <i>arXiv preprint arXiv:2610.24289</i>.'
bibtex: |
  @misc{wang2026unboundedlossesuncheckedinputs,
    title         = {Unbounded Losses, Unchecked Inputs: Measuring the Safeguards of {LLM} Options-Trading Agents},
    author        = {Wang, Mengxiao and Saxena, Nitesh},
    year          = {2026},
    eprint        = {2610.24289},
    archivePrefix = {arXiv},
    primaryClass  = {cs.CR},
    url           = {https://arxiv.org/abs/2610.24289}
  }
---
Large language model (LLM) agents now place options orders at retail brokers, and developers publish open-source options agents faster than anyone has examined them. Prior security work on trading agents scored academic equities designs by whether an attacker can flip a buy-or-sell decision. We present the first measurement of the options agents that brokers and developers ship, scored by the safeguards they enforce and by the worst loss their documented order paths can reach. We screened 765 GitHub repositories, broker documentation, and the research literature and found 215 eligible repositories and 8 broker-native agent interfaces. We then scored 26 systems, including every broker interface and every open-source project with at least 20 stars, on seven robustness and eleven security safeguards with cell-level evidence. The ecosystem is new: 198 of the 215 repositories were created in 2026, and 129 (60.0%) appeared in the two weeks around one options-trading hackathon. Of the 22 systems that can place orders, 10 enforce a pre-trade limit outside the model, yet none of the 26 authenticate their text sources or cross-check market data. Of the 26, 17 can execute with no mandatory human step and 13 can reach unbounded loss, including 6 of the 8 broker interfaces. Because an attacker who writes the agent's inputs can move an order's strike, expiry, volatility, and legs while its direction stays correct, options agents need loss limits enforced at the order boundary.
