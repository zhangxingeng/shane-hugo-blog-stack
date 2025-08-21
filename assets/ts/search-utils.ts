import { match } from './search-types';

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

export function replaceHTMLEnt(str) {
    return str.replace(/[&<>"]/g, replaceTag);
}

export function escapeRegExp(string) {
    return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&');
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
export function processMatches(str: string, matches: match[], ellipsis: boolean = true, charLimit = 140, offset = 20): string {
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

export function updateQueryString(keywords: string, replaceState = false) {
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
