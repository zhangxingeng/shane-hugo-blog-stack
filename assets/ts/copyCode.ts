/**
 * Code copying functionality for syntax highlighted code blocks
 */

export interface CopyCodeOptions {
    copyText?: string;
    copiedText?: string;
    timeout?: number;
}

export function initCodeCopyButtons(options: CopyCodeOptions = {}) {
    const { 
        copyText = 'Copy', 
        copiedText = 'Copied!', 
        timeout = 1000 
    } = options;

    const highlights = document.querySelectorAll('.article-content div.highlight');

    highlights.forEach(highlight => {
        // Skip if button already exists
        if (highlight.querySelector('.copyCodeButton')) return;
        
        const copyButton = document.createElement('button');
        copyButton.innerHTML = copyText;
        copyButton.classList.add(
            'copyCodeButton',
            'absolute', 'top-2', 'right-2', 'z-10',
            'px-3', 'py-1.5', 
            'bg-card-bg', 'text-card-text-secondary',
            'border', 'border-card-separator-color',
            'rounded-md', 'text-xs',
            'hover:bg-accent', 'hover:text-accent-text', 'hover:border-accent',
            'transition-all', 'duration-200',
            'focus:outline-none', 'focus:ring-2', 'focus:ring-accent', 'focus:ring-offset-1'
        );
        copyButton.setAttribute('aria-label', 'Copy code to clipboard');
        copyButton.setAttribute('type', 'button');
        highlight.appendChild(copyButton);

        const codeBlock = highlight.querySelector('code[data-lang]') || highlight.querySelector('code');
        if (!codeBlock) return;

        copyButton.addEventListener('click', async () => {
            try {
                const codeText = codeBlock.textContent ?? '';
                if (!codeText.trim()) {
                    console.warn('No code content to copy');
                    return;
                }
                
                await navigator.clipboard.writeText(codeText);
                copyButton.textContent = copiedText;
                copyButton.classList.remove('bg-card-bg', 'text-card-text-secondary', 'border-card-separator-color');
                copyButton.classList.add('bg-green-500', 'text-white', 'border-green-500');
                
                setTimeout(() => {
                    copyButton.textContent = copyText;
                    copyButton.classList.remove('bg-green-500', 'text-white', 'border-green-500');
                    copyButton.classList.add('bg-card-bg', 'text-card-text-secondary', 'border-card-separator-color');
                }, timeout);
            } catch (err) {
                console.error('Failed to copy code:', err);
                const errorMsg = err instanceof Error ? err.message : 'Unknown error';
                alert(`Failed to copy code: ${errorMsg}. Please try again.`);
            }
        });
    });
}

/**
 * Copy as Markdown functionality for articles
 */
export interface CopyMarkdownOptions {
    timeout?: number;
}

export function initCopyAsMarkdown(options: CopyMarkdownOptions = {}) {
    const { timeout = 2000 } = options;
    
    const copyButtons = document.querySelectorAll('.copy-as-markdown button');
    
    // Check for llms.txt format first, then fallback to markdown
    let llmsLink = document.querySelector('link[type="text/plain"]') as HTMLLinkElement | null;
    const markdownLink = document.querySelector('link[type="text/markdown"]') as HTMLLinkElement | null;
    
    // Prefer existing link elements in HTML head over constructed URLs
    const preferredLink = llmsLink ?? markdownLink;
    
    // Only proceed if we found valid links in the head
    if (!preferredLink?.href) {
        // Hide copy buttons if no content is available
        copyButtons.forEach(button => {
            (button as HTMLElement).style.display = 'none';
        });
        return;
    }
    
    // Convert absolute URL to relative to avoid CORS issues
    let fetchUrl = preferredLink.href;
    try {
        const linkUrl = new URL(preferredLink.href);
        // Always convert to relative URL to avoid CORS issues in development
        fetchUrl = linkUrl.pathname + linkUrl.search + linkUrl.hash;
    } catch (e) {
        // If URL parsing fails, use the href as-is
        console.warn('Failed to parse copy URL:', e);
    }
    
    // Show that markdown content is available
    document.body.classList.add('has-markdown');
    
    copyButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            
            try {
                const response = await fetch(fetchUrl);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const content = await response.text();
                await navigator.clipboard.writeText(content);
                
                // Show feedback using i18n translations
                const span = button.querySelector('span') as HTMLElement;
                const originalText = button.getAttribute('data-copy-text') ?? span?.textContent ?? 'Copy';
                const copiedText = button.getAttribute('data-copied-text') ?? 'Copied!';
                
                if (span) span.textContent = copiedText;
                
                setTimeout(() => {
                    if (span) span.textContent = originalText;
                }, timeout);
            } catch (err) {
                console.error('Failed to copy content:', err);
                const errorMsg = err instanceof Error ? err.message : 'Unknown error';
                alert(`Failed to copy content: ${errorMsg}. Please try again.`);
            }
        });
    });
}
