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
        const copyButton = document.createElement('button');
        copyButton.innerHTML = copyText;
        copyButton.classList.add('copyCodeButton');
        highlight.appendChild(copyButton);

        const codeBlock = highlight.querySelector('code[data-lang]');
        if (!codeBlock) return;

        copyButton.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(codeBlock.textContent ?? '');
                copyButton.textContent = copiedText;
                
                setTimeout(() => {
                    copyButton.textContent = copyText;
                }, timeout);
            } catch (err) {
                console.error('Failed to copy code:', err);
                alert('Failed to copy code. Please try again.');
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
    let llmsLink = document.querySelector('link[type="text/plain"]') as HTMLLinkElement;
    const markdownLink = document.querySelector('link[type="text/markdown"]') as HTMLLinkElement;
    
    // If no plain text link, try to construct llms.txt URL
    if (!llmsLink && markdownLink) {
        const currentUrl = new URL(window.location.href);
        const pathname = currentUrl.pathname;
        const llmsUrl = pathname.endsWith('/') 
            ? pathname + 'llms.txt'
            : pathname + '/llms.txt';
        llmsLink = { href: llmsUrl } as HTMLLinkElement;
    }
    
    const preferredLink = llmsLink ?? markdownLink;
    if (preferredLink) {
        document.body.classList.add('has-markdown');
    }
    
    copyButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            
            try {
                const response = await fetch(preferredLink.href);
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
                alert('Failed to copy content. Please try again.');
            }
        });
    });
}
