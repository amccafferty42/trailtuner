let trail = trails[0].geoJSON;
let trailName;
let trailCircuit;
let trailLength; // in km
let trailElevationGain; // in m
let trailElevationLoss; // in m
let distanceUnit = 'mi'; // default
let distanceConstant = 0.621371; // default 1 km = 0.621371 mi
let elevationUnit = 'ft'; // default
let elevationConstant = 3.28084; // default 1 m = 3.28084 ft

// Variables for the required GeoJSON features
let trailFolder;
let trailheadFolder;
let campsiteFolder;
let trailFeature;
let campsiteFeatures = [];
let trailheadFeatures = [];

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
const neutralIcon = L.icon({
    iconUrl: 'resources/neutral.png',
    iconSize: [20, 28],
    iconAnchor: [10, 27]
});

// Variables for chart.js
let trailElevationChart;

setTrailFromURL();
setTrailDetails(trail);
initMap();
initChart();

function refresh() {
    console.log('test');
    location.reload(); 
}

function initChart() {
    if (this.trailElevationChart) this.trailElevationChart.destroy();
    const ctx = document.getElementById('elevationProfile').getContext("2d");
    const distance = [], elevation = [], trailheads = [];
    for (let i = 0; i < trailFeature.geometry.coordinates.length; i++) {
        //prevent adding multiple points at the same distance (x value)
        if (i == 0 || trailFeature.geometry.coordinates[i][2] != trailFeature.geometry.coordinates[i-1][2]) {
            elevation.push(trailFeature.geometry.coordinates[i][2] * elevationConstant);
            distance.push(trailFeature.geometry.coordinates[i][3] * distanceConstant);
        }
    }
    for (let i = 0; i < trailheadFeatures.length; i++) {
        trailheads.push({
            x: trailheadFeatures[i].properties.distance * distanceConstant,
            y: trailheadFeatures[i].properties.elevation * elevationConstant,
            r: 6,
            label: trailheadFeatures[i].properties.title
        });
    }
    if (trailCircuit) {
        trailheads.push({
            x: trailFeature.geometry.coordinates[trailFeature.geometry.coordinates.length - 1][3] * distanceConstant,
            y: trailheadFeatures[0].properties.elevation * elevationConstant,
            r: 6,
            label: trailheadFeatures[0].properties.title
        });
    }
    const chartData = {
        labels: distance,
        datasets: [{
            type: 'bubble',
            data: trailheads,
            label: 'test',
            borderWidth: 2,
            pointStyle: 'rectRot',
            borderColor: '#2140db',
            backgroundColor: '#627cfc',
            hitRadius: 30,
            hoverBorderWidth: 3,
            options: {
                interaction: {
                    intersect: false, 
                    mode: 'nearest'
                }
            }
        }, 
        {
            type: 'line',
            data: elevation,
            fill: true,
            borderWidth: 2,
            // backgroundColor: '#4d4d4d20',
            // borderColor: '#4d4d4d',
            backgroundColor: '#ff000020',
            borderColor: '#ff0000',

            tension: 0.1,
            pointRadius: 0,
            spanGaps: true,
            options: {
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        }
    ]
    };
      
    const config = {
        data: chartData,
        plugins: [{
            beforeInit: (chart, args, options) => {
            const maxHeight = Math.max(...chart.data.datasets[0].data);
            chart.options.scales.x.min = Math.min(...chart.data.labels);
            chart.options.scales.x.max = Math.max(...chart.data.labels);
            chart.options.scales.y.max = maxHeight + Math.round(maxHeight * 0.2);
            }
        }],
        options: {
            animation: false,
            maintainAspectRatio: false,
            clip: false,
            tooltip: { 
                position: 'point',
                tooltips: {
                    filter: function (tooltipItem) {
                        return tooltipItem.datasetIndex === 0;
                    }
                }
            },
            scales: {
                x: { type: 'linear' },
                y: { type: 'linear', beginAtZero: false },
            },
            plugins: {
                title: { align: "end", display: true, text: "Distance, " + distanceUnit + " / Elevation, " + elevationUnit },
                legend: { display: false },
                tooltip: {
                    displayColors: false,
                    callbacks: {
                        title: (tooltipItems) => {
                            if (tooltipItems[0].dataset.type == 'bubble') return tooltipItems[0].dataset.data[tooltipItems[0].dataIndex].label;
                            return "Distance: " + Math.round(tooltipItems[0].label * 10) / 10 + ' ' + distanceUnit;
                        },
                        label: (tooltipItem) => {
                            const stats = [];
                            if (tooltipItem.dataset.type == 'bubble') {
                                stats.push("Distance: " + Math.round(tooltipItem.dataset.data[tooltipItem.dataIndex].x * 10) / 10 + ' ' + distanceUnit);
                                stats.push("Elevation: " + Math.round(tooltipItem.dataset.data[tooltipItem.dataIndex].y) + ' ' + elevationUnit);
                                stats.length = 2;
                                return stats;
                            } else {
                                return "Elevation: " + Math.round(tooltipItem.raw) + ' ' + elevationUnit; 
                            }
                        },
                    }
                }
            }
        }
    };
    this.trailElevationChart = new Chart(ctx, config);
}
// Set coordinates and zoom of map
function initMap() {
    if (this.leafletMap != undefined) this.leafletMap.remove();
    const half = Math.round(trailFeature.geometry.coordinates.length / 2);
    const lat = trailFeature.geometry.coordinates[half][1];
    const long = trailFeature.geometry.coordinates[half][0];
    this.leafletMap = L.map('map').setView([lat, long], 10);
    this.geoJsonLayer = L.geoJSON().addTo(this.leafletMap);

    // create legend
    const legend = L.control({ position: "bottomleft" });
    legend.onAdd = function () {
        let div = L.DomUtil.create("div", "description");
        L.DomEvent.disableClickPropagation(div);
        const text =
            "<span class=\"red\"><b>&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;</span> = restricted camping<br><span class=\"green\">&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;</span> = unrestricted camping</b><br>*Dispersed Camping is defined as staying anywhere on trail <b>outside</b> of a designated campground";
        div.insertAdjacentHTML("beforeend", text);
        return div;
    };
    legend.addTo(this.leafletMap);

    L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.leafletMap);
    resetMap();
}

