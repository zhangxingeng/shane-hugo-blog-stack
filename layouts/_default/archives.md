# {{ .Title }}

## Categories

{{- $taxonomy := $.Site.GetPage "taxonomyTerm" "categories" -}}
{{- $terms := $taxonomy.Pages -}}
{{ if $terms }}
{{ range $terms }}

- [{{ .Title }}]({{ .RelPermalink }})
{{ end }}
{{ else }}
No categories found.
{{ end }}

## Posts by Year

{{ $pages := where .Site.RegularPages "Type" "in" .Site.Params.mainSections }}
{{ $notHidden := where .Site.RegularPages "Params.hidden" "!=" true }}
{{ $filtered := ($pages | intersect $notHidden) }}

{{ range $filtered.GroupByDate "2006" }}

### {{ .Key }}

{{ range .Pages }}

- {{ .Date.Format "2006-01-02" }} | [{{ .Title }}]({{ .RelPermalink }})
{{ end }}
{{ end }}
