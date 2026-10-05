/* =========================================================
   HUNTMARK — APPLICATION LOGIC
   Hunt smarter. Know your land.
========================================================= */


/* =========================================================
   1. APPLICATION STATE
========================================================= */

const HuntMark = {

    activeTool: null,

    counts: {

        stands: 0,

        cameras: 0,

        foodPlots: 0,

        water: 0

    }

};


/* =========================================================
   2. ELEMENTS
========================================================= */

const elements = {

    mapTools:
        document.querySelectorAll(".map-tool"),

    navButtons:
        document.querySelectorAll(".nav-button"),

    mobileMenu:
        document.querySelector(".mobile-menu"),

    mainNav:
        document.querySelector(".main-nav"),

    standCount:
        document.getElementById("standCount"),

    cameraCount:
        document.getElementById("cameraCount"),

    foodCount:
        document.getElementById("foodCount"),

    waterCount:
        document.getElementById("waterCount"),

    locationButton:
        document.getElementById("locationButton"),

    satelliteButton:
        document.getElementById("satelliteButton")

};


/* =========================================================
   3. TOOL TYPES
========================================================= */

const toolTypes = {

    stand: {

        name: "Stand",

        message:
            "Click the map to place a hunting stand."

    },

    camera: {

        name: "Trail Camera",

        message:
            "Click the map to place a trail camera."

    },

    food: {

        name: "Food Plot",

        message:
            "Click the map to place a food plot."

    },

    water: {

        name: "Water Source",

        message:
            "Click the map to mark a water source."

    },

    trail: {

        name: "Trail",

        message:
            "Click the map to begin marking a trail."

    },

    boundary: {

        name: "Property Boundary",

        message:
            "Click around your property to create a boundary."

    }

};


/* =========================================================
   4. TOOL SELECTION
========================================================= */

function activateTool(toolName) {

    HuntMark.activeTool = toolName;


    elements.mapTools.forEach(button => {

        const isActive =
            button.id === `${toolName}Tool`;

        button.classList.toggle(
            "active",
            isActive
        );

    });


    const tool =
        toolTypes[toolName];


    if (tool) {

        showMessage(tool.message);

    }

}


function deactivateTool() {

    HuntMark.activeTool = null;


    elements.mapTools.forEach(button => {

        button.classList.remove(
            "active"
        );

    });

}


/* =========================================================
   5. MAP TOOL BUTTONS
========================================================= */

document
    .getElementById("standTool")
    .addEventListener("click", () => {

        activateTool("stand");

    });


document
    .getElementById("cameraTool")
    .addEventListener("click", () => {

        activateTool("camera");

    });


document
    .getElementById("foodTool")
    .addEventListener("click", () => {

        activateTool("food");

    });


document
    .getElementById("waterTool")
    .addEventListener("click", () => {

        activateTool("water");

    });


document
    .getElementById("trailTool")
    .addEventListener("click", () => {

        activateTool("trail");

    });


document
    .getElementById("boundaryTool")
    .addEventListener("click", () => {

        activateTool("boundary");

    });


/* =========================================================
   6. PROPERTY ACTION BUTTONS
========================================================= */

const primaryAction =
    document.querySelector(".primary-action");


primaryAction.addEventListener(
    "click",
    () => {

        activateTool("stand");

    }
);


const secondaryActions =
    document.querySelectorAll(
        ".secondary-action"
    );


secondaryActions.forEach(button => {

    button.addEventListener(
        "click",
        () => {

            const text =
                button.textContent.toLowerCase();


            if (text.includes("food")) {

                activateTool("food");

            }

            else if (text.includes("camera")) {

                activateTool("camera");

            }

            else if (text.includes("water")) {

                activateTool("water");

            }

            else if (text.includes("boundary")) {

                activateTool("boundary");

            }

        }
    );

});


/* =========================================================
   7. NAVIGATION
========================================================= */

elements.navButtons.forEach(button => {

    button.addEventListener(
        "click",
        () => {

            elements.navButtons.forEach(
                navButton => {

                    navButton.classList.remove(
                        "active"
                    );

                }
            );


            button.classList.add(
                "active"
            );


            const section =
                button.textContent.trim();


            showMessage(
                `${section} section selected.`
            );

        }
    );

});


/* =========================================================
   8. MOBILE MENU
========================================================= */

elements.mobileMenu.addEventListener(
    "click",
    () => {

        const isVisible =
            elements.mainNav.style.display ===
            "flex";


        if (isVisible) {

            elements.mainNav.style.display =
                "";

        }

        else {

            elements.mainNav.style.display =
                "flex";

            elements.mainNav.style.position =
                "absolute";

            elements.mainNav.style.top =
                "64px";

            elements.mainNav.style.left =
                "0";

            elements.mainNav.style.right =
                "0";

            elements.mainNav.style.height =
                "auto";

            elements.mainNav.style.padding =
                "10px";

            elements.mainNav.style.flexDirection =
                "column";

            elements.mainNav.style.background =
                "#10251B";

        }

    }
);


/* =========================================================
   9. MAP BUTTONS
========================================================= */

elements.locationButton.addEventListener(
    "click",
    () => {

        showMessage(
            "Location services will be connected to the HuntMark map next."
        );

    }
);


elements.satelliteButton.addEventListener(
    "click",
    () => {

        showMessage(
            "Satellite imagery will be connected to the map next."
        );

    }
);


/* =========================================================
   10. MESSAGE SYSTEM
========================================================= */

function showMessage(message) {

    let messageBox =
        document.getElementById(
            "huntmarkMessage"
        );


    if (!messageBox) {

        messageBox =
            document.createElement("div");

        messageBox.id =
            "huntmarkMessage";


        messageBox.style.position =
            "fixed";

        messageBox.style.zIndex =
            "5000";

        messageBox.style.left =
            "50%";

        messageBox.style.bottom =
            "25px";

        messageBox.style.transform =
            "translateX(-50%)";

        messageBox.style.padding =
            "10px 16px";

        messageBox.style.borderRadius =
            "999px";

        messageBox.style.background =
            "#10251B";

        messageBox.style.color =
            "#FFFFFF";

        messageBox.style.fontSize =
            "13px";

        messageBox.style.fontWeight =
            "750";

        messageBox.style.boxShadow =
            "0 8px 25px rgba(0,0,0,.25)";

        messageBox.style.pointerEvents =
            "none";


        document.body.appendChild(
            messageBox
        );

    }


    messageBox.textContent =
        message;


    messageBox.style.opacity =
        "1";


    clearTimeout(
        window.huntmarkMessageTimer
    );


    window.huntmarkMessageTimer =
        setTimeout(() => {

            messageBox.style.opacity =
                "0";

        }, 2500);

}


/* =========================================================
   11. INITIALIZE
========================================================= */

function initializeHuntMark() {

    console.log(
        "HuntMark initialized."
    );

    console.log(
        "Hunt smarter. Know your land."
    );

}


initializeHuntMark();
