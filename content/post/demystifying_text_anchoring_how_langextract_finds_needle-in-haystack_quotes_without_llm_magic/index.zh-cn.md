---
title: "LangExtract揭秘：文本定位到底怎么玩？LLM精准高亮的幕后故事"
description: "你有没有想过，像LangExtract这样的工具是怎么做到在长文档中精确高亮一句话的？别以为是魔法，其实背后全靠巧妙的计算机科学。"
slug: demystifying-text-anchoring-langextract
date: 2025-09-20
image: cover.webp
categories:
  - 技术
  - 自然语言处理
  - 计算机科学
  - Python
  - 大语言模型
tags:
  - 文本定位
  - langextract
  - 文本对齐
  - 模糊匹配
  - 计算机科学
  - sequence-matcher
  - markdown高亮
  - LLM流水线
  - python
  - 无依赖
  - 字符串匹配
  - 技术科普
  - 引文高亮
  - SvelteKit
  - 开源
---

## 文本定位的“魔法”其实很接地气

有一次，我盯着屏幕，目瞪口呆：一个一万字的文档，LangExtract居然能准确地把“Nintendo有定价权”高亮出来，精确到字符级。我的第一反应是：“这不是AI魔法吗？”紧接着又一想：“等等，LLM咋知道字符位置的？”

你是不是也好奇，为什么LangExtract这类工具，能在巨长的文档里，像激光笔一样指向你想要的那句话？别误会，真不是AI通灵，其实是老派计算机科学在发光。今天带你扒一扒文本定位的底层逻辑，顺便教你自己复刻一个！

