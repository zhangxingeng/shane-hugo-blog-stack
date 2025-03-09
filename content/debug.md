---
title: "Debug File Paths"
layout: "page"
---

## Site Resources

{{ range .Site.Resources }}

* Resource: {{ .RelPermalink }} ({{ .ResourceType }})
{{ end }}

## Page Resources

{{ range .Resources }}

* Page Resource: {{ .RelPermalink }} ({{ .ResourceType }})
{{ end }}

## All Pages

{{ range .Site.AllPages }}

* Page: {{ .RelPermalink }}
{{ end }}
