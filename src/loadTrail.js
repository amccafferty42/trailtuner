let trail;
let trailCircuit;
let trailLength; // in km
let trailElevationGain; // in m
let trailElevationLoss; // in m
let distanceUnit = 'mi'; // default
let distanceConstant = 0.621371; // default 1 km = 0.621371 mi
let elevationUnit = 'ft'; // default
let elevationConstant = 3.28084; // default 1 m = 3.28084 ft
let hasDispersedCampsites = false;

let trailFolder;
let trailheadFolder;
let campsiteFolder;
let trailFeature;
let campsiteFeatures = [];
let trailheadFeatures = [];

const toggleTrail = document.getElementById('toggle-trail');
const toggleTrailheads = document.getElementById('toggle-trailheads');
const toggleCampsites = document.getElementById('toggle-campsites');

initTrail();

function initTrail() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    if (urlParams.has('trail')) {
        const matchTrail = trails.filter((x) => x.name == urlParams.get('trail').replaceAll("_", " "));
        trail = (matchTrail === undefined || matchTrail.length === 0) ? trail = trails[0].geoJSON : matchTrail[0].geoJSON;
    } else {
        trail = trails[0].geoJSON;
    }
    setTrailDetails();
}

function loadTrail(geoJSON) {
    trail = geoJSON;
    setTrailDetails();
    reset();
}

function loadRoute(geoJSON) {
    const trail = geoJSON.properties.trail;
    const route = geoJSON.properties.route;
    loadTrail(trail);
    for (const day of route) {
        day.date = new Date(day.date);
        if (!day.prev_site) day.prev_site = undefined;
        if (!day.next_site) day.next_site = undefined;
    }
    this.route = route;
    filterCampsites(campsiteFeatures);
    this.isPositiveDirection = getDirection(route[0].start, route[route.length - 1].end);
    displayRoute(route, true);
    updateGeoJSON();
    routeTitle.scrollIntoView({behavior: 'smooth'});
}

function onTrailSelect() {
    trail = trails[selectTrail.value].geoJSON;
    loadTrail(trail);
    closeTrailModal();
}

function readFile(input, isRoute) {
    let file = input.files[0];
    let fileReader = new FileReader();
    fileReader.readAsText(file); 
    fileReader.onload = function() {
        const geoJSON = JSON.parse(fileReader.result);
        if (isRoute) loadRoute(geoJSON);
        else loadTrail(geoJSON);
        closeTrailModal();
    }; 
    fileReader.onerror = function() {
        alert(fileReader.error);
    };     
}

function toggleIconVisibility() {
    if (this.route) {
        updateMap();
        updateChart();
    } else {
        resetMap();
        initChart();
    }
}

function setTrailDetails() {
    trailFolder = undefined;
    trailheadFolder = undefined;
    campsiteFolder = undefined;
    trailFeature = undefined;
    trailheadFeatures = [];
    campsiteFeatures = [];
    hasDispersedCampsites = false;  

    for (feature of trail.features) {
        if (feature.properties.class === "Folder" && feature.properties.title.toUpperCase() === "TRAIL") {
            if (!trailFolder) trailFolder = feature;
        } else if (feature.properties.class === "Folder" && feature.properties.title.toUpperCase() === "TRAILHEADS") {
            if (!trailheadFolder) trailheadFolder = feature;
        } else if (feature.properties.class === "Folder" && feature.properties.title.toUpperCase() === "CAMPSITES") {
            if (!campsiteFolder) campsiteFolder = feature;
        }
    }

    for (feature of trail.features) {
        if (feature.geometry && feature.geometry.type === "LineString" && feature.properties.folderId == trailFolder.id) {
            trailFeature = feature;
        } else if (feature.geometry && feature.geometry.type === "Point" && feature.properties.folderId == trailheadFolder.id) {
            trailheadFeatures.push(feature);
        } else if (feature.geometry && feature.geometry.type === "Point" && feature.properties.folderId == campsiteFolder.id) {
            campsiteFeatures.push(feature);
        }
    }

    title.innerHTML = trailFeature.properties.title;
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
    //if they are, create NEW features for those with the same info
    //when appending distance, check first to see if duplicate feature with equal distance already exists, if so, then the marker must be meant for a future distance

    for (feature of campsiteFeatures) {
        if (feature.properties && feature.properties.title && feature.properties.title.match(/[*]/)) hasDispersedCampsites = true;
        appendDistance(feature);
    }
    for (feature of trailheadFeatures) appendDistance(feature);

    //sort result set by distance for quick reference during route generation
    trailheadFeatures.sort((a, b) => {return a.properties.distance - b.properties.distance});
    campsiteFeatures.sort((a, b) => {return a.properties.distance - b.properties.distance});

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
            if (feature.geometry.coordinates[2] == 0) feature.geometry.coordinates[2] = trailFeature.geometry.coordinates[i][2];
            if (feature.geometry.coordinates[3] == 0) feature.geometry.coordinates[3] = trailFeature.geometry.coordinates[i][3];

            //newGeometry.coordinates = trailFeature.geometry.coordinates.slice(0, i);
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

function closeTrailModal() {
    document.getElementById('trailFile').value = '';
    document.getElementById('routeFile').value = '';
    $('#changeTrail').modal('hide');
}

function closeMoreRouteOptionsModal() {
    $('#moreRouteOptions').modal('hide');
}