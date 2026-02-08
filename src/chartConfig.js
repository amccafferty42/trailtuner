// Variables for chart.js
let trailElevationChart;

function initChart() {
    if (this.trailElevationChart) this.trailElevationChart.destroy();
    const ctx = document.getElementById('elevationProfile').getContext("2d");
    const distance = [], elevation = [], trailheads = [], campsites = [];
    for (let i = 0; i < trailFeature.geometry.coordinates.length; i++) {
        //prevent adding multiple points at the same distance (x value)
        if (i == 0 || trailFeature.geometry.coordinates[i][2] != trailFeature.geometry.coordinates[i-1][2]) {
            elevation.push(trailFeature.geometry.coordinates[i][2] * elevationConstant);
            distance.push(trailFeature.geometry.coordinates[i][3] * distanceConstant);
        }
    }
    if (toggleTrailheads && toggleTrailheads.checked) {
        for (let i = 0; i < trailheadFeatures.length; i++) {
            trailheads.push({
                x: trailheadFeatures[i].geometry.coordinates[3] * distanceConstant,
                y: trailheadFeatures[i].geometry.coordinates[2] * elevationConstant,
                r: 6,
                label: trailheadFeatures[i].properties.title
            });
        }
        if (trailCircuit) {
            trailheads.push({
                x: trailFeature.geometry.coordinates[trailFeature.geometry.coordinates.length - 1][3] * distanceConstant,
                y: trailheadFeatures[0].geometry.coordinates[2] * elevationConstant,
                r: 6,
                label: trailheadFeatures[0].properties.title
            });
        }
    }
    if (toggleCampsites && toggleCampsites.checked) {
        for (let i = 0; i < campsiteFeatures.length; i++) {
            if (campsiteFeatures[i].properties && campsiteFeatures[i].properties.title !== "*Dispersed Camping*") {
                campsites.push({
                    x: campsiteFeatures[i].geometry.coordinates[3] * distanceConstant,
                    y: campsiteFeatures[i].geometry.coordinates[2] * elevationConstant,
                    r: 6,
                    label: campsiteFeatures[i].properties.title
                });
            }
        }
    }
    //const markers = trailheads.concat(campsites);
    const chartData = {
        labels: distance,
        datasets: [{
            type: 'bubble',
            data: trailheads,
            borderWidth: 2,
            pointStyle: 'rectRot',
            borderColor: '#147a14',
            backgroundColor: '#23db23',
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
            backgroundColor: function(context) {
                return toggleTrail && toggleTrail.checked ? '#ff000020' : 'transparent';
            },
            borderColor: function(context) {
                return toggleTrail && toggleTrail.checked ? '#ff0000' : 'transparent';
            },
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
            const maxHeight = Math.max(elevation);
            chart.options.scales.x.min = Math.min(...chart.data.labels);
            chart.options.scales.x.max = Math.max(...chart.data.labels);
            chart.options.scales.y.max = maxHeight + Math.round(maxHeight * 0.2);
            }
        }],
        options: {
            // onHover: (evt, activeEls, chart) => {
            // },
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
                // title: { align: "end", display: true, text: "Distance, " + distanceUnit + " / Elevation, " + elevationUnit },
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

function updateChart() {
    if (this.trailElevationChart) this.trailElevationChart.destroy();

    const ctx = document.getElementById('elevationProfile').getContext("2d");
    let distances = [], elevations = [], days = [], trailheads = [], campsites = [];

    for (let i = 0; i < exportedRoute.features.length; i++) {
        let feature = exportedRoute.features[i];
        if (toggleTrail && toggleTrail.checked) {
            if (feature.geometry && feature.geometry.type === "LineString" && feature.properties.title == "Full Route") {
                console.log(trailFeature);
                for (let j = 0; j < trailFeature.properties.relativeDistances.length; j++) {
                    if (j === 0 || trailFeature.geometry.coordinates[j][2] !== trailFeature.geometry.coordinates[j-1][2]) {
                        if (trailCircuit) {
                            if (trailFeature.properties.relativeDistances[j] == 0) {

                            } else {
                                distances.push(trailFeature.properties.relativeDistances[j] * distanceConstant);
                            }
                        } else {
                            distances.push(trailFeature.geometry.coordinates[j][3] * distanceConstant);
                        }
                        elevations.push(trailFeature.geometry.coordinates[j][2] * elevationConstant);
                        days.push(trailFeature.properties.title);
                    }
                }
               
                if (!this.isPositiveDirection) {
                    distances = distances.reverse();
                    elevations = elevations.reverse();
                    for (let i = 0; i < distances.length; i++) {
                        //inverting the distances (as well as reversing the array) is necessary because the distribution of points/distances along the route is not guarenteed to be evenly distributed
                        //this means that if it is not inverted, the elevations will be applied to slightly misaligned distances for the reversed elevations, creating a noticeable error
                        distances[i] = Math.abs((trailLength * distanceConstant) - distances[i]);
                    }
                }
            }
        } else {
            if (feature.geometry && feature.geometry.type === "LineString" && feature.properties.title != "Full Route") {
                for (let j = 0; j < feature.properties.relativeDistances.length; j++) {
                    if (j === 0 || feature.geometry.coordinates[j][2] !== feature.geometry.coordinates[j-1][2]) {
                        distances.push(feature.properties.relativeDistances[j] * distanceConstant);
                        elevations.push(feature.geometry.coordinates[j][2] * elevationConstant);
                        days.push(feature.properties.title);
                    }
                }
            }
        }
    }


    if (toggleCampsites && toggleCampsites.checked) {
        let nights = [];
        for (let i = 0; i < this.route.length - 1; i++) {
            let x;
            const y = this.route[i].end.geometry.coordinates[2] * elevationConstant;
            nights.push(i+1);
            const label = 'Night ' + nights.join(' & ') + ': ' + this.route[i].end.properties.title;
            if (toggleTrail && toggleTrail.checked && (!trailCircuit || !equalCoordinates(this.route[0].start.geometry.coordinates, this.route[this.route.length - 1].end.geometry.coordinates, false))) {
                if (this.isPositiveDirection) {
                    x = this.route[i].end.geometry.coordinates[3] * distanceConstant;
                } else {
                    x = Math.abs(trailLength - this.route[i].end.geometry.coordinates[3]) * distanceConstant;
                }
            } else {
                x = this.route[i].end.properties.relativeDistance * distanceConstant;
            }
            campsites.push({
                x: x,
                y: y,
                r: 6,
                label: label
            });
            nights = [];
        }
    }

    if (toggleTrailheads && toggleTrailheads.checked) {
        let x1;
        let x2;
        const y1 = this.route[0].start.geometry.coordinates[2] * elevationConstant;
        const y2 = this.route[this.route.length - 1].end.geometry.coordinates[2] * elevationConstant;
        const label1 = this.route[0].start.properties.title;
        const label2 = this.route[this.route.length - 1].end.properties.title;
        if (toggleTrail && toggleTrail.checked && (!trailCircuit || !equalCoordinates(this.route[0].start.geometry.coordinates, this.route[this.route.length - 1].end.geometry.coordinates, false))) {
            if (this.isPositiveDirection) {
                x1 = this.route[0].start.geometry.coordinates[3] * distanceConstant; //actual distance from 0
                x2 = this.route[this.route.length - 1].end.geometry.coordinates[3] * distanceConstant; //actual distance from 0
            } else {
                x1 = Math.abs(trailLength - this.route[0].start.geometry.coordinates[3]) * distanceConstant; //actual distance from 0 (inverted)
                x2 = Math.abs(trailLength - this.route[this.route.length - 1].end.geometry.coordinates[3]) * distanceConstant; //actual distance from 0 (inverted)
            }
        } else {
            x1 = 0;
            x2 = distances[distances.length - 1];
        }
        trailheads.push({
            x: x1,
            y: y1,
            r: 6,
            label: label1
        });
        trailheads.push({
            x: x2,
            y: y2,
            r: 6,
            label: label2
        });
    }
    const combinedData = distances.map((dist, index) => {
        return { x: dist, y: elevations[index] };
    });

    // 2. Sort the pairs based on distance (lowest to highest)
    combinedData.sort((a, b) => a.x - b.x);

    // 3. (Optional) If Chart.js needs separate arrays again:
    const sortedDistances = combinedData.map(point => point.x);
    const sortedElevations = combinedData.map(point => point.y);
    console.log(distances);
    console.log(elevations);
    console.log(days);
    const chartData = {
        labels: sortedDistances,
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
            spanGaps: false,
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
            spanGaps: false,
            options: {
                interaction: {
                    intersect: false, 
                    mode: 'nearest'
                }
            }
        }, 
        {
            type: 'line',
            data: sortedElevations,
            fill: true,
            borderWidth: 2,
            backgroundColor: '#ff000020',
            borderColor: '#ff0000',
            tension: 0.1,
            pointRadius: 0,
            spanGaps: false,
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
            const maxHeight = Math.max(elevations);
            chart.options.scales.x.min = Math.min(...chart.data.labels);
            chart.options.scales.x.max = Math.max(...chart.data.labels);
            chart.options.scales.y.max = maxHeight + Math.round(maxHeight * 0.2);
            }
        }],
        options: {
            animation: false,
            maintainAspectRatio: false,
            clip: false,
            spanGaps: false,
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
                // title: { align: "end", display: true, text: "Distance, " + distanceUnit + " / Elevation, " + elevationUnit },
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