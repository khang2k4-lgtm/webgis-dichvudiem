//icon vị trí 
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});






//biến toàn cục
var serviceMarkers = [];
var currentLat = null;
var currentLon = null;
var routeLayer = null;
var selectedDestination = null;   // lưu điểm được chọn

var nearestMarker = null;

var searchMode = null; // "nearest" | "all" | null

var selectedSearchLocation = null;

var centerPoint = null;        // vị trí (GPS hoặc search)


var serviceLayer = null;


// Khởi tạo bản đồ
var map = L.map('map').setView([21.0285, 105.8542], 13);

// Tạo BaseMap nhưng KHÔNG addTo(map)
var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
});


// ĐƯỜNG DẪN WMS
var geoserverUrl = "http://localhost:8080/geoserver/webgis/wms";

// Từng layer từ GeoServer
var road = L.tileLayer.wms(geoserverUrl, {
    layers: 'webgis:road',
    format: 'image/png',
    transparent: true
});

var river = L.tileLayer.wms(geoserverUrl, {
    layers: 'webgis:river',
    format: 'image/png',
    transparent: true
});

var water = L.tileLayer.wms(geoserverUrl, {
    layers: 'webgis:water',
    format: 'image/png',
    transparent: true
});

var building = L.tileLayer.wms(geoserverUrl, {
    layers: 'webgis:building',
    format: 'image/png',
    transparent: true
});

var school = L.tileLayer.wms(geoserverUrl, {
    layers: 'webgis:school',
    format: 'image/png',
    transparent: true
});


var overlayMaps = {
    "OpenStreetMap": osm,
    "Road": road,
    "River": river,
    "Water": water,
    "Building": building,
    "School": school
};

L.control.layers(null, overlayMaps).addTo(map);
osm.addTo(map);




var searchLayer = L.layerGroup().addTo(map);




// tìm Vị trí hiện tại
document.getElementById("btnLocate").onclick = function () {
    map.locate({
        setView: true,
        maxZoom: 16,
        enableHighAccuracy: true
    });
};

// Khi tìm thấy vị trí
map.on("locationfound", function (e) {

    var latlng = e.latlng;

    // Xóa marker cũ nếu có
    if (window.currentLocation) {
        map.removeLayer(window.currentLocation);
        map.removeLayer(window.currentCircle);
    }

    // Marker vị trí
    window.currentLocation = L.marker(latlng)
        .addTo(map)
        .bindPopup("Bạn đang ở đây")
        .openPopup();

    // Vòng tròn sai số GPS
    window.currentCircle = L.circle(latlng, {
        radius: e.accuracy,
        color: "blue",
        fillColor: "#30f",
        fillOpacity: 0.2
    }).addTo(map);
});

// Nếu bị lỗi
map.on("locationerror", function () {
    alert("Không lấy được vị trí. Hãy bật GPS hoặc cho phép quyền truy cập.");
});






// Hàm tìm gần nhất quanh vị trí trung tâm (GPS hoặc search)
function findNearestOSM(type, radius) {

    // 🔥 Kiểm tra có vị trí trung tâm chưa
    if (!centerPoint) {
        alert("Hãy lấy vị trí hoặc tìm kiếm địa điểm trước!");
        return;
    }

    var lat = centerPoint.lat;
    var lon = centerPoint.lng;

    // 🔥 Xóa route cũ
    if (routeLayer) {
        map.removeLayer(routeLayer);
        routeLayer = null;
    }

    // 🔥 Xóa nearest cũ
    if (nearestMarker) {
        map.removeLayer(nearestMarker);
        nearestMarker = null;
    }

    // 🔥 Reset điểm đích
    selectedDestination = null;
    document.getElementById("btnRoute").disabled = true;

    var query = "";

    if (type === "hospital") {

        query = `
        [out:json][timeout:25];
        (
          node["amenity"="hospital"](around:${radius},${lat},${lon});
          node["amenity"="clinic"](around:${radius},${lat},${lon});
          node["healthcare"="hospital"](around:${radius},${lat},${lon});
        );
        out body;
        `;

    } else {

        query = `
        [out:json][timeout:25];
        (
          node["amenity"="${type}"](around:${radius},${lat},${lon});
        );
        out body;
        `;
    }

    fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: query
    })
        .then(response => response.json())
        .then(data => {

            if (!data.elements || data.elements.length === 0) {
                alert("Không tìm thấy trong phạm vi đã chọn!");
                return;
            }

            var nearest = null;
            var minDistance = Infinity;

            data.elements.forEach(function (element) {

                if (!element.lat || !element.lon) return;

                var serviceLatLng = L.latLng(element.lat, element.lon);
                var distance = centerPoint.distanceTo(serviceLatLng);

                if (distance < minDistance) {
                    minDistance = distance;
                    nearest = element;
                }
            });

            if (nearest) {

                var nearestLatLng = L.latLng(nearest.lat, nearest.lon);

                nearestMarker = L.marker(nearestLatLng)
                    .addTo(map)
                    .bindPopup(
                        "<b>" + (nearest.tags.name || "Không tên") + "</b><br>" +
                        "Khoảng cách: " + (minDistance / 1000).toFixed(2) + " km"
                    )
                    .openPopup();

                // 🔥 Lưu làm điểm đích để chỉ đường
                selectedDestination = nearestLatLng;

                document.getElementById("btnRoute").disabled = false;

                map.setView(nearestLatLng, 16);
            }
        })
        .catch(err => {
            console.error(err);
            alert("Lỗi Overpass!");
        });
}


