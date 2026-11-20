---
title: "GuardianPWA: Enhancing Security Throughout the Progressive Web App Installation Lifecycle"
collection: publications
category: preprints
permalink: /publication/2025-09-guardian-pwa
date: 2025-09-16
last_modified_at: 2026-11-20
venue: 'arXiv:2509.13561'
authors: ['Mengxiao Wang', 'Guofei Gu']
arxiv: '2509.13561'
paperurl: 'https://arxiv.org/abs/2509.13561'
pdfurl: 'https://arxiv.org/pdf/2509.13561'
keywords: 'Progressive Web Apps, PWA installation, browser security, web security, manifest analysis'
excerpt: 'A defense that follows a Progressive Web App from install prompt through installation and runtime, closing gaps where a hostile PWA can slip privileges past the user or between browser and OS.'
citation: 'Mengxiao Wang and Guofei Gu. (2025). &quot;GuardianPWA: Enhancing Security Throughout the Progressive Web App Installation Lifecycle.&quot; <i>arXiv preprint arXiv:2509.13561</i>.'
bibtex: |
  @misc{wang2025guardianpwa,
    title         = {{GuardianPWA}: Enhancing Security Throughout the Progressive Web App Installation Lifecycle},
    author        = {Wang, Mengxiao and Gu, Guofei},
    year          = {2025},
    eprint        = {2509.13561},
    archivePrefix = {arXiv},
    primaryClass  = {cs.CR},
    url           = {https://arxiv.org/abs/2509.13561}
  }
---
Progressive Web App (PWA) installation is critical for integrating web and mobile app functionalities, offering a seamless user experience. However, ensuring the security of the PWA installation lifecycle is essential for maintaining user trust and privacy. This paper introduces the GUARDIANPWA framework, a comprehensive approach to analyzing the PWA installation mechanism based on the CIA security principles (Confidentiality, Integrity, and Availability) and identifying areas where browser vendors fail to comply with these principles. Our study revealed 203 instances of non-compliance with security principles, highlighting how these irregularities in the PWA installation lifecycle can lead to potential violations of user privacy. For instance, in Firefox, PWAs installed in private mode incorrectly appear in normal mode, risking user confidentiality. Additionally, 29,465 PWAs are at risk because Samsung Internet does not display origins when PWAs navigate to third-party websites, undermining integrity. These findings were reported to browser vendors, leading to Firefox acknowledging four issues, resolving one, and planning to resolve two others. GUARDIANPWA supports developers by analyzing PWA manifest files for syntactic and semantic correctness, offering actionable recommendations, and helping to create PWAs that align with security best practices. By using GUARDIANPWA, developers and users can address critical security gaps and enhance compliance with CIA principles throughout the PWA installation lifecycle.
