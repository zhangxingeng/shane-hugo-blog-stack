interface pageData {
    title: string,
    date: string,
    permalink: string,
    content: string,
    image?: string,
    preview: string,
    matchCount: number
}

interface match {
    start: number,
    end: number
}

// Extend String interface to include matchAll if TypeScript doesn't recognize it
declare global {
    interface String {
        matchAll(regexp: RegExp): any;
    }
    var Promise: any;
}

/**
 * Escape HTML tags as HTML entities
 * Edited from:
 * @link https://stackoverflow.com/a/5499821
 */
const tagsToReplace = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    '…': '&hellip;'
};

function replaceTag(tag) {
    return tagsToReplace[tag] || tag;
}

function replaceHTMLEnt(str) {
    return str.replace(/[&<>"]/g, replaceTag);
}

function escapeRegExp(string) {
    return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&');
}

interface SearchOptions {
    form: HTMLFormElement;
    input: HTMLInputElement;
    list: HTMLDivElement;
    resultTitle?: HTMLHeadElement;
    resultTitleTemplate?: string;
    mode?: 'dedicated' | 'inline';
    noResultsElement?: HTMLElement;
}

class Search {
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
            // Clone the list content immediately before any modifications
            this.originalContent = this.list.cloneNode(true) as HTMLElement;
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

    /**
     * Processes search matches
     * @param str original text
     * @param matches array of matches
     * @param ellipsis whether to add ellipsis to the end of each match
     * @param charLimit max length of preview string
     * @param offset how many characters before and after the match to include in preview
     * @returns preview string
     */
    private static processMatches(str: string, matches: match[], ellipsis: boolean = true, charLimit = 140, offset = 20): string {
        matches.sort((a, b) => {
            return a.start - b.start;
        });

        let i = 0,
            lastIndex = 0,
            charCount = 0;

        const resultArray: string[] = [];

        while (i < matches.length) {
            const item = matches[i];

            /// item.start >= lastIndex (equal only for the first iteration)
            /// because of the while loop that comes after, iterating over variable j

            if (ellipsis && item.start - offset > lastIndex) {
                resultArray.push(`${replaceHTMLEnt(str.substring(lastIndex, lastIndex + offset))} [...] `);
                resultArray.push(`${replaceHTMLEnt(str.substring(item.start - offset, item.start))}`);
                charCount += offset * 2;
            }
            else {
                /// If the match is too close to the end of last match, don't add ellipsis
                resultArray.push(replaceHTMLEnt(str.substring(lastIndex, item.start)));
                charCount += item.start - lastIndex;
            }

            let j = i + 1,
                end = item.end;

            /// Include as many matches as possible
            /// [item.start, end] is the range of the match
            while (j < matches.length && matches[j].start <= end) {
                end = Math.max(matches[j].end, end);
                ++j;
            }

            resultArray.push(`<mark>${replaceHTMLEnt(str.substring(item.start, end))}</mark>`);
            charCount += end - item.start;

            i = j;
            lastIndex = end;

            if (ellipsis && charCount > charLimit) break;
        }

        /// Add the rest of the string
        if (lastIndex < str.length) {
            let end = str.length;
            if (ellipsis) end = Math.min(end, lastIndex + offset);

            resultArray.push(`${replaceHTMLEnt(str.substring(lastIndex, end))}`);

            if (ellipsis && end != str.length) {
                resultArray.push(` [...]`);
            }
        }

        return resultArray.join('');
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
                for (const match of contentMatchAll) {
                    contentMatches.push({
                        start: match.index!,
                        end: match.index! + match[0].length
                    });
                }

                // Find title matches using matchAll like old implementation  
                const titleMatchAll = item.title.matchAll(regex);
                for (const match of titleMatchAll) {
                    titleMatches.push({
                        start: match.index!,
                        end: match.index! + match[0].length
                    });
                }

                if (titleMatches.length > 0) result.title = Search.processMatches(result.title, titleMatches, false);
                if (contentMatches.length > 0) {
                    result.preview = Search.processMatches(result.content, contentMatches);
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
            this.clear();

            if (results.length === 0) {
                this.showNoResults();
            } else {
                this.hideNoResults();
                for (const item of results) {
                    if (this.mode === 'inline') {
                        this.list.append(this.renderInlineResult(item));
                    } else {
                        this.list.append(Search.render(item));
                    }
                }
            }

            const endTime = performance.now();
            
            if (this.resultTitle) {
                this.resultTitle.innerText = this.generateResultTitle(results.length, ((endTime - startTime) / 1000).toPrecision(1));
            }
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
                Search.updateQueryString(keywords, true);
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
            this.list.innerHTML = this.originalContent.innerHTML;
            this.hideNoResults();
            if (this.resultTitle) {
                this.resultTitle.textContent = '';
            }
        }
    }

    private renderInlineResult(item: pageData) {
        const article = document.createElement('article');
        article.className = 'bg-card-bg rounded-card shadow-l1 overflow-hidden mb-8 hover:shadow-l3 hover:scale-[1.02] transition-all duration-300 group border border-card-separator hover:border-accent';
        
        const link = document.createElement('a');
        link.href = item.permalink;
        link.className = 'block p-4 sm:p-6 lg:p-8';
        
        const content = document.createElement('div');
        content.className = 'space-y-4';
        
        const title = document.createElement('h2');
        title.className = 'text-lg sm:text-xl lg:text-2xl font-bold text-card-text group-hover:text-accent transition-colors duration-300';
        title.innerHTML = item.title;
        
        const preview = document.createElement('div');
        preview.className = 'text-sm sm:text-base text-card-text-secondary';
        preview.innerHTML = item.preview;
        
        // Add date if available
        if (item.date) {
            const dateDiv = document.createElement('div');
            dateDiv.className = 'flex items-center gap-2 text-xs sm:text-sm text-card-text-tertiary';
            
            const dateIcon = document.createElement('svg');
            dateIcon.innerHTML = '<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>';
            dateIcon.setAttribute('class', 'w-4 h-4');
            dateIcon.setAttribute('fill', 'none');
            dateIcon.setAttribute('viewBox', '0 0 24 24');
            
            const dateText = document.createElement('time');
            dateText.textContent = new Date(item.date).toLocaleDateString();
            
            dateDiv.appendChild(dateIcon);
            dateDiv.appendChild(dateText);
            content.appendChild(dateDiv);
        }
        
        // Add image if available
        if (item.image) {
            const imageDiv = document.createElement('div');
            imageDiv.className = 'article-image mt-4';
            const img = document.createElement('img');
            img.src = item.image;
            img.loading = 'lazy';
            img.className = 'w-full h-32 object-cover rounded';
            imageDiv.appendChild(img);
            content.appendChild(imageDiv);
        }
        
        content.insertBefore(preview, content.lastChild);
        content.insertBefore(title, content.firstChild);
        link.appendChild(content);
        article.appendChild(link);
        
        return article;
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

    private static updateQueryString(keywords: string, replaceState = false) {
        const pageURL = new URL(window.location.toString());

        if (keywords === '') {
            pageURL.searchParams.delete('keyword')
        }
        else {
            pageURL.searchParams.set('keyword', keywords);
        }

        if (replaceState) {
            window.history.replaceState('', '', pageURL.toString());
        }
        else {
            window.history.pushState('', '', pageURL.toString());
        }
    }

    public static render(item: pageData) {
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
            img.src = item.image;
            img.loading = 'lazy';
            imageDiv.appendChild(img);
            link.appendChild(imageDiv);
        }
        
        article.appendChild(link);
        return article;
    }
}

declare global {
    interface Window {
        searchResultTitleTemplate: string;
    }
}

// Improved initialization that works for both dedicated search and inline widget search
function initializeSearch() {
    console.log('Initializing search...');
    
    // Dedicated search page initialization
    const searchForm = document.querySelector('.search-form:not(.widget)') as HTMLFormElement;
    if (searchForm) {
        console.log('Found dedicated search form');
        const searchInput = searchForm.querySelector('input') as HTMLInputElement;
        const searchResultList = document.querySelector('.search-result--list') as HTMLDivElement;
        const searchResultTitle = document.querySelector('.search-result--title') as HTMLHeadingElement;

        if (searchInput && searchResultList) {
            console.log('Initializing dedicated search');
            new Search({
                form: searchForm,
                input: searchInput,
                list: searchResultList,
                resultTitle: searchResultTitle,
                resultTitleTemplate: window.searchResultTitleTemplate || 'Found #PAGES_COUNT results in #TIME_SECONDS seconds',
                mode: 'dedicated'
            });
        } else {
            console.warn('Missing search elements for dedicated search:', {
                searchInput: !!searchInput,
                searchResultList: !!searchResultList
            });
        }
        return; // Exit early if dedicated search is found and processed
    }

    // Widget search (inline) initialization - only if no dedicated search found
    const widgetSearchForm = document.querySelector('.search-form.widget') as HTMLFormElement;
    if (widgetSearchForm) {
        console.log('Found widget search form');
        const searchInput = widgetSearchForm.querySelector('input') as HTMLInputElement;
        const postList = document.getElementById('post-list') as HTMLDivElement;
        const searchResultTitle = document.getElementById('search-result-title') as HTMLHeadingElement;
        const noResults = document.getElementById('search-no-results') as HTMLElement;
        
        // Get template from data attribute or fallback to window or default
        const templateElement = document.querySelector('.search-result-template') as HTMLElement;
        const resultTemplate = templateElement?.dataset.template || window.searchResultTitleTemplate || 'Found #PAGES_COUNT results in #TIME_SECONDS seconds';

        if (searchInput && postList) {
            console.log('Initializing inline search');
            new Search({
                form: widgetSearchForm,
                input: searchInput,
                list: postList,
                resultTitle: searchResultTitle,
                resultTitleTemplate: resultTemplate,
                mode: 'inline',
                noResultsElement: noResults
            });
        } else {
            console.warn('Missing search elements for inline search:', {
                searchInput: !!searchInput,
                postList: !!postList,
                searchResultTitle: !!searchResultTitle,
                noResults: !!noResults
            });
        }
    } else {
        console.log('No search forms found on this page');
    }
}

// More reliable initialization that waits for DOM content to be loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSearch);
} else {
    // DOM is already loaded
    initializeSearch();
}

export default Search;