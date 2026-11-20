---
title: "PromptSleuth: Detecting Prompt Injection via Semantic Intent Invariance"
collection: publications
category: preprints
permalink: /publication/2025-08-promptsleuth
date: 2025-08-28
last_modified_at: 2026-11-20
venue: 'arXiv:2508.20890'
authors: ['Mengxiao Wang', 'Yuxuan Zhang', 'Guofei Gu']
arxiv: '2508.20890'
paperurl: 'https://arxiv.org/abs/2508.20890'
pdfurl: 'https://arxiv.org/pdf/2508.20890'
keywords: 'prompt injection, LLM security, prompt injection detection, LLM agents, benchmark'
excerpt: 'A detector for prompt-injection attacks that reasons about the semantic intent of the input rather than matching surface patterns. Intent-invariant checks stay robust when attackers paraphrase, encode, or reorder the injected instruction.'
citation: 'Mengxiao Wang, Yuxuan Zhang, and Guofei Gu. (2025). &quot;PromptSleuth: Detecting Prompt Injection via Semantic Intent Invariance.&quot; <i>arXiv preprint arXiv:2508.20890</i>.'
bibtex: |
  @misc{wang2025promptsleuth,
    title         = {{PromptSleuth}: Detecting Prompt Injection via Semantic Intent Invariance},
    author        = {Wang, Mengxiao and Zhang, Yuxuan and Gu, Guofei},
    year          = {2025},
    eprint        = {2508.20890},
    archivePrefix = {arXiv},
    primaryClass  = {cs.CR},
    url           = {https://arxiv.org/abs/2508.20890}
  }
---
Large Language Models (LLMs) are increasingly integrated into real-world applications, from virtual assistants to autonomous agents. However, their flexibility also introduces new attack vectors-particularly Prompt Injection (PI), where adversaries manipulate model behavior through crafted inputs. As attackers continuously evolve with paraphrased, obfuscated, and even multi-task injection strategies, existing benchmarks are no longer sufficient to capture the full spectrum of emerging threats. To address this gap, we construct a new benchmark that systematically extends prior efforts. Our benchmark subsumes the two widely-used existing ones while introducing new manipulation techniques and multi-task scenarios, thereby providing a more comprehensive evaluation setting. We find that existing defenses, though effective on their original benchmarks, show clear weaknesses under our benchmark, underscoring the need for more robust solutions. Our key insight is that while attack forms may vary, the adversary's intent-injecting an unauthorized task-remains invariant. Building on this observation, we propose PromptSleuth, a semantic-oriented defense framework that detects prompt injection by reasoning over task-level intent rather than surface features. Evaluated across state-of-the-art benchmarks, PromptSleuth consistently outperforms existing defense while maintaining comparable runtime and cost efficiency. These results demonstrate that intent-based semantic reasoning offers a robust, efficient, and generalizable strategy for defending LLMs against evolving prompt injection threats.
