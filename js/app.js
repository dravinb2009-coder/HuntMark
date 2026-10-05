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

// ============================================
// MAP
// ============================================

let map;

function initializeMap() {
    const mapElement = document.getElementById("map");

    if (!mapElement || typeof L === "undefined") {
        console.error("HuntMark: Leaflet map could not be initialized.");
        return;
    }

    // Start centered around Morristown, Tennessee.
    map = L.map("map", {
        zoomControl: true
    }).setView([36.2140, -83.2949], 13);

    // Standard map
    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors'
        }
    ).addTo(map);

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

    showMessage(toolMessages[tool] || "Tool activated.");
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
    if (!button) return;

    button.addEventListener("click", () => {
        if (HuntMark.activeTool === tool) {
            deactivateTool();
            showMessage("Tool deactivated.");
        } else {
            activateTool(tool);
        }
    });
});

// ============================================
// PROPERTY ACTIONS
// ============================================

const propertyActions = {
    addStand: document.getElementById("addStand"),
    addFood: document.getElementById("addFood"),
    addCamera: document.getElementById("addCamera"),
    addWater: document.getElementById("addWater"),
    drawBoundary: document.getElementById("drawBoundary")
};

if (propertyActions.addStand) {
    propertyActions.addStand.addEventListener("click", () => {
        activateTool("stand");
    });
}

if (propertyActions.addFood) {
    propertyActions.addFood.addEventListener("click", () => {
        activateTool("food");
    });
}

if (propertyActions.addCamera) {
    propertyActions.addCamera.addEventListener("click", () => {
        activateTool("camera");
    });
}

if (propertyActions.addWater) {
    propertyActions.addWater.addEventListener("click", () => {
        activateTool("water");
    });
}

if (propertyActions.drawBoundary) {
    propertyActions.drawBoundary.addEventListener("click", () => {
        activateTool("boundary");
    });
}

// ============================================
// NAVIGATION
// ============================================

const navButtons = document.querySelectorAll(".nav-btn");

navButtons.forEach(button => {
    button.addEventListener("click", () => {
        navButtons.forEach(btn => btn.classList.remove("active"));
        button.classList.add("active");

        const section = button.textContent.trim();

        if (section === "Map") {
            showMessage("Map view active.");
        } else if (section === "Property") {
            showMessage("Property tools active.");
        } else if (section === "Weather") {
            showMessage("Weather tools coming next.");
        } else if (section === "Reports") {
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
    menuButton.addEventListener("click", () => {
        nav.classList.toggle("open");
    });
}

// ============================================
// MAP CONTROLS
// ============================================

const locationButton = document.getElementById("locationButton");
const satelliteButton = document.getElementById("satelliteButton");

let standardLayer;
let satelliteLayer;

function setupMapLayers() {
    if (!map) return;

    standardLayer = L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors'
        }
    );

    satelliteLayer = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
            maxZoom: 19,
            attribution: "Tiles &copy; Esri"
        }
    );

    map.eachLayer(layer => {
        map.removeLayer(layer);
    });

    standardLayer.addTo(map);
}

if (locationButton) {
    locationButton.addEventListener("click", () => {
        if (!navigator.geolocation) {
            showMessage("Location services are not supported.");
            return;
        }

        showMessage("Finding your location...");

        navigator.geolocation.getCurrentPosition(
            position => {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;

                map.setView([latitude, longitude], 16);

                L.marker([latitude, longitude])
                    .addTo(map)
                    .bindPopup("<strong>You are here</strong>")
                    .openPopup();

                showMessage("Map centered on your location.");
            },
            () => {
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

if (satelliteButton) {
    satelliteButton.addEventListener("click", () => {
        if (!map || !standardLayer || !satelliteLayer) return;

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
// MAP TOOL CLICKING
// ============================================

// <Will be added later>

// ============================================
// MAP MARKERS
// ============================================

function addMapMarker(lat, lng, icon, name, type) {
    const markerIcon = L.divIcon({
        className: "huntmark-marker",
        html: `<span>${icon}</span>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20]
    });

    const marker = L.marker([lat, lng], {
        icon: markerIcon
    }).addTo(map);

    marker.bindPopup(`
        <div class="marker-popup">
            <strong>${name}</strong>
            <br>
            <small>
                ${lat.toFixed(5)}, ${lng.toFixed(5)}
            </small>
        </div>
    `);

    HuntMark.counts[type + "s"]++;

    updateCounts();

    showMessage(`${name} added to your map.`);

    deactivateTool();
}

// ============================================
// COUNTERS
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
    const existingMessage = document.querySelector(".huntmark-message");

    if (existingMessage) {
        existingMessage.remove();
    }

    const messageElement = document.createElement("div");

    messageElement.className = "huntmark-message";
    messageElement.textContent = message;

    document.body.appendChild(messageElement);

    setTimeout(() => {
        messageElement.classList.add("show");
    }, 10);

    setTimeout(() => {
        messageElement.classList.remove("show");

        setTimeout(() => {
            messageElement.remove();
        }, 300);
    }, 2500);
}

// ============================================
// START APPLICATION
// ============================================

document.addEventListener("DOMContentLoaded", () => {
    initializeMap();

    if (map) {
        setupMapLayers();
    }

    updateCounts();

    console.log("HuntMark is ready.");
});
