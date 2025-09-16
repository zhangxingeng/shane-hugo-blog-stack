/**
 * Dynamic Layout Management
 * Expands main content when sidebars scroll out of view
 */

interface LayoutElements {
    leftSidebar: HTMLElement | null;
    rightSidebar: HTMLElement | null;
    mainContent: HTMLElement | null;
    container: HTMLElement | null;
}

class DynamicLayoutManager {
    private elements: LayoutElements;
    private isExpanded = false;
    private observer: IntersectionObserver | null = null;
    private expandThreshold = 0.1; // When 10% or less of sidebars are visible
    private leftSidebarVisible = true;
    private rightSidebarVisible = true;
    private sidebarOffsets: { left: number; right: number } = { left: 0, right: 0 };
    private lastScrollY = 0;
    private scrollHandler: EventListener | null = null;

    constructor() {
        this.elements = {
            leftSidebar: document.querySelector('#left-sidebar'),
            rightSidebar: document.querySelector('#right-sidebar'),
            mainContent: document.querySelector('#main-content'),
            container: document.querySelector('#main-layout')
        };

        // Fallback for right sidebar if not found by ID
        if (!this.elements.rightSidebar) {
            const altRightSidebar = document.querySelector('aside.order-3');
            if (altRightSidebar) {
                this.elements.rightSidebar = altRightSidebar as HTMLElement;
            }
        }

        // Initialize visibility states based on element existence
        this.leftSidebarVisible = !!this.elements.leftSidebar;
        this.rightSidebarVisible = !!this.elements.rightSidebar;

        this.init();
    }

    private init(): void {
        if (!this.elements.mainContent) return;

        // Only proceed if we have at least one sidebar
        if (!this.elements.leftSidebar && !this.elements.rightSidebar) return;

        this.calculateSidebarOffsets();
        this.setupScrollListener();
    }

    private calculateSidebarOffsets(): void {
        if (this.elements.leftSidebar) {
            this.sidebarOffsets.left = this.elements.leftSidebar.offsetTop + this.elements.leftSidebar.offsetHeight;
        }

        if (this.elements.rightSidebar) {
            this.sidebarOffsets.right = this.elements.rightSidebar.offsetTop + this.elements.rightSidebar.offsetHeight;
        }
    }

    private setupScrollListener(): void {
        this.scrollHandler = this.throttle(this.handleScroll.bind(this), 16); // ~60fps
        window.addEventListener('scroll', this.scrollHandler, { passive: true });

        // Initial check
        this.handleScroll();
    }

    private throttle(func: Function, wait: number): EventListener {
        let timeout: number | null = null;
        let previous = 0;

        return function(this: any) {
            const now = Date.now();
            const remaining = wait - (now - previous);

            if (remaining <= 0 || remaining > wait) {
                if (timeout) {
                    clearTimeout(timeout);
                    timeout = null;
                }
                previous = now;
                func.apply(this, arguments);
            } else if (!timeout) {
                timeout = window.setTimeout(() => {
                    previous = Date.now();
                    timeout = null;
                    func.apply(this, arguments);
                }, remaining);
            }
        } as EventListener;
    }

    private handleScroll(): void {
        const currentScrollY = window.scrollY;
        const buffer = 100; // Buffer zone in pixels

        // Calculate which sidebars are out of view
        const leftOutOfView = this.elements.leftSidebar ?
            (currentScrollY + buffer) > this.sidebarOffsets.left : true;
        const rightOutOfView = this.elements.rightSidebar ?
            (currentScrollY + buffer) > this.sidebarOffsets.right : true;

        // Determine if we should expand
        const shouldExpand = this.shouldExpandLayout(leftOutOfView, rightOutOfView);

        if (shouldExpand !== this.isExpanded) {
            this.toggleLayout(shouldExpand);
        }

        this.lastScrollY = currentScrollY;
    }

