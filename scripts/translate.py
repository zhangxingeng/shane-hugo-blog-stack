import os
import re
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Set
from dotenv import load_dotenv
import openai
from tqdm import tqdm

# Load environment variables from .env file
load_dotenv()

# Set up OpenAI API key
openai.api_key = os.getenv("OPENAI_API_KEY")

# Language configuration - ordered by priority (first = highest priority as source)
LANGUAGES = [
    {"code": "", "name": "English", "filename_suffix": ""},
    {"code": "zh-cn", "name": "Chinese", "filename_suffix": ".zh-cn"},
    # Future languages can be added here:
    # {"code": "de", "name": "German", "filename_suffix": ".de"},
    # {"code": "fr", "name": "French", "filename_suffix": ".fr"},
]

def get_filename_for_language(lang_code: str) -> str:
    """Get the appropriate filename for a language code."""
    for lang in LANGUAGES:
        if lang["code"] == lang_code:
            return f"index{lang['filename_suffix']}.md"
    raise ValueError(f"Unknown language code: {lang_code}")

def get_language_name(lang_code: str) -> str:
    """Get the human-readable name for a language code."""
    for lang in LANGUAGES:
        if lang["code"] == lang_code:
            return lang["name"]
    return lang_code

def validate_language_config() -> bool:
    """Validate the language configuration for consistency."""
    if not LANGUAGES:
        print("Error: No languages configured!")
        return False
    
    # Check for duplicate codes
    codes = [lang["code"] for lang in LANGUAGES]
    if len(codes) != len(set(codes)):
        print("Error: Duplicate language codes found!")
        return False
    
    # Check for required fields
    for lang in LANGUAGES:
        if not all(key in lang for key in ["code", "name", "filename_suffix"]):
            print(f"Error: Language configuration missing required fields: {lang}")
            return False
    
    return True

def get_supported_language_codes() -> List[str]:
    """Get list of all supported language codes."""
    return [lang["code"] for lang in LANGUAGES]

def get_all_posts_by_language(content_dirs: List[str]) -> Dict[str, Set[Path]]:
    """Find all posts grouped by language across specified content directories."""
    posts_by_language = {lang["code"]: set() for lang in LANGUAGES}
    
    for content_dir_str in content_dirs:
        content_dir = Path(content_dir_str)
        if not content_dir.exists():
            print(f"Warning: Directory {content_dir} does not exist")
            continue
            
        # Search for posts in each supported language
        for lang in LANGUAGES:
            filename = get_filename_for_language(lang["code"])
            posts = list(content_dir.rglob(filename))
            posts_by_language[lang["code"]].update(post.parent for post in posts)
    
    return posts_by_language

def find_missing_translations(posts_by_language: Dict[str, Set[Path]]) -> List[Tuple[Path, str, str]]:
    """
    Find posts that need translation.
    Returns list of (post_dir, source_lang_code, target_lang_code) tuples.
    """
    translations_needed = []
    
    # Get all directories that have at least one post
    all_post_dirs = set()
    for post_dirs in posts_by_language.values():
        all_post_dirs.update(post_dirs)
    
    for post_dir in all_post_dirs:
        # Find which languages exist for this post
        existing_languages = []
        for lang in LANGUAGES:
            if post_dir in posts_by_language[lang["code"]]:
                existing_languages.append(lang["code"])
        
        # Find which languages are missing
        missing_languages = []
        for lang in LANGUAGES:
            if lang["code"] not in existing_languages:
                missing_languages.append(lang["code"])
        
        # If we have all languages, skip
        if not missing_languages:
            continue
            
        # Select source language (highest priority among existing)
        source_lang = None
        for lang in LANGUAGES:  # Already ordered by priority
            if lang["code"] in existing_languages:
                source_lang = lang["code"]
                break
        
        if source_lang is None:
            continue  # This shouldn't happen, but just in case
            
        # Add translation tasks for all missing languages
        for target_lang in missing_languages:
            translations_needed.append((post_dir, source_lang, target_lang))
    
    return translations_needed

