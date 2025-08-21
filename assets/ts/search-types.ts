export interface pageData {
    title: string,
    date: string,
    permalink: string,
    content: string,
    image?: string | {
        src: string,
        srcset?: string,
        width?: number,
        height?: number
    },
    preview: string,
    matchCount: number,
    categories?: Array<{
        name: string,
        url: string
    }>,
    readingTime?: number,
    hasMarkdown?: boolean,
    translations?: Array<{
        name: string,
        url: string
    }>
}

export interface match {
    start: number,
    end: number
}

export interface SearchOptions {
    form: HTMLFormElement;
    input: HTMLInputElement;
    list: HTMLDivElement;
    resultTitle?: HTMLHeadElement;
    resultTitleTemplate?: string;
    mode?: 'dedicated' | 'inline';
    noResultsElement?: HTMLElement;
}

// Extend String interface to include matchAll if TypeScript doesn't recognize it
declare global {
    interface String {
        matchAll(regexp: RegExp): any;
    }
    var Promise: any;
}
