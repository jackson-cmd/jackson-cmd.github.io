---
permalink: /talks/
title: "Talks"
author_profile: false
published: false
description: "Talks by Mengxiao Wang on the security of LLM agents and LLM trading agents, with slides and video recordings."
---

<link rel="stylesheet" href="{{ '/assets/css/sitepages.css' | relative_url }}">

<p class="sp-lead">Talks with slides and, where the venue recorded them, videos.</p>

<table class="sp-table">
  <thead><tr><th>Date</th><th>Talk</th><th>Links</th></tr></thead>
  <tbody>
  {% for t in site.data.talks %}
    <tr>
      <td class="num">{{ t.date | date: "%b %Y" }}</td>
      <td><strong>{{ t.title }}</strong><br><span>{{ t.event }}{% if t.location %}, {{ t.location }}{% endif %}</span></td>
      <td class="sp-meta">{% if t.slides %}<a href="{{ t.slides | relative_url }}">Slides</a>{% endif %}{% if t.video %}<a href="{{ t.video }}">Video</a>{% endif %}{% if t.paper %}<a href="{{ t.paper | relative_url }}">Paper</a>{% endif %}</td>
    </tr>
  {% endfor %}
  </tbody>
</table>
