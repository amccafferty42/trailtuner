// Variables for Leaflet map, layer, and icons
let leafletMap;
let geoJsonLayer;
const startIcon = L.icon({
    iconUrl: 'resources/start.png',
    iconSize: [20, 28],
    iconAnchor: [10, 27]
});
const endIcon = L.icon({
    iconUrl: 'resources/end.png',
    iconSize: [20, 28],
    iconAnchor: [10, 27]
});
const startEndIcon = L.icon({
    iconUrl: 'resources/startend.png',
    iconSize: [20, 28],
    iconAnchor: [10, 27]
});
const neutralIcon = L.icon({
    iconUrl: 'resources/neutral.png',
    iconSize: [20, 28],
    iconAnchor: [10, 27]
});

// Set coordinates and zoom of map
function initMap() {
    if (this.leafletMap != undefined) this.leafletMap.remove();
    const half = Math.round(trailFeature.geometry.coordinates.length / 2);
    const lat = trailFeature.geometry.coordinates[half][1];
    const long = trailFeature.geometry.coordinates[half][0];
    this.leafletMap = L.map('map').setView([lat, long], 10);
    this.geoJsonLayer = L.geoJSON().addTo(this.leafletMap);

    // create legend
    // const legend = L.control({ position: "bottomleft" });
    // legend.onAdd = function () {
    //     let div = L.DomUtil.create("div", "description");
    //     L.DomEvent.disableClickPropagation(div);
    //     return div;
    // };
    // legend.addTo(this.leafletMap);
    L.tileLayer('https://tile.tracestrack.com/topo__/{z}/{x}/{y}.png?key=9a6df92c1ad74b39dc40c8690eeac1af ', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.leafletMap);
    // L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    //     attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    // }).addTo(this.leafletMap);
    resetMap();
}

// Reset map to display only trail and trailheads (no campsites)
function resetMap() {
    this.geoJsonLayer.clearLayers();
    if (toggleTrail && toggleTrail.checked) this.geoJsonLayer.addData(trailFeature);
    if (toggleTrailheads && toggleTrailheads.checked) for (feature of trailheadFeatures) this.geoJsonLayer.addData(feature);
    if (toggleCampsites && toggleCampsites.checked) for (feature of campsiteFeatures) {
        if (feature.properties && feature.properties.title !== "*Dispersed Camping*") this.geoJsonLayer.addData(feature);
    }
    this.geoJsonLayer.eachLayer(function (layer) {
        if (layer.feature.geometry.type == "LineString") {
            layer.setStyle({color :'#fc0000'});
            layer.bindPopup('<h5>' + layer.feature.properties.title + '</h5><hr><p><img src="./resources/rulers.svg" alt="*">&nbsp;&nbsp;<strong>Distance:</strong> ' + Math.round(trailLength * distanceConstant * 10) / 10 + ' ' + distanceUnit + '</p><p><img src="./resources/graph-up-arrow.svg" alt="*">&nbsp;&nbsp;<strong>Elevation gain:</strong> ' + Math.trunc(trailElevationGain * elevationConstant).toLocaleString() + ' ' + elevationUnit + '</p><p><img src="./resources/graph-down-arrow.svg" alt="*">&nbsp;&nbsp;<strong>Elevation loss:</strong> ' + Math.trunc(trailElevationLoss * elevationConstant).toLocaleString() + ' ' + elevationUnit + '</p>');
        } else if (layer.feature.geometry.type != "LineString" && layer.feature.properties && layer.feature.properties.title) {
            if (layer.feature.properties.folderId == trailheadFolder.id) {
                layer.setIcon(startIcon);
                layer.bindTooltip(layer.feature.properties.title, {permanent: true, opacity: 0.75});
                layer.bindPopup('<h5>' + layer.feature.properties.title + '</h5><hr><p><img src="./resources/mountain.svg" alt="*">&nbsp;&nbsp;<strong>Elevation:</strong> ' + Math.trunc(layer.feature.geometry.coordinates[2] * elevationConstant).toLocaleString() + ' ' + elevationUnit + '</p><p><img src="./resources/pin-map-fill.svg" alt="*">&nbsp;&nbsp;<strong>GPS:</strong> ' + layer.feature.geometry.coordinates[1].toFixed(5) + ',' + layer.feature.geometry.coordinates[0].toFixed(5) + '</p>');
            } else if (layer.feature.properties.folderId == campsiteFolder.id) {
                layer.setIcon(neutralIcon);
                layer.bindTooltip(layer.feature.properties.title, {permanent: true, opacity: 0.75});
                layer.bindPopup('<h5>' + layer.feature.properties.title + '</h5><hr><p><img src="./resources/mountain.svg" alt="*">&nbsp;&nbsp;<strong>Elevation:</strong> ' + Math.trunc(layer.feature.geometry.coordinates[2] * elevationConstant).toLocaleString() + ' ' + elevationUnit + '</p><p><img src="./resources/pin-map-fill.svg" alt="*">&nbsp;&nbsp;<strong>GPS:</strong> ' + layer.feature.geometry.coordinates[1].toFixed(5) + ',' + layer.feature.geometry.coordinates[0].toFixed(5) + '</p>');
            }
        }
    });
    this.geoJsonLayer.on('click', function(e) { 
        e.layer._map.panTo([e.latlng.lat, e.latlng.lng]);
    });
}

