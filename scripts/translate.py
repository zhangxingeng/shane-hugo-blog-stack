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
                    "你是一位以风趣幽默，简单易懂，懂得交流沟通出名的专业中文博客作者。"
                    "请把下面的英文博客内容重新创作成地道的中文文章。"
                    "要求："
                    "1. 不要逐字翻译，要重新组织语言，让内容符合中文表达习惯"
                    "2. 可以适度使用幽默风趣的现代中文语言(可以直接用不必用引号)，让文章更有趣（要适度，要优雅，不要低俗， 不要过火, 记得过犹不及）"
                    "3. 保留技术术语的准确性 （如果没有精准的翻译可以保留原有英文），但解释要简单易懂"
                    "4. 可以适当加入甚至改写已有内容成中文特有的比喻和例子"
                    "5. 让文章读起来像是中国作者原创的，而不是翻译的"
                    "6. 可以适当加入一些幽默元素，让读者会心一笑😃"
                    "7. 记住：你是在创作，不是在翻译！"
                    "8. 必须完整保留原有的frontmatter结构（包括所有字段的顺序、缩进、格式），但可以翻译其中的文本内容使其符合中文语境"
                    "9. 对于frontmatter中的标题、描述、分类、标签等文本内容，应该翻译成自然的中文表达，但要保持技术准确性"
                    "10. 不要输出除了frontmatter和文章正文以外的任何内容"
                    "11. 确保翻译后的frontmatter在YAML格式上完全合法"
                )},
                {"role": "user", "content": content}
            ],
            temperature=0.7,
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
