
/* ============================================
   HUNTMARK - Map, Markers, Boundaries & Saving
   ============================================ */

const STORAGE_KEY = "huntmark-map-data-v1";

const HuntMark = {
    activeTool: null,
    satelliteMode: false,

    counts: {
        stands: 0,
        cameras: 0,
        food: 0,
        water: 0
    },

    locations: [],
    nextId: 1,

    boundaryPoints: [],
    boundaryMarkers: [],
    boundaryLine: null,
    boundaryPolygon: null,
    savedBoundary: [],

    trailPoints: [],
    trailMarkers: [],
    trailLine: null
};

let map;
let standardLayer;
let satelliteLayer;

const markerTypes = {
    stand: {
        icon: "🦌",
        name: "Stand",
        count: "stands"
    },
    camera: {
        icon: "📷",
        name: "Trail Camera",
        count: "cameras"
    },
    food: {
        icon: "🌱",
        name: "Food Plot",
        count: "food"
    },
    water: {
        icon: "💧",
        name: "Water Source",
        count: "water"
    }
};

const toolButtons = {
    stand: document.getElementById("standTool"),
    camera: document.getElementById("cameraTool"),
    food: document.getElementById("foodTool"),
    water: document.getElementById("waterTool"),
    trail: document.getElementById("trailTool"),
    boundary: document.getElementById("boundaryTool")
};

/* ============================================
   MAP INITIALIZATION
   ============================================ */

