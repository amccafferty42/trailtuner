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
    
    // 1. Setup Map
    const half = Math.round(trailFeature.geometry.coordinates.length / 2);
    const lat = trailFeature.geometry.coordinates[half][1];
    const long = trailFeature.geometry.coordinates[half][0];
    this.leafletMap = L.map('map').setView([lat, long], 16);
    this.geoJsonLayer = L.geoJSON().addTo(this.leafletMap);

    // 2. Initialize the Hover Marker (Red Dot)
    // We create it once and hide/show it as needed
    if (mapHoverMarker) mapHoverMarker.remove();
    mapHoverMarker = L.circleMarker([0, 0], {
        radius: 6,
        fillColor: "#ff0000",
        color: "#fff",
        weight: 2,
        opacity: 1,
        fillOpacity: 1
    }).addTo(this.leafletMap);
    mapHoverMarker.getElement().style.display = 'none';

    L.tileLayer('https://tile.tracestrack.com/topo__/{z}/{x}/{y}.png?key=9a6df92c1ad74b39dc40c8690eeac1af', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.leafletMap);

    resetMap(); // (Your existing function to draw lines/markers)

    this.leafletMap.off('mousemove');
    this.leafletMap.off('mouseout');

    // Attach new listeners with 'this' context bound
    this.leafletMap.on('mousemove', onMapHover.bind(this));
    this.leafletMap.on('mouseout', onMapOut.bind(this));
    
    this.leafletMap.fitBounds(this.geoJsonLayer.getBounds());
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
            layer.bindPopup('<h5>' + layer.feature.properties.title + '</h5><hr><p><img src="./resources/rulers.svg" alt="*">&nbsp;&nbsp;<nobr><strong>Distance:</strong> ' + Math.round(trailLength * distanceConstant * 10) / 10 + ' ' + distanceUnit + '</p></nobr><p><img src="./resources/graph-up-arrow.svg" alt="*">&nbsp;&nbsp;<nobr><strong>Elevation gain:</strong> ' + Math.trunc(trailElevationGain * elevationConstant).toLocaleString() + ' ' + elevationUnit + '</p></nobr><p><img src="./resources/graph-down-arrow.svg" alt="*">&nbsp;&nbsp;<nobr><strong>Elevation loss:</strong> ' + Math.trunc(trailElevationLoss * elevationConstant).toLocaleString() + ' ' + elevationUnit + '</p></nobr>');
        } else if (layer.feature.geometry.type != "LineString" && layer.feature.properties && layer.feature.properties.title) {
            if (layer.feature.properties.folderId == trailheadFolder.id) {
                layer.setIcon(startIcon);
                layer.bindTooltip(layer.feature.properties.title, {permanent: true, opacity: 0.75});
                layer.bindPopup('<h5>' + layer.feature.properties.title + '</h5><hr><p><img src="./resources/mountain.svg" alt="*">&nbsp;&nbsp;<nobr><strong>Elevation:</strong> ' + Math.trunc(layer.feature.geometry.coordinates[2] * elevationConstant).toLocaleString() + ' ' + elevationUnit + '</p></nobr><p><img src="./resources/pin-map-fill.svg" alt="*">&nbsp;&nbsp;<nobr><strong>GPS:</strong> ' + layer.feature.geometry.coordinates[1].toFixed(5) + ',' + layer.feature.geometry.coordinates[0].toFixed(5) + '</p></nobr>');
            } else if (layer.feature.properties.folderId == campsiteFolder.id) {
                layer.setIcon(neutralIcon);
                layer.bindTooltip(layer.feature.properties.title, {permanent: true, opacity: 0.75});
                layer.bindPopup('<h5>' + layer.feature.properties.title + '</h5><hr><p><img src="./resources/mountain.svg" alt="*">&nbsp;&nbsp;<nobr><strong>Elevation:</strong> ' + Math.trunc(layer.feature.geometry.coordinates[2] * elevationConstant).toLocaleString() + ' ' + elevationUnit + '</p></nobr><p><img src="./resources/pin-map-fill.svg" alt="*">&nbsp;&nbsp;<nobr><strong>GPS:</strong> ' + layer.feature.geometry.coordinates[1].toFixed(5) + ',' + layer.feature.geometry.coordinates[0].toFixed(5) + '</p></nobr>');
            }
        }
    });

    this.geoJsonLayer.on('click', function(e) { 
        e.layer._map.panTo([e.latlng.lat, e.latlng.lng]);
        openTooltipByName(e.layer.feature.properties.title);
    });

    this.geoJsonLayer.on('popupclose', function(e) {
        closeAllTooltips();
    });

    this.leafletMap.fitBounds(this.geoJsonLayer.getBounds());
}

