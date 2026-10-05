// ============================================
// HUNTMARK - Main Application
// ============================================

const HuntMark = {
    activeTool: null,
    satelliteMode: false,

    counts: {
        stands: 0,
        cameras: 0,
        food: 0,
        water: 0
    },

    boundaryPoints: [],
    boundaryMarkers: [],
    boundaryLine: null,
    boundaryPolygon: null
};

let map;
let standardLayer;
let satelliteLayer;


// ============================================
// MAP
// ============================================

function initializeMap() {

    const mapElement = document.getElementById("map");

    if (!mapElement || typeof L === "undefined") {
        console.error("HuntMark: Leaflet map could not be initialized.");
        return;
    }

    map = L.map("map", {
        zoomControl: true
    }).setView([36.2140, -83.2949], 13);

    standardLayer = L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,
            attribution: "&copy; OpenStreetMap contributors"
        }
    );

    satelliteLayer = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
            maxZoom: 19,
            attribution: "Tiles &copy; Esri"
        }
    );

    standardLayer.addTo(map);


    // ========================================
    // MAP CLICK
    // ========================================

    map.on("click", function(event) {

        if (!HuntMark.activeTool) {
            return;
        }

        const lat = event.latlng.lat;
        const lng = event.latlng.lng;


        switch (HuntMark.activeTool) {

            case "stand":

                addMapMarker(
                    lat,
                    lng,
                    "🦌",
                    "Stand",
                    "stands"
                );

                break;


            case "camera":

                addMapMarker(
                    lat,
                    lng,
                    "📷",
                    "Trail Camera",
                    "cameras"
                );

                break;


            case "food":

                addMapMarker(
                    lat,
                    lng,
                    "🌱",
                    "Food Plot",
                    "food"
                );

                break;


            case "water":

                addMapMarker(
                    lat,
                    lng,
                    "💧",
                    "Water Source",
                    "water"
                );

                break;


            case "trail":

                showMessage(
                    `Trail point placed at ${lat.toFixed(5)}, ${lng.toFixed(5)}`
                );

                break;


            case "boundary":

                addBoundaryPoint(
                    lat,
                    lng
                );

                break;
        }

    });


    console.log("HuntMark map initialized.");
}


// ============================================
// TOOL BUTTONS
// ============================================

const toolButtons = {
    stand: document.getElementById("standTool"),
    camera: document.getElementById("cameraTool"),
    food: document.getElementById("foodTool"),
    water: document.getElementById("waterTool"),
    trail: document.getElementById("trailTool"),
    boundary: document.getElementById("boundaryTool")
};


const toolMessages = {

    stand:
        "Stand placement mode activated. Click the map to place a stand.",

    camera:
        "Trail camera mode activated. Click the map to place a camera.",

    food:
        "Food plot mode activated. Click the map to place a food plot.",

    water:
        "Water source mode activated. Click the map to mark water.",

    trail:
        "Trail planning mode activated.",

    boundary:
        "Boundary mode activated. Click around your property to draw the boundary."
};


function activateTool(tool) {

    HuntMark.activeTool = tool;

    Object.values(toolButtons).forEach(button => {

        if (button) {
            button.classList.remove("active");
        }

    });


    if (toolButtons[tool]) {
        toolButtons[tool].classList.add("active");
    }


    if (tool === "boundary") {

        startBoundary();

    } else {

        removeBoundaryControls();

    }


    showMessage(toolMessages[tool]);
}


function deactivateTool() {

    HuntMark.activeTool = null;

    Object.values(toolButtons).forEach(button => {

        if (button) {
            button.classList.remove("active");
        }

    });

}


// ============================================
// CONNECT TOOL BUTTONS
// ============================================

Object.entries(toolButtons).forEach(([tool, button]) => {

    if (!button) {
        return;
    }

    button.addEventListener("click", function() {

        if (HuntMark.activeTool === tool) {

            if (tool === "boundary") {
                cancelBoundary();
            }

            deactivateTool();

            showMessage("Tool deactivated.");

        } else {

            activateTool(tool);

        }

    });

});


// ============================================
// BOUNDARY SYSTEM
// ============================================

function startBoundary() {

    clearTemporaryBoundary();

    HuntMark.boundaryPoints = [];

    createBoundaryControls();

    updateBoundaryStatus();

}