// Reset map to display only trail and trailheads (no campsites)
function resetMap() {
    this.geoJsonLayer.clearLayers();
    this.geoJsonLayer.addData(trailFeature);
    for (feature of trailheadFeatures) this.geoJsonLayer.addData(feature);
    this.geoJsonLayer.eachLayer(function (layer) {
        if (layer.feature.geometry.type == "LineString") layer.setStyle({color :'#fc0000'}); 
        if (layer.feature.geometry.type != "LineString" && layer.feature.properties && layer.feature.properties.title) {
            layer.setIcon(neutralIcon);
            layer.bindTooltip(layer.feature.properties.title, {permanent: true, opacity: 0.75});
        }
    });
}

// Validate trail and set details
function setTrailDetails(trail) {
    trailFolder = undefined;
    trailheadFolder = undefined;
    campsiteFolder = undefined;
    trailFeature = undefined;
    trailheadFeatures = [];
    campsiteFeatures = [];

    for (feature of trail.features) {
        if (feature.properties.class === "Folder" && feature.properties.title.toUpperCase() === "TRAIL") {
            if (!trailFolder) trailFolder = feature;
            else return;
        } else if (feature.properties.class === "Folder" && feature.properties.title.toUpperCase() === "TRAILHEADS") {
            if (!trailheadFolder) trailheadFolder = feature;
            else return;
        } else if (feature.properties.class === "Folder" && feature.properties.title.toUpperCase() === "CAMPSITES") {
            if (!campsiteFolder) campsiteFolder = feature;
            else return;
        }
    }
    if (!campsiteFolder || !trailheadFolder || !trailFolder) return;

    for (feature of trail.features) {
        if (feature.geometry && feature.geometry.type === "LineString" && feature.properties.folderId == trailFolder.id) {
            if (!trailFeature) trailFeature = feature;
            else return;
        } else if (feature.geometry && feature.geometry.type === "Point" && feature.properties.folderId == trailheadFolder.id) {
            trailheadFeatures.push(feature);
        } else if (feature.geometry && feature.geometry.type === "Point" && feature.properties.folderId == campsiteFolder.id) {
            campsiteFeatures.push(feature);
        }
    }
    if (!trailFeature || !trailFeature.properties || !trailFeature.properties.title || trailFeature.properties.title.length > 30 || trailFeature.geometry.coordinates.length < 20) return;
    if (trailheadFeatures.length <= 1) return;
    if (campsiteFeatures.length <= 0) return;

    trailName = trailFeature.properties.title;
    trailLength = calculateLength(trailFeature.geometry.coordinates);

    const elevationChange = calculateElevation(trailFeature.geometry);
    trailElevationGain = elevationChange.elevationGain;
    trailElevationLoss = elevationChange.elevationLoss;
  
    trailCircuit = (trailFeature.geometry.coordinates[0][0].toFixed(3) == trailFeature.geometry.coordinates[trailFeature.geometry.coordinates.length - 1][0].toFixed(3) && trailFeature.geometry.coordinates[0][1].toFixed(3) == trailFeature.geometry.coordinates[trailFeature.geometry.coordinates.length - 1][1].toFixed(3)) ? true : false;
    if (trailCircuit) {
        trailFeature.geometry.coordinates.push(structuredClone(trailFeature.geometry.coordinates[0]));
        trailFeature.geometry.coordinates[trailFeature.geometry.coordinates.length - 1][3] = trailLength;
    }
    if (trailCircuit && !isClockwise(trailFeature.geometry.coordinates)) trailFeature.geometry.coordinates.reverse();

    //iterate through campsites and trailheads to find any that are on the route multiple times
    //if they are, create NEW featrues for those with the same info
    //when appending distance, check first to see if duplicate feature with equal distance already exists, if so, then the marker must be meant for a future distance

    for (feature of campsiteFeatures) appendDistance(feature);
    for (feature of trailheadFeatures) appendDistance(feature);

    //sort result set by distance and append an index for quick reference during route generation
    trailheadFeatures.sort((a, b) => {return a.properties.distance - b.properties.distance});
    campsiteFeatures.sort((a, b) => {return a.properties.distance - b.properties.distance});
    for (let i = 0; i < campsiteFeatures.length; i++) campsiteFeatures[i].properties.index = i;

    if (trailCircuit && campsiteFeatures[0].properties.distance != 0) return;
    // else if (!trailCircuit && campsiteFeatures[0].properties.distance != 0 && campsiteFeatures[campsiteFeatures.length - 1].properties.distance != trailLength) return;

    console.info(trailFeature);
    console.info(trailheadFeatures);
    console.info(campsiteFeatures);
}

