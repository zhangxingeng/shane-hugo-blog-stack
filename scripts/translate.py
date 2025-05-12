import os
import re
from pathlib import Path
from dotenv import load_dotenv
import openai
from tqdm import tqdm

# Load environment variables from .env file
load_dotenv()

# Set up OpenAI API key
openai.api_key = os.getenv("OPENAI_API_KEY")


def get_markdown_files():
    """Find all markdown files in content/post folder."""
    content_dir = Path("content/post")
    en_posts = list(content_dir.rglob("index.md"))
    cn_posts = list(content_dir.rglob("index.zh-cn.md"))

    # Get the directories that have English posts
    en_dirs = {post.parent for post in en_posts}

    # Get the directories that have Chinese posts
    cn_dirs = {post.parent for post in cn_posts}

    # Find directories with English posts but no Chinese translations
    missing_translation_dirs = en_dirs - cn_dirs

    # Get the English posts that need translation
    posts_to_translate = [dir_path /
                          "index.md" for dir_path in missing_translation_dirs]

    return posts_to_translate


def translate_content(content):
    """Translate content using GPT-4.1 API."""
    try:
        response = openai.chat.completions.create(
            model="gpt-4.1",
            messages=[
                {"role": "system", "content": (
                    "You are a professional translator for hugo blog posts. "
                    "Translate the following English markdown content to Simplified "
                    "Chinese so people can read it in Chinese. "
                    "Retain frontmatter structure but translate the content."
                )},
                {"role": "user", "content": content}
            ],
            temperature=0.3,
        )
        translated_content = response.choices[0].message.content
        return translated_content

    except Exception as e:
        print(f"Translation error: {e}")
        return None


def main():
    posts_to_translate = get_markdown_files()
    print(f"Found {len(posts_to_translate)} posts that need translation")

    for post_path in tqdm(posts_to_translate, desc="Translating posts"):
        try:
            with open(post_path, 'r', encoding='utf-8') as file:
                content = file.read()
            translated_content = translate_content(content)
            if translated_content:
                cn_post_path = post_path.parent / "index.zh-cn.md"
                with open(cn_post_path, 'w', encoding='utf-8') as file:
                    file.write(translated_content)
                print(f"✓ Created translation for {post_path}")
            else:
                print(f"✗ Failed to translate {post_path}")
        except Exception as e:
            print(f"Error processing {post_path}: {e}")


if __name__ == "__main__":
    main()
