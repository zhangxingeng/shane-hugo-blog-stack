import { pageData, match, SearchOptions } from './search-types';
import { escapeRegExp, processMatches, replaceHTMLEnt, updateQueryString } from './search-utils';
import { renderInlineResult, renderDedicatedResult } from './search-renderer';

export class Search {
    private data: pageData[];
    private form: HTMLFormElement;
    private input: HTMLInputElement;
    private list: HTMLDivElement;
    private resultTitle: HTMLHeadElement | null;
    private resultTitleTemplate: string;
    private mode: 'dedicated' | 'inline';
    private originalContent: HTMLElement | null;
    private noResultsElement: HTMLElement | null;

    constructor(options: SearchOptions) {
        this.form = options.form;
        this.input = options.input;
        this.list = options.list;
        this.resultTitle = options.resultTitle || null;
        this.resultTitleTemplate = options.resultTitleTemplate || 'Found #PAGES_COUNT results in #TIME_SECONDS seconds';
        this.mode = options.mode || 'dedicated';
        this.originalContent = null;
        this.noResultsElement = options.noResultsElement || null;

        // Store original content for inline mode
        if (this.mode === 'inline') {
            // Store original content by serializing and preserving the exact HTML structure
            this.originalContent = this.list.cloneNode(true) as HTMLElement;
            
            // Ensure all image sources are preserved and properly accessible
            const images = this.originalContent.querySelectorAll('img');
            images.forEach(img => {
                // Store the original src and srcset as data attributes to preserve them
                if (img.src) {
                    img.setAttribute('data-original-src', img.src);
                }
                if (img.srcset) {
                    img.setAttribute('data-original-srcset', img.srcset);
                }
                // Ensure images maintain their loaded class
                if (!img.classList.contains('loaded')) {
                    img.classList.add('loaded');
                }
            });
        }

        /// Check if there's already value in the search input
        if (this.input.value.trim() !== '') {
            this.doSearch(this.input.value.split(' '));
        }
        else {
            // Only handle query string for dedicated search mode
            if (this.mode === 'dedicated') {
                this.handleQueryString();
            }
        }

        // Only bind query string changes for dedicated search
        if (this.mode === 'dedicated') {
            this.bindQueryStringChange();
        }
        this.bindSearchForm();
    }

    private searchKeywords(keywords: string[]): Promise<pageData[]> {
        return this.getData().then((rawData) => {
            const results: pageData[] = [];

            // Create combined regex like in old implementation
            const regex = new RegExp(keywords.filter((v) => {
                return v.trim() !== '';
            }).map(k => escapeRegExp(k.trim())).join('|'), 'gi');

            for (const item of rawData) {
                const titleMatches: match[] = [],
                    contentMatches: match[] = [];

                let result = {
                    ...item,
                    preview: '',
                    matchCount: 0
                }

                // Find content matches using matchAll like old implementation
                const contentMatchAll = item.content.matchAll(regex);
                for (const match of [...contentMatchAll]) {
                    contentMatches.push({
                        start: match.index!,
                        end: match.index! + match[0].length
                    });
                }

                // Find title matches using matchAll like old implementation  
                const titleMatchAll = item.title.matchAll(regex);
                for (const match of [...titleMatchAll]) {
                    titleMatches.push({
                        start: match.index!,
                        end: match.index! + match[0].length
                    });
                }

                if (titleMatches.length > 0) result.title = processMatches(result.title, titleMatches, false);
                if (contentMatches.length > 0) {
                    result.preview = processMatches(result.content, contentMatches);
                }
                else {
                    /// If there are no matches in the content, use the first 140 characters as preview
                    result.preview = replaceHTMLEnt(result.content.substring(0, 140));
                }

                result.matchCount = titleMatches.length + contentMatches.length;
                if (result.matchCount > 0) results.push(result);
            }

            /// Result with more matches appears first
            return results.sort((a, b) => {
                return b.matchCount - a.matchCount;
            });
        });
    }

    private doSearch(keywords: string[]) {
        const startTime = performance.now();

        this.searchKeywords(keywords).then((results) => {
            // Add smooth transition for search results
            this.list.style.opacity = '0.8';
            this.list.style.transition = 'opacity 0.15s ease-in-out';
            
            setTimeout(() => {
                this.clear();

                if (results.length === 0) {
                    this.showNoResults();
                } else {
                    this.hideNoResults();
                    // Use document fragment for better performance
                    const fragment = document.createDocumentFragment();
                    for (const item of results) {
                        if (this.mode === 'inline') {
                            fragment.append(renderInlineResult(item));
                        } else {
                            fragment.append(renderDedicatedResult(item));
                        }
                    }
                    this.list.append(fragment);
                }

                const endTime = performance.now();
                
                if (this.resultTitle) {
                    this.resultTitle.innerText = this.generateResultTitle(results.length, ((endTime - startTime) / 1000).toPrecision(1));
                }
                
                // Restore full opacity
                this.list.style.opacity = '1';
                
                // Remove transition after completion
                setTimeout(() => {
                    this.list.style.transition = '';
                }, 150);
            }, 50);
        }).catch((error) => {
            console.error('Search error:', error);
            this.clear();
            // Show error state
            if (this.resultTitle) {
                this.resultTitle.innerText = 'Search failed. Please try again.';
                this.resultTitle.style.color = 'var(--accent-color)';
            }
        });
    }

