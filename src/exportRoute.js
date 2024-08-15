let exportedRoute;

// Update GeoJSON with all trailheads and campsites on the generated route, as well as an individual LineString for each day
function updateGeoJSON() {
    exportedRoute = {
        features: [trailheadFolder, campsiteFolder, trailFolder],
        "type": "FeatureCollection"
    };

    // Add trailheads and campsites
    for (let day of this.route) {
        exportedRoute.features.push(day.start);
    }
    if (this.route[0].start != this.route[this.route.length - 1].end) {
        exportedRoute.features.push(this.route[this.route.length - 1].end);
    }

    let fullRoute = {
        "geometry": {
            "type": "LineString",
            "coordinates": []
        },
        "properties": Object.assign({}, trailFeature.properties),
        "type": "Feature"
    }
    let dayRoute = {
        "geometry": {
            "type": "LineString",
            "coordinates": []
        },
        "properties": Object.assign({}, trailFeature.properties),
        "type": "Feature"
    }
    fullRoute.properties.title = "Full Route";
    if (trailCircuit || this.route[0].start != this.route[this.route.length - 1].end) {
        let j = 0;
        for (let i = 0; i < trailFeature.geometry.coordinates.length; i++) {
            if (trailFeature.geometry.coordinates[i][0] == this.route[0].start.geometry.coordinates[0]
            &&  trailFeature.geometry.coordinates[i][1] == this.route[0].start.geometry.coordinates[1]) {
                do {
                    dayRoute.geometry.coordinates.push(trailFeature.geometry.coordinates[i]);
                    if (trailFeature.geometry.coordinates[i][0] == this.route[j].end.geometry.coordinates[0]
                    &&  trailFeature.geometry.coordinates[i][1] == this.route[j].end.geometry.coordinates[1]
                    && (!trailCircuit || this.route[0].start != this.route[this.route.length - 1].end || fullRoute.geometry.coordinates.length >= 10)) { 
                        dayRoute.properties.title = "Day " + (j + 1);
                        dayRoute.properties.date = this.route[j].date.toLocaleDateString('en-us', { weekday:"short", year:"2-digit", month:"numeric", day:"numeric"});
                        dayRoute.properties.elevationGain = this.route[j].elevationGain;
                        dayRoute.properties.elevationLoss = this.route[j].elevationLoss;
                        exportedRoute.features.push(JSON.parse(JSON.stringify(dayRoute)));
                        dayRoute.geometry.coordinates = [];
                        dayRoute.geometry.coordinates.push(trailFeature.geometry.coordinates[i]);
                        j++;
                    }
                    fullRoute.geometry.coordinates.push(trailFeature.geometry.coordinates[i]);
                    i = this.isPositiveDirection ? i + 1 : i - 1;
                    if (i < 0) i = trailFeature.geometry.coordinates.length - 1;
                    if (i >= trailFeature.geometry.coordinates.length) i = 0;
                } while (  (trailFeature.geometry.coordinates[i][0] != this.route[this.route.length - 1].end.geometry.coordinates[0])
                        || (trailFeature.geometry.coordinates[i][1] != this.route[this.route.length - 1].end.geometry.coordinates[1]) 
                        || (trailCircuit && this.route[0].start == this.route[this.route.length - 1].end && fullRoute.geometry.coordinates.length < 20)); //solves case where full circuit will not build line because start == end
                break;
            }
        }        
        dayRoute.properties.title = "Day " + this.route.length;
        dayRoute.properties.date = this.route[this.route.length - 1].date.toLocaleDateString('en-us', { weekday:"short", year:"2-digit", month:"numeric", day:"numeric"});
        exportedRoute.features.push(JSON.parse(JSON.stringify(dayRoute)));
    }
    exportedRoute = calculateAdjustedDistance(exportedRoute, fullRoute);
    exportedRoute.features.push(fullRoute); //add the full route (not broken into individual days) to the exported file
    updateChart(fullRoute);
    updateMap();
}

function calculateAdjustedDistance(exportedRoute, fullRoute) {
    if (routeLength <= 0) return exportedRoute;
    const startDistance = fullRoute.geometry.coordinates[0][3];
    const wrapAroundDistance = this.isPositiveDirection ? trailFeature.geometry.coordinates[trailFeature.geometry.coordinates.length - 1][3] - fullRoute.geometry.coordinates[0][3] : fullRoute.geometry.coordinates[fullRoute.geometry.coordinates.length - 1][3];
    const reverseDistance = this.isPositiveDirection ? 0 : routeLength;
    let currDistance, adjustedDistance;
    for (let i = 0; i < exportedRoute.features.length; i++) {
        if (exportedRoute.features[i].geometry && exportedRoute.features[i].geometry.type === "LineString") {
            for (let j = 0; j < exportedRoute.features[i].geometry.coordinates.length; j++) {
                currDistance = exportedRoute.features[i].geometry.coordinates[j][3];
                if (exportedRoute.features[i].properties.title === "Day 1" && j === 0) { // first distance should always be 0 (due to route clipping, sometimes the first distance is ~0.1)
                    adjustedDistance = 0;
                } else if (this.isPositiveDirection && currDistance < startDistance) {
                    adjustedDistance = currDistance + wrapAroundDistance;
                } else if (!this.isPositiveDirection && currDistance > startDistance) {
                    adjustedDistance = Math.abs(reverseDistance - currDistance + wrapAroundDistance);
                } else {
                    adjustedDistance = Math.abs(currDistance - startDistance);
                }
                exportedRoute.features[i].geometry.coordinates[j][4] = adjustedDistance;
            }
        } else if (exportedRoute.features[i].geometry) {
            currDistance = exportedRoute.features[i].geometry.coordinates[3];
            if (this.isPositiveDirection && currDistance < startDistance) {
                adjustedDistance = currDistance + wrapAroundDistance;
            } else if (!this.isPositiveDirection && currDistance > startDistance) {
                adjustedDistance = Math.abs(reverseDistance - currDistance + wrapAroundDistance);
            } else {
                adjustedDistance = Math.abs(currDistance - startDistance);
            }
            exportedRoute.features[i].geometry.coordinates[4] = adjustedDistance;
        }
    }
    return exportedRoute;
}