// Append the distance from 0 for each trailhead and campsite
function appendDistance(feature) {
    if (feature.properties.title.match(/[*]/)) feature.properties.title = "*Dispersed Camping*";
    let newGeometry = {};
    newGeometry.type = 'LineString';
    // First attempt: find a coordinate pair at a trail vertex within 0.001 degrees (~111 m) of marker
    for (let i = 0; i < trailFeature.geometry.coordinates.length; i++) {
        if ((feature.geometry.coordinates[0].toFixed(3) == trailFeature.geometry.coordinates[i][0].toFixed(3)
            && feature.geometry.coordinates[1].toFixed(3) == trailFeature.geometry.coordinates[i][1].toFixed(3))) {
            newGeometry.coordinates = trailFeature.geometry.coordinates.slice(0, i);
            feature.properties.distance = trailFeature.geometry.coordinates[i][3];
            feature.properties.elevation = trailFeature.geometry.coordinates[i][2];
            const elevationChange = calculateElevation(newGeometry);
            feature.properties.elevationGain = elevationChange.elevationGain;
            feature.properties.elevationLoss = elevationChange.elevationLoss;
            if (trailCircuit && feature.properties.distance.toFixed(1) == trailLength.toFixed(1)) feature.properties.distance = 0; 
            break;
        }
    }
    // Second attempt: find a coordinate pair in line between two pairs of trail coordinates
    // This covers the scenario when a marker is placed on trail, but > 0.001 degrees from a trail vertex (i.e. low sampling)
    // If a marker is found on the line segment between two vertices, create a new vertex on the trail where the marker lies between those two points
    if (feature.properties.distance === undefined) {
        for (let i = 0; i < trailFeature.geometry.coordinates.length - 1; i++) {
            if (inLine(trailFeature.geometry.coordinates[i], trailFeature.geometry.coordinates[i+1], feature.geometry.coordinates)) {
                if (feature.geometry.coordinates[2] == 0) feature.geometry.coordinates[2] = trailFeature.geometry.coordinates[i][2];
                if (feature.geometry.coordinates[3] == 0) feature.geometry.coordinates[3] = trailFeature.geometry.coordinates[i][3];
                trailFeature.geometry.coordinates.splice(i+1, 0, feature.geometry.coordinates);
                newGeometry.coordinates = trailFeature.geometry.coordinates.slice(0, i+1);
                feature.properties.distance = trailFeature.geometry.coordinates[i][3];
                feature.properties.elevation = trailFeature.geometry.coordinates[i][2];
                const elevationChange = calculateElevation(newGeometry);
                feature.properties.elevationGain = elevationChange.elevationGain;
                feature.properties.elevationLoss = elevationChange.elevationLoss;
                if (trailCircuit && feature.properties.distance.toFixed(1) == trailLength.toFixed(1)) feature.properties.distance = 0; 
                break;
            }
        }
    }
}

// Load selected trail and reset
function onTrailSelect() {
    trail = trails[selectTrail.value].geoJSON;
    setTrailDetails(trail);
    reset();
    initMap();
    initChart();
    selectTrail.value = "";
    $('#changeTrail').modal('hide');
}

function setTrailFromURL() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    if (urlParams.has('trail')) {
        const matchTrail = trails.filter((x) => x.name == urlParams.get('trail').replaceAll("_", " "));
        trail = (matchTrail === undefined || matchTrail.length === 0) ? trail = trails[0].geoJSON : matchTrail[0].geoJSON;
    }
}

