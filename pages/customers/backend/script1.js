const API_URL = "http://localhost:5000";

// 🚀 Load Vehicles on Page Load
function loadVehicles() {
    fetch("http://localhost:5000/vehicles")
    .then(response => response.json())
    .then(data => {
        console.log("📋 Vehicles Loaded:", data);
        let rows = "";
        data.forEach(vehicle => {
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
    })
    .catch(err => console.error("❌ Error loading vehicles:", err));
}



// ➕ Add Vehicle
function addVehicle() {
    const name = document.getElementById("name").value;
    const capacity = parseInt(document.getElementById("capacity").value);
    const mileage = parseFloat(document.getElementById("mileage").value);
    const loadedQuantity = parseInt(document.getElementById("loadedQuantity").value);
    const status = document.getElementById("status").value;

    if (!name || !capacity || !mileage || !loadedQuantity) {
        alert("All fields are required!");
        return;
    }


    fetch("http://localhost:5000/add_vehicle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name, capacity, mileage, loadedQuantity, status
        }),
    })
    .then(response => response.json())
    .then(() => {
        console.log("✅ Vehicle Added Successfully!");
        document.getElementById("name").value = "";
        document.getElementById("capacity").value = "";
        document.getElementById("mileage").value = "";
        document.getElementById("loadedQuantity").value = "";
        document.getElementById("status").value = "Active";
        
        // ✅ Refresh vehicle list after adding
        loadVehicles();
    })
    .catch(err => console.error("❌ Error adding vehicle:", err));
}

function fetchVehicles() {
    fetch("http://localhost:5000/vehicles")
    .then(res => res.json())
    .then(data => {
        console.log("Fetched Vehicles:", data); // Debugging log
        let rows = "";
        data.forEach(vehicle => {
            rows += `
                <tr>
                    <td>${vehicle.ID}</td>
                    <td>${vehicle.Name}</td>
                    <td>${vehicle.Capacity}</td>
                    <td>${vehicle.Mileage} km/l</td>
                    <td>${vehicle.LoadedQuantity}</td>
                    <td>${vehicle.FreeSpace}</td>
                    <td>${vehicle.Status}</td>
                    <td>
                        <button class="delete" onclick="deleteVehicle(${vehicle.ID})">🗑 Delete</button>
                    </td>
                </tr>
            `;
        });
        document.getElementById("vehicleTable").innerHTML = rows;
    })
    .catch(err => console.error("Error fetching vehicles:", err));
}



// 🗑 Delete Vehicle
function deleteVehicle(id) {
    fetch(`${API_URL}/delete_vehicle/${id}`, { method: "DELETE" })
    .then(() => {
        loadVehicles();
        alert("✅ Vehicle Deleted Successfully!");
    })
    .catch(err => console.error("Error deleting vehicle:", err));
}

// 📍 Google Maps API - Vehicle Locations
function initMap() {
    const map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 20.5937, lng: 78.9629 },
        zoom: 5,
    });

    fetch(`${API_URL}/vehicles`)
    .then(response => response.json())
    .then(data => {
        data.forEach(vehicle => {
            new google.maps.Marker({
                position: { lat: vehicle.latitude, lng: vehicle.longitude },
                map: map,
                title: vehicle.Name,
            });
        });
    });
}

loadVehicles();