// function calculateRelativeDistance(features, startDistance, endDistance, routeLength) {
//     if (routeLength <= 0) return features;
//     const wrapAroundDistance = this.isPositiveDirection ? endDistance - startDistance : endDistance;
//     const reverseDistance = this.isPositiveDirection ? 0 : routeLength;
//     let currDistance, relativeDistance;
//     for (let i = 0; i < features.length; i++) {
//         if (features[i].geometry && features[i].geometry.type === "LineString") {
//             features[i].properties.relativeDistances = [];
//             for (let j = 0; j < features[i].geometry.coordinates.length; j++) {
//                 //currDistance = features[i].geometry.coordinates[j][3];
//                 currDistance = features[i].properties.distances[j];
//                 if (features[i].properties.title === "Day 1" && j === 0) { // first distance should always be 0 (due to route clipping, sometimes the first distance is ~0.1)
//                     relativeDistance = 0;
//                 } else if (this.isPositiveDirection && currDistance < startDistance) {
//                     relativeDistance = currDistance + wrapAroundDistance;
//                 } else if (!this.isPositiveDirection && currDistance > startDistance) {
//                     relativeDistance = Math.abs(reverseDistance - currDistance + wrapAroundDistance);
//                 } else {
//                     relativeDistance = Math.abs(currDistance - startDistance);
//                 }
//                 //features[i].geometry.coordinates[j][4] = relativeDistance;
//                 features[i].properties.relativeDistances.push(relativeDistance);
//             }
//         } else if (features[i].geometry) {
//             currDistance = features[i].properties.distance;
//             if (this.isPositiveDirection && currDistance < startDistance) {
//                 relativeDistance = currDistance + wrapAroundDistance;
//             } else if (!this.isPositiveDirection && currDistance > startDistance) {
//                 relativeDistance = Math.abs(reverseDistance - currDistance + wrapAroundDistance);
//             } else {
//                 relativeDistance = Math.abs(currDistance - startDistance);
//             }
//             features[i].properties.relativeDistance = relativeDistance;
//         }
//     }
//     return features;
// }

// Download GeoJSON
function exportGeoJSON() {
    if (exportedRoute) {
        let finalRoute = structuredClone(exportedRoute);
        finalRoute = structuredClone(finalRoute);
        finalRoute = trimCoordinates(finalRoute);
        finalRoute.properties = {};
        finalRoute.properties.title = this.routeTitle.innerText;
        finalRoute.properties.route = this.route;
        finalRoute.properties.trail = trail;
        const a = document.createElement('a');
        const blob = new Blob([JSON.stringify(finalRoute)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        a.href = url;
        a.target = '_blank';
        a.download = finalRoute.properties.title.replace(/\s+/g, '') + '.json';
        a.click();
    }
}

//trimming coordinates is necessary because official GeoJSON standard states that coordinates[] should have no more than three items for [lat, long, elev]. distance needs to be appended for the elevation chart to load, 
function trimCoordinates(featureCollection) {
    for (const feature of featureCollection.features) {
        if (feature.geometry != undefined && feature.geometry.coordinates != undefined) {
            if (Array.isArray(feature.geometry.coordinates[0])) {
                for (const coordinates of feature.geometry.coordinates) {
                    coordinates.length = 3;
                }
            } else {
                feature.geometry.coordinates.length = 3;
            }
        }
    }
    return featureCollection;
}

// Share route via email
function emailRoute() {
    if (exportedRoute) {
        const subject = trailFeature.properties.title + " Itinerary";
        let message = "";
        for (let i = 0; i < this.route.length; i++) {
            message += this.route[i].date.toLocaleDateString('en-us', { year:"2-digit", month:"numeric", day:"numeric"}) + ": " + Math.round(this.route[i].length * distanceConstant * 10) / 10 + " " + distanceUnit + " from " + this.route[i].start.properties.title + " to " + this.route[i].end.properties.title + '%0D%0A';
        }
        window.open("mailto:?subject=" + subject + "&body=" + message);
    }
}