function onMapHover(e) {
    const coords = trailFeature.geometry.coordinates;
    const HIT_RADIUS = 30; // 30 pixels radius
    
    // 1. Find the geometric closest point (Fastest method)
    let closestIndex = -1;
    let minDistance = Infinity;

    for (let i = 0; i < coords.length; i++) {
        // We use rough geometric distance for speed
        const d = Math.hypot(e.latlng.lat - coords[i][1], e.latlng.lng - coords[i][0]);
        if (d < minDistance) {
            minDistance = d;
            closestIndex = i;
        }
    }

    if (closestIndex === -1) return;

    // 2. PROXIMITY CHECK (The Magic Step)
    // Convert the closest point to "Screen Pixels" to check the radius
    const closestPointLatLng = L.latLng(coords[closestIndex][1], coords[closestIndex][0]);
    const pointPixel = this.leafletMap.latLngToContainerPoint(closestPointLatLng);
    const mousePixel = e.containerPoint; // Leaflet provides this on map mousemove

    // Calculate pixel distance
    const distPixels = Math.hypot(pointPixel.x - mousePixel.x, pointPixel.y - mousePixel.y);

    // 3. If within 30px, Sync Chart. If too far, Clear Chart.
    if (distPixels > HIT_RADIUS) {
        onMapOut.call(this); // Too far away -> Hide everything
        return;
    }

    // --- If we are here, we are close enough! Sync the chart ---
    
    if (this.trailElevationChart) {
        // Get the raw distance from the GeoJSON
        const rawDist = coords[closestIndex][3]; 
        let targetX = 0;

        if ((typeof trailCircuit !== 'undefined' && trailCircuit && document.getElementById('cw').checked) || 
            this.isPositiveDirection === undefined || this.isPositiveDirection) {
            targetX = rawDist * distanceConstant;
        } else {
            targetX = Math.abs(trailLength - rawDist) * distanceConstant;
        }

        const chart = this.trailElevationChart;
        const lineDataset = chart.data.datasets.find(d => d.type === 'line');
        
        if (lineDataset) {
            let bestPointIndex = -1;
            let minXDiff = Infinity;

            for (let j = 0; j < lineDataset.data.length; j++) {
                if (!lineDataset.data[j]) continue;
                
                const diff = Math.abs(lineDataset.data[j].x - targetX);
                if (diff < minXDiff) {
                    minXDiff = diff;
                    bestPointIndex = j;
                }
            }

            if (bestPointIndex !== -1) {
                // Assuming Line is Dataset 2 (or find index dynamically)
                const datasetIndex = chart.data.datasets.indexOf(lineDataset);
                const activeEl = { datasetIndex: datasetIndex, index: bestPointIndex };
                
                chart.tooltip.setActiveElements([activeEl]);
                chart.setActiveElements([activeEl]);
                chart.update();
                
                if (mapHoverMarker) {
                    mapHoverMarker.setLatLng([coords[closestIndex][1], coords[closestIndex][0]]);
                    mapHoverMarker.getElement().style.display = 'block';
                }
            }
        }
    }
}

function onMapOut() {
    if (this.trailElevationChart) {
        this.trailElevationChart.setActiveElements([]);
        this.trailElevationChart.tooltip.setActiveElements([]);
        this.trailElevationChart.update();
    }
    if (mapHoverMarker) {
        mapHoverMarker.getElement().style.display = 'none';
    }
}

// This function is called by the Chart.js onClick handler
function onMarkerSelected(chartPointData) {
    chartPointData.label = chartPointData.label.replace(/^Night \d+: /, "");

    // 1. Check if the map layer exists
    if (!this.geoJsonLayer) return;

    // 2. Iterate through all Leaflet layers to find the matching marker
    this.geoJsonLayer.eachLayer((layer) => {
        const props = layer.feature?.properties;

        // Check if this layer has a title and if it matches the clicked chart bubble
        if (props && props.title === chartPointData.label) {
            
            // Make sure it is a Marker (has getLatLng) and not a LineString (Trail)
            if (typeof layer.getLatLng === 'function') {
                
                // A. Move the map to this marker
                this.leafletMap.panTo(layer.getLatLng());

                // B. Open the popup (Simulates the click)
                layer.openPopup();
            }
        }
    });
}