function initializeMap() {
    const mapElement = document.getElementById("map");

    if (!mapElement || typeof L === "undefined") {
        console.error("HuntMark: Map or Leaflet is unavailable.");
        showMessage("The map could not load. Refresh and try again.");
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

    map.on("click", handleMapClick);

    loadSavedData();
    renderSavedBoundary();
    renderSavedLocations();

    updateCounts();
    updateBoundaryStatus();

    console.log("HuntMark is ready.");
}

/* ============================================
   MAP CLICK HANDLING
   ============================================ */

function handleMapClick(event) {
    const tool = HuntMark.activeTool;

    if (!tool) return;

    const lat = event.latlng.lat;
    const lng = event.latlng.lng;

    if (["stand", "camera", "food", "water"].includes(tool)) {
        if (HuntMark.savedBoundary.length >= 3 &&
            !pointInsideBoundary(lat, lng)) {
            showMessage("Place this location inside your property boundary.");
            return;
        }

        const details = markerTypes[tool];
        addLocation(lat, lng, tool, details);
        deactivateTool();
        return;
    }

    if (tool === "boundary") {
        addBoundaryPoint(lat, lng);
        return;
    }

    if (tool === "trail") {
        addTrailPoint(lat, lng);
    }
}

/* ============================================
   TOOL ACTIVATION
   ============================================ */

function activateTool(tool) {
    if (!toolButtons[tool]) return;

    // Keep an unfinished drawing from being accidentally abandoned.
    if (HuntMark.activeTool === "boundary" && tool !== "boundary") {
        showMessage("Finish or cancel your boundary first.");
        return;
    }

    if (HuntMark.activeTool === "trail" && tool !== "trail") {
        showMessage("Finish or cancel your trail first.");
        return;
    }

    deactivateTool(false);

    HuntMark.activeTool = tool;
    toolButtons[tool].classList.add("active");

    if (tool === "boundary") {
        startBoundary();
        return;
    }

    if (tool === "trail") {
        startTrail();
        return;
    }

    showMessage(
        `Click the map to place a ${markerTypes[tool].name.toLowerCase()}.`
    );
}

function deactivateTool(removeControls = true) {
    HuntMark.activeTool = null;

    Object.values(toolButtons).forEach(button => {
        if (button) button.classList.remove("active");
    });

    if (removeControls) {
        removeDrawingControls();
    }
}

Object.entries(toolButtons).forEach(([tool, button]) => {
    if (!button) return;

    button.addEventListener("click", () => {
        if (HuntMark.activeTool === tool) {
            if (tool === "boundary" || tool === "trail") {
                showMessage("Finish or cancel the drawing first.");
                return;
            }

            deactivateTool();
            showMessage("Tool deactivated.");
        } else {
            activateTool(tool);
        }
    });
});

/* ============================================
   LOCATIONS: ADD, EDIT, DELETE
   ============================================ */

function addLocation(lat, lng, type, details, saved = false) {
    const location = {
        id: HuntMark.nextId++,
        type,
        name: details.name,
        notes: "",
        lat,
        lng
    };

    HuntMark.locations.push(location);

    renderLocation(location);
    updateCounts();
    saveData();

    if (!saved) {
        showMessage(`${location.name} added to your map.`);
    }
}

function renderLocation(location) {
    const details = markerTypes[location.type];
    if (!details || !map) return;

    const markerIcon = L.divIcon({
        className: "huntmark-marker",
        html: `<span>${details.icon}</span>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20]
    });

    const marker = L.marker(
        [location.lat, location.lng],
        { icon: markerIcon }
    ).addTo(map);

    marker.bindPopup(() => createLocationPopup(location));

    marker.on("popupopen", event => {
        const popup = event.popup.getElement();
        if (!popup) return;

        const editButton = popup.querySelector("[data-edit-location]");
        const deleteButton = popup.querySelector("[data-delete-location]");

        if (editButton) {
            editButton.addEventListener("click", () => {
                editLocation(location.id);
            });
        }

        if (deleteButton) {
            deleteButton.addEventListener("click", () => {
                deleteLocation(location.id);
            });
        }
    });

    location._marker = marker;
}

function createLocationPopup(location) {
    const popup = document.createElement("div");
    popup.className = "marker-popup";

    const title = document.createElement("strong");
    title.textContent = location.name;

    const coordinates = document.createElement("p");
    coordinates.textContent =
        `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`;

    const notes = document.createElement("p");
    notes.textContent = location.notes || "No notes added.";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.textContent = "Edit";
    editButton.dataset.editLocation = "";

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.dataset.deleteLocation = "";

    popup.append(title, coordinates, notes, editButton, deleteButton);

    return popup;
}

function editLocation(id) {
    const location = HuntMark.locations.find(item => item.id === id);
    if (!location) return;

    const newName = prompt("Location name:", location.name);
    if (newName === null) return;

    const newNotes = prompt("Notes (optional):", location.notes || "");
    if (newNotes === null) return;

    const cleanName = newName.trim();

    if (!cleanName) {
        showMessage("Location name cannot be empty.");
        return;
    }

    location.name = cleanName;
    location.notes = newNotes.trim();

    location._marker?.setPopupContent(() => createLocationPopup(location));

    saveData();
    showMessage("Location updated.");
}

function deleteLocation(id) {
    const location = HuntMark.locations.find(item => item.id === id);
    if (!location) return;

    if (!confirm(`Delete "${location.name}" from your map?`)) return;

    if (location._marker) {
        map.removeLayer(location._marker);
    }

    HuntMark.locations = HuntMark.locations.filter(item => item.id !== id);

    updateCounts();
    saveData();
    showMessage(`${location.name} deleted.`);
}

/* ============================================
   PROPERTY BOUNDARY
   ============================================ */

function startBoundary() {
    clearTemporaryBoundary();

    HuntMark.boundaryPoints = [];

    createDrawingControls(
        "Draw Property Boundary",
        "Click around the edges of your property.",
        "Finish Boundary",
        finishBoundary,
        cancelBoundary
    );

    updateBoundaryStatus();
}

function addBoundaryPoint(lat, lng) {
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

    showMessage(`Boundary point ${HuntMark.boundaryPoints.length} added.`);
}

function updateBoundaryLine() {
    if (HuntMark.boundaryLine) {
        map.removeLayer(HuntMark.boundaryLine);
    }

    if (HuntMark.boundaryPoints.length < 2) return;

    HuntMark.boundaryLine = L.polyline(HuntMark.boundaryPoints, {
        color: "#D97706",
        weight: 4,
        dashArray: "8, 8"
    }).addTo(map);
}

function finishBoundary() {
    if (HuntMark.boundaryPoints.length < 3) {
        showMessage("Add at least 3 points to finish your boundary.");
        return;
    }

    const newBoundary = HuntMark.boundaryPoints.map(point => ({
        lat: point.lat,
        lng: point.lng
    }));

    // Keep existing locations only if the new boundary contains them.
    const outsideLocations = HuntMark.locations.filter(location =>
        !pointInsideBoundary(location.lat, location.lng, newBoundary)
    );

    if (outsideLocations.length > 0 &&
        !confirm(
            `${outsideLocations.length} existing location(s) are outside ` +
            "the new boundary. Keep the boundary anyway? Those locations " +
            "will remain on the map, but you cannot add new ones outside it."
        )) {
        return;
    }

    HuntMark.savedBoundary = newBoundary;

    clearTemporaryBoundary();
    renderSavedBoundary();

    HuntMark.boundaryPoints = [];

    updateBoundaryStatus();
    removeDrawingControls();
    deactivateTool(false);
    saveData();

    showMessage("Property boundary saved.");
}

function cancelBoundary() {
    clearTemporaryBoundary();
    HuntMark.boundaryPoints = [];

    updateBoundaryStatus();
    removeDrawingControls();
    deactivateTool(false);

    showMessage("Boundary drawing cancelled.");
}

function clearTemporaryBoundary() {
    HuntMark.boundaryMarkers.forEach(marker => map.removeLayer(marker));
    HuntMark.boundaryMarkers = [];

    if (HuntMark.boundaryLine) {
        map.removeLayer(HuntMark.boundaryLine);
        HuntMark.boundaryLine = null;
    }
}

function renderSavedBoundary() {
    if (HuntMark.boundaryPolygon) {
        map.removeLayer(HuntMark.boundaryPolygon);
        HuntMark.boundaryPolygon = null;
    }

    if (HuntMark.savedBoundary.length < 3) {
        updateBoundaryStatus();
        return;
    }

    const points = HuntMark.savedBoundary.map(point =>
        [point.lat, point.lng]
    );

    HuntMark.boundaryPolygon = L.polygon(points, {
        color: "#D97706",
        weight: 4,
        fillColor: "#D97706",
        fillOpacity: 0.18
    }).addTo(map);

    HuntMark.boundaryPolygon.bindPopup(
        "<strong>HuntMark Property Boundary</strong>"
    );

    updateBoundaryStatus();
}

/* Point-in-polygon test using longitude/latitude coordinates. */
function pointInsideBoundary(lat, lng, boundary = HuntMark.savedBoundary) {
    if (boundary.length < 3) return true;

    let inside = false;

    for (let i = 0, j = boundary.length - 1;
         i < boundary.length;
         j = i++) {

        const xi = boundary[i].lng;
        const yi = boundary[i].lat;
        const xj = boundary[j].lng;
        const yj = boundary[j].lat;

        const crosses = (
            (yi > lat) !== (yj > lat) &&
            lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
        );

        if (crosses) inside = !inside;
    }

    return inside;
}

/* ============================================
   TRAIL DRAWING
   ============================================ */

function startTrail() {
    clearTemporaryTrail();

    HuntMark.trailPoints = [];

    createDrawingControls(
        "Plan a Trail",
        "Click along the route you want to mark.",
        "Finish Trail",
        finishTrail,
        cancelTrail
    );

    showMessage("Click the map to add trail points.");
}

function addTrailPoint(lat, lng) {
    const point = L.latLng(lat, lng);
    HuntMark.trailPoints.push(point);

    const marker = L.circleMarker(point, {
        radius: 4,
        color: "#183A2A",
        fillColor: "#D97706",
        fillOpacity: 1
    }).addTo(map);

    HuntMark.trailMarkers.push(marker);

    if (HuntMark.trailLine) {
        map.removeLayer(HuntMark.trailLine);
    }

    if (HuntMark.trailPoints.length >= 2) {
        HuntMark.trailLine = L.polyline(HuntMark.trailPoints, {
            color: "#183A2A",
            weight: 4
        }).addTo(map);
    }

    showMessage(`Trail point ${HuntMark.trailPoints.length} added.`);
}

function finishTrail() {
    if (HuntMark.trailPoints.length < 2) {
        showMessage("Add at least 2 points to finish a trail.");
        return;
    }

    const trail = L.polyline(HuntMark.trailPoints, {
        color: "#183A2A",
        weight: 4
    }).addTo(map);

    const trailId = HuntMark.nextId++;

    trail.bindPopup(
        `<strong>Planned Trail</strong><br>
         <button type="button" id="deleteTrail-${trailId}">Delete Trail</button>`
    );

    trail.on("popupopen", event => {
        const button = event.popup.getElement()
            ?.querySelector(`#deleteTrail-${trailId}`);

        if (button) {
            button.addEventListener("click", () => {
                if (confirm("Delete this planned trail?")) {
                    map.removeLayer(trail);
                    HuntMark.trails = (HuntMark.trails || [])
                        .filter(item => item.id !== trailId);
                    saveData();
                    showMessage("Trail deleted.");
                }
            });
        }
    });

    if (!HuntMark.trails) HuntMark.trails = [];

    HuntMark.trails.push({
        id: trailId,
        points: HuntMark.trailPoints.map(point => ({
            lat: point.lat,
            lng: point.lng
        }))
    });

    clearTemporaryTrail();
    HuntMark.trailPoints = [];

    removeDrawingControls();
    deactivateTool(false);
    saveData();

    showMessage("Trail saved.");
}

function cancelTrail() {
    clearTemporaryTrail();
    HuntMark.trailPoints = [];

    removeDrawingControls();
    deactivateTool(false);

    showMessage("Trail drawing cancelled.");
}

function clearTemporaryTrail() {
    HuntMark.trailMarkers.forEach(marker => map.removeLayer(marker));
    HuntMark.trailMarkers = [];

    if (HuntMark.trailLine) {
        map.removeLayer(HuntMark.trailLine);
        HuntMark.trailLine = null;
    }
}

/* ============================================
   SHARED DRAWING CONTROLS
   ============================================ */

function createDrawingControls(title, help, finishLabel, onFinish, onCancel) {
    removeDrawingControls();

    const controls = document.createElement("div");
    controls.id = "drawingControls";
    controls.className = "boundary-controls";

    const helpBox = document.createElement("div");
    helpBox.className = "boundary-help";

    const heading = document.createElement("strong");
    heading.textContent = title;

    const description = document.createElement("span");
    description.textContent = help;

    helpBox.append(heading, description);

    const finish = document.createElement("button");
    finish.type = "button";
    finish.className = "boundary-finish";
    finish.textContent = `✓ ${finishLabel}`;
    finish.addEventListener("click", onFinish);

    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "boundary-cancel";
    cancel.textContent = "✕ Cancel";
    cancel.addEventListener("click", onCancel);

    controls.append(helpBox, finish, cancel);
    document.body.appendChild(controls);
}

function removeDrawingControls() {
    document.getElementById("drawingControls")?.remove();

    // Remove the old control ID if an earlier version left it behind.
    document.getElementById("boundaryControls")?.remove();
}

/* ============================================
   SAVE AND RESTORE
   ============================================ */

function saveData() {
    const data = {
        locations: HuntMark.locations.map(location => ({
            id: location.id,
            type: location.type,
            name: location.name,
            notes: location.notes,
            lat: location.lat,
            lng: location.lng
        })),

        savedBoundary: HuntMark.savedBoundary,
        trails: HuntMark.trails || [],
        nextId: HuntMark.nextId
    };

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.error("HuntMark could not save map data:", error);
        showMessage("Unable to save map data in this browser.");
    }
}

