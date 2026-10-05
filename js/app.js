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
    }
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

    // Map clicking
    map.on("click", function(event) {
        if (!HuntMark.activeTool) {
            return;
        }

        const lat = event.latlng.lat;
        const lng = event.latlng.lng;

        switch (HuntMark.activeTool) {

            case "stand":
                addMapMarker(lat, lng, "🦌", "Stand", "stands");
                break;

            case "camera":
                addMapMarker(lat, lng, "📷", "Trail Camera", "cameras");
                break;

            case "food":
                addMapMarker(lat, lng, "🌱", "Food Plot", "food");
                break;

            case "water":
                addMapMarker(lat, lng, "💧", "Water Source", "water");
                break;

            case "trail":
                showMessage(
                    `Trail point placed at ${lat.toFixed(5)}, ${lng.toFixed(5)}`
                );
                break;

            case "boundary":
                showMessage(
                    `Boundary point placed at ${lat.toFixed(5)}, ${lng.toFixed(5)}`
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
    stand: "Stand placement mode activated.",
    camera: "Trail camera placement mode activated.",
    food: "Food plot placement mode activated.",
    water: "Water source placement mode activated.",
    trail: "Trail planning mode activated.",
    boundary: "Property boundary mode activated."
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

Object.entries(toolButtons).forEach(([tool, button]) => {

    if (!button) {
        return;
    }

    button.addEventListener("click", function() {

        if (HuntMark.activeTool === tool) {
            deactivateTool();
            showMessage("Tool deactivated.");
        } else {
            activateTool(tool);
        }

    });
});

// ============================================
// PROPERTY ACTION BUTTONS
// ============================================

const propertyActions = {
    addStand: document.getElementById("addStand"),
    addFood: document.getElementById("addFood"),
    addCamera: document.getElementById("addCamera"),
    addWater: document.getElementById("addWater"),
    drawBoundary: document.getElementById("drawBoundary")
};

if (propertyActions.addStand) {
    propertyActions.addStand.addEventListener("click", function() {
        activateTool("stand");
    });
}

if (propertyActions.addFood) {
    propertyActions.addFood.addEventListener("click", function() {
        activateTool("food");
    });
}

if (propertyActions.addCamera) {
    propertyActions.addCamera.addEventListener("click", function() {
        activateTool("camera");
    });
}

if (propertyActions.addWater) {
    propertyActions.addWater.addEventListener("click", function() {
        activateTool("water");
    });
}

if (propertyActions.drawBoundary) {
    propertyActions.drawBoundary.addEventListener("click", function() {
        activateTool("boundary");
    });
}

// ============================================
// NAVIGATION
// ============================================

const navButtons = document.querySelectorAll(".nav-btn");

navButtons.forEach(button => {

    button.addEventListener("click", function() {

        navButtons.forEach(btn => {
            btn.classList.remove("active");
        });

        button.classList.add("active");

        const section = button.textContent.trim();

        if (section === "Map") {
            showMessage("Map view active.");
        }

        if (section === "Property") {
            showMessage("Property tools active.");
        }

        if (section === "Weather") {
            showMessage("Weather tools coming next.");
        }

        if (section === "Reports") {
            showMessage("Reports coming soon.");
        }

    });

});

// ============================================
// MOBILE MENU
// ============================================

const menuButton = document.getElementById("menuButton");
const nav = document.querySelector(".main-nav");

if (menuButton && nav) {

    menuButton.addEventListener("click", function() {
        nav.classList.toggle("open");
    });

}

// ============================================
// LOCATION
// ============================================

const locationButton = document.getElementById("locationButton");

if (locationButton) {

    locationButton.addEventListener("click", function() {

        if (!navigator.geolocation) {
            showMessage("Location services are not supported.");
            return;
        }

        showMessage("Finding your location...");

        navigator.geolocation.getCurrentPosition(

            function(position) {

                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;

                map.setView(
                    [latitude, longitude],
                    16
                );

                L.marker([latitude, longitude])
                    .addTo(map)
                    .bindPopup("<strong>You are here</strong>")
                    .openPopup();

                showMessage("Map centered on your location.");
            },

            function() {
                showMessage("Unable to access your location.");
            },

            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 30000
            }

        );

    });

}

// ============================================
// SATELLITE
// ============================================

const satelliteButton = document.getElementById("satelliteButton");

if (satelliteButton) {

    satelliteButton.addEventListener("click", function() {

        if (!map) {
            return;
        }

        if (!HuntMark.satelliteMode) {

            map.removeLayer(standardLayer);
            satelliteLayer.addTo(map);

            HuntMark.satelliteMode = true;

            satelliteButton.textContent = "🗺️ Map";

            showMessage("Satellite imagery enabled.");

        } else {

            map.removeLayer(satelliteLayer);
            standardLayer.addTo(map);

            HuntMark.satelliteMode = false;

            satelliteButton.textContent = "🛰️ Satellite";

            showMessage("Standard map enabled.");

        }

    });

}

// ============================================
// ADD MAP MARKER
// ============================================

function addMapMarker(lat, lng, icon, name, countType) {

    const markerIcon = L.divIcon({

        className: "huntmark-marker",

        html: `<span>${icon}</span>`,

        iconSize: [40, 40],

        iconAnchor: [20, 20],

        popupAnchor: [0, -20]

    });

    const marker = L.marker(
        [lat, lng],
        {
            icon: markerIcon
        }
    ).addTo(map);

    marker.bindPopup(`
        <div class="marker-popup">
            <strong>${name}</strong>
            <br>
            <small>
                ${lat.toFixed(5)}, ${lng.toFixed(5)}
            </small>
        </div>
    `);

    HuntMark.counts[countType]++;

    updateCounts();

    showMessage(`${name} added to your map.`);

    deactivateTool();
}

// ============================================
// UPDATE COUNTERS
// ============================================

function updateCounts() {

    const standCount = document.getElementById("standCount");
    const cameraCount = document.getElementById("cameraCount");
    const foodCount = document.getElementById("foodCount");
    const waterCount = document.getElementById("waterCount");

    if (standCount) {
        standCount.textContent = HuntMark.counts.stands;
    }

    if (cameraCount) {
        cameraCount.textContent = HuntMark.counts.cameras;
    }

    if (foodCount) {
        foodCount.textContent = HuntMark.counts.food;
    }

    if (waterCount) {
        waterCount.textContent = HuntMark.counts.water;
    }
}

// ============================================
// NOTIFICATIONS
// ============================================

function showMessage(message) {

    const existingMessage =
        document.querySelector(".huntmark-message");

    if (existingMessage) {
        existingMessage.remove();
    }

    const messageElement =
        document.createElement("div");

    messageElement.className =
        "huntmark-message";

    messageElement.textContent =
        message;

    document.body.appendChild(
        messageElement
    );

    setTimeout(function() {
        messageElement.classList.add("show");
    }, 10);

    setTimeout(function() {

        messageElement.classList.remove("show");

        setTimeout(function() {
            messageElement.remove();
        }, 300);

    }, 2500);
}

// ============================================
// START HUNTMARK
// ============================================

document.addEventListener("DOMContentLoaded", function() {

    initializeMap();

    updateCounts();

    console.log("HuntMark is ready.");

});
