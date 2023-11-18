let trail = trails[0].geoJSON;
let trailName;
let trailLength;
let trailElevationGain;
let trailElevationLoss;
let trailUnit = 'mi'; //default
let trailCircuit;

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
const tentIcon = L.icon({
    iconUrl: 'resources/tent.png',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
});

setTrailFromURL();
setTrailDetails(trail);
initMap();

// Set coordinates and zoom of map
function initMap() {
    if (this.leafletMap != undefined) this.leafletMap.remove();
    const half = Math.round(trailFeature.geometry.coordinates.length / 2);
    const lat = trailFeature.geometry.coordinates[half][1];
    const long = trailFeature.geometry.coordinates[half][0];
    this.leafletMap = L.map('map').setView([lat, long], 10);
    this.geoJsonLayer = L.geoJSON().addTo(this.leafletMap);
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
    trailLength = lengthGeo(trailFeature.geometry) / 1000;

    const elevationChange = calculateElevation(trailFeature.geometry);
    trailElevationGain = elevationChange.elevationGain;
    trailElevationLoss = elevationChange.elevationLoss;

    if (trailUnit == 'mi') trailLength = Math.round(trailLength * 0.6213711922 * 10) / 10;
    trailCircuit = (trailFeature.geometry.coordinates[0][0].toFixed(3) == trailFeature.geometry.coordinates[trailFeature.geometry.coordinates.length - 1][0].toFixed(3) && trailFeature.geometry.coordinates[0][1].toFixed(3) == trailFeature.geometry.coordinates[trailFeature.geometry.coordinates.length - 1][1].toFixed(3)) ? true : false;

    if (trailCircuit && !isClockwise(trailFeature.geometry.coordinates)) trailFeature.geometry.coordinates.reverse();

    for (feature of campsiteFeatures) appendDistance(feature);
    for (feature of trailheadFeatures) appendDistance(feature);

    //sort result set by distance and append an index for quick reference during route generation
    trailheadFeatures.sort((a, b) => {return a.properties.distance - b.properties.distance});
    campsiteFeatures.sort((a, b) => {return a.properties.distance - b.properties.distance});
    for (let i = 0; i < campsiteFeatures.length; i++) campsiteFeatures[i].properties.index = i;

    if (trailCircuit && campsiteFeatures[0].properties.distance != 0) return;
    // else if (!trailCircuit && campsiteFeatures[0].properties.distance != 0 && campsiteFeatures[campsiteFeatures.length - 1].properties.distance != trailLength) return;

    console.log(trailFeature);
    console.log(trailheadFeatures);
    console.log(campsiteFeatures);
}

// Append the distance from 0 for each trailhead and campsite
function appendDistance(feature) {
    let newGeometry = {};
    newGeometry.type = 'LineString';
    // First attempt: find a coordinate pair at a trail vertex within 0.001 degrees (~111 m) of marker
    for (let i = 0; i < trailFeature.geometry.coordinates.length; i++) {
        if ((feature.geometry.coordinates[0].toFixed(3) == trailFeature.geometry.coordinates[i][0].toFixed(3)
            && feature.geometry.coordinates[1].toFixed(3) == trailFeature.geometry.coordinates[i][1].toFixed(3))) {
            newGeometry.coordinates = trailFeature.geometry.coordinates.slice(0, i);
            feature.properties.distance = lengthGeo(newGeometry) / 1000;
            const elevationChange = calculateElevation(newGeometry);
            feature.properties.elevationGain = elevationChange.elevationGain;
            feature.properties.elevationLoss = elevationChange.elevationLoss;
            if (trailUnit == 'mi') feature.properties.distance = Math.round(feature.properties.distance * 0.6213711922 * 10) / 10;
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
                trailFeature.geometry.coordinates.splice(i+1, 0, feature.geometry.coordinates);
                newGeometry.coordinates = trailFeature.geometry.coordinates.slice(0, i+1);
                feature.properties.distance = lengthGeo(newGeometry) / 1000;
                const elevationChange = calculateElevation(newGeometry);
                feature.properties.elevationGain = elevationChange.elevationGain;
                feature.properties.elevationLoss = elevationChange.elevationLoss;
                if (trailUnit == 'mi') feature.properties.distance = Math.round(feature.properties.distance * 0.6213711922 * 10) / 10;
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

function elevationGeo(geometry) {
    if (geometry.type === 'LineString')
        return calculateElevation(geometry.coordinates);
    else if (geometry.type === 'MultiLineString')
        return geometry.coordinates.reduce(function(memo, coordinates) {
            return memo + calculateElevation(coordinates);
        }, 0);
    else
        return null;
}

function calculateElevation(lineString) {
    // if (!lineString || !lineString.coordinates || lineString.coordinates.length < 2) {
    //     console.error("Invalid LineString GeoJSON");
    //     return null;
    // }
    
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
        // console.log(elevationGain);
        // console.log(elevationLoss);
    }
    
    return { elevationGain, elevationLoss };
}

function lengthGeo(geometry) {
    if (geometry.type === 'LineString')
        return calculateLength(geometry.coordinates);
    else if (geometry.type === 'MultiLineString')
        return geometry.coordinates.reduce(function(memo, coordinates) {
            return memo + calculateLength(coordinates);
        }, 0);
    else
        return null;
}

function calculateLength(lineString) {
    if (lineString.length<2)
        return 0;
    var result = 0;
    for (var i=1; i<lineString.length; i++)
        result += distance(lineString[i-1][0],lineString[i-1][1],
                           lineString[i  ][0],lineString[i  ][1]);
    return result;
}

/**
 * Calculate the approximate distance between two coordinates (lat/lon)
 *
 * © Chris Veness, MIT-licensed,
 * http://www.movable-type.co.uk/scripts/latlong.html#equirectangular
 */
function distance(λ1,φ1,λ2,φ2) {
    var R = 6371000;
    Δλ = (λ2 - λ1) * Math.PI / 180;
    φ1 = φ1 * Math.PI / 180;
    φ2 = φ2 * Math.PI / 180;
    var x = Δλ * Math.cos((φ1+φ2)/2);
    var y = (φ2-φ1);
    var d = Math.sqrt(x*x + y*y);
    return R * d;
};

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