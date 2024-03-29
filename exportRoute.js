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
                    // TODO finding breakpoints of linestrings would be better if every marker was guarenteed to have an exact coordinate on trail (create new ones that match)
                } while (  (trailFeature.geometry.coordinates[i][0].toFixed(3) != this.route[this.route.length - 1].end.geometry.coordinates[0].toFixed(3))
                        || (trailFeature.geometry.coordinates[i][1].toFixed(3) != this.route[this.route.length - 1].end.geometry.coordinates[1].toFixed(3)) 
                        || (trailCircuit && this.route[0].start == this.route[this.route.length - 1].end && fullRoute.geometry.coordinates.length < 20)); //solves case where full circuit will not build line because start == end
                // TODO: this logic breaks the chart because the distance is incorrect. Omitting it leaves a tiny gap in map for full circuits
                // if (trailCircuit && this.route[0].start == this.route[this.route.length - 1].end) {
                //     let connectingCoordinate = structuredClone(fullRoute.geometry.coordinates[0]);
                //     connectingCoordinate[3] = trailLength * 1.60934;
                //     dayRoute.geometry.coordinates.push(connectingCoordinate);
                //     fullRoute.geometry.coordinates.push(connectingCoordinate);
                // }
                // The first coordinate of a full loop is simultaneously distance 0 and max trailLength. For CCW loops, the distance of the first coordinate must be set to trailLength or it breaks the chart 
                //if (trailCircuit && !this.isPositiveDirection && this.route[0].start == this.route[this.route.length - 1].end && fullRoute.geometry.coordinates[0][3] == 0) fullRoute.geometry.coordinates.push(fullRoute.geometry.coordinates.splice(0, 1)[0]);
                break;
            }
        }        
        dayRoute.properties.title = "Day " + this.route.length;
        exportedRoute.features.push(JSON.parse(JSON.stringify(dayRoute)));
    }
    updateMap();
    updateChart();
}