    private shouldExpandLayout(leftOutOfView: boolean, rightOutOfView: boolean): boolean {
        // If no sidebars exist, don't expand
        if (!this.elements.leftSidebar && !this.elements.rightSidebar) return false;

        // If both sidebars exist, expand when left sidebar is out of view
        // (The right sidebar might be much taller due to TOC, so we don't wait for it)
        if (this.elements.leftSidebar && this.elements.rightSidebar) {
            return leftOutOfView;
        }

        // If only left sidebar exists
        if (this.elements.leftSidebar && !this.elements.rightSidebar) {
            return leftOutOfView;
        }

        // If only right sidebar exists
        if (!this.elements.leftSidebar && this.elements.rightSidebar) {
            return rightOutOfView;
        }

        return false;
    }

    private toggleLayout(expand: boolean): void {
        if (!this.elements.mainContent) return;

        this.isExpanded = expand;

        // Apply expansion classes with smooth animation
        if (expand) {
            this.expandLayout();
        } else {
            this.contractLayout();
        }
    }

    private expandLayout(): void {
        const { mainContent, leftSidebar, rightSidebar, container } = this.elements;

        if (!mainContent) return;

        // Add expanded classes
        mainContent.classList.add(
            'lg:!w-full',
            'xl:!w-full',
            'max-w-none',
            'layout-expanded'
        );

        // Hide sidebars with fade effect
        if (leftSidebar) {
            leftSidebar.classList.add(
                'lg:!w-0',
                'lg:overflow-hidden',
                'lg:opacity-0',
                'lg:!hidden',
                'sidebar-collapsed'
            );
        }

        if (rightSidebar) {
            // More aggressive hiding - set inline styles to override any CSS
            rightSidebar.style.width = '0px';
            rightSidebar.style.minWidth = '0px';
            rightSidebar.style.maxWidth = '0px';
            rightSidebar.style.opacity = '0';
            rightSidebar.style.visibility = 'hidden';
            rightSidebar.style.overflow = 'hidden';
            rightSidebar.style.display = 'none';

            rightSidebar.classList.add(
                'lg:!w-0',
                'lg:overflow-hidden',
                'lg:opacity-0',
                'lg:!hidden',
                'sidebar-collapsed'
            );
        }

        if (container) {
            container.classList.add('layout-expanded-container');
        }

        // Dispatch custom event for other components to react
        window.dispatchEvent(new CustomEvent('layoutExpanded', {
            detail: { expanded: true }
        }));
    }

    private contractLayout(): void {
        const { mainContent, leftSidebar, rightSidebar, container } = this.elements;

        if (!mainContent) return;

        // Remove expanded classes
        mainContent.classList.remove(
            'lg:!w-full',
            'xl:!w-full',
            'max-w-none',
            'layout-expanded'
        );

        // Restore sidebars
        if (leftSidebar) {
            leftSidebar.classList.remove(
                'lg:!w-0',
                'lg:overflow-hidden',
                'lg:opacity-0',
                'lg:!hidden',
                'sidebar-collapsed'
            );
        }

        if (rightSidebar) {
            // Clear inline styles to restore original CSS
            rightSidebar.style.width = '';
            rightSidebar.style.minWidth = '';
            rightSidebar.style.maxWidth = '';
            rightSidebar.style.opacity = '';
            rightSidebar.style.visibility = '';
            rightSidebar.style.overflow = '';
            rightSidebar.style.display = '';

            rightSidebar.classList.remove(
                'lg:!w-0',
                'lg:overflow-hidden',
                'lg:opacity-0',
                'lg:!hidden',
                'sidebar-collapsed'
            );
        }

        if (container) {
            container.classList.remove('layout-expanded-container');
        }

        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('layoutExpanded', {
            detail: { expanded: false }
        }));
    }

    // Public method to manually trigger layout change (for testing)
    public forceExpand(expand: boolean): void {
        this.toggleLayout(expand);
    }

    // Clean up scroll listener
    public destroy(): void {
        if (this.scrollHandler) {
            window.removeEventListener('scroll', this.scrollHandler);
            this.scrollHandler = null;
        }
    }
}

export default DynamicLayoutManager;