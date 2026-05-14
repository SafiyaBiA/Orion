document.addEventListener("DOMContentLoaded", function () {
    const mapContainer = document.getElementById("map");
    const orderTable = document.querySelector("#orderTable tbody");
    const searchInput = document.getElementById("searchInput");
    const filterSelect = document.getElementById("statusFilter");
    const orderForm = document.getElementById("orderForm");

    let map = L.map('map', { scrollWheelZoom: false }).setView([20.5937, 78.9629], 5); // Centered at India

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    async function fetchOrders() {
        try {
            const response = await fetch("http://localhost:3000/api/orders");
            let orders = await response.json();

            console.log("📦 Orders Fetched:", orders);

            const searchValue = searchInput.value.toLowerCase();
            const selectedStatus = filterSelect.value;

            if (searchValue) {
                orders = orders.filter(order =>
                    order.orderID.toLowerCase().includes(searchValue) ||
                    order.address.toLowerCase().includes(searchValue)
                );
            }

            if (selectedStatus !== "All") {
                orders = orders.filter(order => order.status === selectedStatus);
            }

            renderOrders(orders);
            plotOrdersOnMap(orders);
        } catch (error) {
            console.error("❌ Error fetching orders:", error);
        }
    }

    function renderOrders(orders) {
        orderTable.innerHTML = "";
        orders.forEach(order => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${order.orderID}</td>
                <td>${order.address}</td>
                <td>${order.quantity}</td>
                <td class="status">${order.status}</td>

                <td>${formatDate(order.created_at)}</td>
                <td><button class="delete-btn" data-id="${order.orderID}">🗑 Delete</button></td>
            `;
            orderTable.appendChild(row);
        });
    
        function formatDate(timestamp) {
            const date = new Date(timestamp);
            return date.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
        }
    
        document.querySelectorAll(".delete-btn").forEach(button => {
            button.addEventListener("click", async function () {
                if (confirm("⚠️ Are you sure you want to delete this order?")) {
                    await deleteOrder(this.getAttribute("data-id"));
                }
            });
        });
    
        document.querySelectorAll(".status-dropdown").forEach(select => {
            select.addEventListener("change", async function () {
                const orderID = this.getAttribute("data-id");
                const newStatus = this.value;
                await updateOrderStatus(orderID, newStatus);
            });
        });
    }
    async function updateOrderStatus(orderID, status) {
        try {
            const response = await fetch(`http://localhost:3000/api/orders/${orderID}/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status })
            });
    
            if (!response.ok) throw new Error("Failed to update status");
    
            console.log(`✅ Status updated for Order ${orderID}: ${status}`);
            fetchOrders(); // Refresh order list dynamically
        } catch (error) {
            console.error("❌ Error updating status:", error);
        }
    }
    
    

    async function deleteOrder(orderID) {
        await fetch(`http://localhost:3000/api/orders/${orderID}`, { method: "DELETE" });
        fetchOrders();
    }
    async function fetchVehicleStatus() {
        try {
            const response = await fetch("http://localhost:3000/api/vehicles");
            const data = await response.json();
    
            document.getElementById("activeCount").textContent = data.activeCount;
            document.getElementById("availableCount").textContent = data.availableCount;
    
            renderVehicleTable(data.vehicles);
        } catch (error) {
            console.error("❌ Error fetching vehicles:", error);
        }
    }
    
    function renderVehicleTable(vehicles) {
        const vehicleTableBody = document.getElementById("vehicleTableBody");
        vehicleTableBody.innerHTML = ""; // Clear table before inserting new data
    
        vehicles.forEach(vehicle => {
            const available = vehicle.current_orders < vehicle.capacity;
            const row = `
                <tr>
                    <td>${vehicle.vehicle_id}</td>
                    <td class="${vehicle.status === 'Active' ? 'available' : 'unavailable'}">${vehicle.status}</td>
                    <td>${vehicle.current_orders}</td>
                    <td>${vehicle.capacity - vehicle.current_orders}</td>
                    <td>${available ? '✅ Yes' : '❌ No'}</td>
                </tr>
            `;
            vehicleTableBody.innerHTML += row;
        });
    }
    
    // Call function when page loads
    fetchVehicleStatus();
    
    
    function renderVehicleStatus(vehicles) {
        const vehicleTableBody = document.getElementById("vehicleTableBody");
        vehicleTableBody.innerHTML = "";
    
        vehicles.forEach(vehicle => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${vehicle.vehicle_id}</td>
                <td class="${vehicle.status === 'Active' ? 'available' : 'unavailable'}">${vehicle.status}</td>
                <td>${vehicle.current_orders}</td>
                <td>${vehicle.capacity - vehicle.current_orders}</td>
                <td>${vehicle.current_orders < vehicle.capacity ? '✅ Yes' : '❌ No'}</td>
            `;
            vehicleTableBody.appendChild(row);
        });
    }
    
    

    async function getCoordinates(address) {
        try {
            console.log(`🔍 Fetching coordinates for: ${address}`);
    
            let response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
            let data = await response.json();
    
            // If no results, retry with a broader address (city/state)
            if (data.length === 0 && address.includes(",")) {
                let fallbackAddress = address.split(",").slice(-3).join(",").trim();
                console.warn(`⚠️ Retrying with broader address: ${fallbackAddress}`);
    
                response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fallbackAddress)}`);
                data = await response.json();
            }
    
            if (data.length === 0) {
                console.warn(`⚠️ No valid location found for: ${address}`);
                return null;
            }
    
            return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
        } catch (error) {
            console.error("❌ Geocoding API error:", error);
            return null;
        }
    }
    

    async function plotOrdersOnMap(orders) {
        map.eachLayer(layer => {
            if (layer instanceof L.Marker) {
                map.removeLayer(layer);
            }
        });

        for (let order of orders) {
            const coords = await getCoordinates(order.address);
            if (coords) {
                L.marker([coords.lat, coords.lon])
                    .addTo(map)
                    .bindPopup(`<b>📦 Order ID:</b> ${order.orderID}<br>
                                <b>📍 Address:</b> ${order.address}<br>
                                <b>🔄 Status:</b> ${order.status}`);
            } else {
                console.warn(`⚠️ No valid location found for: ${order.address}`);
            }
        }
    }

    orderForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const orderID = document.getElementById("orderID").value;
        const address = document.getElementById("address").value;
        const quantity = document.getElementById("quantity").value;

        await fetch("http://localhost:3000/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderID, address, quantity })
        });

        fetchOrders();
    });

    searchInput.addEventListener("input", fetchOrders);
    filterSelect.addEventListener("change", fetchOrders);

    fetchOrders();
});