function readFile(input) {
    let file = input.files[0];
    let fileReader = new FileReader();
    fileReader.readAsText(file); 
    fileReader.onload = function() {
        changeTrail(fileReader.result)
    }; 
    fileReader.onerror = function() {
        alert(fileReader.error);
    }; 
}

function changeTrail(file) {
    const newTrail = validJson(file);
    if (newTrail) {
        trail = newTrail;
        reset();
        initMap();
        document.getElementById('trailFile').value = '';
        $('#changeTrail').modal('hide');
    }
}

function validJson(file) {
    try {
        const trail = JSON.parse(file);
        let numTrailFolders = 0, numTrailheadFolders = 0, numCampsiteFolders = 0;
        for (feature of trail.features) {
            if (!feature.geometry) {
                if (feature.properties.title === 'Trailheads') numTrailheadFolders++;
                else if (feature.properties.title === 'Campsites') numCampsiteFolders++;
                else if (feature.properties.title === 'Trail') numTrailFolders++;
            }
        }
        if (numTrailFolders != 1 || numTrailheadFolders != 1 || numCampsiteFolders != 1) return false;
        setTrailDetails(trail); //set trail details to verify each marker is on trail and has "distance" appended to the properties
        for (campsite of campsiteFeatures) if (campsite.properties.distance === undefined) return false;
        for (trailhead of trailheadFeatures) if (trailhead.properties.distance === undefined) return false;
        return trail;
    } catch (e) {
        console.error(e);
    }
    return false;
}

// Return whether or not point C is on the segment of the line passing through the points A and B
function inLine(a, b, c) {
    const dxc = c[0] - a[0];
    const dyc = c[1] - a[1];
    const dxl = b[0] - a[0];
    const dyl = b[1] - a[1];
    const cross = dxc * dyl - dyc * dxl;
    const threshold = 0.000001; //the closer to 0, the closer the point must be to the line to qualify
    if (Math.abs(cross) > threshold) return false;
    if (Math.abs(dxl) >= Math.abs(dyl)) { 
        return dxl > 0 ? a[0] <= c[0] && c[0] <= b[0] : b[0] <= c[0] && c[0] <= a[0];
    } else {
        return dyl > 0 ? a[1] <= c[1] && c[1] <= b[1] : b[1] <= c[1] && c[1] <= a[1];
    }
 }

function calculateElevation(lineString) {   
    let elevationGain = 0;
    let elevationLoss = 0;
    
    for (let i = 1; i < lineString.coordinates.length; i++) {
        const currentElevation = lineString.coordinates[i][2] || 0; // If elevation is not present, assume 0
        const previousElevation = lineString.coordinates[i - 1][2] || 0;
        const elevationDifference = currentElevation - previousElevation;
    
        if (elevationDifference > 0) {
          elevationGain += elevationDifference;
        } else {
          elevationLoss -= elevationDifference; // Using subtraction to get positive value
        }
    }
    
    return { elevationGain, elevationLoss };
}

function calculateLength(lineString) {
    if (lineString.length < 2)
        return 0;
    let result = 0;
    lineString[0][3] = 0;
    for (let i = 1; i < lineString.length; i++) {
        result += haversineDistance(lineString[i-1][1],lineString[i-1][0],lineString[i-1][2],
                                     lineString[i  ][1],lineString[i  ][0],lineString[i  ][2]);
        lineString[i][3] = result;
    }
    return result;
}

function haversineDistance(lat1, lon1, alt1, lat2, lon2, alt2) {
    if (!alt1 || !alt2) alt1 = alt2 = 0; // If no elevation is provided, set values to 0

    const earthRadius = 6371; // Radius of the Earth in kilometers

    // Convert degrees to radians
    const toRadians = (angle) => angle * (Math.PI / 180);

    // Convert altitude to kilometers
    const alt1Km = alt1 / 1000;
    const alt2Km = alt2 / 1000;

    // Calculate differences in coordinates
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const dAlt = alt2Km - alt1Km;

    // Haversine formula for distance
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    // Distance in kilometers (along the surface of the sphere)
    const distance = earthRadius * c;

    // Adding altitude difference to the distance
    const totalDistance = Math.sqrt(distance * distance + dAlt * dAlt);

    return totalDistance;
}

function calcArea(poly) {
    if (!poly || poly.length < 3) return null;
    let end = poly.length - 1;
    let sum = poly[end][0] * poly[0][1] - poly[0][0] * poly[end][1];
    for(let i = 0; i < end; ++i) {
        const n = i + 1;
        sum += poly[i][0] * poly[n][1] - poly[n][0] * poly[i][1];
    }
    return sum;
}

function isClockwise(poly) {
    return calcArea(poly) < 0;
}