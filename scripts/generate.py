from pydantic import BaseModel, Field
from pathlib import Path
from openai import OpenAI
import os
from dotenv import load_dotenv
from PIL import Image
import base64
import io
import gradio as gr
import re
from datetime import datetime

load_dotenv()
assert os.getenv("OPENAI_API_KEY") is not None, "OPENAI_API_KEY is not set"

root_directory = Path(__file__).parent.parent
instruction_file_path = (
    root_directory / "content" / "post" / "blog_building_prompt" / "index.md"
)


class BlogPost(BaseModel):
    title: str = Field(description="The title of the blog post")
    raw_content: str = Field(
        description="The raw content of the blog post, including the front matter and the content"
    )


def read_instruction():
    instruction = ""
    with open(instruction_file_path, "r", encoding="utf-8") as file:
        instruction = file.read()
    return instruction


def generate_blog(raw_input: str, custom_instructions: str = "") -> BlogPost:
    client = OpenAI()
    instruction_content = read_instruction()

    system_prompt = f"""\
    You are an expert blog writer who creates engaging, conversational, and insightful content. 
    Follow the provided style guide meticulously to create blog posts that feel like conversations with a close friend.

    Here are your writing instructions:
    {instruction_content}

    The user indicates that the following additional instructions should be followed as well: {custom_instructions}

    Return a structured blog post with proper frontmatter and markdown content."""

    prompt = f"""Based on the following raw content, create an engaging blog post following the style guide:

    Raw content to transform into a blog post:
    {raw_input}

    Today's date: {datetime.now().strftime("%Y-%m-%d")}

    """

    response = client.chat.completions.parse(
        model="gpt-4.1",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt},
        ],
        response_format=BlogPost,
        temperature=0.7,
    )
    return response.choices[0].message.parsed


def imagine_image(original_blog: str, custom_instructions: str = "") -> str:
    client = OpenAI()
    image_imagination_prompt = """\
    ## Cover Image Instructions
    Read the blog post and think how you would visualize it (and what kind of a image view would be attractive to readers). Then create an ultra-wide, visually captivating banner image inspired by the provided blog post core visualization description. Keep the following hints in mind:

    - Consider the blog's core themes or key insights.
    - Reflect on the emotional tones or moods suggested by the content.  
    - Explore colors and styles that resonate naturally with the blog's overall feeling.
    - Do not include any text in the image
    """

    system_prompt = f"""\
    You are a creative visual designer who specializes in creating compelling image descriptions for blog cover images.
    Your job is to read blog content and create detailed, vivid descriptions that can be used to generate ultra-wide banner images.
    
    {image_imagination_prompt}
    
    The user indicates that the following additional instructions should be followed as well: {custom_instructions}
    
    Create a detailed description for an image that would serve as an engaging cover for this blog post."""

    prompt = f"""Based on the following blog post content, create a detailed visual description for a cover image:

    Blog Post Content:
    {original_blog}

    Please provide a detailed description that includes:
    - Visual composition and layout
    - Color palette and mood
    - Key visual elements and metaphors
    - Artistic style (realistic, abstract, minimalist, etc.)
    - Any symbolic elements that represent the blog's core message

    The description should be detailed enough to generate a compelling ultra-wide banner image.
    """

    response = client.chat.completions.create(
        model="gpt-4.1",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt},
        ],
        temperature=0.8,
    )
    return response.choices[0].message.content


def generate_image(
    original_blog: str, imagination_result: str, custom_instructions: str = ""
):
    client = OpenAI()

    # Create enhanced prompt combining blog context with imagination
    prompt = f"""\
    ## This is how this image is imagined to be like:
    
    <imagination>
    {imagination_result}
    </imagination>

    ## The original blog post this image will be used on:
    <blog_post>
    {original_blog}
    </blog_post>

    ## Additional instructions: 
    <additional_instructions>
    {custom_instructions}
    </additional_instructions>

    Style: 
    - an image that is visually appealing to the potential readers of this blog post. 
    - No text should appear in the image.
    """
    try:
        response = client.images.generate(
            model="gpt-image-1",
            prompt=prompt,
            n=3,
            size="1536x1024",
            output_format="png",
            quality="high",
            # default output is b64_json
        )
        images = [d.b64_json for d in response.data]
        return images
    except Exception as e:
        print(f"Error generating image: {e}")
        return []


