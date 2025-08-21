---
title: "{{ replace .Name "-" " " | title }}"
image: 
style:
    background: "#2a9d8f"
    color: "#fff"
---

## Posts in "{{ replace .Name "-" " " | title }}" category

{{< posts-by-category "{{ .Name }}" >}}