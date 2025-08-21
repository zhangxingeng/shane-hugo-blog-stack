// Table of Contents functionality for mobile and desktop

function setupTOC() {
    // Setup sidebar TOC
    setupTOCInstance('sidebar-toc');
    
    // Setup mobile TOC
    setupTOCInstance('mobile-toc');
    
    // Setup reading progress
    setupReadingProgress();
    
    // Setup section highlighting for all TOCs
    setupSectionHighlighting();
}

function setupTOCInstance(idPrefix: string) {
    const tocToggle = document.getElementById(`${idPrefix}-toggle`);
    const tocContent = document.getElementById(`${idPrefix}-content`);
    const tocNavigation = document.getElementById(`${idPrefix}-navigation`) as HTMLElement;
    
    if (!tocNavigation) {
        return; // No TOC instance found
    }

    // TOC toggle functionality (if toggle button exists)
    if (tocToggle) {
        tocToggle.addEventListener('click', () => {
            const isExpanded = tocToggle.getAttribute('aria-expanded') === 'true';
            const newState = !isExpanded;
            
            tocToggle.setAttribute('aria-expanded', newState.toString());
            
            if (newState) {
                tocNavigation.classList.add('expanded');
                tocNavigation.style.maxHeight = tocNavigation.scrollHeight + 'px';
                
                // Rotate chevron icon
                const chevron = tocToggle.querySelector('svg');
                if (chevron) {
                    chevron.style.transform = 'rotate(180deg)';
                }
            } else {
                tocNavigation.classList.remove('expanded');
                tocNavigation.style.maxHeight = '0';
                
                // Reset chevron icon
                const chevron = tocToggle.querySelector('svg');
                if (chevron) {
                    chevron.style.transform = 'rotate(0deg)';
                }
            }
        });
    }

    // Auto-collapse TOC when clicking a link (mobile only)
    const tocLinks = tocNavigation.querySelectorAll('a');
    tocLinks.forEach((link, index) => {
        // Add keyboard navigation support
        link.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                const nextLink = tocLinks[index + 1] as HTMLElement;
                if (nextLink) nextLink.focus();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                const prevLink = tocLinks[index - 1] as HTMLElement;
                if (prevLink) prevLink.focus();
            } else if (e.key === 'Home') {
                e.preventDefault();
                (tocLinks[0] as HTMLElement).focus();
            } else if (e.key === 'End') {
                e.preventDefault();
                (tocLinks[tocLinks.length - 1] as HTMLElement).focus();
            }
        });
        
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Add visual feedback
            link.classList.add('clicked');
            setTimeout(() => link.classList.remove('clicked'), 200);
            
            // Smooth scroll to target
            const targetId = link.getAttribute('href')?.substring(1);
            if (targetId) {
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    // Get scroll offset from data attribute or use default
                    const headerOffset = parseInt(document.documentElement.dataset.scrollOffset || '80');
                    const elementPosition = targetElement.offsetTop;
                    const offsetPosition = elementPosition - headerOffset;

                    // Check if smooth scrolling is enabled
                    const smoothScroll = document.documentElement.dataset.smoothScroll !== 'false';
                    
                    window.scrollTo({
                        top: offsetPosition,
                        behavior: smoothScroll ? 'smooth' : 'auto'
                    });
                    
                    // Focus the target heading for accessibility
                    setTimeout(() => {
                        targetElement.setAttribute('tabindex', '-1');
                        targetElement.focus();
                        targetElement.removeAttribute('tabindex');
                    }, smoothScroll ? 500 : 0);
                }
            }
            
            // Auto-collapse on mobile (if enabled)
            const autoCollapseMobile = document.documentElement.dataset.autoCollapseMobile !== 'false';
            if (tocToggle && window.innerWidth < 1024 && autoCollapseMobile) {
                tocToggle.setAttribute('aria-expanded', 'false');
                tocNavigation.classList.remove('expanded');
                tocNavigation.style.maxHeight = '0';
                
                const chevron = tocToggle.querySelector('svg');
                if (chevron) {
                    chevron.style.transform = 'rotate(0deg)';
                }
            }
        });
    });

    // Handle window resize
    if (tocToggle) {
        window.addEventListener('resize', () => {
            if (window.innerWidth >= 1024) {
                // Desktop: reset mobile states
                tocToggle.setAttribute('aria-expanded', 'false');
                tocNavigation.classList.remove('expanded');
                tocNavigation.style.maxHeight = '';
                
                const chevron = tocToggle.querySelector('svg');
                if (chevron) {
                    chevron.style.transform = 'rotate(0deg)';
                }
            }
        });
    }
}