def save_image(b64_string: str, output_path: Path) -> tuple[bool, bool]:
    """Save image from base64 string to both PNG and WebP formats"""
    img_bytes = base64.b64decode(b64_string)
    webp_path = output_path / "cover.webp"
    png_path = output_path / "cover.png"
    img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    img.save(webp_path, "WEBP")
    img.save(png_path, "PNG")
    # check if the image is saved
    png_exists = png_path.exists()
    webp_exists = webp_path.exists()
    return png_exists, webp_exists


def sanitize_filename(title: str) -> str:
    """Convert blog title to filesystem-safe filename"""
    # Replace spaces and special characters with underscores
    sanitized = re.sub(r"[^a-zA-Z0-9\s-]", "", title)
    sanitized = re.sub(r"\s+", "_", sanitized).strip("_")
    return sanitized.lower()


def save_blog_post(blog_post: BlogPost, selected_image_b64: str = None) -> str:
    """Save blog post and optional image to the file system"""
    try:
        # Create sanitized directory name
        folder_name = sanitize_filename(blog_post.title)
        post_dir = root_directory / "content" / "post" / folder_name
        post_dir.mkdir(parents=True, exist_ok=True)

        # Save blog post as index.md
        index_path = post_dir / "index.md"
        index_path.write_text(blog_post.raw_content, encoding="utf-8")

        # Save image if provided
        if selected_image_b64:
            png_exists, webp_exists = save_image(selected_image_b64, post_dir)
            return f"✅ Blog post saved to {post_dir}\n📄 index.md created\n🖼️ Images saved: PNG ({png_exists}), WebP ({webp_exists})"
        else:
            return f"✅ Blog post saved to {post_dir}\n📄 index.md created\n⚠️ No image saved"

    except Exception as e:
        return f"❌ Error saving blog post: {str(e)}"


