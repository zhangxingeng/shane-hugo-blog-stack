import { pageData } from './search-types';

export function renderInlineResult(item: pageData): HTMLElement {
    const article = document.createElement('article');
    // Use exact same CSS classes as original cards
    article.className = 'bg-card-bg rounded-card shadow-l1 overflow-hidden mb-8 hover:shadow-l3 hover:scale-[1.02] transition-all duration-300 group' + (item.image ? ' has-image' : '');
    
    const header = document.createElement('header');
    header.className = 'mb-6';
    
    // Add image if available - using exact same structure as original
    if (item.image) {
        const imageDiv = document.createElement('div');
        imageDiv.className = 'article-image';
        const link = document.createElement('a');
        link.href = item.permalink;
        const img = document.createElement('img');
        
        // Set up the image with proper src and attributes
        if (typeof item.image === 'string') {
            img.src = item.image;
        } else if (item.image && typeof item.image === 'object') {
            // It's an object with src, srcset, width, height
            if (item.image.src) {
                img.src = item.image.src;
                if (item.image.srcset) {
                    img.srcset = item.image.srcset;
                }
                if (item.image.width) {
                    img.width = item.image.width;
                }
                if (item.image.height) {
                    img.height = item.image.height;
                }
            }
        }
        
        img.loading = 'lazy';
        img.alt = `Featured image of post ${item.title.replace(/<[^>]*>/g, '')}`;
        img.className = 'loaded';
        link.appendChild(img);
        imageDiv.appendChild(link);
        header.appendChild(imageDiv);
    }
    
    // Details section - exact same structure as original
    const details = document.createElement('div');
    details.className = 'p-4 sm:p-6 lg:p-8';
    
    // Categories header - exact same structure as original
    if (item.categories && item.categories.length > 0) {
        const categoriesHeader = document.createElement('header');
        categoriesHeader.className = 'flex flex-wrap gap-2 mb-4';
        
        item.categories.forEach(category => {
            const categoryLink = document.createElement('a');
            categoryLink.href = category.url;
            categoryLink.className = 'inline-block px-3 py-1 bg-accent text-accent-text text-sm font-semibold rounded-tag hover:bg-accent-darker transition-colors duration-200';
            categoryLink.textContent = category.name;
            categoriesHeader.appendChild(categoryLink);
        });
        
        details.appendChild(categoriesHeader);
    }
    
    // Title section - exact same structure as original
    const titleSection = document.createElement('div');
    titleSection.className = 'mb-4';
    
    const title = document.createElement('h2');
    title.className = 'text-lg sm:text-xl lg:text-2xl font-bold text-card-text mb-2 group-hover:text-accent transition-colors duration-300';
    
    const titleLink = document.createElement('a');
    titleLink.href = item.permalink;
    titleLink.className = 'hover:underline decoration-accent decoration-2 underline-offset-4';
    titleLink.innerHTML = item.title;
    title.appendChild(titleLink);
    
    // Replace description with search preview (this is the key difference)
    const description = document.createElement('h3');
    description.className = 'text-sm sm:text-base lg:text-lg text-card-text-secondary mb-4';
    description.innerHTML = item.preview;
    
    titleSection.appendChild(title);
    titleSection.appendChild(description);
    details.appendChild(titleSection);
    
    // Footer section - exact same structure as original
    const footer = document.createElement('footer');
    footer.className = 'flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-card-text-tertiary';
    
    // Date section - using exact same structure as original
    if (item.date) {
        const dateDiv = document.createElement('div');
        dateDiv.className = 'flex items-center gap-2';
        
        // Use the exact same icon structure as original (calendar-time icon)
        const dateIcon = document.createElement('svg');
        dateIcon.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        dateIcon.className = 'icon icon-tabler icon-tabler-calendar-time';
        dateIcon.setAttribute('width', '24');
        dateIcon.setAttribute('height', '24');
        dateIcon.setAttribute('viewBox', '0 0 24 24');
        dateIcon.setAttribute('stroke-width', '2');
        dateIcon.setAttribute('stroke', 'currentColor');
        dateIcon.setAttribute('fill', 'none');
        dateIcon.setAttribute('stroke-linecap', 'round');
        dateIcon.setAttribute('stroke-linejoin', 'round');
        dateIcon.innerHTML = '<path stroke="none" d="M0 0h24v24H0z"></path><path d="M11.795 21h-6.795a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v4"></path><circle cx="18" cy="18" r="4"></circle><path d="M15 3v4"></path><path d="M7 3v4"></path><path d="M3 11h16"></path><path d="M18 16.496v1.504l1 1"></path>';
        
        const dateText = document.createElement('time');
        dateText.className = '';
        const date = new Date(item.date);
        dateText.textContent = date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
        
        dateDiv.appendChild(dateIcon);
        dateDiv.appendChild(dateText);
        footer.appendChild(dateDiv);
    }
    
    // Reading time section - exact same structure as original
    if (item.readingTime) {
        const readingTimeDiv = document.createElement('div');
        readingTimeDiv.className = 'flex items-center gap-2';
        
        // Use the exact same clock icon as original
        const clockIcon = document.createElement('svg');
        clockIcon.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        clockIcon.className = 'icon icon-tabler icon-tabler-clock';
        clockIcon.setAttribute('width', '24');
        clockIcon.setAttribute('height', '24');
        clockIcon.setAttribute('viewBox', '0 0 24 24');
        clockIcon.setAttribute('stroke-width', '2');
        clockIcon.setAttribute('stroke', 'currentColor');
        clockIcon.setAttribute('fill', 'none');
        clockIcon.setAttribute('stroke-linecap', 'round');
        clockIcon.setAttribute('stroke-linejoin', 'round');
        clockIcon.innerHTML = '<path stroke="none" d="M0 0h24v24H0z"></path><circle cx="12" cy="12" r="9"></circle><polyline points="12 7 12 12 15 15"></polyline>';
        
        const readingTimeText = document.createElement('time');
        readingTimeText.className = '';
        readingTimeText.textContent = `${item.readingTime} minute read`;
        
        readingTimeDiv.appendChild(clockIcon);
        readingTimeDiv.appendChild(readingTimeText);
        footer.appendChild(readingTimeDiv);
    }
    
    // Copy as Markdown button - exact same structure as original
    if (item.hasMarkdown) {
        const copyDiv = document.createElement('div');
        copyDiv.className = 'copy-as-markdown flex items-center gap-2 w-full sm:w-auto';
        
        const copyButton = document.createElement('button');
        copyButton.className = 'inline-flex items-center justify-center gap-2 px-3 py-1 text-xs sm:text-sm bg-card-bg-selected text-card-text-secondary rounded-card hover:bg-accent hover:text-accent-text transition-all duration-200 w-full sm:w-auto';
        copyButton.title = 'Copy as Markdown';
        copyButton.setAttribute('data-copy-text', 'Copy as Markdown');
        copyButton.setAttribute('data-copied-text', 'Copied!');
        
        // Clipboard icon
        const clipboardIcon = document.createElement('svg');
        clipboardIcon.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        clipboardIcon.setAttribute('width', '24');
        clipboardIcon.setAttribute('height', '24');
        clipboardIcon.setAttribute('viewBox', '0 0 24 24');
        clipboardIcon.setAttribute('fill', 'none');
        clipboardIcon.setAttribute('stroke', 'currentColor');
        clipboardIcon.setAttribute('stroke-width', '2');
        clipboardIcon.setAttribute('stroke-linecap', 'round');
        clipboardIcon.setAttribute('stroke-linejoin', 'round');
        clipboardIcon.className = 'icon icon-tabler icons-tabler-outline icon-tabler-clipboard';
        clipboardIcon.innerHTML = '<path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2"></path><path d="M9 3m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v0a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2z"></path>';
        
        const copySpan = document.createElement('span');
        copySpan.textContent = 'Copy as Markdown';
        
        copyButton.appendChild(clipboardIcon);
        copyButton.appendChild(copySpan);
        copyDiv.appendChild(copyButton);
        footer.appendChild(copyDiv);
    }
    
    // Add subtle search match indicator
    const matchIndicator = document.createElement('div');
    matchIndicator.className = 'flex items-center gap-2 text-accent';
    const matchIcon = document.createElement('svg');
    matchIcon.setAttribute('width', '24');
    matchIcon.setAttribute('height', '24');
    matchIcon.setAttribute('viewBox', '0 0 24 24');
    matchIcon.setAttribute('fill', 'none');
    matchIcon.setAttribute('stroke', 'currentColor');
    matchIcon.setAttribute('stroke-width', '2');
    matchIcon.setAttribute('stroke-linecap', 'round');
    matchIcon.setAttribute('stroke-linejoin', 'round');
    matchIcon.innerHTML = '<circle cx="11" cy="11" r="8"></circle><path d="M21 21l-4.35-4.35"></path>';
    
    const matchText = document.createElement('span');
    matchText.textContent = `${item.matchCount} match${item.matchCount > 1 ? 'es' : ''}`;
    
    matchIndicator.appendChild(matchIcon);
    matchIndicator.appendChild(matchText);
    footer.appendChild(matchIndicator);
    
    details.appendChild(footer);
    
    // Translation footer - exact same structure as original
    if (item.translations && item.translations.length > 0) {
        const translationsFooter = document.createElement('footer');
        translationsFooter.className = 'flex items-center gap-2 text-sm text-card-text-secondary mt-4';
        
        // Language icon
        const langIcon = document.createElement('svg');
        langIcon.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        langIcon.className = 'icon icon-tabler icon-tabler-language';
        langIcon.setAttribute('width', '24');
        langIcon.setAttribute('height', '24');
        langIcon.setAttribute('viewBox', '0 0 24 24');
        langIcon.setAttribute('stroke-width', '2');
        langIcon.setAttribute('stroke', 'currentColor');
        langIcon.setAttribute('fill', 'none');
        langIcon.setAttribute('stroke-linecap', 'round');
        langIcon.setAttribute('stroke-linejoin', 'round');
        langIcon.innerHTML = '<path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M4 5h7"></path><path d="M9 3v2c0 4.418 -2.239 8 -5 8"></path><path d="M5 9c-.003 2.144 2.952 3.908 6.7 4"></path><path d="M12 20l4 -9l4 9"></path><path d="M19.1 18h-6.2"></path>';
        
        const translationsDiv = document.createElement('div');
        item.translations.forEach((translation, index) => {
            if (index > 0) {
                translationsDiv.appendChild(document.createTextNode(' '));
            }
            const translationLink = document.createElement('a');
            translationLink.href = translation.url;
            translationLink.className = 'link';
            translationLink.textContent = translation.name;
            translationsDiv.appendChild(translationLink);
        });
        
        translationsFooter.appendChild(langIcon);
        translationsFooter.appendChild(translationsDiv);
        details.appendChild(translationsFooter);
    }
    
    header.appendChild(details);
    article.appendChild(header);
    
    return article;
}

export function renderDedicatedResult(item: pageData): HTMLElement {
    const article = document.createElement('article');
    const link = document.createElement('a');
    link.href = item.permalink;
    
    const details = document.createElement('div');
    details.className = 'article-details';
    
    const title = document.createElement('h2');
    title.className = 'article-title';
    title.innerHTML = item.title;
    
    const preview = document.createElement('section');
    preview.className = 'article-preview';
    preview.innerHTML = item.preview;
    
    details.appendChild(title);
    details.appendChild(preview);
    link.appendChild(details);
    
    if (item.image) {
        const imageDiv = document.createElement('div');
        imageDiv.className = 'article-image';
        const img = document.createElement('img');
        if (typeof item.image === 'string') {
            img.src = item.image;
        } else {
            img.src = item.image.src;
            if (item.image.srcset) {
                img.srcset = item.image.srcset;
            }
            if (item.image.width) {
                img.width = item.image.width;
            }
            if (item.image.height) {
                img.height = item.image.height;
            }
        }
        img.loading = 'lazy';
        imageDiv.appendChild(img);
        link.appendChild(imageDiv);
    }
    
    article.appendChild(link);
    return article;
}
