/**
 * Slide up/down
 * Code from https://dev.to/bmsvieira/vanilla-js-slidedown-up-4dkn
 * @param target 
 * @param duration 
 */
let slideUp = (target: HTMLElement, duration = 500) => {
    target.classList.add('transiting');
    target.style.transitionProperty = 'height, margin, padding';
    target.style.transitionDuration = duration + 'ms';
    target.style.height = target.offsetHeight + 'px';
    target.offsetHeight;
    target.style.overflow = 'hidden';
    target.style.height = "0";
    target.style.paddingTop = "0";
    target.style.paddingBottom = "0";
    target.style.marginTop = "0";
    target.style.marginBottom = "0";
    window.setTimeout(() => {
        target.classList.remove('show');
        target.classList.add('hidden');
        target.style.removeProperty('height');
        target.style.removeProperty('padding-top');
        target.style.removeProperty('padding-bottom');
        target.style.removeProperty('margin-top');
        target.style.removeProperty('margin-bottom');
        target.style.removeProperty('overflow');
        target.style.removeProperty('transition-duration');
        target.style.removeProperty('transition-property');
        target.classList.remove('transiting');
    }, duration);
}

let slideDown = (target: HTMLElement, duration = 500) => {
    target.classList.add('transiting');
    target.classList.remove('hidden');
    target.classList.add('show');

    let height = target.offsetHeight;
    target.style.overflow = 'hidden';
    target.style.height = "0";
    target.style.paddingTop = "0";
    target.style.paddingBottom = "0";
    target.style.marginTop = "0";
    target.style.marginBottom = "0";
    target.offsetHeight;
    target.style.transitionProperty = "height, margin, padding";
    target.style.transitionDuration = duration + 'ms';
    target.style.height = height + 'px';
    target.style.removeProperty('padding-top');
    target.style.removeProperty('padding-bottom');
    target.style.removeProperty('margin-top');
    target.style.removeProperty('margin-bottom');
    window.setTimeout(() => {
        target.style.removeProperty('height');
        target.style.removeProperty('overflow');
        target.style.removeProperty('transition-duration');
        target.style.removeProperty('transition-property');
        target.classList.remove('transiting');
    }, duration);
}

let slideToggle = (target: HTMLElement, duration = 500) => {
    if (target.classList.contains('hidden')) {
        return slideDown(target, duration);
    } else {
        return slideUp(target, duration);
    }
}

export default function () {
    const toggleMenu = document.getElementById('toggle-menu');
    if (toggleMenu) {
        // Get animation duration from site params or use default
        const siteParams = (window as any).siteParams || {};
        const animationDuration = siteParams.navigation?.animationDuration || 300;
        
        // Ensure the menu is hidden on first load for mobile
        const mainMenu = document.getElementById('main-menu');
        if (mainMenu && window.innerWidth < 1024) {
            mainMenu.classList.remove('show');
            mainMenu.classList.add('hidden');
        }
        
        // Improved click handler with better UX
        toggleMenu.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const menuEl = document.getElementById('main-menu');
            if (!menuEl || menuEl.classList.contains('transiting')) return;
            
            const isMenuOpen = document.body.classList.contains('show-menu');
            
            if (isMenuOpen) {
                // Close menu
                document.body.classList.remove('show-menu');
                slideUp(menuEl as HTMLElement, animationDuration);
                toggleMenu.classList.remove('is-active');
                toggleMenu.setAttribute('aria-expanded', 'false');
            } else {
                // Open menu
                document.body.classList.add('show-menu');
                menuEl.classList.remove('hidden');
                slideDown(menuEl as HTMLElement, animationDuration);
                toggleMenu.classList.add('is-active');
                toggleMenu.setAttribute('aria-expanded', 'true');
            }
        });

        // Close menu on ESC
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const menuEl = document.getElementById('main-menu');
                if (document.body.classList.contains('show-menu')) {
                    document.body.classList.remove('show-menu');
                    if (menuEl && !menuEl.classList.contains('transiting')) {
                        slideUp(menuEl as HTMLElement, animationDuration);
                    }
                    toggleMenu.classList.remove('is-active');
                    toggleMenu.setAttribute('aria-expanded', 'false');
                }
            }
        });

        // Close menu when clicking outside (mobile only)
        document.addEventListener('click', (e) => {
            if (window.innerWidth >= 1024) return;
            
            const menuEl = document.getElementById('main-menu');
            const sidebar = document.querySelector('.sidebar');
            const isMenuOpen = document.body.classList.contains('show-menu');
            const target = e.target as Node;
            
            // Close menu if clicking outside sidebar area (but not on hamburger)
            if (isMenuOpen && sidebar && !sidebar.contains(target) && !toggleMenu.contains(target)) {
                document.body.classList.remove('show-menu');
                if (menuEl && !menuEl.classList.contains('transiting')) {
                    slideUp(menuEl as HTMLElement, animationDuration);
                }
                toggleMenu.classList.remove('is-active');
                toggleMenu.setAttribute('aria-expanded', 'false');
            }
        });

        // Reset menu visibility when resizing to desktop
        window.addEventListener('resize', () => {
            const menuEl = document.getElementById('main-menu') as HTMLElement;
            if (window.innerWidth >= 1024) {
                // Show menu, remove overlay state
                if (menuEl) {
                    menuEl.classList.remove('hidden');
                    menuEl.classList.add('show');
                }
                document.body.classList.remove('show-menu');
                toggleMenu.classList.remove('is-active');
                toggleMenu.setAttribute('aria-expanded', 'false');
            } else {
                // Hide menu for mobile initial state
                if (menuEl && !toggleMenu.classList.contains('is-active')) {
                    menuEl.classList.remove('show');
                    menuEl.classList.add('hidden');
                }
            }
        });
    }
}