class AppController:
    """Encapsulates UI state and handlers for the Gradio app."""

    def __init__(self):
        self.current_blog_post = None
        self.current_image_description = None
        self.current_images = []  # base64 strings
        self.selected_image_index = None

    def display_system_prompts(self):
        """Return debug prompt templates for display only (not executed)."""
        blog_prompt = """System Prompt for Blog Generation:
        f"You are an expert blog writer who creates engaging, conversational, and insightful content. 
        Follow the provided style guide meticulously to create blog posts that feel like conversations with a close friend.
        
        Here are your writing instructions:
        {instruction_content}
        
        The user indicates that the following additional instructions should be followed as well: {custom_instructions}
        
        Return a structured blog post with proper frontmatter and markdown content."
        """

        image_prompt = """System Prompt for Image Imagination:
        f"You are a creative visual designer who specializes in creating compelling image descriptions for blog cover images.
        Your job is to read blog content and create detailed, vivid descriptions that can be used to generate ultra-wide banner images.
        
        {image_imagination_prompt}
        
        The user indicates that the following additional instructions should be followed as well: {custom_instructions}
        
        Create a detailed description for an image that would serve as an engaging cover for this blog post."
        """

        return blog_prompt, image_prompt

    # Handlers
    def generate_blog_handler(
        self, content, custom_instructions, progress=gr.Progress()
    ):
        if not content or not content.strip():
            return "Please paste some content to generate a blog post.", None, ""
        progress(0.1, desc="Starting blog generation...")
        try:
            progress(0.5, desc="Generating blog content...")
            self.current_blog_post = generate_blog(content, custom_instructions)
            progress(1.0, desc="Blog generated successfully!")
            return (
                self.current_blog_post.raw_content,
                self.current_blog_post,
                f"**Blog Title:** {self.current_blog_post.title}",
            )
        except Exception as e:
            return f"❌ Error generating blog: {str(e)}", None, ""

    def generate_image_description_handler(
        self, blog_post_obj, custom_instructions, manual_blog_text, progress=gr.Progress()
    ):
        # Prefer manually pasted blog content if provided; otherwise use state object
        source_content = None
        if manual_blog_text and manual_blog_text.strip():
            source_content = manual_blog_text
        elif blog_post_obj:
            source_content = blog_post_obj.raw_content
        else:
            return "Please paste the blog post content or generate a blog post first."
        progress(0.1, desc="Starting image description generation...")
        try:
            progress(0.5, desc="Creating image description...")
            self.current_image_description = imagine_image(source_content, custom_instructions)
            progress(1.0, desc="Image description generated!")
            return self.current_image_description
        except Exception as e:
            return f"❌ Error generating image description: {str(e)}"

    def generate_images_handler(
        self,
        blog_post_obj,
        image_description,
        custom_instructions,
        manual_blog_text,
        progress=gr.Progress(),
    ):
        if not image_description:
            return [], "Please generate an image description first."
        # Prefer manually pasted blog content if provided; otherwise use state object
        source_content = None
        if manual_blog_text and manual_blog_text.strip():
            source_content = manual_blog_text
        elif blog_post_obj:
            source_content = blog_post_obj.raw_content
        else:
            return [], "Please paste the blog post content or generate a blog post first."
        progress(0.1, desc="Starting image generation...")
        try:
            progress(0.3, desc="Generating image variations...")
            self.current_images = generate_image(source_content, image_description, custom_instructions)

            # Convert base64 images to displayable PIL images
            image_list = []
            total = max(1, len(self.current_images))
            for i, img_b64 in enumerate(self.current_images):
                try:
                    img_bytes = base64.b64decode(img_b64)
                    img = Image.open(io.BytesIO(img_bytes))
                    image_list.append(img)
                    progress(
                        0.3 + (i + 1) * 0.7 / total, desc=f"Processing image {i + 1}..."
                    )
                except Exception as e:
                    print(f"Error processing image {i}: {e}")
                    continue

            if not image_list:
                return [], "No images generated. Try adjusting your instructions."

            progress(1.0, desc="Images generated successfully!")
            return (
                image_list,
                f"Generated {len(image_list)} image variations. Click on an image to select it.",
            )
        except Exception as e:
            return [], f"❌ Error generating images: {str(e)}"

    def select_image_handler(self, evt: gr.SelectData):
        self.selected_image_index = evt.index
        return f"✅ Selected image #{evt.index + 1}"

    def save_blog_handler(self, blog_post_obj):
        if not blog_post_obj:
            return "Please generate a blog post first."
        selected_image_b64 = (
            self.current_images[self.selected_image_index]
            if self.selected_image_index is not None
            and 0 <= self.selected_image_index < len(self.current_images)
            else None
        )
        return save_blog_post(blog_post_obj, selected_image_b64)


def build_blog_tab():
    """Build the Blog Generation tab and return its components."""
    with gr.Row():
        with gr.Column(scale=2):
            content_input = gr.Textbox(
                label="📋 Paste Your Content",
                placeholder="Paste the raw content you want to transform into a blog post...",
                lines=8,
                max_lines=20,
            )
        with gr.Column(scale=1):
            custom_blog_instructions = gr.Textbox(
                label="✏️ Additional Custom Instructions",
                placeholder="Any specific instructions for the blog generation (optional)...",
                lines=4,
                max_lines=10,
            )

    with gr.Row():
        generate_blog_btn = gr.Button(
            "🚀 Generate Blog Post", variant="primary", size="lg"
        )

    blog_info = gr.Markdown()
    blog_output = gr.Markdown(label="Generated Blog Post")

    with gr.Row():
        save_blog_btn = gr.Button("💾 Save Blog Post", variant="primary")
        blog_save_status = gr.Textbox(label="Save Status", interactive=False)

    blog_post_state = gr.State(value=None)

    return (
        content_input,
        custom_blog_instructions,
        generate_blog_btn,
        blog_output,
        blog_info,
        save_blog_btn,
        blog_save_status,
        blog_post_state,
    )


