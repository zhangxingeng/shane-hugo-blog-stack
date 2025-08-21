{{- if eq .Layout "thinkdifferent" -}}

# {{ .Title }}

This page is not available in markdown format.

Visit the full page at: {{ .Permalink }}
{{- else -}}

# {{ .Title }}

{{ .RawContent }}
{{- end -}}