function addBoundaryPoint(lat, lng) {

    if (HuntMark.activeTool !== "boundary") {
        return;
    }


    const point = L.latLng(lat, lng);

    HuntMark.boundaryPoints.push(point);


    const marker = L.circleMarker(point, {

        radius: 6,

        weight: 2,

        color: "#D97706",

        fillColor: "#D97706",

        fillOpacity: 1

    }).addTo(map);


    HuntMark.boundaryMarkers.push(marker);


    updateBoundaryLine();

    updateBoundaryStatus();


    showMessage(
        `Boundary point ${HuntMark.boundaryPoints.length} added.`
    );

}


function updateBoundaryLine() {

    if (HuntMark.boundaryLine) {

        map.removeLayer(
            HuntMark.boundaryLine
        );

    }


    if (HuntMark.boundaryPoints.length < 2) {
        return;
    }


    HuntMark.boundaryLine = L.polyline(

        HuntMark.boundaryPoints,

        {
            color: "#D97706",
            weight: 4,
            dashArray: "8, 8"
        }

    ).addTo(map);

}


function finishBoundary() {

    if (HuntMark.boundaryPoints.length < 3) {

        showMessage(
            "You need at least 3 points to create a boundary."
        );

        return;
    }


    if (HuntMark.boundaryLine) {

        map.removeLayer(
            HuntMark.boundaryLine
        );

        HuntMark.boundaryLine = null;

    }


    if (HuntMark.boundaryPolygon) {

        map.removeLayer(
            HuntMark.boundaryPolygon
        );

    }


    HuntMark.boundaryPolygon = L.polygon(

        HuntMark.boundaryPoints,

        {
            color: "#D97706",
            weight: 4,
            fillColor: "#D97706",
            fillOpacity: 0.18
        }

    ).addTo(map);


    HuntMark.boundaryPolygon.bindPopup(
        "<strong>HuntMark Property Boundary</strong>"
    );


    HuntMark.boundaryPolygon.openPopup();


    document.getElementById("boundaryStatus").textContent =
        "Set";


    showMessage(
        "Property boundary saved."
    );


    removeBoundaryControls();

    deactivateTool();

}


function cancelBoundary() {

    clearTemporaryBoundary();

    HuntMark.boundaryPoints = [];

    updateBoundaryStatus();

    removeBoundaryControls();

}


function clearTemporaryBoundary() {

    HuntMark.boundaryMarkers.forEach(marker => {

        if (map) {
            map.removeLayer(marker);
        }

    });


    HuntMark.boundaryMarkers = [];


    if (HuntMark.boundaryLine) {

        map.removeLayer(
            HuntMark.boundaryLine
        );

        HuntMark.boundaryLine = null;

    }

}


function createBoundaryControls() {

    removeBoundaryControls();


    const controls = document.createElement("div");

    controls.id = "boundaryControls";

    controls.className =
        "boundary-controls";


    controls.innerHTML = `

        <div class="boundary-help">
            <strong>Draw Property Boundary</strong>
            <span>Click around the property to add points.</span>
        </div>

        <button
            id="finishBoundary"
            class="boundary-finish"
        >
            ✓ Finish Boundary
        </button>

        <button
            id="cancelBoundary"
            class="boundary-cancel"
        >
            ✕ Cancel
        </button>

    `;


    document.body.appendChild(
        controls
    );


    document
        .getElementById("finishBoundary")
        .addEventListener(
            "click",
            finishBoundary
        );


    document
        .getElementById("cancelBoundary")
        .addEventListener(
            "click",
            cancelBoundary
        );

}


function removeBoundaryControls() {

    const controls =
        document.getElementById(
            "boundaryControls"
        );


    if (controls) {
        controls.remove();
    }

}


function updateBoundaryStatus() {

    const status =
        document.getElementById(
            "boundaryStatus"
        );


    if (!status) {
        return;
    }


    if (
        HuntMark.boundaryPolygon
    ) {

        status.textContent =
            "Set";

        return;
    }


    if (
        HuntMark.boundaryPoints.length > 0
    ) {

        status.textContent =
            `${HuntMark.boundaryPoints.length} Points`;

    } else {

        status.textContent =
            "Not Set";

    }

}


// ============================================
// LOCATION COUNT
// ============================================

function updateLocationCount() {

    const element =
        document.getElementById(
            "locationCount"
        );


    if (!element) {
        return;
    }


    element.textContent =
        HuntMark.counts.stands +
        HuntMark.counts.cameras +
        HuntMark.counts.food +
        HuntMark.counts.water;

}


// ============================================
// LOCATION
// ============================================

