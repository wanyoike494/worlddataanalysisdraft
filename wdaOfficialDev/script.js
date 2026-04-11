document.querySelectorAll('.dropdownTrigger').forEach(trigger => {//WDA Blogs and WDA Dashbooards are dropdown buttons. so here we select them 
    // since both have class of name dropdownTrigger and then loops over each one, calling each item trigger. trigger is a variable name that 
    // we call them.
    trigger.addEventListener('click', function(e){ //Attaches a click event listener to each trigger. Every time one is clicked, 
    // the function runs. The e parameter is the event object — it holds information about the click that just happened.
        e.preventDefault(); //Cancels the browser's default behaviour for that element. For example, if the trigger is an <a> tag, 
        // this stops it from navigating to a URL — we only want it to open the dropdown.
        const menu = this.nextElementSibling; //this refers to the specific trigger that was clicked. .nextElementSibling grabs the 
        // very next HTML element right after it in the DOM — which is assumed to be its corresponding .dropdownMenu. This is why your 
        // HTML structure must pair each trigger directly above its menu. in our case nextElementSibling is a <ul> tag so a list will appear.

        //close other open menu first
        document.querySelectorAll('.dropdownMenu').forEach(m => { //Selects all dropdown menus on the page and loops through them. For 
        // every menu that is not the one we just clicked, it removes the show class — effectively closing all other open dropdowns before 
        // opening the new one. This ensures only one dropdown is ever open at a time.
            if (m !== menu) m.classList.remove('show');
        });

        //Toggle current Menu
        menu.classList.toggle('show');//On the current menu (the one belonging to the clicked trigger), it toggles the show class 
        // — adding it if it's absent (opens the menu), or removing it if it's already there (closes the menu). Your CSS is responsible for 
        // actually hiding/showing the menu based on whether .show is present.
    });
});


window.addEventListener('click', function(e) { //Attaches a click listener to the entire browser window — so this fires on literally any click 
// anywhere on the page.
    if (!e.target.closest('.dropdownTrigger') && !e.target.closest('.dropdownMenu')) {//e.target is the exact element the user clicked. 
    // .closest() walks up the DOM tree from that element looking for a match. So this condition asks: "Did the user click something that 
    // is (or is inside) a trigger or a menu?" The ! negates both, meaning this block only runs if the answer is no — i.e., the user clicked 
    // somewhere completely outside.
        document.querySelectorAll('.dropdownMenu').forEach(m => {//Since the click was outside any dropdown-related element, all open menus 
        // are closed by removing the show class from every .dropdownMenu on the page.
            m.classList.remove('show');
        });
    }
});