function setupReadingProgress() {
    const progressBar = document.getElementById('reading-progress-bar');
    const mobileProgressBar = document.getElementById('mobile-reading-progress-bar');
    
    const updateReadingProgress = () => {
        const article = document.querySelector('.article-content') as HTMLElement;
        if (!article) return;

        const articleTop = article.offsetTop;
        const articleHeight = article.offsetHeight;
        const windowHeight = window.innerHeight;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        const articleBottom = articleTop + articleHeight;
        const windowBottom = scrollTop + windowHeight;

        let progress = 0;
        if (scrollTop >= articleTop) {
            if (windowBottom >= articleBottom) {
                progress = 100;
            } else {
                const visibleHeight = windowBottom - articleTop;
                progress = (visibleHeight / articleHeight) * 100;
            }
        }

        progress = Math.min(100, Math.max(0, progress));
        
        // Update TOC progress indicator
        document.documentElement.style.setProperty('--scroll-progress', `${progress}%`);
        
        // Update reading progress bars
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
        if (mobileProgressBar) {
            mobileProgressBar.style.width = `${progress}%`;
        }
    };

    // Throttled scroll handler for performance
    let ticking = false;
    const handleScroll = () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                updateReadingProgress();
                ticking = false;
            });
            ticking = true;
        }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Initial progress calculation
    updateReadingProgress();
}

function setupSectionHighlighting() {
    // Check if section highlighting is enabled
    const highlightEnabled = document.documentElement.dataset.highlightCurrentSection !== 'false';
    if (!highlightEnabled) return;
    
    const allTocNavigations = document.querySelectorAll('.toc-navigation');
    
    if (allTocNavigations.length === 0) return;
    
    const highlightCurrentSection = () => {
        const headings = document.querySelectorAll('.article-content h1, .article-content h2, .article-content h3, .article-content h4, .article-content h5, .article-content h6');
        const scrollPosition = window.scrollY + 100; // Offset for better UX
        
        let currentHeading: HTMLElement | null = null;
        headings.forEach(heading => {
            const htmlHeading = heading as HTMLElement;
            if (htmlHeading.offsetTop <= scrollPosition) {
                currentHeading = htmlHeading;
            }
        });
        
        // Remove all active states from all TOC instances
        allTocNavigations.forEach(tocNav => {
            const links = tocNav.querySelectorAll('a');
            links.forEach(link => link.classList.remove('active'));
        });
        
        // Add active state to current section in all TOC instances
        if (currentHeading && currentHeading.id) {
            allTocNavigations.forEach(tocNav => {
                const activeLink = tocNav.querySelector(`a[href="#${currentHeading.id}"]`);
                if (activeLink) {
                    activeLink.classList.add('active');
                    
                    // Smooth scroll the TOC to show the active item
                    const tocContainer = tocNav.closest('.toc-navigation');
                    if (tocContainer) {
                        const containerRect = tocContainer.getBoundingClientRect();
                        const linkRect = activeLink.getBoundingClientRect();
                        
                        // Check if the active link is outside the visible area
                        if (linkRect.top < containerRect.top || linkRect.bottom > containerRect.bottom) {
                            activeLink.scrollIntoView({
                                behavior: 'smooth',
                                block: 'center'
                            });
                        }
                    }
                }
            });
        }
    };

    // Throttled scroll handler for section highlighting
    let highlightTicking = false;
    const handleSectionHighlight = () => {
        if (!highlightTicking) {
            requestAnimationFrame(() => {
                highlightCurrentSection();
                highlightTicking = false;
            });
            highlightTicking = true;
        }
    };

    window.addEventListener('scroll', handleSectionHighlight, { passive: true });
    
    // Initial section highlighting
    highlightCurrentSection();
}

export { setupTOC };