const locationButton =
    document.getElementById(
        "locationButton"
    );


if (locationButton) {

    locationButton.addEventListener(
        "click",
        function() {

            if (!navigator.geolocation) {

                showMessage(
                    "Location services are not supported."
                );

                return;
            }


            showMessage(
                "Finding your location..."
            );


            navigator.geolocation.getCurrentPosition(

                function(position) {

                    const latitude =
                        position.coords.latitude;

                    const longitude =
                        position.coords.longitude;


                    map.setView(
                        [
                            latitude,
                            longitude
                        ],
                        16
                    );


                    L.marker(
                        [
                            latitude,
                            longitude
                        ]
                    )
                    .addTo(map)
                    .bindPopup(
                        "<strong>You are here</strong>"
                    )
                    .openPopup();


                    showMessage(
                        "Map centered on your location."
                    );

                },


                function() {

                    showMessage(
                        "Unable to access your location."
                    );

                },


                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 30000
                }

            );

        }
    );

}


// ============================================
// SATELLITE
// ============================================

const satelliteButton =
    document.getElementById(
        "satelliteButton"
    );


if (satelliteButton) {

    satelliteButton.addEventListener(
        "click",
        function() {

            if (!map) {
                return;
            }


            if (!HuntMark.satelliteMode) {

                map.removeLayer(
                    standardLayer
                );

                satelliteLayer.addTo(
                    map
                );


                HuntMark.satelliteMode =
                    true;


                satelliteButton.textContent =
                    "🗺️ Map";


                showMessage(
                    "Satellite imagery enabled."
                );

            } else {

                map.removeLayer(
                    satelliteLayer
                );

                standardLayer.addTo(
                    map
                );


                HuntMark.satelliteMode =
                    false;


                satelliteButton.textContent =
                    "🛰️ Satellite";


                showMessage(
                    "Standard map enabled."
                );

            }

        }
    );

}


// ============================================
// ADD MAP MARKER
// ============================================

function addMapMarker(
    lat,
    lng,
    icon,
    name,
    countType
) {

    const markerIcon =
        L.divIcon({

            className:
                "huntmark-marker",

            html:
                `<span>${icon}</span>`,

            iconSize:
                [40, 40],

            iconAnchor:
                [20, 20],

            popupAnchor:
                [0, -20]

        });


    const marker =
        L.marker(

            [
                lat,
                lng
            ],

            {
                icon:
                    markerIcon
            }

        ).addTo(map);


    marker.bindPopup(`

        <div class="marker-popup">

            <strong>${name}</strong>

            <br>

            <small>
                ${lat.toFixed(5)},
                ${lng.toFixed(5)}
            </small>

        </div>

    `);


    HuntMark.counts[countType]++;


    updateCounts();


    showMessage(
        `${name} added to your map.`
    );


    deactivateTool();

}


// ============================================
// UPDATE COUNTERS
// ============================================

function updateCounts() {

    const standCount =
        document.getElementById(
            "standCount"
        );

    const cameraCount =
        document.getElementById(
            "cameraCount"
        );

    const foodCount =
        document.getElementById(
            "foodCount"
        );

    const waterCount =
        document.getElementById(
            "waterCount"
        );


    if (standCount) {
        standCount.textContent =
            HuntMark.counts.stands;
    }


    if (cameraCount) {
        cameraCount.textContent =
            HuntMark.counts.cameras;
    }


    if (foodCount) {
        foodCount.textContent =
            HuntMark.counts.food;
    }


    if (waterCount) {
        waterCount.textContent =
            HuntMark.counts.water;
    }


    updateLocationCount();

}


// ============================================
// NOTIFICATIONS
// ============================================

function showMessage(message) {

    const existingMessage =
        document.querySelector(
            ".huntmark-message"
        );


    if (existingMessage) {
        existingMessage.remove();
    }


    const messageElement =
        document.createElement(
            "div"
        );


    messageElement.className =
        "huntmark-message";


    messageElement.textContent =
        message;


    document.body.appendChild(
        messageElement
    );


    setTimeout(function() {

        messageElement.classList.add(
            "show"
        );

    }, 10);


    setTimeout(function() {

        messageElement.classList.remove(
            "show"
        );


        setTimeout(function() {

            messageElement.remove();

        }, 300);

    }, 2500);

}


// ============================================
// START HUNTMARK
// ============================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        initializeMap();

        updateCounts();

        console.log(
            "HuntMark is ready."
        );

    }
);
