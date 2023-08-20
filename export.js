let exportedRoute;
let fullRoute;

function updateGeoJSON() {
    exportedRoute = {
        features: [trailheadFolder, campsiteFolder],
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
    let j = 0;
    for (let i = 0; i < trailFeature.geometry.coordinates.length; i++) {
        if (trailFeature.geometry.coordinates[i][0].toFixed(3) == this.route[0].start.geometry.coordinates[0].toFixed(3)
        &&  trailFeature.geometry.coordinates[i][1].toFixed(3) == this.route[0].start.geometry.coordinates[1].toFixed(3)) {
            do {
                dayRoute.geometry.coordinates.push(trailFeature.geometry.coordinates[i]);
                if (trailFeature.geometry.coordinates[i][0].toFixed(3) == this.route[j].end.geometry.coordinates[0].toFixed(3)
                &&  trailFeature.geometry.coordinates[i][1].toFixed(3) == this.route[j].end.geometry.coordinates[1].toFixed(3)) { 
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
            } while ((trailFeature.geometry.coordinates[i][0].toFixed(3) != this.route[this.route.length - 1].end.geometry.coordinates[0].toFixed(3))
                   || (trailFeature.geometry.coordinates[i][1].toFixed(3) != this.route[this.route.length - 1].end.geometry.coordinates[1].toFixed(3)) 
                   || (trailCircuit && this.route[0].start == this.route[this.route.length - 1].end && this.route.length > 1 && j == 0)); //solves case where full circuit will not build line because start == end
            if (trailCircuit && this.route[0].start == this.route[this.route.length - 1].end) {
                dayRoute.geometry.coordinates.push(trailFeature.geometry.coordinates[0]);
                fullRoute.geometry.coordinates.push(trailFeature.geometry.coordinates[0]);
            }
            break;
        }
    }                    
    fullRoute.properties.title = "Full Route";
    dayRoute.properties.title = "Day " + (j + 1);
    exportedRoute.features.push(JSON.parse(JSON.stringify(dayRoute)));
    //TODO only append this on export
    //exportedRoute.features.push(fullRoute);

    this.geoJsonLayer.clearLayers();
    for (feature of exportedRoute.features) {
        if (feature.geometry) this.geoJsonLayer.addData(feature);
    }
 
    let campsiteIndex = 0;
    this.geoJsonLayer.eachLayer(function (layer) {
        if (layer.feature.properties && layer.feature.geometry.type != "LineString" && layer.feature.properties.title) {
            layer.bindTooltip(layer.feature.properties.title, {permanent: true, opacity: 0.75});
            if (layer.feature.properties && layer.feature.properties.folderId == campsiteFolder.id) {
                campsiteIndex++;
                layer.bindPopup('Night ' + campsiteIndex);
                layer.setIcon(tentIcon);
            } else if (layer.feature.properties && layer.feature.properties.folderId == trailheadFolder.id && layer.feature.properties.title == this.route[0].start.properties.title) {
                layer.bindPopup('Start');
                layer.setIcon(startIcon);
            } else if (layer.feature.properties && layer.feature.properties.folderId == trailheadFolder.id && layer.feature.properties.title == this.route[this.route.length - 1].end.properties.title) {
                layer.bindPopup('Finish');
                layer.setIcon(endIcon);
            }
        } else if (layer.feature.geometry.type == "LineString") {
            layer.setStyle({color :'red'}); 
            layer.bindPopup('Start: ' + this.route[layer.feature.properties.title.charAt(layer.feature.properties.title.length - 1) - 1].start.properties.title + '<br>End: ' + this.route[layer.feature.properties.title.charAt(layer.feature.properties.title.length - 1) - 1].end.properties.title + '<br>Length: ' + this.route[layer.feature.properties.title.charAt(layer.feature.properties.title.length - 1) - 1].length + ' ' + trailUnit);
            layer.bindTooltip(layer.feature.properties.title, {permanent: false, opacity: 0.75});
            if (layer.feature.properties.title.charAt(layer.feature.properties.title.length - 1) % 2 == 0) layer.setStyle({color :'#ff7d7d'});
        }
    });
    exportRoute.disabled = false;
    console.log(exportedRoute);
}

function exportGeoJSON() {
    if (exportedRoute) {
        exportedRoute.features.push(fullRoute); //add the full route (not broken into individual days) to the exported file
        const a = document.createElement('a');
        const blob = new Blob([JSON.stringify(exportedRoute)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        a.href = url;
        a.target = '_blank';
        a.download = trailFeature.properties.title.replace(" ", "") + '.json';
        a.click();
    }
}