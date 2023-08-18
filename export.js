const campsiteIcon = L.icon({
    iconUrl: 'resources/tent.png',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
});

const fontAwesomeIcon = L.divIcon({
    html: '<span class="glyphicon glyphicon-tent"></span>',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    className: 'my-div-icon'
});

function updateGeoJSON() {
    let exportedRoute = {
        features: [trailheadFolder, campsiteFolder],
        "type": "FeatureCollection"
    };

    // Add trailheads and campsites
    for (let day of this.route) exportedRoute.features.push(day.start);
    exportedRoute.features.push(this.route[this.route.length - 1].end);

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
    let j = 0;
    for (let i = 0; i < trailFeature.geometry.coordinates.length; i++) {
        if (trailFeature.geometry.coordinates[i][0].toFixed(3) == this.route[0].start.geometry.coordinates[0].toFixed(3)
        &&  trailFeature.geometry.coordinates[i][1].toFixed(3) == this.route[0].start.geometry.coordinates[1].toFixed(3)) {
            do {
                dayRoute.geometry.coordinates.push(trailFeature.geometry.coordinates[i]);
                if (trailFeature.geometry.coordinates[i][0].toFixed(3) == this.route[j].end.geometry.coordinates[0].toFixed(3)
                &&  trailFeature.geometry.coordinates[i][1].toFixed(3) == this.route[j].end.geometry.coordinates[1].toFixed(3)) {
                    dayRoute.properties.title = "Day " + (j + 1);
                    j++;
                    exportedRoute.features.push(JSON.parse(JSON.stringify(dayRoute)));
                    dayRoute.geometry.coordinates = [];
                }
                fullRoute.geometry.coordinates.push(trailFeature.geometry.coordinates[i]);
                i = this.isPositiveDirection ? i + 1 : i - 1;
                if (i < 0) i = trailFeature.geometry.coordinates.length - 1;
                if (i >= trailFeature.geometry.coordinates.length) i = 0;
            } while ((trailFeature.geometry.coordinates[i][0].toFixed(3) != this.route[this.route.length - 1].end.geometry.coordinates[0].toFixed(3))
                   || (trailFeature.geometry.coordinates[i][1].toFixed(3) != this.route[this.route.length - 1].end.geometry.coordinates[1].toFixed(3)));          
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
                layer.setIcon(campsiteIcon);
            }
        } else if (layer.feature.geometry.type == "LineString") {
            layer.setStyle({color :'red'}); 
            layer.bindPopup('Start: ' + this.route[layer.feature.properties.title.charAt(layer.feature.properties.title.length - 1) - 1].start.properties.title + '<br>End: ' + this.route[layer.feature.properties.title.charAt(layer.feature.properties.title.length - 1) - 1].end.properties.title + '<br>Length: ' + this.route[layer.feature.properties.title.charAt(layer.feature.properties.title.length - 1) - 1].length + ' ' + trailUnit);
            layer.bindTooltip(layer.feature.properties.title, {permanent: false, opacity: 0.75});
            //if (layer.feature.properties.title.charAt(layer.feature.properties.title.length - 1) % 2 == 0) layer.setStyle({color :'red'});
        }
    });

    console.log(exportedRoute);
}