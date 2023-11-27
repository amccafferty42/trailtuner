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
            if (trailFeature.geometry.coordinates[i][0].toFixed(3) == this.route[0].start.geometry.coordinates[0].toFixed(3)
            &&  trailFeature.geometry.coordinates[i][1].toFixed(3) == this.route[0].start.geometry.coordinates[1].toFixed(3)) {
                do {
                    dayRoute.geometry.coordinates.push(trailFeature.geometry.coordinates[i]);
                    if (trailFeature.geometry.coordinates[i][0].toFixed(3) == this.route[j].end.geometry.coordinates[0].toFixed(3)
                    &&  trailFeature.geometry.coordinates[i][1].toFixed(3) == this.route[j].end.geometry.coordinates[1].toFixed(3)
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
                } while ((trailFeature.geometry.coordinates[i][0].toFixed(3) != this.route[this.route.length - 1].end.geometry.coordinates[0].toFixed(3))
                        || (trailFeature.geometry.coordinates[i][1].toFixed(3) != this.route[this.route.length - 1].end.geometry.coordinates[1].toFixed(3)) 
                        || (trailCircuit && this.route[0].start == this.route[this.route.length - 1].end && fullRoute.geometry.coordinates.length < 20)); //solves case where full circuit will not build line because start == end
                if (trailCircuit && this.route[0].start == this.route[this.route.length - 1].end) {
                    dayRoute.geometry.coordinates.push(fullRoute.geometry.coordinates[0]);
                    fullRoute.geometry.coordinates.push(fullRoute.geometry.coordinates[0]);
                }
                break;
            }
        }                    
        exportedRoute.features.push(JSON.parse(JSON.stringify(dayRoute)));
    }
    updateMap();
    //updateElevationChart(days);
    console.log(exportedRoute);
}

// Update map to display the generated route
function updateMap() {
    this.geoJsonLayer.clearLayers();
    for (feature of exportedRoute.features) {
        if (feature.geometry) this.geoJsonLayer.addData(feature);
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
                        iconUrl: 'resources/' + nightIndex +'.png',
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
            layer.bindPopup('Start: ' + this.route[dayIndex].start.properties.title + '<br>End: ' + this.route[dayIndex].end.properties.title + '<br>Length: ' + this.route[dayIndex].length.toFixed(1) + ' ' + distanceUnit);
            layer.bindTooltip(layer.feature.properties.title, {permanent: false, opacity: 0.75});
            //            if (dayIndex % 2 == 0) layer.setStyle({color :'#ff7d7d'});
            // if (dayIndex % 2 == 0) layer.setStyle({color :'blue'});
            // if (dayIndex % 3 == 0) layer.setStyle({color :'yellow'});
            dayIndex++;
        }
    });
}

function updateElevationChart(days) {
    console.log(days);
    for (let i = 0; i < days.length; i++) {
        console.log(days[i]);
    }

    const ctx = document.getElementById('daily-elevation').getContext("2d");

    const distance = [];
    const elevation = [];
    const trailheads = [];
    for (let i = 0; i < feature.geometry.coordinates.length; i++) {
        elevation.push(feature.geometry.coordinates[i][2] * 3.28084);
        distance.push(feature.geometry.coordinates[i][3] * 0.6213711922 / 1000);
    }
    for (let i = 0; i < trailheadFeatures.length; i++) {
        trailheads.push({
            x: trailheadFeatures[i].properties.distance,
            y: trailheadFeatures[i].properties.altitude * 3.28084,
            r: 5,
            label: trailheadFeatures[i].properties.title
        });
        // trailheadDistances.push(trailheadFeatures[i].properties.distance);
        // trailheadElevations.push(trailheadFeatures[i].properties.altitude);
    }
    const chartData = {
        labels: distance,
        datasets: [{
            type: 'bubble',
            data: trailheads,
            pointStyle: 'circle',
            borderColor: '#000000',
            backgroundColor: '#662900BA'
        }, 
        {
            type: 'line',
            data: elevation,
            fill: true,
            borderWidth: 2,
            borderColor: '#00630AFF',
            //backgroundColor: '#66ccff66',
            //borderColor: '#005907FF',
            backgroundColor: '#00630A80',
            tension: 0.1,
            pointRadius: 0,
            spanGaps: true,
            hitRadius: 0
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
            chart.options.scales.y1.max = maxHeight + Math.round(maxHeight * 0.2);
            }
        }],
        options: {
            animation: false,
            maintainAspectRatio: false,
            interaction: { intersect: false, mode: 'index' },
            tooltip: { position: 'nearest' },
            scales: {
                x: { type: 'linear' },
                y: { type: 'linear', beginAtZero: false },
                y1: { type: 'linear', display: true, position: 'right', beginAtZero: false, grid: { drawOnChartArea: false }},
            },
            plugins: {
                title: { align: "end", display: true, text: "Distance, mi / Elevation, ft" },
                legend: { display: false },
                tooltip: {
                    displayColors: false,
                    callbacks: {
                        title: (tooltipItems) => {
                            return "Distance: " + tooltipItems[0].label + 'm'
                        },
                        label: (tooltipItem) => {
                            return "Elevation: " + tooltipItem.raw + 'm'
                        },
                    }
                }
            },
            elements: {
                point: {
                    //backgroundColor: getLineColor,
                    //hoverBackgroundColor: makeHalfAsOpaque,
                    //radius: adjustRadiusBasedOnData,
                    //pointStyle: alternatePointStyles,
                    hoverRadius: 5
                }
            }
        }
    };
    const chart = new Chart(ctx, config);
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
            message += this.route[i].date.toLocaleDateString('en-us', { year:"2-digit", month:"numeric", day:"numeric"}) + ": " + this.route[i].length.toFixed(1) + " " + distanceUnit + " from " + this.route[i].start.properties.title + " to " + this.route[i].end.properties.title + '%0D%0A';
        }
        window.open("mailto:?subject=" + subject + "&body=" + message);
    }
}