function updateChart() {
    if (this.trailElevationChart) this.trailElevationChart.destroy();
    const ctx = document.getElementById('elevationProfile').getContext("2d");
    const distances = [], elevations = [], days = [], trailheads = [], campsites = [];
    const startDistance = fullRoute.geometry.coordinates[0][3];
    const wrapAroundDistance = this.isPositiveDirection ? trailFeature.geometry.coordinates[trailFeature.geometry.coordinates.length - 1][3] - fullRoute.geometry.coordinates[0][3] : fullRoute.geometry.coordinates[fullRoute.geometry.coordinates.length - 1][3];
    const reverseDistance = this.isPositiveDirection ? 0 : routeLength;
    for (let i = 0; i < exportedRoute.features.length; i++) {
        if (exportedRoute.features[i].geometry && exportedRoute.features[i].geometry.type === "LineString") {
            for (let j = 0; j < exportedRoute.features[i].geometry.coordinates.length; j++) {
                const currDistance = exportedRoute.features[i].geometry.coordinates[j][3];
                let adjustedDistance;
                if (exportedRoute.features[i].properties.title === "Day 1" && j === 0) { // first distance should always be 0 (due to route clipping, sometimes the first distance is ~0.1)
                    adjustedDistance = 0;
                } else if (this.isPositiveDirection && currDistance < startDistance) {
                    adjustedDistance = currDistance + wrapAroundDistance;
                } else if (!this.isPositiveDirection && currDistance > startDistance) {
                    adjustedDistance = Math.abs(reverseDistance - currDistance + wrapAroundDistance);
                } else {
                    adjustedDistance = Math.abs(currDistance - startDistance);
                }
                if (j === 0 || exportedRoute.features[i].geometry.coordinates[j][2] !== exportedRoute.features[i].geometry.coordinates[j-1][2]) {
                    distances.push(adjustedDistance * distanceConstant);
                    elevations.push(exportedRoute.features[i].geometry.coordinates[j][2] * elevationConstant);
                    days.push(exportedRoute.features[i].properties.title);
                }
            }
        }
    }
    let nights = [];
    for (let i = 0; i < this.route.length - 1; i++) {
        nights.push(i+1);
        if (this.route[i].end != this.route[i + 1].end) {
            const currDistance = this.route[i].end.properties.distance;
            let adjustedDistance;
            if (this.isPositiveDirection && currDistance < startDistance) {
                adjustedDistance = currDistance + wrapAroundDistance;
            } else if (!this.isPositiveDirection && currDistance > startDistance) {
                adjustedDistance = Math.abs(reverseDistance - currDistance + wrapAroundDistance);
            } else {
                adjustedDistance = Math.abs(currDistance - startDistance);
            }
            campsites.push({
                x: adjustedDistance * distanceConstant,
                y: this.route[i].end.properties.elevation * elevationConstant,
                r: 6,
                label: 'Night ' + nights.join(' & ') + ': ' + this.route[i].end.properties.title
            });
            nights = [];
        }
    }
    trailheads.push({
        x: 0,
        y: this.route[0].start.properties.elevation * elevationConstant,
        r: 6,
        label: this.route[0].start.properties.title
    });
    trailheads.push({
        x: distances[distances.length - 1],
        y: this.route[this.route.length - 1].end.properties.elevation * elevationConstant,
        r: 6,
        label: this.route[this.route.length - 1].end.properties.title
    });
    const chartData = {
        labels: distances,
        datasets: [{
            type: 'bubble',
            data: trailheads,
            borderWidth: 2,
            pointStyle: 'rectRot',
            borderColor: 'black',
            borderColor: function(context) {
                return context.dataIndex % 2 ? '#000000' : '#147a14';
            },
            backgroundColor: function(context) {
                return context.dataIndex % 2 ? '#ff0000' : '#23db23';
            },
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
            type: 'bubble',
            data: campsites,
            borderWidth: 2,
            pointStyle: 'rectRounded',
            borderColor: '#123bc4',
            backgroundColor: '#5c81ff',
            hitRadius: 30,
            hoverBorderWidth: 2,
            options: {
                interaction: {
                    intersect: false, 
                    mode: 'nearest'
                }
            }
        }, 
        {
            type: 'line',
            data: elevations,
            fill: true,
            borderWidth: 2,
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
        }]
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
                            return days[tooltipItems[0].dataIndex];
                            //return "Distance: " + Math.round(tooltipItems[0].label * 10) / 10 + ' ' + distanceUnit
                        },
                        label: (tooltipItem) => {
                            const stats = [];
                            if (tooltipItem.dataset.type == 'bubble') {
                                stats.push("Distance: " + Math.round(tooltipItem.dataset.data[tooltipItem.dataIndex].x * 10) / 10 + ' ' + distanceUnit);
                                stats.push("Elevation: " + Math.round(tooltipItem.dataset.data[tooltipItem.dataIndex].y) + ' ' + elevationUnit);
                                stats.length = 2;
                                return stats;
                            } else {
                                stats.push("Distance: " + Math.round(tooltipItem.label * 10) / 10 + ' ' + distanceUnit);
                                stats.push("Elevation: " + Math.round(tooltipItem.raw) + ' ' + elevationUnit);
                                stats.length = 2;
                                return stats;
                            }
                        },
                    }
                }
            }
        }
    };
    this.trailElevationChart = new Chart(ctx, config);
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
            layer.bindPopup('Start: ' + this.route[dayIndex].start.properties.title + '<br>End: ' + this.route[dayIndex].end.properties.title + '<br>Length: ' + Math.round(this.route[dayIndex].length * distanceConstant * 10) / 10 + ' ' + distanceUnit);
            layer.bindTooltip(layer.feature.properties.title, {permanent: false, opacity: 0.75});
            //            if (dayIndex % 2 == 0) layer.setStyle({color :'#ff7d7d'});
            // if (dayIndex % 2 == 0) layer.setStyle({color :'blue'});
            // if (dayIndex % 3 == 0) layer.setStyle({color :'yellow'});
            dayIndex++;
        }
    });
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