// Variables for Leaflet map, layer, and icons
let leafletMap;
let geoJsonLayer;
const startIcon = L.icon({
    iconUrl: '../resources/start.png',
    iconSize: [20, 28],
    iconAnchor: [10, 27]
});
const endIcon = L.icon({
    iconUrl: '../resources/end.png',
    iconSize: [20, 28],
    iconAnchor: [10, 27]
});
const neutralIcon = L.icon({
    iconUrl: '../resources/neutral.png',
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
    //     //const text = "*Dispersed Camping is defined as staying anywhere on trail <b>outside</b> of a designated campground";
    //     //const text = '<div class="toggleVisibility"><input class="toggle-visibility-input form-check-input" type="checkbox" id="toggle-trailheads" title="Trailheads" checked onchange="toggleIconVisibility(this)"><label class="toggle-visibility-input form-check-label" for="toggle-trailheads" title="Trailheads"><h2 class="half-day-label"><small>&nbsp;Trailheads&nbsp;</small></h2></label><input class="toggle-visibility-input form-check-input" type="checkbox" id="toggle-campsites" title="Campsites" onchange="toggleIconVisibility(this)"><label class="toggle-visibility-input form-check-label" for="toggle-campsites" title="Campsites"><h2 class="half-day-label"><small>&nbsp;Campsites&nbsp;</small></h2></label></div>';
    //     //<span class=\"red\"><b>&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;</span> = restricted camping<br><span class=\"green\">&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;</span> = unrestricted camping</b><br>
    //     //div.insertAdjacentHTML("beforeend", text);
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
        if (layer.feature.geometry.type == "LineString") layer.setStyle({color :'#fc0000'}); 
        if (layer.feature.geometry.type != "LineString" && layer.feature.properties && layer.feature.properties.title) {
            if (layer.feature.properties.folderId == trailheadFolder.id) {
                layer.setIcon(startIcon);
                layer.bindTooltip(layer.feature.properties.title, {permanent: true, opacity: 0.75});
            } else if (layer.feature.properties.folderId == campsiteFolder.id) {
                layer.setIcon(neutralIcon);
                layer.bindTooltip(layer.feature.properties.title, {permanent: true, opacity: 0.75});
            }
        }
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
    this.geoJsonLayer.eachLayer(function (layer) {
        if (layer.feature.properties && layer.feature.geometry.type != "LineString" && layer.feature.properties.title) {
            layer.bindTooltip(layer.feature.properties.title, {permanent: true, opacity: 0.75});
            if (layer.feature.properties && layer.feature.properties.folderId == campsiteFolder.id) {
                nightIndex++;
                if (nightIndex > 0 && nightIndex < 20) {
                    //numbers created with 600 font, bold, segoe UI
                    const icon = L.icon({
                        iconUrl: '../resources/' + nightIndex +'.png',
                        iconSize: [20, 28],
                        iconAnchor: [10, 27]
                    });
                    layer.setIcon(icon);
                } else {
                    layer.setIcon(neutralIcon);
                }
            } else if (layer.feature.properties && layer.feature.properties.folderId == trailheadFolder.id && layer.feature.properties.title == this.route[0].start.properties.title) {
                layer.bindPopup('Start');
                layer.setIcon(startIcon);
            } else if (layer.feature.properties && layer.feature.properties.folderId == trailheadFolder.id && layer.feature.properties.title == this.route[this.route.length - 1].end.properties.title) {
                layer.bindPopup('Finish');
                layer.setIcon(endIcon);
            }
        } else if (layer.feature.geometry.type == "LineString") {
            layer.setStyle({color :'red'}); 
            layer.bindPopup('Start: ' + this.route[dayIndex].start.properties.title + '<br>End: ' + this.route[dayIndex].end.properties.title + '<br>Length: ' + Math.round(this.route[dayIndex].length * distanceConstant * 10) / 10 + ' ' + distanceUnit);
            layer.bindTooltip(layer.feature.properties.title, {permanent: false, opacity: 0.75});
            // if (dayIndex % 2 == 0) layer.setStyle({color :'#ff7d7d'});
            // if (dayIndex % 2 == 0) layer.setStyle({color :'blue'});
            // if (dayIndex % 3 == 0) layer.setStyle({color :'yellow'});
            if (layer.feature.properties.folderId != trailFolder.id) dayIndex++;
        }
    });
}