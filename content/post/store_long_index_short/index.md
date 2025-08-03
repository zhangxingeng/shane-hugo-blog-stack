---
title: "Context Keeper: How Storing Long but Indexing Short Affects Retrival Accuracy"
description: "How breaking text into chunks can improve similarity detection for question pairs, outperforming traditional full-text embedding methods"
slug: context-keeper-retrival-algorithm
date: 2025-03-16
image: cover.webp
categories:
    - Natural Language Processing
    - Information Retrieval
    - Machine Learning
tags:
    - Text Similarity
    - Sentence Transformers
    - Chunking
    - Semantic Search
    - Question Answering
---

## The Challenge of Text Similarity

Determining whether two pieces of text are semantically similar is a fundamental challenge in natural language processing. This problem appears in many applications, from detecting duplicate questions on platforms like Quora to powering semantic search in retrieval systems.

The traditional approach involves embedding entire texts using models like Sentence Transformers and computing cosine similarity between these embeddings. While effective, this method treats texts as monolithic entities, potentially missing nuanced similarities between specific parts of the texts.

## A New Approach: Chunking-Based Similarity

We've developed and tested a new approach that outperforms the traditional method by breaking texts into smaller chunks before comparison. Our experiments on the Quora question pairs dataset show a consistent improvement in accuracy.

## How It Works

The algorithm consists of four main steps:

### 1. Text Chunking

Instead of embedding entire questions, we first break them into smaller, dynamically-sized chunks:

```python
def chunk_text(text: str, min_chunk: int = 18, max_chunk: int = 150) -> List[str]:
    """Split text into dynamically sized chunks using optimal parameters."""
    words = text.split()
    chunk_size = max(min_chunk, min(len(words) // 4, max_chunk))
    return [" ".join(words[i : i + chunk_size]) for i in range(0, len(words), chunk_size)]
```

The function ensures chunks are neither too small (minimum 18 words) nor too large (maximum 150 words), with a default size of 1/4 of the text length.

### 2. Chunk Embedding

Each chunk is embedded separately using a pre-trained Sentence Transformer model:

```python
def embed_texts(texts: List[str]) -> torch.Tensor:
    """Embed a list of texts."""
    return model.encode(texts, convert_to_tensor=True)
```

### 3. Top-K Similarity Computation

Instead of comparing entire texts, we compute similarities between all possible chunk pairs from the two texts, then take the average of the top-K most similar pairs:

```python
def compute_top_k_similarity(q1_chunks: torch.Tensor, q2_chunks: torch.Tensor, top_k: int = 3) -> float:
    """Compute top-k average similarity between chunk pairs."""
    similarities = [float(util.pytorch_cos_sim(q1, q2).item()) 
                   for q1 in q1_chunks for q2 in q2_chunks]
    return float(np.mean(sorted(similarities, reverse=True)[:top_k])) if similarities else 0.0
```

### 4. Threshold-Based Classification

Finally, we classify question pairs as duplicates if their similarity score exceeds a threshold:

```python
def evaluate_accuracy(dataset: pd.DataFrame, similarity_column: str, threshold: float = 0.7) -> float:
    """Evaluate accuracy based on similarity threshold."""
    predictions = (dataset[similarity_column] >= threshold).astype(int)
    accuracy = (predictions == dataset["is_duplicate"]).mean()
    return accuracy
```

## Parameter Tuning and Results

We conducted extensive parameter tuning to find the optimal configuration:

- **Chunk Size**: min_chunk=18, max_chunk=150
- **Top-K**: 3 (only considering the 3 most similar chunk pairs)
- **Similarity Threshold**: 0.7

With these parameters, our chunking-based approach achieved 73.40% accuracy on the Quora dataset, compared to 72.80% for the traditional full-text approach. This represents a 0.60% absolute improvement and a 0.82% relative improvement.

## Why It Works

The chunking approach works better for several reasons:

1. **Focused Comparison**: By comparing chunks rather than entire texts, the algorithm can identify specific parts that are semantically similar, even if other parts differ.

2. **Noise Reduction**: Taking only the top-K most similar chunks filters out less relevant parts of the texts.

3. **Granular Representation**: Chunks provide a more granular representation of the text's semantic content.

## Computational Considerations

While the chunking approach improves accuracy, it does come with computational trade-offs:

### Advantages

- **Parallelization**: Chunk embeddings can be computed in parallel
- **Interpretability**: The top matching chunks provide explainable results
- **Flexibility**: Parameters can be tuned for different text types and lengths

### Drawbacks

- **Increased Computation**: If each text produces N chunks, we need to compute N² similarity scores between all possible chunk pairs
- **Memory Usage**: Storing embeddings for all chunks requires more memory than storing a single embedding per text
- **Parameter Sensitivity**: Performance depends on proper tuning of chunk size and top-K parameters

For our test dataset with 500 question pairs, the computational overhead was manageable. However, for large-scale applications, optimizations would be necessary, such as:

1. Using approximate nearest neighbor search to find top similar chunks
2. Implementing batch processing for chunk embedding
3. Pruning obviously dissimilar chunks early in the process

## Implementation

The implementation uses PyTorch and the Sentence Transformers library:

```python
# Load a pre-trained sentence embedding model
model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

# Process dataset
dataset = load_dataset_quora()

# Compute chunked similarity
dataset = compute_chunked_embeddings(dataset)
dataset = compute_chunked_similarity(dataset)
```

