document.addEventListener('DOMContentLoaded', () => {
    const toggles = document.querySelectorAll('.menu-toggle');
    const dropdowns = document.querySelectorAll('.dropdown');

    // 1. Handle Master Hamburger Triggers for each Navbar individually
    toggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const targetId = toggle.getAttribute('data-target');
            const targetMenu = document.getElementById(targetId);

            // Toggle active look for the individual hamburger button and its slider drawer
            toggle.classList.toggle('open');
            targetMenu.classList.toggle('open');
        });
    });

    // 2. Handle Independent Dropdown/Accordion Toggles inside both navbars
    dropdowns.forEach(dropdown => {
        const link = dropdown.querySelector('.nav-link');
        
        link.addEventListener('click', (e) => {
            // Check if the page is currently in mobile viewport boundaries
            if (window.innerWidth <= 768) {
                e.preventDefault(); // Stop native navigation redirect links
                
                const isActive = dropdown.classList.contains('active');
                
                // Find only matching dropdown scopes within the exact same parent navigation container
                const parentNav = dropdown.closest('.nav-menu');
                const siblingDropdowns = parentNav.querySelectorAll('.dropdown');
                
                // Close other open sub-accordions within this navbar alone
                siblingDropdowns.forEach(d => d.classList.remove('active'));
                
                if (!isActive) {
                    dropdown.classList.add('active');
                }
            }
        });
    });
});