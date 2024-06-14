let exportedRoute;
let fullRoute;
let days = [];

// Update GeoJSON with all trailheads and campsites on the generated route, as well as an individual LineString for each day
function updateGeoJSON() {
    exportedRoute = {
        features: [trailheadFolder, campsiteFolder, trailFolder],
        "type": "FeatureCollection"
    };

    // Add trailheads and campsites
    for (let day of this.route) exportedRoute.features.push(day.start);
    if(this.route[0].start != this.route[this.route.length - 1].end) exportedRoute.features.push(this.route[this.route.length - 1].end);

    fullRoute = {
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
        exportedRoute.features.push(JSON.parse(JSON.stringify(dayRoute)));
    }
    // if (trailCircuit || this.route[0].start != this.route[this.route.length - 1].end) {
    //     let j = 0;
    //     for (let i = 0; i < trailFeature.geometry.coordinates.length; i++) {
    //         if (trailFeature.geometry.coordinates[i][0].toFixed(3) == this.route[0].start.geometry.coordinates[0].toFixed(3)
    //         &&  trailFeature.geometry.coordinates[i][1].toFixed(3) == this.route[0].start.geometry.coordinates[1].toFixed(3)) {
    //             do {
    //                 dayRoute.geometry.coordinates.push(trailFeature.geometry.coordinates[i]);
    //                 if (trailFeature.geometry.coordinates[i][0].toFixed(3) == this.route[j].end.geometry.coordinates[0].toFixed(3)
    //                 &&  trailFeature.geometry.coordinates[i][1].toFixed(3) == this.route[j].end.geometry.coordinates[1].toFixed(3)
    //                 && (!trailCircuit || this.route[0].start != this.route[this.route.length - 1].end || fullRoute.geometry.coordinates.length >= 10)) { 
    //                     dayRoute.properties.title = "Day " + (j + 1);
    //                     exportedRoute.features.push(JSON.parse(JSON.stringify(dayRoute)));
    //                     dayRoute.geometry.coordinates = [];
    //                     dayRoute.geometry.coordinates.push(trailFeature.geometry.coordinates[i]);
    //                     j++;
    //                 }
    //                 fullRoute.geometry.coordinates.push(trailFeature.geometry.coordinates[i]);
    //                 i = this.isPositiveDirection ? i + 1 : i - 1;
    //                 if (i < 0) i = trailFeature.geometry.coordinates.length - 1;
    //                 if (i >= trailFeature.geometry.coordinates.length) i = 0;
    //                 // TODO finding breakpoints of linestrings would be better if every marker was guarenteed to have an exact coordinate on trail (create new ones that match)
    //             } while (  (trailFeature.geometry.coordinates[i][0].toFixed(3) != this.route[this.route.length - 1].end.geometry.coordinates[0].toFixed(3))
    //                     || (trailFeature.geometry.coordinates[i][1].toFixed(3) != this.route[this.route.length - 1].end.geometry.coordinates[1].toFixed(3)) 
    //                     || (trailCircuit && this.route[0].start == this.route[this.route.length - 1].end && fullRoute.geometry.coordinates.length < 20)); //solves case where full circuit will not build line because start == end
    //             // TODO: this logic breaks the chart because the distance is incorrect. Omitting it leaves a tiny gap in map for full circuits
    //             // if (trailCircuit && this.route[0].start == this.route[this.route.length - 1].end) {
    //             //     let connectingCoordinate = structuredClone(fullRoute.geometry.coordinates[0]);
    //             //     connectingCoordinate[3] = trailLength * 1.60934;
    //             //     dayRoute.geometry.coordinates.push(connectingCoordinate);
    //             //     fullRoute.geometry.coordinates.push(connectingCoordinate);
    //             // }
    //             // The first coordinate of a full loop is simultaneously distance 0 and max trailLength. For CCW loops, the distance of the first coordinate must be set to trailLength or it breaks the chart 
    //             //if (trailCircuit && !this.isPositiveDirection && this.route[0].start == this.route[this.route.length - 1].end && fullRoute.geometry.coordinates[0][3] == 0) fullRoute.geometry.coordinates.push(fullRoute.geometry.coordinates.splice(0, 1)[0]);
    //             break;
    //         }
    //     }        
    //     dayRoute.properties.title = "Day " + this.route.length;
    //     exportedRoute.features.push(JSON.parse(JSON.stringify(dayRoute)));
    // }
    updateMap();
    updateChart();
}

// Download GeoJSON
function exportGeoJSON() {
    if (exportedRoute) {
        exportedRoute.features.push(fullRoute); //add the full route (not broken into individual days) to the exported file
        const a = document.createElement('a');
        const blob = new Blob([JSON.stringify(exportedRoute)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        a.href = url;
        a.target = '_blank';
        a.download = trailFeature.properties.title + '.json';
        a.click();
    }
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