function exportGeoJSON() {
    let exportedRoute = {
        features: [trailheadFolder, campsiteFolder],
        "type": "FeatureCollection"
    };

    // Add trailheads and campsites
    for (let day of this.route) exportedRoute.features.push(day.start);
    exportedRoute.features.push(this.route[this.route.length - 1].end);

    // Add full length route
    const fullRoute = {
        "properties": trailFeature.properties,
        "type": "Feature"
    }
    for (let i = 0; i < trailFeature.geometry.coordinates.length - 1; i++) {
        if (trailFeature.geometry.coordinates[i][0].toFixed(3) == this.route[0].start.geometry.coordinates[0].toFixed(3)
        &&  trailFeature.geometry.coordinates[i][1].toFixed(3) == this.route[0].start.geometry.coordinates[1].toFixed(3)) {
            
        }
    }

    console.log(exportedRoute);
}