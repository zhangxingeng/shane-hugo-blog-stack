# {{ .Site.Title }}

> {{ .Site.Params.sidebar.subtitle }}
>
> This blog is available in both English and Mandarin Chinese. For every post, you can add `index.md` or `llms.txt` to the URL to get a markdown version in plain text that you can use as context for calls to LLMs.

You can find [more information about the author on the about page](/page/about/index.md).

## Recent Posts

{{- $posts := where .Site.RegularPages "Section" "post" -}}
{{- $recentPosts := first 10 $posts -}}
{{- range $recentPosts }}

- [{{ .Title }}]({{ .RelPermalink }}index.md) - {{ .Summary | plainify | truncate 100 }}
{{- end }}

## Categories

{{- range .Site.Taxonomies.categories.ByCount }}

- [{{ .Name | title }}](/categories/{{ .Name | urlize }}/index.md) ({{ .Count }} {{ if eq .Count 1 }}post{{ else }}posts{{ end }})
{{- end }}

## Technical Focus Areas

{{- $allTags := .Site.Taxonomies.tags.ByCount -}}
{{- $topTags := first 15 $allTags -}}
{{- range $topTags }}

- **{{ .Name | title }}** ({{ .Count }} {{ if eq .Count 1 }}post{{ else }}posts{{ end }})
{{- end }}

## Archive

All posts organized by year: [Archive](/page/archives/index.md)

---

*Last updated: {{ now.Format "January 2, 2006" }}*
*Total posts: {{ len $posts }}*

Visit the main site at: {{ .Site.BaseURL }}
