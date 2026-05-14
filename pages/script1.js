const API_URL = "http://localhost:5000";

document.addEventListener("DOMContentLoaded", function () {
    const editButton = document.getElementById("editButton");
    const vehiclesSection = document.getElementById("vehiclesSection");

    // Toggle visibility of vehicles table when Edit button is clicked
    editButton.addEventListener("click", function () {
        vehiclesSection.style.display = vehiclesSection.style.display === "none" ? "block" : "none";
    });

    // Load vehicles on page load
    loadVehicles();
});

// 🚀 Load Vehicles from Backend
function loadVehicles() {
    fetch(`${API_URL}/vehicles`)
        .then(response => response.json())
        .then(data => {
            console.log("📋 Vehicles Loaded:", data);
            renderVehicleTable(data);
        })
        .catch(err => console.error("❌ Error loading vehicles:", err));
}

// 📋 Render Vehicles in Table
function renderVehicleTable(vehicles) {
    let rows = "";
    vehicles.forEach(vehicle => {
        rows += `<tr>
            <td>${vehicle.ID}</td>
            <td>${vehicle.Name}</td>
            <td>${vehicle.Capacity}</td>
            <td>${vehicle.Mileage} km/l</td>
            <td>${vehicle.LoadedQuantity}</td>
            <td>${vehicle.FreeSpace}</td>
            <td>${vehicle.Status}</td>
            <td>
                <button class="btn btn-danger" onclick="deleteVehicle(${vehicle.ID})">🗑 Delete</button>
            </td>
        </tr>`;
    });
    document.getElementById("vehicleTable").innerHTML = rows;
}

// ➕ Add New Vehicle
function addVehicle() {
    const name = document.getElementById("name").value.trim();
    const capacity = parseInt(document.getElementById("capacity").value);
    const mileage = parseFloat(document.getElementById("mileage").value);
    const loadedQuantity = parseInt(document.getElementById("loadedQuantity").value);
    const status = document.getElementById("status").value;

    if (!name || isNaN(capacity) || isNaN(mileage) || isNaN(loadedQuantity)) {
        alert("⚠️ All fields are required and must be valid numbers!");
        return;
    }

    fetch(`${API_URL}/add_vehicle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, capacity, mileage, loadedQuantity, status })
    })
    .then(response => response.json())
    .then(() => {
        console.log("✅ Vehicle Added Successfully!");
        clearVehicleForm();
        loadVehicles();
    })
    .catch(err => console.error("❌ Error adding vehicle:", err));
}

// 🧹 Clear Input Fields after Adding Vehicle
function clearVehicleForm() {
    document.getElementById("name").value = "";
    document.getElementById("capacity").value = "";
    document.getElementById("mileage").value = "";
    document.getElementById("loadedQuantity").value = "";
    document.getElementById("status").value = "Active";
}

// 🗑 Delete Vehicle
function deleteVehicle(id) {
    if (!confirm("⚠️ Are you sure you want to delete this vehicle?")) return;

    fetch(`${API_URL}/delete_vehicle/${id}`, { method: "DELETE" })
    .then(() => {
        console.log("✅ Vehicle Deleted Successfully!");
        loadVehicles();
    })
    .catch(err => console.error("❌ Error deleting vehicle:", err));
}

// 📍 Google Maps API - Vehicle Locations
function initMap() {
    const map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 20.5937, lng: 78.9629 }, // Centered in India
        zoom: 5,
    });

    fetch(`${API_URL}/vehicles`)
        .then(response => response.json())
        .then(data => {
            data.forEach(vehicle => {
                if (vehicle.latitude && vehicle.longitude) {
                    new google.maps.Marker({
                        position: { lat: vehicle.latitude, lng: vehicle.longitude },
                        map: map,
                        title: vehicle.Name,
                    });
                }
            });
        })
        .catch(err => console.error("❌ Error loading vehicle locations:", err));
}
