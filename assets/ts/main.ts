/*!
*   Hugo Theme Stack
*
*/
import StackGallery from "ts/gallery";
import { getColor } from 'ts/color';
import menu from 'ts/menu';
import createElement from 'ts/createElement';
import StackColorScheme from 'ts/colorScheme';
import { setupScrollspy } from 'ts/scrollspy';
import { setupSmoothAnchors } from "ts/smoothAnchors";
import { setupTOC } from 'ts/toc';
import Search from 'ts/search';

let Stack = {
    init: () => {
        /**
         * Bind menu event
         */
        menu();

        const articleContent = document.querySelector('.article-content') as HTMLElement;
        if (articleContent) {
            new StackGallery(articleContent);
            setupSmoothAnchors();
            setupScrollspy();
            setupTOC();
        }

        /**
         * Initialize copy as markdown functionality
         */
        Stack.initCopyAsMarkdown();

        /**
         * Add linear gradient background to tile style article
         */
        const articleTile = document.querySelector('.article-list--tile');
        if (articleTile) {
            let observer = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting) return;
                    observer.unobserve(entry.target);

                    const articles = entry.target.querySelectorAll('article.has-image');
                    articles.forEach(articles => {
                        const image = articles.querySelector('img'),
                            imageURL = image.src,
                            key = image.getAttribute('data-key'),
                            hash = image.getAttribute('data-hash'),
                            articleDetails: HTMLDivElement = articles.querySelector('.article-details');

                        getColor(key, hash, imageURL).then(colors => {

                            articleDetails.style.background = `
                            linear-gradient(0deg, 
                                rgba(${colors.DarkMuted.rgb[0]}, ${colors.DarkMuted.rgb[1]}, ${colors.DarkMuted.rgb[2]}, 0.5) 0%, 
                                rgba(${colors.Vibrant.rgb[0]}, ${colors.Vibrant.rgb[1]}, ${colors.Vibrant.rgb[2]}, 0.75) 100%)`;
                        });
                    })
                })
            });

            observer.observe(articleTile)
        }


        /**
         * Add copy button to code block
        */
        const highlights = document.querySelectorAll('.article-content div.highlight');
        const copyText = `Copy`,
            copiedText = `Copied!`;

        highlights.forEach(highlight => {
            const copyButton = document.createElement('button');
            copyButton.innerHTML = copyText;
            copyButton.classList.add('copyCodeButton');
            highlight.appendChild(copyButton);

            const codeBlock = highlight.querySelector('code[data-lang]');
            if (!codeBlock) return;

            copyButton.addEventListener('click', () => {
                navigator.clipboard.writeText(codeBlock.textContent)
                    .then(() => {
                        copyButton.textContent = copiedText;

                        setTimeout(() => {
                            copyButton.textContent = copyText;
                        }, 1000);
                    })
                    .catch(err => {
                        alert(err)
                        console.log('Something went wrong', err);
                    });
            });
        });

        new StackColorScheme(document.getElementById('dark-mode-toggle'));
        
        /**
         * Initialize search functionality
         */
        // The Search class has its own initialization, but we need to ensure it's included in the bundle
        if (Search) {
            // Search will auto-initialize via its own event listeners
            console.log('Search functionality loaded');
        }
        
        /**
         * Initialize back to top button
         */
        Stack.initBackToTop();
        
        /**
         * Initialize image loading enhancements
         */
        Stack.initImageEnhancements();
        
        /**
         * Initialize related articles functionality
         */
        Stack.initRelatedArticles();
    },

    initCopyAsMarkdown: () => {
        const copyButtons = document.querySelectorAll('.copy-as-markdown button');
        
        // Check for llms.txt format first, then fallback to markdown
        let llmsLink = document.querySelector('link[type="text/plain"]') as HTMLLinkElement;
        const markdownLink = document.querySelector('link[type="text/markdown"]') as HTMLLinkElement;
        
        // If no plain text link, try to construct llms.txt URL
        if (!llmsLink && markdownLink) {
            const currentUrl = new URL(window.location.href);
            const pathname = currentUrl.pathname;
            const llmsUrl = pathname.charAt(pathname.length - 1) === '/' 
                ? pathname + 'llms.txt'
                : pathname + '/llms.txt';
            llmsLink = { href: llmsUrl } as HTMLLinkElement;
        }
        
        const preferredLink = llmsLink || markdownLink;
        if (preferredLink) {
            document.body.classList.add('has-markdown');
        }
        
        copyButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                
                fetch(preferredLink.href)
                    .then(response => response.text())
                    .then(content => navigator.clipboard.writeText(content))
                    .then(() => {
                        // Show feedback using i18n translations
                        const span = button.querySelector('span') as HTMLElement;
                        const originalText = button.getAttribute('data-copy-text') || span.textContent;
                        const copiedText = button.getAttribute('data-copied-text') || 'Copied!';
                        span.textContent = copiedText;
                        
                        setTimeout(() => {
                            span.textContent = originalText;
                        }, 2000);
                    })
                    .catch(err => {
                        console.error('Failed to copy content:', err);
                        alert('Failed to copy content. Please try again.');
                    });
            });
        });
    },

    initBackToTop: () => {
        const backToTopButton = document.getElementById('back-to-top');
        if (!backToTopButton) return;

        // Get threshold from data attribute or default to 300
        const threshold = parseInt(backToTopButton.getAttribute('data-threshold') || '300');

        // Show/hide button based on scroll position
        const toggleVisibility = () => {
            if (window.scrollY > threshold) {
                backToTopButton.classList.remove('opacity-0', 'pointer-events-none');
                backToTopButton.classList.add('opacity-100', 'pointer-events-auto');
            } else {
                backToTopButton.classList.add('opacity-0', 'pointer-events-none');
                backToTopButton.classList.remove('opacity-100', 'pointer-events-auto');
            }
        };

        // Throttle scroll events for better performance
        let ticking = false;
        const handleScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    toggleVisibility();
                    ticking = false;
                });
                ticking = true;
            }
        };

        // Smooth scroll to top
        const scrollToTop = () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        };

        // Event listeners
        window.addEventListener('scroll', handleScroll, { passive: true });
        backToTopButton.addEventListener('click', scrollToTop);

        // Initial check
        toggleVisibility();
    },

    initImageEnhancements: () => {
        // Lazy loading image enhancement
        const lazyImages = document.querySelectorAll('img[loading="lazy"]');
        
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target as HTMLImageElement;
                        img.addEventListener('load', () => {
                            img.classList.add('loaded');
                        });
                        
                        // If image is already loaded
                        if (img.complete) {
                            img.classList.add('loaded');
                        }
                        
                        observer.unobserve(img);
                    }
                });
            });

            lazyImages.forEach(img => imageObserver.observe(img));
        } else {
            // Fallback for browsers without IntersectionObserver
            lazyImages.forEach(img => {
                (img as HTMLImageElement).classList.add('loaded');
            });
        }

        // Add click-to-zoom functionality for article images
        const articleImages = document.querySelectorAll('.article-content img:not(.no-zoom)');
        articleImages.forEach(img => {
            img.addEventListener('click', () => {
                Stack.openImageModal(img as HTMLImageElement);
            });
            
            // Add cursor pointer to indicate clickable
            (img as HTMLElement).style.cursor = 'pointer';
        });
    },

    openImageModal: (img: HTMLImageElement) => {
        // Create modal overlay
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4';
        modal.style.backdropFilter = 'blur(4px)';
        
        // Create modal image
        const modalImg = document.createElement('img');
        modalImg.src = img.src;
        modalImg.alt = img.alt;
        modalImg.className = 'max-w-full max-h-full object-contain rounded-lg shadow-2xl';
        
        // Create close button
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.className = 'absolute top-4 right-4 text-white text-4xl font-bold hover:text-gray-300 transition-colors duration-200 w-12 h-12 flex items-center justify-center rounded-full bg-black bg-opacity-50';
        closeBtn.setAttribute('aria-label', 'Close image');
        
        modal.appendChild(modalImg);
        modal.appendChild(closeBtn);
        document.body.appendChild(modal);
        
        // Close modal functionality
        const closeModal = () => {
            document.body.removeChild(modal);
            document.body.style.overflow = '';
        };
        
        closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
        
        // Close on Escape key
        const handleKeydown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleKeydown);
            }
        };
        document.addEventListener('keydown', handleKeydown);
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        
        // Add fade-in animation
        modal.style.opacity = '0';
        requestAnimationFrame(() => {
            modal.style.transition = 'opacity 0.3s ease';
            modal.style.opacity = '1';
        });
    },

    initRelatedArticles: () => {
        // Initialize related articles animations
        const relatedArticles = document.querySelectorAll('.related-content-animate');
        
        if (relatedArticles.length > 0) {
            // Trigger animations with staggered delay
            relatedArticles.forEach((article, index) => {
                setTimeout(() => {
                    article.classList.remove('opacity-0');
                }, index * 100);
            });
        }

        // Initialize show more functionality for mobile
        const showMoreBtn = document.getElementById('show-more-related');
        if (showMoreBtn) {
            let isExpanded = false;
            
            const toggleRelatedArticles = () => {
                const hiddenArticles = document.querySelectorAll('[data-article-index]');
                const btnText = showMoreBtn.querySelector('.show-more-text') as HTMLElement;
                const btnIcon = showMoreBtn.querySelector('svg') as SVGElement;
                
                if (!isExpanded) {
                    // Show hidden articles
                    hiddenArticles.forEach((article, index) => {
                        const articleIndex = parseInt(article.getAttribute('data-article-index') || '0');
                        if (articleIndex >= 3) {
                            article.classList.remove('hidden');
                            // Animate in with delay
                            setTimeout(() => {
                                article.classList.remove('opacity-0');
                            }, (articleIndex - 3) * 100);
                        }
                    });
                    
                    btnText.textContent = 'Show Less Articles';
                    btnIcon.style.transform = 'rotate(180deg)';
                    isExpanded = true;
                } else {
                    // Hide articles beyond first 3
                    hiddenArticles.forEach(article => {
                        const articleIndex = parseInt(article.getAttribute('data-article-index') || '0');
                        if (articleIndex >= 3) {
                            article.classList.add('opacity-0');
                            setTimeout(() => {
                                article.classList.add('hidden');
                            }, 300);
                        }
                    });
                    
                    btnText.textContent = 'Show More Articles';
                    btnIcon.style.transform = 'rotate(0deg)';
                    isExpanded = false;
                }
            };
            
            // Make function globally accessible
            (window as any).toggleRelatedArticles = toggleRelatedArticles;
        }
    }
}

window.addEventListener('load', () => {
    setTimeout(function () {
        Stack.init();
    }, 0);
})

declare global {
    interface Window {
        createElement: any;
        Stack: any
    }
}

window.Stack = Stack;
window.createElement = createElement;