{{- $baseURL := .Site.BaseURL -}}
# {{ .Site.Title }}

> {{ .Site.Params.sidebar.subtitle }}
>
> 本博客提供中英双语版本。对于每篇文章，您可以在URL后添加`index.md`或`llms.txt`来获取纯文本的markdown版本，可作为LLM调用的上下文。

您可以在[关于页面]({{ $baseURL }}page/about/index.md)找到更多作者信息。

## 最新文章

{{- $posts := where .Site.RegularPages "Section" "post" -}}
{{- $recentPosts := first 10 $posts -}}
{{- range $recentPosts }}

- [{{ .Title }}]({{ $baseURL }}{{ .RelPermalink }}index.md) - {{ .Summary | plainify | truncate 100 }}
{{- end }}

## 分类目录

{{- range .Site.Taxonomies.categories.ByCount }}

- [{{ .Name | title }}]({{ $baseURL }}categories/{{ .Name | urlize }}/index.md)（{{ .Count }}篇{{ if eq .Count 1 }}文章{{ else }}文章{{ end }}）
{{- end }}

## 技术专长领域

{{- $allTags := .Site.Taxonomies.tags.ByCount -}}
{{- $topTags := first 15 $allTags -}}
{{- range $topTags }}

- **{{ .Name | title }}**（{{ .Count }}篇{{ if eq .Count 1 }}文章{{ else }}文章{{ end }}）
{{- end }}

## 归档

按年份整理的所有文章：[归档]({{ $baseURL }}page/archives/index.md)

---

*最后更新：{{ now.Format "2006年1月2日" }}*
*文章总数：{{ len $posts }}篇*

访问主站：{{ .Site.BaseURL }}
