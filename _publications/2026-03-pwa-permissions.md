---
title: "Demystifying Progressive Web Application Permission Systems"
collection: publications
category: conferences
permalink: /publication/2026-03-pwa-permissions
date: 2026-06-01
last_modified_at: 2026-11-20
venue: '56th IEEE/IFIP International Conference on Dependable Systems and Networks (DSN)'
conference: '2026 56th Annual IEEE/IFIP International Conference on Dependable Systems and Networks (DSN)'
authors: ['Mengxiao Wang', 'Jianwei Huang', 'Guofei Gu']
doi: '10.1109/DSN69566.2026.00030'
firstpage: '173'
lastpage: '184'
arxiv: '2509.13563'
paperurl: 'https://doi.org/10.1109/DSN69566.2026.00030'
pdfurl: 'https://arxiv.org/pdf/2509.13563'
keywords: 'Progressive Web Apps, PWA, browser permissions, web security, permission systems'
excerpt: 'A measurement and analysis of the permission systems Progressive Web Applications inherit from the browser and add on top of it, and how the two layers interact in practice.'
citation: 'Mengxiao Wang, Jianwei Huang, and Guofei Gu. (2026). &quot;Demystifying Progressive Web Application Permission Systems.&quot; <i>Proc. of the 56th IEEE/IFIP International Conference on Dependable Systems and Networks (DSN)</i>.'
bibtex: |
  @inproceedings{wang2026demystifying,
    title     = {Demystifying Progressive Web Application Permission Systems},
    author    = {Wang, Mengxiao and Huang, Jianwei and Gu, Guofei},
    booktitle = {2026 56th Annual IEEE/IFIP International Conference on Dependable Systems and Networks (DSN)},
    pages     = {173--184},
    year      = {2026},
    doi       = {10.1109/DSN69566.2026.00030}
  }
---
Progressive Web Applications (PWAs) blend the advantages of web and native apps, offering features like offline access, push notifications, and installability. Beyond these, modern PWAs are increasingly granted system-level capabilities such as auto-start on login and shared context with native applications. However, their permission management remains poorly defined and inconsistently implemented across platforms and browsers. To investigate these gaps, we developed Permissioner, a cross-platform analysis tool, and conducted a systematic study of PWA permissions. Our analysis uncovered critical issues of inconsistency, incompleteness, and unclear boundaries in permission enforcement, leading to various attacks including permission leakage, device identification, and Permission API abuse. We further examined why some browsers resist adopting more granular permission controls, identifying trade-offs involving usability, compatibility, and platform limitations. Through collaboration with browser vendors, several issues reported in our findings were acknowledged and resolved, notably by Firefox and Chrome. Our work highlights the urgent need for a unified, robust permission model for PWAs and provides actionable guidance toward achieving this goal.