// Nút tìm gần nhất
document.getElementById("btnFind").onclick = function () {

    var selectedType = document.getElementById("serviceType").value;
    var selectedRadius = document.getElementById("searchRadius").value;

    // 🔥 Chỉ kiểm tra centerPoint
    if (!centerPoint) {
        alert("Hãy lấy vị trí hoặc tìm kiếm địa điểm trước!");
        return;
    }

    findNearestOSM(selectedType, selectedRadius);
};





// Hàm tìm tất cả điểm quanh vị trí hiện tại
function findAllOSM(type, radius) {

    if (!centerPoint) {
        alert("Hãy lấy vị trí hoặc tìm kiếm địa điểm trước!");
        return;
    }

    if (!radius || isNaN(radius)) {
        alert("Bán kính không hợp lệ!");
        return;
    }

    radius = parseInt(radius);

    var lat = centerPoint.lat;
    var lon = centerPoint.lng;

    // 🔥 Xóa route cũ
    if (routeLayer) {
        map.removeLayer(routeLayer);
        routeLayer = null;
    }

    // 🔥 Xóa marker cũ
    if (serviceMarkers && serviceMarkers.length > 0) {
        serviceMarkers.forEach(marker => map.removeLayer(marker));
    }
    serviceMarkers = [];

    selectedDestination = null;

    var btnRoute = document.getElementById("btnRoute");
    if (btnRoute) btnRoute.disabled = true;

    // 🔥 Query tối ưu (KHÔNG relation, giới hạn 100 để tránh 504)
    var query = `
[out:json][timeout:15];
(
  node["amenity"="${type}"](around:${radius},${lat},${lon});
  way["amenity"="${type}"](around:${radius},${lat},${lon});
);
out center 100;
`;

    fetch("https://overpass.kumi.systems/api/interpreter", {
        method: "POST",
        body: query
    })
        .then(response => {
            if (!response.ok) {
                throw new Error("HTTP " + response.status);
            }
            return response.json();
        })
        .then(data => {

            if (!data.elements || data.elements.length === 0) {
                alert("Không tìm thấy trong phạm vi đã chọn!");
                return;
            }

            var userLatLng = L.latLng(lat, lon);

            var results = data.elements.map(el => {

                var elLat, elLon;

                if (el.type === "node") {
                    elLat = el.lat;
                    elLon = el.lon;
                } else if (el.center) {
                    elLat = el.center.lat;
                    elLon = el.center.lon;
                }

                if (!elLat || !elLon) return null;

                var distance = userLatLng.distanceTo([elLat, elLon]);

                return {
                    lat: elLat,
                    lon: elLon,
                    name: el.tags?.name || "Không tên",
                    distance: distance
                };

            }).filter(x => x !== null);

            // 🔥 Sắp xếp gần → xa
            results.sort((a, b) => a.distance - b.distance);

            results.forEach(item => {

                var serviceLatLng = L.latLng(item.lat, item.lon);

                var marker = L.marker(serviceLatLng)
                    .addTo(map)
                    .bindPopup(
                        "<b>" + item.name + "</b><br>" +
                        "Khoảng cách: " + (item.distance / 1000).toFixed(2) + " km"
                    );

                // 🔥 Khi click marker → lưu vào selectedDestination
                marker.on("click", function () {
                    selectedDestination = serviceLatLng;
                    if (btnRoute) btnRoute.disabled = false;
                });

                serviceMarkers.push(marker);
            });

            alert("Tìm thấy " + serviceMarkers.length + " địa điểm!");

            if (serviceMarkers.length > 0) {
                var group = L.featureGroup(serviceMarkers);
                map.fitBounds(group.getBounds());
            }

        })
        .catch(err => {
            console.error("Overpass lỗi:", err);
            alert("Overpass quá tải hoặc lỗi mạng!");
        });
}


// Nút tìm tất cả
document.getElementById("btnFindAll").onclick = function () {

    if (!centerPoint) {
        alert("Hãy lấy vị trí hoặc tìm kiếm địa điểm trước!");
        return;
    }

    var selectedType = document.getElementById("serviceType").value;
    var selectedRadius = document.getElementById("searchRadius").value;

    findAllOSM(selectedType, selectedRadius);
};




