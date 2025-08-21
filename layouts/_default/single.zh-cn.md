{{- if eq .Layout "thinkdifferent" -}}

# {{ .Title }}

此页面不支持markdown格式。

访问完整页面：{{ .Permalink }}
{{- else -}}

# {{ .Title }}

{{ .RawContent }}
{{- end -}} 