function loadSavedData() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;

        const data = JSON.parse(raw);

        HuntMark.locations = Array.isArray(data.locations)
            ? data.locations
            : [];

        HuntMark.savedBoundary = Array.isArray(data.savedBoundary)
            ? data.savedBoundary
            : [];

        HuntMark.trails = Array.isArray(data.trails)
            ? data.trails
            : [];

        HuntMark.nextId = Number.isInteger(data.nextId)
            ? data.nextId
            : 1;

        const highestId = HuntMark.locations.reduce(
            (max, item) => Math.max(max, Number(item.id) || 0),
            0
        );

        HuntMark.nextId = Math.max(HuntMark.nextId, highestId + 1);

    } catch (error) {
        console.error("HuntMark could not restore saved data:", error);
        showMessage("Saved map data could not be loaded.");
    }
}

function renderSavedLocations() {
    const saved = [...HuntMark.locations];

    HuntMark.locations = [];

    saved.forEach(location => {
        const details = markerTypes[location.type];
        if (!details) return;

        HuntMark.locations.push(location);
        renderLocation(location);
    });

    (HuntMark.trails || []).forEach(trail => {
        if (!Array.isArray(trail.points) || trail.points.length < 2) return;

        const line = L.polyline(
            trail.points.map(point => [point.lat, point.lng]),
            { color: "#183A2A", weight: 4 }
        ).addTo(map);

        line.bindPopup(
            `<strong>Planned Trail</strong><br>
             <button type="button" id="deleteTrail-${trail.id}">Delete Trail</button>`
        );

        line.on("popupopen", event => {
            const button = event.popup.getElement()
                ?.querySelector(`#deleteTrail-${trail.id}`);

            if (button) {
                button.addEventListener("click", () => {
                    if (confirm("Delete this planned trail?")) {
                        map.removeLayer(line);
                        HuntMark.trails = HuntMark.trails.filter(
                            item => item.id !== trail.id
                        );
                        saveData();
                        showMessage("Trail deleted.");
                    }
                });
            }
        });
    });
}