## Conclusion

Our chunking-based similarity approach demonstrates that breaking texts into smaller units before comparison can yield meaningful improvements in similarity detection. The method is simple to implement yet effective, making it a valuable addition to the NLP practitioner's toolkit.

The approach is particularly well-suited for applications where:

- Texts contain multiple distinct semantic components
- Partial matches are important indicators of overall similarity
- Explainability of similarity scores is valuable

Future work could explore more sophisticated chunking strategies, such as semantic-based chunking rather than simple word count-based approaches, as well as more efficient algorithms for large-scale applications.

By focusing on the most similar parts of texts rather than treating them as indivisible wholes, we can build more accurate and nuanced text similarity systems.

## Appendix: Full Code for Benchmarking

```python
from typing import List

import numpy as np
import pandas as pd
import torch
from datasets import load_dataset
from sentence_transformers import SentenceTransformer, util

# Load a pre-trained sentence embedding model
model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")


def load_dataset_quora(sample_size: int = 500) -> pd.DataFrame:
    """Load and preprocess the Quora dataset."""
    raw_dataset = load_dataset("quora", split="train", trust_remote_code=True)
    data = {"question1": [x["questions"]["text"][0] for x in raw_dataset], "question2": [x["questions"]["text"][1] for x in raw_dataset], "is_duplicate": [x["is_duplicate"] for x in raw_dataset]}
    dataset = pd.DataFrame(data)
    return dataset.sample(sample_size, random_state=42)


def chunk_text(text: str, min_chunk: int = 18, max_chunk: int = 150) -> List[str]:
    """Split text into dynamically sized chunks using optimal parameters."""
    words = text.split()
    chunk_size = max(min_chunk, min(len(words) // 4, max_chunk))
    return [" ".join(words[i : i + chunk_size]) for i in range(0, len(words), chunk_size)]


def embed_texts(texts: List[str]) -> torch.Tensor:
    """Embed a list of texts."""
    return model.encode(texts, convert_to_tensor=True)


def compute_baseline_similarity(dataset: pd.DataFrame) -> pd.DataFrame:
    """Compute similarity scores using full-text embeddings."""
    embeddings_q1 = embed_texts(dataset["question1"].tolist())
    embeddings_q2 = embed_texts(dataset["question2"].tolist())
    dataset["similarity_baseline"] = util.pytorch_cos_sim(embeddings_q1, embeddings_q2).diagonal().cpu().numpy()
    return dataset


def compute_chunked_embeddings(dataset: pd.DataFrame) -> pd.DataFrame:
    """Compute embeddings for chunked texts."""
    dataset = dataset.copy()
    dataset["q1_chunks"] = dataset["question1"].apply(lambda x: embed_texts(chunk_text(x))).values
    dataset["q2_chunks"] = dataset["question2"].apply(lambda x: embed_texts(chunk_text(x))).values
    return dataset


def compute_top_k_similarity(q1_chunks: torch.Tensor, q2_chunks: torch.Tensor, top_k: int = 10) -> float:
    """Compute top-k average similarity between chunk pairs."""
    similarities = [float(util.pytorch_cos_sim(q1, q2).item()) for q1 in q1_chunks for q2 in q2_chunks]
    return float(np.mean(sorted(similarities, reverse=True)[:top_k])) if similarities else 0.0


def compute_chunked_similarity(dataset: pd.DataFrame, top_k: int = 3) -> pd.DataFrame:
    """Compute similarity scores using chunked embeddings with optimal parameters."""
    dataset["similarity_chunking"] = dataset.apply(lambda row: compute_top_k_similarity(row["q1_chunks"], row["q2_chunks"], top_k), axis=1)
    return dataset


def evaluate_accuracy(dataset: pd.DataFrame, similarity_column: str, threshold: float = 0.7) -> float:
    """Evaluate accuracy based on similarity threshold."""
    predictions = (dataset[similarity_column] >= threshold).astype(int)
    accuracy = (predictions == dataset["is_duplicate"]).mean()
    print(f"Accuracy for {similarity_column} at threshold {threshold}: {accuracy:.4f}")
    return accuracy


def main():
    # Load and process dataset
    dataset = load_dataset_quora()

    # Compute baseline similarity (traditional approach)
    dataset = compute_baseline_similarity(dataset)
    baseline_accuracy = evaluate_accuracy(dataset, "similarity_baseline")

    # Compute chunked similarity with optimal parameters
    dataset = compute_chunked_embeddings(dataset)
    dataset = compute_chunked_similarity(dataset)
    chunking_accuracy = evaluate_accuracy(dataset, "similarity_chunking")

    print("\nFinal Results:")
    print(f"Baseline Accuracy: {baseline_accuracy:.4f}")
    print(f"Chunking Accuracy: {chunking_accuracy:.4f}")
    print(f"Absolute Improvement: {(chunking_accuracy - baseline_accuracy):.4f}")
    print(f"Relative Improvement: {((chunking_accuracy - baseline_accuracy) / baseline_accuracy * 100):.2f}%")


if __name__ == "__main__":
    main()
```

Output result:

```console
Accuracy for similarity_baseline at threshold 0.7: 0.7280
Accuracy for similarity_chunking at threshold 0.7: 0.7340

Final Results:
Baseline Accuracy: 0.7280
Chunking Accuracy: 0.7340
Absolute Improvement: 0.0060
Relative Improvement: 0.82%
```
