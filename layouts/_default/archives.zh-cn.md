# {{ .Title }}

## 分类

{{- $taxonomy := $.Site.GetPage "taxonomyTerm" "categories" -}}
{{- $terms := $taxonomy.Pages -}}
{{ if $terms }}
{{ range $terms }}

- [{{ .Title }}]({{ .RelPermalink }})
{{ end }}
{{ else }}
未找到分类。
{{ end }}

## 按年份分组的文章

{{ $pages := where .Site.RegularPages "Type" "in" .Site.Params.mainSections }}
{{ $notHidden := where .Site.RegularPages "Params.hidden" "!=" true }}
{{ $filtered := ($pages | intersect $notHidden) }}

{{ range $filtered.GroupByDate "2006" }}

### {{ .Key }}

{{ range .Pages }}

- {{ .Date.Format "2006-01-02" }} | [{{ .Title }}]({{ .RelPermalink }})
{{ end }}
{{ end }}