/* ============================================
   COUNTERS AND PROPERTY STATUS
   ============================================ */

function updateCounts() {
    HuntMark.counts = {
        stands: 0,
        cameras: 0,
        food: 0,
        water: 0
    };

    HuntMark.locations.forEach(location => {
        const details = markerTypes[location.type];
        if (details) HuntMark.counts[details.count]++;
    });

    const ids = {
        stands: "standCount",
        cameras: "cameraCount",
        food: "foodCount",
        water: "waterCount"
    };

    Object.entries(ids).forEach(([type, id]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = HuntMark.counts[type];
    });

    const locationCount = document.getElementById("locationCount");

    if (locationCount) {
        locationCount.textContent = HuntMark.locations.length;
    }
}

function updateBoundaryStatus() {
    const status = document.getElementById("boundaryStatus");
    if (!status) return;

    if (HuntMark.savedBoundary.length >= 3) {
        status.textContent = "Set";
    } else if (HuntMark.boundaryPoints.length > 0) {
        status.textContent = `${HuntMark.boundaryPoints.length} Points`;
    } else {
        status.textContent = "Not Set";
    }
}

/* ============================================
   LOCATION BUTTON
   ============================================ */

const locationButton = document.getElementById("locationButton");

if (locationButton) {
    locationButton.addEventListener("click", () => {
        if (!navigator.geolocation) {
            showMessage("Location services are not supported.");
            return;
        }

        showMessage("Finding your location...");

        navigator.geolocation.getCurrentPosition(
            position => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                map.setView([lat, lng], 16);

                L.marker([lat, lng])
                    .addTo(map)
                    .bindPopup("<strong>You are here</strong>")
                    .openPopup();

                showMessage("Map centered on your location.");
            },
            () => showMessage("Unable to access your location."),
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 30000
            }
        );
    });
}