// Update map to display the generated route
function updateMap() {
    this.geoJsonLayer.clearLayers();
    
    // 2. Initialize the Hover Marker (Red Dot)
    // We create it once and hide/show it as needed
    if (mapHoverMarker) mapHoverMarker.remove();
    mapHoverMarker = L.circleMarker([0, 0], {
        radius: 6,
        fillColor: "#ff0000",
        color: "#fff",
        weight: 2,
        opacity: 1,
        fillOpacity: 1
    }).addTo(this.leafletMap);
    mapHoverMarker.getElement().style.display = 'none';

    for (feature of exportedRoute.features) {
        if (feature.geometry && ((feature.geometry.type == "LineString" && feature.properties.title != "Full Route") || 
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
                layer.bindPopup('<h4><strong>Night ' + nightIndex + '&nbsp;&nbsp;</strong><small class="text-body-secondary">' + this.route[nightIndex - 1].date.toLocaleDateString('en-us', { weekday:"short", year:"2-digit", month:"numeric", day:"numeric"}) + '</small></h4><h5>' + layer.feature.properties.title + '</h5><hr><p><img src="./resources/mountain.svg" alt="*">&nbsp;&nbsp;<nobr><strong>Elevation:</strong> ' + Math.trunc(layer.feature.geometry.coordinates[2] * elevationConstant).toLocaleString() + ' ' + elevationUnit + '</p></nobr><p><img src="./resources/pin-map-fill.svg" alt="*">&nbsp;&nbsp;<nobr><strong>GPS:</strong> ' + layer.feature.geometry.coordinates[1].toFixed(5) + ',' + layer.feature.geometry.coordinates[0].toFixed(5) + '</p></nobr>');
            } else if (layer.feature.properties && layer.feature.properties.folderId == trailheadFolder.id && layer.feature.properties.title == this.route[0].start.properties.title && layer.feature.properties.title == this.route[this.route.length - 1].end.properties.title) {
                //start & end trailhead (full circuits)
                layer.bindPopup('<h4><strong>Start&nbsp;&nbsp;</strong><small class="text-body-secondary">' + this.route[0].date.toLocaleDateString('en-us', { weekday:"short", year:"2-digit", month:"numeric", day:"numeric"}) + '</small></h4><h4><strong>End&nbsp;&nbsp;</strong><small class="text-body-secondary">' + this.route[this.route.length - 1].date.toLocaleDateString('en-us', { weekday:"short", year:"2-digit", month:"numeric", day:"numeric"}) + '</small></h4><h5>' + layer.feature.properties.title + '</h5><hr><p><img src="./resources/mountain.svg" alt="*">&nbsp;&nbsp;<nobr><strong>Elevation:</strong> ' + Math.trunc(layer.feature.geometry.coordinates[2] * elevationConstant).toLocaleString() + ' ' + elevationUnit + '</p></nobr><p><img src="./resources/pin-map-fill.svg" alt="*">&nbsp;&nbsp;<nobr><strong>GPS:</strong> ' + layer.feature.geometry.coordinates[1].toFixed(5) + ',' + layer.feature.geometry.coordinates[0].toFixed(5) + '</p></nobr>');
                layer.setIcon(startEndIcon);
            } else if (layer.feature.properties && layer.feature.properties.folderId == trailheadFolder.id && layer.feature.properties.title == this.route[0].start.properties.title) {
                //start trailhead
                layer.bindPopup('<h4><strong>Start&nbsp;&nbsp;</strong><small class="text-body-secondary">' + this.route[0].date.toLocaleDateString('en-us', { weekday:"short", year:"2-digit", month:"numeric", day:"numeric"}) + '</small></h4><h5>' + layer.feature.properties.title + '</h5><hr><p><img src="./resources/mountain.svg" alt="*">&nbsp;&nbsp;<nobr><strong>Elevation:</strong> ' + Math.trunc(layer.feature.geometry.coordinates[2] * elevationConstant).toLocaleString() + ' ' + elevationUnit + '</p></nobr><p><img src="./resources/pin-map-fill.svg" alt="*">&nbsp;&nbsp;<nobr><strong>GPS:</strong> ' + layer.feature.geometry.coordinates[1].toFixed(5) + ',' + layer.feature.geometry.coordinates[0].toFixed(5) + '</p></nobr>');
                layer.setIcon(startIcon);
            } else if (layer.feature.properties && layer.feature.properties.folderId == trailheadFolder.id && layer.feature.properties.title == this.route[this.route.length - 1].end.properties.title) {
                //end trailhead
                layer.bindPopup('<h4><strong>End&nbsp;&nbsp;</strong><small class="text-body-secondary">' + this.route[this.route.length - 1].date.toLocaleDateString('en-us', { weekday:"short", year:"2-digit", month:"numeric", day:"numeric"}) + '</small></h4><h5>' + layer.feature.properties.title + '</h5><hr><p><img src="./resources/mountain.svg" alt="*">&nbsp;&nbsp;<nobr><strong>Elevation:</strong> ' + Math.trunc(layer.feature.geometry.coordinates[2] * elevationConstant).toLocaleString() + ' ' + elevationUnit + '</p></nobr><p><img src="./resources/pin-map-fill.svg" alt="*">&nbsp;&nbsp;<nobr><strong>GPS:</strong> ' + layer.feature.geometry.coordinates[1].toFixed(5) + ',' + layer.feature.geometry.coordinates[0].toFixed(5) + '</p></nobr>');
                layer.setIcon(endIcon);
            }
        } else if (layer.feature.geometry.type == "LineString") {
            //dayIndex = parseInt(layer.feature.properties.title.slice(-1)) - 1;
            dayIndex = parseInt(layer.feature.properties.title.match(/\d+/g)) - 1;
            layer.setStyle({color :'red'}); 
            if (toggleTrail && !toggleTrail.checked) layer.bindPopup('<h4><strong>' + layer.feature.properties.title + '&nbsp;&nbsp;</strong><small class="text-body-secondary">' + this.route[dayIndex].date.toLocaleDateString('en-us', { weekday:"short", year:"2-digit", month:"numeric", day:"numeric"}) + '</small></h4><h5>' + this.route[dayIndex].start.properties.title + ' to</h5><h5>' + this.route[dayIndex].end.properties.title + '</h5><hr><nobr><p><img src="./resources/rulers.svg" alt="*">&nbsp;&nbsp;<strong>Distance:</strong> ' + Math.round(this.route[dayIndex].length * distanceConstant * 10) / 10 + ' ' + distanceUnit + '</p></nobr><p><img src="./resources/graph-up-arrow.svg" alt="*">&nbsp;&nbsp;<nobr><strong>Elevation gain:</strong> ' + Math.trunc(this.route[dayIndex].elevationGain * elevationConstant).toLocaleString() + ' ' + elevationUnit + '</p></nobr><p><img src="./resources/graph-down-arrow.svg" alt="*">&nbsp;&nbsp;<nobr><strong>Elevation loss:</strong> ' + Math.trunc(this.route[dayIndex].elevationLoss * elevationConstant).toLocaleString() + ' ' + elevationUnit + '</p></nobr>');
            else layer.bindPopup('<h5>' + layer.feature.properties.title + '</h5><hr><p><img src="./resources/rulers.svg" alt="*">&nbsp;&nbsp;<nobr><strong>Distance:</strong> ' + Math.round(trailLength * distanceConstant * 10) / 10 + ' ' + distanceUnit + '</p></nobr><p><img src="./resources/graph-up-arrow.svg" alt="*">&nbsp;&nbsp;<nobr><strong>Elevation gain:</strong> ' + Math.trunc(trailElevationGain * elevationConstant).toLocaleString() + ' ' + elevationUnit + '</p></nobr><p><img src="./resources/graph-down-arrow.svg" alt="*">&nbsp;&nbsp;<nobr><strong>Elevation loss:</strong> ' + Math.trunc(trailElevationLoss * elevationConstant).toLocaleString() + ' ' + elevationUnit + '</p></nobr>');
            layer.bindTooltip(layer.feature.properties.title, {permanent: false, opacity: 0.75});
        }
    });
    this.geoJsonLayer.on('click', function(e) { 
        e.layer._map.panTo([e.latlng.lat, e.latlng.lng]);
        openTooltipByName(e.layer.feature.properties.title);
        deselectRows();
        if (tableBody.innerHTML != "") {
            if (e.layer.feature.geometry.type == "LineString") {
                selectRow(e.layer.feature.properties.title.slice(-1));
            }
        }
    });
    
    this.leafletMap.off('mousemove');
    this.leafletMap.off('mouseout');

    // Attach new listeners with 'this' context bound
    this.leafletMap.on('mousemove', onMapHover.bind(this));
    this.leafletMap.on('mouseout', onMapOut.bind(this));

    this.leafletMap.fitBounds(this.geoJsonLayer.getBounds());
}

function zoomOut() {
    this.leafletMap.fitBounds(this.geoJsonLayer.getBounds());
}

function markerOpen(name) {
    this.geoJsonLayer.eachLayer(function (layer) {
        if ((layer.feature.geometry.type != "LineString" && layer.feature.id === name) || layer.feature.properties.title === name) {
            centerMarker(layer);
        }
    });
}

function markerClose() {
    this.geoJsonLayer.eachLayer(function (layer) {
        layer.closePopup();
    });
    deselectRows();
    closeAllTooltips();
}
  
function centerMarker(layer) {
    layer.openPopup();
    if (layer.feature.geometry.type != "LineString") {
        layer._map.panTo([layer.feature.geometry.coordinates[1], layer.feature.geometry.coordinates[0]]);
    } else {
        const half = Math.round(layer.feature.geometry.coordinates.length / 2);
        layer._map.panTo([layer.feature.geometry.coordinates[half][1], layer.feature.geometry.coordinates[half][0]]);
    }
}