// Hàm chỉ đường
function drawRoute() {

    // 🔥 Kiểm tra vị trí bắt đầu (centerPoint)
    if (!centerPoint) {
        alert("Hãy lấy vị trí hoặc tìm kiếm địa điểm trước!");
        return;
    }

    // 🔥 Kiểm tra điểm đích
    if (!selectedDestination || !selectedDestination.lat || !selectedDestination.lng) {
        alert("Chưa có điểm đích!");
        return;
    }

    // Xóa route cũ nếu có
    if (routeLayer) {
        map.removeLayer(routeLayer);
        routeLayer = null;
    }

    var startLat = centerPoint.lat;
    var startLon = centerPoint.lng;

    var endLat = selectedDestination.lat;
    var endLon = selectedDestination.lng;

    var url = `https://router.project-osrm.org/route/v1/driving/` +
        `${startLon},${startLat};${endLon},${endLat}` +
        `?overview=full&geometries=geojson`;

    fetch(url)
        .then(res => res.json())
        .then(data => {

            if (!data.routes || data.routes.length === 0) {
                alert("Không tìm được đường!");
                return;
            }

            var routeGeoJSON = data.routes[0].geometry;

            routeLayer = L.geoJSON(routeGeoJSON, {
                style: {
                    color: "blue",
                    weight: 5
                }
            }).addTo(map);

            map.fitBounds(routeLayer.getBounds());
        })
        .catch(err => {
            console.error("OSRM error:", err);
            alert("Lỗi vẽ đường!");
        });
}

//nút chỉ đường
document.getElementById("btnRoute").onclick = function () {
    drawRoute();
};



// Hàm tìm kiếm theo: chi tiết (số nhà/thôn/đường), xã, huyện, tỉnh
function searchAddress(chiTiet, xa, huyen, tinh) {

    if (!xa || !huyen || !tinh) {
        alert("Vui lòng nhập đầy đủ xã, huyện, tỉnh!");
        return;
    }

    // 🔥 Ghép địa chỉ linh hoạt
    var parts = [];

    if (chiTiet) parts.push(chiTiet);
    parts.push(xa);
    parts.push(huyen);
    parts.push(tinh);
    parts.push("Vietnam");

    var fullAddress = parts.join(", ");

    var url = "https://nominatim.openstreetmap.org/search?" +
        "format=json&limit=1&addressdetails=1&q=" +
        encodeURIComponent(fullAddress);

    fetch(url, {
        headers: {
            "Accept": "application/json"
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error("HTTP status " + response.status);
            }
            return response.json();
        })
        .then(data => {

            if (!data || data.length === 0) {
                alert("Không tìm thấy địa chỉ!");
                return;
            }

            var lat = parseFloat(data[0].lat);
            var lon = parseFloat(data[0].lon);
            var latLng = L.latLng(lat, lon);

            // 🔥 LƯU centerPoint
            centerPoint = latLng;

            // Xóa route cũ
            if (routeLayer) {
                map.removeLayer(routeLayer);
                routeLayer = null;
            }

            // Xóa nearest marker
            if (nearestMarker) {
                map.removeLayer(nearestMarker);
                nearestMarker = null;
            }

            // Xóa serviceMarkers
            if (serviceMarkers && serviceMarkers.length > 0) {
                serviceMarkers.forEach(marker => map.removeLayer(marker));
                serviceMarkers = [];
            }

            // Tạo searchLayer nếu chưa có
            if (!searchLayer) {
                searchLayer = L.layerGroup().addTo(map);
            }

            searchLayer.clearLayers();

            // Thêm marker tìm kiếm
            L.marker(latLng)
                .addTo(searchLayer)
                .bindPopup(data[0].display_name)
                .openPopup();

            map.setView(latLng, 17);

            // Reset điểm đích
            selectedDestination = null;

            var btnRoute = document.getElementById("btnRoute");
            if (btnRoute) btnRoute.disabled = true;

            console.log("Đã lưu centerPoint:", centerPoint.lat, centerPoint.lng);
        })
        .catch(error => {
            console.error("Nominatim error:", error);
            alert("Không kết nối được Nominatim!");
        });
}


// Nút tìm kiếm
document.getElementById("btnSearchAddress").onclick = function () {

    var chiTiet = document.getElementById("chiTiet").value.trim();
    var xa = document.getElementById("xa").value.trim();
    var huyen = document.getElementById("huyen").value.trim();
    var tinh = document.getElementById("tinh").value.trim();

    if (!xa || !huyen || !tinh) {
        alert("Nhập đầy đủ Xã - Huyện - Tỉnh!");
        return;
    }

    searchAddress(chiTiet, xa, huyen, tinh);
};








var centerPoint = null;   // 🔥 vị trí trung tâm duy nhất
var userMarker = null;    // marker vị trí người dùng

map.on("locationfound", function (e) {

    centerPoint = e.latlng;   // 🔥 LƯU vị trí GPS

    // 🔥 Xóa marker cũ nếu có
    if (userMarker) {
        map.removeLayer(userMarker);
    }

    userMarker = L.marker(centerPoint)
        .addTo(map)
        .bindPopup("Bạn đang ở đây")
        .openPopup();

    console.log("GPS:", centerPoint.lat, centerPoint.lng);
});





