/* ============================================
   SATELLITE TOGGLE
   ============================================ */

const satelliteButton = document.getElementById("satelliteButton");

if (satelliteButton) {
    satelliteButton.addEventListener("click", () => {
        if (!map) return;

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

/* ============================================
   NAVIGATION AND MOBILE MENU
   ============================================ */

document.querySelectorAll(".nav-btn").forEach(button => {
    button.addEventListener("click", () => {
        document.querySelectorAll(".nav-btn").forEach(item =>
            item.classList.remove("active")
        );

        button.classList.add("active");

        const section = button.textContent.trim();

        if (section === "Map") showMessage("Map view active.");
        if (section === "Property") showMessage("Property tools active.");
        if (section === "Weather") showMessage("Weather tools coming next.");
        if (section === "Reports") showMessage("Reports coming soon.");
    });
});

const menuButton = document.getElementById("menuButton");
const nav = document.querySelector(".main-nav");

if (menuButton && nav) {
    menuButton.addEventListener("click", () => {
        nav.classList.toggle("open");
    });
}

/* ============================================
   NOTIFICATIONS
   ============================================ */

function showMessage(message) {
    document.querySelector(".huntmark-message")?.remove();

    const element = document.createElement("div");
    element.className = "huntmark-message";
    element.textContent = message;

    document.body.appendChild(element);

    setTimeout(() => element.classList.add("show"), 10);

    setTimeout(() => {
        element.classList.remove("show");
        setTimeout(() => element.remove(), 300);
    }, 2800);
}

/* ============================================
   START
   ============================================ */

document.addEventListener("DOMContentLoaded", initializeMap);
