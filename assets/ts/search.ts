import { Search } from './search-core';

declare global {
    interface Window {
        searchResultTitleTemplate: string;
    }
}

// Efficient initialization that works for both dedicated search and inline widget search
function initializeSearch() {
    // Check for dedicated search page first
    const searchForm = document.querySelector('.search-form:not(.widget)') as HTMLFormElement;
    if (searchForm) {
        const searchInput = searchForm.querySelector('input') as HTMLInputElement;
        const searchResultList = document.querySelector('.search-result--list') as HTMLDivElement;
        const searchResultTitle = document.querySelector('.search-result--title') as HTMLHeadingElement;

        if (searchInput && searchResultList) {
            new Search({
                form: searchForm,
                input: searchInput,
                list: searchResultList,
                resultTitle: searchResultTitle,
                resultTitleTemplate: window.searchResultTitleTemplate || 'Found #PAGES_COUNT results in #TIME_SECONDS seconds',
                mode: 'dedicated'
            });
        } else {
            // Only show warnings in development mode
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                console.warn('Missing search elements for dedicated search:', {
                    searchInput: !!searchInput,
                    searchResultList: !!searchResultList
                });
            }
        }
    }

    // Widget search (inline) initialization - always check, don't return early
    const widgetSearchForm = document.querySelector('.search-form.widget') as HTMLFormElement;
    if (widgetSearchForm) {
        const searchInput = widgetSearchForm.querySelector('input') as HTMLInputElement;
        const postList = document.getElementById('post-list') as HTMLDivElement;
        const searchResultTitle = document.getElementById('search-result-title') as HTMLHeadingElement;
        const noResults = document.getElementById('search-no-results') as HTMLElement;
        
        // Get template from data attribute or fallback to window or default
        const templateElement = document.querySelector('.search-result-template') as HTMLElement;
        const resultTemplate = templateElement?.dataset.template || window.searchResultTitleTemplate || 'Found #PAGES_COUNT results in #TIME_SECONDS seconds';

        if (searchInput && postList) {
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
            // Only show warnings in development mode
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                console.warn('Missing search elements for inline search:', {
                    searchInput: !!searchInput,
                    postList: !!postList,
                    searchResultTitle: !!searchResultTitle,
                    noResults: !!noResults
                });
            }
        }
    }
}

// More reliable initialization that waits for DOM content to be loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSearch);
} else {
    // DOM is already loaded
    initializeSearch();
}

export { Search } from './search-core';
export default Search;