    private generateResultTitle(resultLen, time) {
        return this.resultTitleTemplate.replace("#PAGES_COUNT", resultLen).replace("#TIME_SECONDS", time);
    }

    public getData(): Promise<pageData[]> {
        if (!this.data) {
            /// Not fetched yet
            const jsonURL = this.form.dataset.json;
            if (!jsonURL) {
                console.error('Search form is missing data-json attribute');
                return Promise.reject(new Error('Search form is missing data-json attribute'));
            }
            
            return fetch(jsonURL).then(res => {
                if (!res.ok) {
                    throw new Error(`Failed to fetch search data: ${res.status} ${res.statusText}`);
                }
                return res.json();
            }).then((data) => {
                this.data = data;
                const parser = new DOMParser();

                for (const item of this.data) {
                    item.content = parser.parseFromString(item.content, 'text/html').body.innerText;
                }
                return this.data;
            }).catch(error => {
                console.error('Error fetching search data:', error);
                throw error;
            });
        }

        // Return a resolved promise for cached data  
        return Promise.resolve(this.data);
    }

    private bindSearchForm() {
        let lastSearch = '';
        let searchTimeout: any;

        const eventHandler = (e) => {
            if (e && e.preventDefault) e.preventDefault();
            const keywords = this.input.value.trim();

            // Only update query string for dedicated search mode
            if (this.mode === 'dedicated') {
                updateQueryString(keywords, true);
            }

            if (keywords === '') {
                lastSearch = '';
                if (this.mode === 'inline') {
                    return this.showOriginalContent();
                } else {
                    return this.clear();
                }
            }

            if (lastSearch === keywords) return;
            lastSearch = keywords;

            // Simple debouncing for better performance
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.doSearch(keywords.split(' '));
            }, this.mode === 'inline' ? 150 : 0);
        }

        this.input.addEventListener('input', eventHandler);
        this.input.addEventListener('compositionend', eventHandler);
    }

    private clear() {
        this.list.innerHTML = '';
        if (this.resultTitle) {
            this.resultTitle.innerText = '';
            this.resultTitle.style.color = ''; // Reset any error color
        }
    }

    private showNoResults() {
        if (this.noResultsElement) {
            this.noResultsElement.classList.remove('hidden');
        }
    }

    private hideNoResults() {
        if (this.noResultsElement) {
            this.noResultsElement.classList.add('hidden');
        }
    }

    private showOriginalContent() {
        if (this.originalContent && this.mode === 'inline') {
            // Add smooth transition when returning to original content
            this.list.style.opacity = '0.8';
            this.list.style.transition = 'opacity 0.15s ease-in-out';
            
            setTimeout(() => {
                // Clear the current content first
                this.list.innerHTML = '';
                
                // Restore original content by cloning and restoring image attributes
                const clonedOriginal = this.originalContent.cloneNode(true) as HTMLElement;
                
                // Restore image src and srcset from data attributes
                const images = clonedOriginal.querySelectorAll('img');
                images.forEach(img => {
                    const originalSrc = img.getAttribute('data-original-src');
                    const originalSrcset = img.getAttribute('data-original-srcset');
                    
                    if (originalSrc) {
                        img.src = originalSrc;
                        img.removeAttribute('data-original-src');
                    }
                    if (originalSrcset) {
                        img.srcset = originalSrcset;
                        img.removeAttribute('data-original-srcset');
                    }
                    // Ensure the loaded class is maintained
                    if (!img.classList.contains('loaded')) {
                        img.classList.add('loaded');
                    }
                });
                
                // Use document fragment for better performance
                const fragment = document.createDocumentFragment();
                while (clonedOriginal.firstChild) {
                    fragment.appendChild(clonedOriginal.firstChild);
                }
                this.list.appendChild(fragment);
                
                this.hideNoResults();
                if (this.resultTitle) {
                    this.resultTitle.textContent = '';
                    this.resultTitle.style.color = ''; // Reset any error color
                }
                
                // Restore full opacity
                this.list.style.opacity = '1';
                
                // Remove transition after completion
                setTimeout(() => {
                    this.list.style.transition = '';
                }, 150);
                
                // Re-initialize any event listeners or components that might be needed
                this.reinitializeComponents();
            }, 50);
        }
    }

    private reinitializeComponents() {
        // Re-initialize any components that might need event listeners
        // For example, copy-to-markdown buttons, image lazy loading, etc.
        const copyButtons = this.list.querySelectorAll('.copy-as-markdown button');
        copyButtons.forEach(button => {
            // Re-add click handler if needed - this would normally be handled by the main JS
            // but we're just ensuring the DOM is properly set up
        });
    }

    private bindQueryStringChange() {
        window.addEventListener('popstate', (e) => {
            this.handleQueryString()
        })
    }

    private handleQueryString() {
        const pageURL = new URL(window.location.toString());
        const keywords = pageURL.searchParams.get('keyword');
        this.input.value = keywords;

        if (keywords) {
            this.doSearch(keywords.split(' '));
        }
        else {
            this.clear()
        }
    }
}