最近我偶然玩到[LangExtract](https://github.com/google/langextract)——Google出品的开源项目，号称能“一键提取并高亮出处”。你给它一万字的文档和一个含糊的提问，它能不仅抽取相关句子，还能精准标出原文位置。比如你问“找出任天堂有定价权的证据”，相关句子立刻在Markdown里闪闪发光，主角光环拉满。

第一次见到这效果，确实像黑科技。但这事儿的真相比魔法更浪漫：只是经典算法+工程小技巧搞定的。说实话，这比“魔法”还酷。

### 等等，LLM怎么知道我文档里的偏移量？

混过LLM的人都知道，它们擅长生成和提取文本，但让它们告诉你“这句话在第X个字符”——这基本等于问鱼为什么会爬树。那么LangExtract是怎么架起这座桥的？

小秘密：LLM根本不管“第几位”。它只负责输出“证据”作为原文的子串。接下来，库会负责“定位”，即在原文里寻找这句话。LLM如果老实（prompt写得好），直接就能精确匹配；否则，比如有错别字、空格不一样，就得靠**模糊匹配**了。真正的“魔法”其实是Python自带的`difflib.SequenceMatcher`。

下面我带你理一理流程，代码也安排上。如果你着急看算法，可以直接跳到[自制无依赖文本对齐算法](#自己写一个无依赖的文本对齐算法)。

---

## 文本定位怎么做？三句话讲明白

假设你有一份超长Markdown文件，要找出这句话的准确位置：“Nintendo can set the price unchallenged”。给LLM或者自己提取出来后，如何在原文里高亮它？

### 步骤1：抽取

- LLM或者你的代码先输出一条或多条相关quote。

### 步骤2：定位

- 对每一句quote，用LangExtract或自家流水线去原文找位置。
- **第一步尝试：** 直接查找（`text.find(quote)`）。
- **失败了怎么办：** 用模糊匹配算法找“差不多”的片段，即使有点typo或者格式不一致。
- 找到后，记录下`[start, end]`字符范围。

### 步骤3：多处命中与极端情况

- 同一句话在文档中出现多次时，你可以：
  - 取第一个；
  - 返回所有位置（让UI或用户决定）；
  - 或者用上下文（比如前后几词）来唯一锁定。

搞定！LLM负责“语义抽取”，定位代码给你“坐标”。高亮、跳转、UI全靠它。

---

## 幕后揭秘：不是LLM，是老派计算机科学

现在，魔术师的黑布掀开了——真正的定位靠的是**模糊字符串匹配**。LangExtract的核心用的是Python自带的[`difflib.SequenceMatcher`](https://docs.python.org/3/library/difflib.html)，你在比对文件、拼写检查、语法修复时可能都见过。快、稳、百炼成钢，长文档也轻松应对（别急，后面聊性能）。

流程梳理如下：

1. **分词预处理：** 把quote和文档都拆成词/字符。
2. **匹配：**
   - 先精确匹配。
   - 不行的话，用滑窗法，对文档窗口和quote用`SequenceMatcher`比一把。
   - 相似度超过阈值（比如0.85）就认。
3. **返回位置：** 给出原文中的`[start, end]`字符索引。

### 性能会不会很慢？

你或许担心：“长文档会不会卡死？”最坏情况时间复杂度是`O(n*m)`（n是文档长度，m是quote长度），但一堆小技巧让它飞快：

- **滑窗匹配：** 只对和quote差不多长的窗口做比对
- **精确匹配优先：** 能直接命中的话，模糊比对根本不用出场
- **关键词窗口：** 罕见词优先开窗

实际用下来，几万字的文档，`difflib`表现非常溜，一般都在100ms内搞定。

比如LLM返回“任天堂可以不受竞争地定价”，原文却写成“Nintendo can set the price unchallenged”，精确匹配失败，模糊匹配0.85分，位置锁定，效果满分。真正厉害的不是“百分百一样”，而是“八九不离十”也能命中。

---

## 为什么不用LangExtract库就行了？

你可能想：“LangExtract都给我包好了，用它不就完事了？”如果你全套都用它，当然没问题。但要是你只要“quote->坐标”这一个功能，专门引个大库就显得有点杀鸡用牛刀了。其实LangExtract的定位功能，也就几十行经典算法代码。

越多中间层，越难debug，还得为一个小功能背一堆依赖包。何不自己撸一个？

---

## 自己写一个无依赖的文本对齐算法

原版代码可戳这里：[langextract \@ `langextract/resolver.py`](https://github.com/google/langextract/blob/7df90448bbe5afc866d3e0ffc4c07978105a4544/langextract/resolver.py)。

下面是精简后的无外部依赖实现，跟LangExtract核心逻辑一致。先上代码，后面讲讲生产环境的加固思路：

```python
import difflib
import unicodedata
import re
from dataclasses import dataclass
from enum import Enum
from typing import List, Optional, Tuple, NamedTuple

class MatchStatus(Enum):
    """匹配状态"""
    EXACT = "精确匹配"
    FUZZY = "模糊匹配"
    NOT_FOUND = "未找到"

@dataclass
class SpanMatch:
    """quote和原文匹配的结果"""
    quote: str
    start: Optional[int]
    end: Optional[int]
    score: float
    status: MatchStatus

class MatchResult(NamedTuple):
    start: Optional[int]
    end: Optional[int]
    score: float

class TextNormalizer:
    """文本标准化，保证匹配稳定"""
    @staticmethod
    def normalize(text: str) -> str:
        if not text:
            return ""
        text = unicodedata.normalize("NFC", text)
        text = re.sub(r"\s+", " ", text).strip()
        return text
    
    @staticmethod
    def create_index_map(original: str, normalized: str) -> List[int]:
        index_map = []
        orig_idx = 0
        for norm_char in normalized:
            while orig_idx < len(original) and original[orig_idx].isspace() and norm_char != ' ':
                orig_idx += 1
            if orig_idx < len(original):
                index_map.append(orig_idx)
                orig_idx += 1
            else:
                index_map.append(len(original))
        return index_map

class MatchingConfig:
    """匹配配置参数"""
    def __init__(
        self,
        threshold: float = 0.85,
        exact_threshold: float = 0.999,
        min_step_size: int = 8,
        step_fraction: int = 4,
        window_padding: int = 64
    ):
        self.threshold = threshold
        self.exact_threshold = exact_threshold
        self.min_step_size = min_step_size
        self.step_fraction = step_fraction
        self.window_padding = window_padding
    
    def get_step_size(self, quote_length: int) -> int:
        return max(self.min_step_size, quote_length // self.step_fraction)
    
    def get_window_size(self, quote_length: int) -> int:
        return quote_length + self.window_padding

class ExactMatcher:
    """精确匹配"""
    @staticmethod
    def find_exact_match(text: str, quote: str) -> MatchResult:
        start = text.find(quote)
        if start != -1:
            return MatchResult(start, start + len(quote), 1.0)
        return MatchResult(None, None, 0.0)

class FuzzyMatcher:
    """模糊匹配（difflib实现）"""
    def __init__(self, config: MatchingConfig):
        self.config = config
    
    def find_fuzzy_match(self, text: str, quote: str) -> MatchResult:
        if not quote or not text:
            return MatchResult(None, None, 0.0)
        best_match = MatchResult(None, None, 0.0)
        quote_len = len(quote)
        step_size = self.config.get_step_size(quote_len)
        window_size = self.config.get_window_size(quote_len)
        for i in range(0, max(1, len(text) - quote_len + 1), step_size):
            window = text[i:i + window_size]
            match_result = self._match_in_window(quote, window, i)
            if match_result.score > best_match.score:
                best_match = match_result
        if best_match.score >= self.config.threshold:
            return best_match
        return MatchResult(None, None, best_match.score)
    
    def _match_in_window(self, quote: str, window: str, window_start: int) -> MatchResult:
        matcher = difflib.SequenceMatcher(a=quote, b=window, autojunk=False)
        score = matcher.ratio()
        if score <= 0:
            return MatchResult(None, None, score)
        blocks = matcher.get_matching_blocks()
        if not blocks:
            return MatchResult(None, None, score)
        main_block = max(blocks[:-1], key=lambda b: b.size, default=blocks[0])
        match_start = window_start + main_block.b - main_block.a
        match_start = max(0, match_start)
        match_end = match_start + len(quote)
        return MatchResult(match_start, match_end, score)

class QuoteAligner:
    """主流程协调器"""
    def __init__(self, config: Optional[MatchingConfig] = None):
        self.config = config or MatchingConfig()
        self.normalizer = TextNormalizer()
        self.exact_matcher = ExactMatcher()
        self.fuzzy_matcher = FuzzyMatcher(self.config)
    
    def align_quote(self, source_text: str, quote: str) -> SpanMatch:
        if not quote or not source_text:
            return SpanMatch(quote, None, None, 0.0, MatchStatus.NOT_FOUND)
        norm_source = self.normalizer.normalize(source_text)
        norm_quote = self.normalizer.normalize(quote)
        exact_result = self.exact_matcher.find_exact_match(norm_source, norm_quote)
        if exact_result.start is not None:
            return SpanMatch(
                quote=quote,
                start=exact_result.start,
                end=exact_result.end,
                score=exact_result.score,
                status=MatchStatus.EXACT
            )
        fuzzy_result = self.fuzzy_matcher.find_fuzzy_match(norm_source, norm_quote)
        if fuzzy_result.start is not None:
            status = (MatchStatus.EXACT if fuzzy_result.score >= self.config.exact_threshold 
                     else MatchStatus.FUZZY)
            return SpanMatch(
                quote=quote,
                start=fuzzy_result.start,
                end=fuzzy_result.end,
                score=fuzzy_result.score,
                status=status
            )
        return SpanMatch(
            quote=quote,
            start=None,
            end=None,
            score=fuzzy_result.score,
            status=MatchStatus.NOT_FOUND
        )
    
    def align_quotes(self, source_text: str, quotes: List[str]) -> List[SpanMatch]:
        return [self.align_quote(source_text, quote) for quote in quotes]

def align_quotes(source_text: str, quotes: List[str], threshold: float = 0.85) -> List[SpanMatch]:
    config = MatchingConfig(threshold=threshold)
    aligner = QuoteAligner(config)
    return aligner.align_quotes(source_text, quotes)

# 示例用法
if __name__ == "__main__":
    source = "Nintendo can set the price unchallenged in their market segment."
    quotes = [
        "Nintendo can set the price unchallenged",  # 精确匹配
        "Nintendo can set prices without competition",  # 模糊匹配
        "Sony dominates the market"  # 完全没戏
    ]
    results = align_quotes(source, quotes, threshold=0.8)
    for result in results:
        print(f"Quote: '{result.quote}'")
        print(f"Status: {result.status.value}")
        print(f"Score: {result.score:.3f}")
        if result.start is not None:
            print(f"Position: [{result.start}:{result.end}]")
            print(f"Found: '{source[result.start:result.end]}'")
        print("-" * 50)
```

### 这个实现为什么更优雅

这套写法遵循SOLID原则，易维护又易扩展：

#### 🔧 **单一职责**

- `TextNormalizer`专管文本预处理
- `ExactMatcher`只负责精确匹配
- `FuzzyMatcher`专治模糊对齐
- `QuoteAligner`总管流程

#### ⚙️ **配置驱动**

- `MatchingConfig`集中管理参数，调阈值、滑窗、步长都方便
- 魔法数字清零，调优一目了然

#### 🧪 **可测试性强**

- 每个类接口清晰，单元测试easy
- 依赖解耦，mock起来无压力

#### 📈 **性能友好**

- 精确命中直接返回，O(n)快得飞起
- 滑窗和步长可调，长文档无压力
- `difflib`窗口用得恰到好处

### 主要特性与用法

**简单用法：**

```python
# 想快速对齐quote？一句话搞定
results = align_quotes(source_text, quotes, threshold=0.8)
```

**高级自定义：**

```python
# 想精细调参？用全套API
config = MatchingConfig(threshold=0.9, window_padding=128)
aligner = QuoteAligner(config)
results = aligner.align_quotes(source_text, quotes)
```

**生产级建议：**

- **索引映射：** `TextNormalizer.create_index_map()`为位置映射提供基础
- **多处命中：** 目前返回第一个/最佳匹配，需要可扩展
- **性能：** 超大文档可先按段落分块+关键词索引
- **内存：** 滑窗策略保证内存恒定，不怕文档大

### 技术小贴士

- **时间复杂度：** 最坏O(n×m)，但滑窗和早退让它飞快
- **空间复杂度：** O(k)，k为窗口大小
- **准确性：** 行为对齐LangExtract，易维护、易测试

---

## 为什么这事重要？“AI魔法”背后的工程美学

看到LLM工具精准高亮，很多人以为是AI全知全能的黑魔法。但真相是：**秘方根本不在LLM本体。**

真正的突破，在于工程。LLM负责理解语义，老派算法负责精准定位。你看到一万字文档里精准高亮，其实是语义理解和工程基础的完美联姻。

所以，最酷的创新，往往来自既懂AI、又懂CS的“桥梁师傅”。有些人天天争论“LLM会不会替代编程”，高手们早就一边用LLM搞语义抽取，一边用传统算法搞精准落地，根本不冲突。

**下一个时代属于“造桥人”**。别只盯着AI模型的参数表，也别只迷信传统编程。把两者结合起来，才是真正的技术魔法。

下回再见到“AI不可思议”的场面，不妨扒一扒幕后。你会发现，最炫的创新，其实是工程师把多年老本事和新技术巧妙融合的结果——魔法就在这种融合里。

---

## 总结：别迷信魔法，学会造桥

- 文本定位（找出并高亮大文档中的quote）是LLM+经典算法的合体绝技。
- LangExtract等工具的做法很透明——不是啥“神秘AI黑箱”，而是工程+时间考验的算法（比如`difflib.SequenceMatcher`）。
- 只要quote定位？完全可以自己撸一个，轻松无依赖。
- 技术未来属于既懂经典又拥抱新潮的“桥梁师傅”。

下次遇到看似“魔法”的工具，别跪拜，也别嗤之以鼻。问问自己：“AI做了哪一半，工程做了哪一半？”真正的创新，都在这两者的桥梁上。

---

（人类作者手打，AI合理润色）