// Update map to display the generated route
function updateMap() {
    this.geoJsonLayer.clearLayers();
    for (feature of exportedRoute.features) {
        if (feature.geometry && (feature.geometry.type == "LineString" || 
            feature.properties && feature.properties.folderId == trailheadFolder.id && toggleTrailheads.checked ||
            feature.properties && feature.properties.folderId == campsiteFolder.id && toggleCampsites.checked)) {
                this.geoJsonLayer.addData(feature);
            }
    }
    if (toggleTrail && toggleTrail.checked) {
        this.geoJsonLayer.addData(trailFeature);
    }
    let nightIndex = 0, dayIndex = 0;
    this.geoJsonLayer = this.geoJsonLayer.eachLayer(function (layer) {
        if (layer.feature.properties && layer.feature.geometry.type != "LineString" && layer.feature.properties.title) {
            layer.bindTooltip(layer.feature.properties.title, {permanent: true, opacity: 0.75});
            if (layer.feature.properties && layer.feature.properties.folderId == campsiteFolder.id) {
                nightIndex++;
                if (nightIndex > 0 && nightIndex < 20) {
                    //numbers created with 600 font, bold, segoe UI
                    const icon = L.icon({
                        iconUrl: 'resources/' + nightIndex +'.png',
                        iconSize: [20, 28],
                        iconAnchor: [10, 27]
                    });
                    layer.setIcon(icon);
                } else {
                    layer.setIcon(neutralIcon);
                }
                layer.bindPopup('<h4><strong>Night ' + nightIndex + '&nbsp;&nbsp;</strong><small class="text-body-secondary">' + this.route[nightIndex - 1].date.toLocaleDateString('en-us', { weekday:"short", year:"2-digit", month:"numeric", day:"numeric"}) + '</small></h4><h5>' + layer.feature.properties.title + '</h5><hr><p><img src="./resources/mountain.svg" alt="*">&nbsp;&nbsp;<strong>Elevation:</strong> ' + Math.trunc(layer.feature.geometry.coordinates[2] * elevationConstant).toLocaleString() + ' ' + elevationUnit + '</p><p><img src="./resources/pin-map-fill.svg" alt="*">&nbsp;&nbsp;<strong>GPS:</strong> ' + layer.feature.geometry.coordinates[1].toFixed(5) + ',' + layer.feature.geometry.coordinates[0].toFixed(5) + '</p>');
            } else if (layer.feature.properties && layer.feature.properties.folderId == trailheadFolder.id && layer.feature.properties.title == this.route[0].start.properties.title && layer.feature.properties.title == this.route[this.route.length - 1].end.properties.title) {
                //start & end trailhead (full circuits)
                layer.bindPopup('<h4><strong>Start&nbsp;&nbsp;</strong><small class="text-body-secondary">' + this.route[0].date.toLocaleDateString('en-us', { weekday:"short", year:"2-digit", month:"numeric", day:"numeric"}) + '</small></h4><h4><strong>End&nbsp;&nbsp;</strong><small class="text-body-secondary">' + this.route[this.route.length - 1].date.toLocaleDateString('en-us', { weekday:"short", year:"2-digit", month:"numeric", day:"numeric"}) + '</small></h4><h5>' + layer.feature.properties.title + '</h5><hr><p><img src="./resources/mountain.svg" alt="*">&nbsp;&nbsp;<strong>Elevation:</strong> ' + Math.trunc(layer.feature.geometry.coordinates[2] * elevationConstant).toLocaleString() + ' ' + elevationUnit + '</p><p><img src="./resources/pin-map-fill.svg" alt="*">&nbsp;&nbsp;<strong>GPS:</strong> ' + layer.feature.geometry.coordinates[1].toFixed(5) + ',' + layer.feature.geometry.coordinates[0].toFixed(5) + '</p>');
                layer.setIcon(startEndIcon);
            } else if (layer.feature.properties && layer.feature.properties.folderId == trailheadFolder.id && layer.feature.properties.title == this.route[0].start.properties.title) {
                //start trailhead
                layer.bindPopup('<h4><strong>Start&nbsp;&nbsp;</strong><small class="text-body-secondary">' + this.route[0].date.toLocaleDateString('en-us', { weekday:"short", year:"2-digit", month:"numeric", day:"numeric"}) + '</small></h4><h5>' + layer.feature.properties.title + '</h5><hr><p><img src="./resources/mountain.svg" alt="*">&nbsp;&nbsp;<strong>Elevation:</strong> ' + Math.trunc(layer.feature.geometry.coordinates[2] * elevationConstant).toLocaleString() + ' ' + elevationUnit + '</p><p><img src="./resources/pin-map-fill.svg" alt="*">&nbsp;&nbsp;<strong>GPS:</strong> ' + layer.feature.geometry.coordinates[1].toFixed(5) + ',' + layer.feature.geometry.coordinates[0].toFixed(5) + '</p>');
                layer.setIcon(startIcon);
            } else if (layer.feature.properties && layer.feature.properties.folderId == trailheadFolder.id && layer.feature.properties.title == this.route[this.route.length - 1].end.properties.title) {
                //end trailhead
                layer.bindPopup('<h4><strong>End&nbsp;&nbsp;</strong><small class="text-body-secondary">' + this.route[this.route.length - 1].date.toLocaleDateString('en-us', { weekday:"short", year:"2-digit", month:"numeric", day:"numeric"}) + '</small></h4><h5>' + layer.feature.properties.title + '</h5><hr><p><img src="./resources/mountain.svg" alt="*">&nbsp;&nbsp;<strong>Elevation:</strong> ' + Math.trunc(layer.feature.geometry.coordinates[2] * elevationConstant).toLocaleString() + ' ' + elevationUnit + '</p><p><img src="./resources/pin-map-fill.svg" alt="*">&nbsp;&nbsp;<strong>GPS:</strong> ' + layer.feature.geometry.coordinates[1].toFixed(5) + ',' + layer.feature.geometry.coordinates[0].toFixed(5) + '</p>');
                layer.setIcon(endIcon);
            }
        } else if (layer.feature.geometry.type == "LineString") {
            layer.setStyle({color :'red'}); 
            //if (toggleTrail && !toggleTrail.checked) layer.bindPopup('<h5>' + this.route[dayIndex].start.properties.title + ' to</h5><h5>' + this.route[dayIndex].end.properties.title + '</h5><hr><p><img src="./resources/sun-fill.svg" alt="*">&nbsp;&nbsp;<strong>' + layer.feature.properties.title + ': </strong>' + layer.feature.properties.date + '</p><p><img src="./resources/rulers.svg" alt="*">&nbsp;&nbsp;<strong>Distance:</strong> ' + Math.round(this.route[dayIndex].length * distanceConstant * 10) / 10 + ' ' + distanceUnit + '</p><p><img src="./resources/graph-up-arrow.svg" alt="*">&nbsp;&nbsp;<strong>Elevation gain:</strong> ' + Math.trunc(this.route[dayIndex].elevationGain * elevationConstant).toLocaleString() + ' ' + elevationUnit + '</p><p><img src="./resources/graph-down-arrow.svg" alt="*">&nbsp;&nbsp;<strong>Elevation loss:</strong> ' + Math.trunc(this.route[dayIndex].elevationLoss * elevationConstant).toLocaleString() + ' ' + elevationUnit + '</p>');
            if (toggleTrail && !toggleTrail.checked) layer.bindPopup('<h4><strong>' + layer.feature.properties.title + '&nbsp;&nbsp;</strong><small class="text-body-secondary">' + this.route[dayIndex].date.toLocaleDateString('en-us', { weekday:"short", year:"2-digit", month:"numeric", day:"numeric"}) + '</small></h4><h5>' + this.route[dayIndex].start.properties.title + ' to</h5><h5>' + this.route[dayIndex].end.properties.title + '</h5><hr><p><img src="./resources/rulers.svg" alt="*">&nbsp;&nbsp;<strong>Distance:</strong> ' + Math.round(this.route[dayIndex].length * distanceConstant * 10) / 10 + ' ' + distanceUnit + '</p><p><img src="./resources/graph-up-arrow.svg" alt="*">&nbsp;&nbsp;<strong>Elevation gain:</strong> ' + Math.trunc(this.route[dayIndex].elevationGain * elevationConstant).toLocaleString() + ' ' + elevationUnit + '</p><p><img src="./resources/graph-down-arrow.svg" alt="*">&nbsp;&nbsp;<strong>Elevation loss:</strong> ' + Math.trunc(this.route[dayIndex].elevationLoss * elevationConstant).toLocaleString() + ' ' + elevationUnit + '</p>');
            else layer.bindPopup('<h5>' + layer.feature.properties.title + '</h5><hr><p><img src="./resources/rulers.svg" alt="*">&nbsp;&nbsp;<strong>Distance:</strong> ' + Math.round(trailLength * distanceConstant * 10) / 10 + ' ' + distanceUnit + '</p><p><img src="./resources/graph-up-arrow.svg" alt="*">&nbsp;&nbsp;<strong>Elevation gain:</strong> ' + Math.trunc(trailElevationGain * elevationConstant).toLocaleString() + ' ' + elevationUnit + '</p><p><img src="./resources/graph-down-arrow.svg" alt="*">&nbsp;&nbsp;<strong>Elevation loss:</strong> ' + Math.trunc(trailElevationLoss * elevationConstant).toLocaleString() + ' ' + elevationUnit + '</p>');
            layer.bindTooltip(layer.feature.properties.title, {permanent: false, opacity: 0.75});
            // if (dayIndex % 2 == 0) layer.setStyle({color :'#ff7d7d'});
            // if (dayIndex % 2 == 0) layer.setStyle({color :'blue'});
            // if (dayIndex % 3 == 0) layer.setStyle({color :'yellow'});
            if (layer.feature.properties.folderId == trailFolder.id) dayIndex++;
        }
    });
    this.geoJsonLayer.on('click', function(e) { 
        console.log(this.trailElevationChart);
        e.layer._map.panTo([e.latlng.lat, e.latlng.lng]);
        deselectRows();
        if (tableBody.innerHTML != "") {
            if (e.layer.feature.geometry.type == "LineString") {
                selectRow(e.layer.feature.properties.title.slice(-1));
            }
        }
    });
}

function markerClose() {
    this.geoJsonLayer.eachLayer(function (layer) {
        layer.closePopup();
    });
    deselectRows();
}

function markerOpen(name) {
    this.geoJsonLayer.eachLayer(function (layer) {
        if (layer.feature.geometry.type != "LineString") {
            if (layer.feature.id === name) {
                centerMarker(layer);
            }
        } else {
            if (layer.feature.properties.title === name) {
                centerMarker(layer);
            }
        }
    });
}
  
function centerMarker(layer) {
    layer.openPopup();
    if (layer.feature.geometry.type != "LineString") {
        layer._map.panTo([layer.feature.geometry.coordinates[1], layer.feature.geometry.coordinates[0]]);
    } else {
        const half = Math.round(layer.feature.geometry.coordinates.length / 2);
        console.log(half);
        layer._map.panTo([layer.feature.geometry.coordinates[half][1], layer.feature.geometry.coordinates[half][0]]);
    }
  }