def build_image_tab():
    """Build the Image Generation tab and return its components."""
    with gr.Column():
        manual_blog_input = gr.Textbox(
            label="📄 Paste Blog Post (optional)",
            placeholder="Paste the full blog post markdown/frontmatter here if it isn't loaded...",
            lines=10,
            max_lines=20,
        )
        custom_image_instructions = gr.Textbox(
            label="🎨 Custom Image Instructions",
            placeholder="Additional instructions for image generation (optional)...",
            lines=2,
        )

        with gr.Row():
            generate_description_btn = gr.Button(
                "📝 Generate Image Description", variant="primary"
            )
            regenerate_description_btn = gr.Button("🔄 Regenerate Description")

        image_description_output = gr.Textbox(
            label="🎨 Image Description", lines=5, max_lines=10
        )

        with gr.Row():
            generate_images_btn = gr.Button(
                "🎨 Generate Image Variations", variant="primary", size="lg"
            )

        image_status = gr.Textbox(label="Generation Status", interactive=False)

        with gr.Column():
            image_gallery = gr.Gallery(
                label="Generated Images (Click to Select)",
                columns=3,
                rows=1,
                height="400px",
                object_fit="contain",
            )
            image_selection_status = gr.Textbox(
                label="Selection Status", interactive=False
            )

    return (
        manual_blog_input,
        custom_image_instructions,
        generate_description_btn,
        regenerate_description_btn,
        image_description_output,
        generate_images_btn,
        image_status,
        image_gallery,
        image_selection_status,
    )


def build_debug_tab(controller: AppController):
    gr.Markdown("### System Prompts (for debugging)")
    blog_prompt_display, image_prompt_display = controller.display_system_prompts()
    with gr.Accordion("Blog Generation Prompt", open=False):
        gr.Code(blog_prompt_display, language="markdown")
    with gr.Accordion("Image Description Prompt", open=False):
        gr.Code(image_prompt_display, language="markdown")


def create_gradio_app():
    """Create and return the Gradio app"""
    controller = AppController()

    # Create Gradio interface
    with gr.Blocks(title="Blog Generator", theme=gr.themes.Soft()) as app:
        gr.Markdown("# 📝 Blog Post & Image Generator")
        gr.Markdown(
            "Transform your raw content into engaging blog posts with AI-generated cover images."
        )

        # Blog Generation Tab
        with gr.Tab("📝 Blog Generation"):
            (
                content_input,
                custom_blog_instructions,
                generate_blog_btn,
                blog_output,
                blog_info,
                save_blog_btn,
                blog_save_status,
                blog_post_state,
            ) = build_blog_tab()

        # Image Generation Tab
        with gr.Tab("🖼️ Image Generation"):
            (
                manual_blog_input,
                custom_image_instructions,
                generate_description_btn,
                regenerate_description_btn,
                image_description_output,
                generate_images_btn,
                image_status,
                image_gallery,
                image_selection_status,
            ) = build_image_tab()

        # Debug Tab
        with gr.Tab("🔧 Debug Info"):
            build_debug_tab(controller)

        # Event handlers
        generate_blog_btn.click(
            controller.generate_blog_handler,
            inputs=[content_input, custom_blog_instructions],
            outputs=[blog_output, blog_post_state, blog_info],
            show_progress=True,
        )

        

        generate_description_btn.click(
            controller.generate_image_description_handler,
            inputs=[blog_post_state, custom_image_instructions, manual_blog_input],
            outputs=[image_description_output],
        )

        regenerate_description_btn.click(
            controller.generate_image_description_handler,
            inputs=[blog_post_state, custom_image_instructions, manual_blog_input],
            outputs=[image_description_output],
        )

        generate_images_btn.click(
            controller.generate_images_handler,
            inputs=[
                blog_post_state,
                image_description_output,
                custom_image_instructions,
                manual_blog_input,
            ],
            outputs=[image_gallery, image_status],
        )

        image_gallery.select(
            controller.select_image_handler, outputs=[image_selection_status]
        )

        save_blog_btn.click(
            controller.save_blog_handler,
            inputs=[blog_post_state],
            outputs=[blog_save_status],
        )

    return app.queue()


def main():
    """Launch the Gradio app"""
    app = create_gradio_app()
    app.launch(server_name="0.0.0.0", server_port=7860, share=False, show_error=True)


if __name__ == "__main__":
    main()

