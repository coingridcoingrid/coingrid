async function loadSidebar() {

    const container =
    document.getElementById("sidebar-container");

    if (!container) return;

    try {

        const response = await fetch("components/sidebar.html");
        
        container.innerHTML =
        await response.text();

        const sidebar =
        document.getElementById("sidebar");

        const overlay =
        document.getElementById("sidebarOverlay");

        const menuBtn =
        document.getElementById("menuBtn");

        const closeBtn =
        document.getElementById("closeSidebar");

        function openSidebar(){

            sidebar.classList.add("active");

            overlay.classList.add("active");

        }

        function closeSidebar(){

            sidebar.classList.remove("active");

            overlay.classList.remove("active");

        }

        if(menuBtn){

            menuBtn.addEventListener(
                "click",
                openSidebar
            );

        }

        if(closeBtn){

            closeBtn.addEventListener(
                "click",
                closeSidebar
            );

        }

        if(overlay){

            overlay.addEventListener(
                "click",
                closeSidebar
            );

        }

        document.addEventListener(
            "keydown",
            function(e){

                if(e.key==="Escape"){

                    closeSidebar();

                }

            }
        );

        /* ACTIVE PAGE */

        const current =
        window.location.pathname
        .split("/")
        .pop();

        document
        .querySelectorAll(".nav-links a")
        .forEach(link=>{

            const href =
            link.getAttribute("href");

            if(
                href &&
                href.endsWith(current)
            ){

                link.classList.add("active");

            }

        });

    }

    catch(error){

        console.error(
        "Sidebar Load Error:",
        error
        );

    }

}

document.addEventListener(
"DOMContentLoaded",
loadSidebar
);
