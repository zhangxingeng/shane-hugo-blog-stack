/**
 * Dynamic Layout Management for Collapsible Sidebars
 *
 * This script manages the collapsing and expanding of sidebars based on scroll position.
 * When a sidebar is scrolled completely out of view, it collapses to the side,
 * allowing the main content to expand. When scrolled back into view, it reappears.
 */

class DynamicLayoutManager {
    private leftSidebar: HTMLElement | null;
    private rightSidebar: HTMLElement | null;
    private mainLayout: HTMLElement | null;

    private leftSidebarState = { isCollapsed: false, originalY: 0, height: 0 };
    private rightSidebarState = { isCollapsed: false, originalY: 0, height: 0 };

    private ticking = false;

    constructor() {
        this.leftSidebar = document.getElementById('left-sidebar') as HTMLElement | null;
        this.rightSidebar = document.getElementById('right-sidebar') as HTMLElement | null;
        this.mainLayout = document.getElementById('main-layout') as HTMLElement | null;

        this.init();
    }

    private init(): void {
        if (!this.leftSidebar && !this.rightSidebar) {
            return;
        }

        // Use a timeout to ensure the DOM is fully rendered and positions are accurate.
        setTimeout(() => {
            this.storeOriginalPositions();
            this.updateLayout(); // Initial check after getting positions
        }, 100);

        window.addEventListener('scroll', this.onScroll.bind(this), { passive: true });
        window.addEventListener('resize', this.onResize.bind(this), { passive: true });
    }

    private storeOriginalPositions(): void {
        if (this.leftSidebar) {
            const wasCollapsed = this.leftSidebar.classList.contains('sidebar-collapsed-left');
            if (wasCollapsed) this.leftSidebar.classList.remove('sidebar-collapsed-left');
            
            this.leftSidebarState.originalY = this.leftSidebar.offsetTop;
            this.leftSidebarState.height = this.leftSidebar.offsetHeight;

            if (wasCollapsed) this.leftSidebar.classList.add('sidebar-collapsed-left');
        }
        if (this.rightSidebar) {
            const wasCollapsed = this.rightSidebar.classList.contains('sidebar-collapsed-right');
            if (wasCollapsed) this.rightSidebar.classList.remove('sidebar-collapsed-right');

            this.rightSidebarState.originalY = this.rightSidebar.offsetTop;
            this.rightSidebarState.height = this.rightSidebar.offsetHeight;
            
            if (wasCollapsed) this.rightSidebar.classList.add('sidebar-collapsed-right');
        }
    }

    private onScroll(): void {
        if (!this.ticking) {
            window.requestAnimationFrame(() => {
                this.updateLayout();
                this.ticking = false;
            });
            this.ticking = true;
        }
    }
    
    private onResize(): void {
        // Recalculate positions on resize
        this.storeOriginalPositions();
        this.updateLayout();
    }

    private updateLayout(): void {
        if (this.leftSidebar) {
            this.updateSidebarState(this.leftSidebar, this.leftSidebarState, 'left');
        }
        if (this.rightSidebar) {
            this.updateSidebarState(this.rightSidebar, this.rightSidebarState, 'right');
        }
    }

    private updateSidebarState(sidebar: HTMLElement, state: { isCollapsed: boolean, originalY: number, height: number }, side: 'left' | 'right'): void {
        const scrollY = window.scrollY;
        const originalBottom = state.originalY + state.height;

        // Collapse when the user has scrolled past the sidebar's original bottom position.
        const shouldBeCollapsed = scrollY > originalBottom;

        if (shouldBeCollapsed && !state.isCollapsed) {
            this.collapseSidebar(sidebar, state, side);
        } else if (!shouldBeCollapsed && state.isCollapsed) {
            this.expandSidebar(sidebar, state, side);
        }
    }

    private collapseSidebar(sidebar: HTMLElement, state: { isCollapsed: boolean, originalY: number, height: number }, side: 'left' | 'right'): void {
        state.isCollapsed = true;
        sidebar.classList.add(`sidebar-collapsed-${side}`);
        this.mainLayout?.classList.add(`${side}-sidebar-collapsed`);
    }

    private expandSidebar(sidebar: HTMLElement, state: { isCollapsed: boolean, originalY: number, height: number }, side: 'left' | 'right'): void {
        state.isCollapsed = false;
        sidebar.classList.remove(`sidebar-collapsed-${side}`);
        this.mainLayout?.classList.remove(`${side}-sidebar-collapsed`);
    }

    public destroy(): void {
        window.removeEventListener('scroll', this.onScroll.bind(this));
        window.removeEventListener('resize', this.onResize.bind(this));
    }
}

export default DynamicLayoutManager;