def generate_translation_prompt(source_lang: str, target_lang: str) -> str:
    """Generate appropriate translation prompt for the language pair."""
    
    if source_lang == "" and target_lang == "zh-cn":
        # English to Chinese
        return (
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
        )
    
    elif source_lang == "zh-cn" and target_lang == "":
        # Chinese to English
        return (
            "You are a professional English tech blogger known for being witty, humorous, easy to understand, and excellent at communication. "
            "Please recreate the following Chinese blog content into authentic English writing. "
            "Requirements: "
            "1. Don't translate word-by-word, reorganize the language to fit English expression habits "
            "2. You can moderately use humorous and witty modern English to make the article more interesting (be moderate, elegant, not vulgar, don't overdo it - remember that moderation is key) "
            "3. Maintain technical accuracy (keep original Chinese terms if there's no precise English translation), but explanations should be simple and easy to understand "
            "4. You can appropriately add or even rewrite existing content with English-specific metaphors and examples "
            "5. Make the article read like it was originally written by a native English author, not translated "
            "6. You can appropriately add some humorous elements to make readers smile 😃 "
            "7. Remember: you are creating, not translating! "
            "8. Must completely preserve the original frontmatter structure (including all field order, indentation, format), but translate the text content to fit English context "
            "9. For text content in frontmatter like titles, descriptions, categories, tags, translate them into natural English expressions while maintaining technical accuracy "
            "10. Don't output anything other than frontmatter and article body "
            "11. Ensure the translated frontmatter is completely valid in YAML format"
        )
    
    else:
        # Generic prompt for other language pairs
        source_name = get_language_name(source_lang)
        target_name = get_language_name(target_lang)
        return (
            f"You are a professional {target_name} tech blogger known for being witty, humorous, easy to understand, and excellent at communication. "
            f"Please recreate the following {source_name} blog content into authentic {target_name} writing. "
            "Requirements: "
            "1. Don't translate word-by-word, reorganize the language to fit the target language's expression habits "
            "2. You can moderately use humorous and witty language to make the article more interesting (be moderate and elegant) "
            "3. Maintain technical accuracy, but explanations should be simple and easy to understand "
            "4. Make the article read like it was originally written by a native author, not translated "
            "5. You can appropriately add some humorous elements to make readers smile 😃 "
            "6. Remember: you are creating, not translating! "
            "7. Must completely preserve the original frontmatter structure, but translate the text content appropriately "
            "8. Don't output anything other than frontmatter and article body "
            "9. Ensure the translated frontmatter is valid in YAML format"
        )

def translate_content(content: str, source_lang: str, target_lang: str) -> Optional[str]:
    """Translate content using GPT-4.1 API with appropriate prompt for language pair."""
    try:
        system_prompt = generate_translation_prompt(source_lang, target_lang)
        
        response = openai.chat.completions.create(
            model="gpt-4.1",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": content}
            ],
            temperature=0.7,
        )
        translated_content = response.choices[0].message.content
        return translated_content

    except Exception as e:
        source_name = get_language_name(source_lang)
        target_name = get_language_name(target_lang)
        print(f"Translation error ({source_name} → {target_name}): {e}")
        return None


def main():
    """Main function to handle multi-language translation workflow."""
    # Validate language configuration
    if not validate_language_config():
        return
    
    # Define the content directories to search for posts
    content_dirs = [
        "content/post",
        "content/series", 
        "content/page",
        # Add more directories as needed
    ]
    
    supported_languages = ", ".join([f"{lang['name']} ({lang['code'] or 'default'})" for lang in LANGUAGES])
    print(f"🌐 Supported languages: {supported_languages}")
    print("🔍 Scanning for posts in all supported languages...")
    posts_by_language = get_all_posts_by_language(content_dirs)
    
    # Print summary of found posts
    print("\nPosts found by language:")
    for lang in LANGUAGES:
        lang_name = lang["name"]
        count = len(posts_by_language[lang["code"]])
        print(f"  {lang_name}: {count} posts")
    
    print("\n🔍 Analyzing missing translations...")
    translations_needed = find_missing_translations(posts_by_language)
    
    if not translations_needed:
        print("✨ All posts are already translated to all supported languages!")
        return
    
    # Group translations by language pair for better reporting
    translation_summary = {}
    for post_dir, source_lang, target_lang in translations_needed:
        source_name = get_language_name(source_lang)
        target_name = get_language_name(target_lang)
        pair = f"{source_name} → {target_name}"
        if pair not in translation_summary:
            translation_summary[pair] = 0
        translation_summary[pair] += 1
    
    print("\nTranslations needed:")
    for pair, count in translation_summary.items():
        print(f"  {pair}: {count} posts")
    
    print(f"\n🚀 Starting translation of {len(translations_needed)} posts...")
    
    success_count = 0
    for post_dir, source_lang, target_lang in tqdm(translations_needed, desc="Translating posts"):
        try:
            # Read source file
            source_filename = get_filename_for_language(source_lang)
            source_path = post_dir / source_filename
            
            if not source_path.exists():
                print(f"✗ Source file not found: {source_path}")
                continue
                
            with open(source_path, 'r', encoding='utf-8') as file:
                content = file.read()
            
            # Translate content
            translated_content = translate_content(content, source_lang, target_lang)
            
            if translated_content:
                # Write translated file
                target_filename = get_filename_for_language(target_lang)
                target_path = post_dir / target_filename
                
                with open(target_path, 'w', encoding='utf-8') as file:
                    file.write(translated_content)
                
                source_name = get_language_name(source_lang)
                target_name = get_language_name(target_lang)
                print(f"✓ {source_name} → {target_name}: {post_dir.name}")
                success_count += 1
            else:
                source_name = get_language_name(source_lang)
                target_name = get_language_name(target_lang)
                print(f"✗ Failed: {source_name} → {target_name}: {post_dir.name}")
                
        except Exception as e:
            print(f"✗ Error processing {post_dir}: {e}")
    
    print(f"\n✨ Translation complete! Successfully translated {success_count}/{len(translations_needed)} posts.")


if __name__ == "__main__":
    main()
