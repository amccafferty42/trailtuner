// Variables for chart.js
let trailElevationChart;

const commonChartOptions = { 
   options: {
        animation: false,
        maintainAspectRatio: false,
        clip: false,
        spanGaps: false,

        // 1. FIX: Global interaction settings for "scrubbing" behavior
        interaction: {
            mode: 'index',    // Grab all data at this index (line + bubbles)
            intersect: false, // Trigger even if mouse isn't touching the line
            axis: 'x'         // Calculate nearest point based on X-axis only
        },

        scales: {
            x: { type: 'linear' },
            y: { type: 'linear', beginAtZero: false },
        },

        plugins: {
            legend: { display: false },
            
            // 2. FIX: Consolidate all tooltip logic here (Chart.js v3+)
            tooltip: {
                position: 'nearest',
                displayColors: false,
                
                // Sort bubbles (datasets 0 & 1) to the top of the tooltip
                itemSort: function(a, b) {
                    return a.datasetIndex - b.datasetIndex;
                },

                callbacks: {
                    title: (tooltipItems) => {
                        const firstItem = tooltipItems[0];
                        // If the top item is a bubble, use its label
                        if (firstItem.dataset.type === 'bubble') {
                            return firstItem.dataset.data[firstItem.dataIndex].label;
                        }
                        // Otherwise, it's the line. Check if 'days' array exists (from updateChart) or default to distance
                        if (typeof days !== 'undefined' && days[firstItem.dataIndex]) {
                            return days[firstItem.dataIndex];
                        }
                        return "Distance: " + Math.round(firstItem.label * 10) / 10 + ' ' + distanceUnit;
                    },
                    label: (context) => {
                        // Check if ANY item in this hover event is a bubble
                        const hasBubble = context.tooltip.dataPoints.some(p => p.dataset.type === 'bubble');

                        // A. If this is the LINE dataset...
                        if (context.dataset.type === 'line') {
                            // ...and a bubble is present, return null to HIDE the line info
                            if (hasBubble) return null;
                            
                            // Otherwise, show line stats (scrubbing mode)
                            const dist = Math.round(context.label * 10) / 10 + ' ' + distanceUnit;
                            const elev = Math.round(context.raw) + ' ' + elevationUnit;
                            return [`Distance: ${dist}`, `Elevation: ${elev}`];
                        }

                        // B. If this is a BUBBLE dataset...
                        const dist = Math.round(context.raw.x * 10) / 10 + ' ' + distanceUnit;
                        const elev = Math.round(context.raw.y) + ' ' + elevationUnit;
                        return [`Distance: ${dist}`, `Elevation: ${elev}`];
                    }
                }
            }
        },

        // 3. Events
        onHover: (event, chartElement) => {
            const isHoveringPoint = chartElement.length && chartElement[0].element.options.radius > 0;
            event.native.target.style.cursor = isHoveringPoint ? 'pointer' : 'default';
        },
        onClick: (evt, activeElements, chart) => {
            if (activeElements.length === 0) {
                stickyElement = null;
                chart.update();
                return;
            }

            const element = activeElements[0];
            const datasetIndex = element.datasetIndex;
            const dataset = chart.data.datasets[datasetIndex];

            // Only trigger sticky behavior for Bubbles
            if (dataset.type === 'bubble') {
                const markerData = dataset.data[element.index];
                stickyElement = { datasetIndex: datasetIndex, index: element.index };
                
                // Call your external method
                if (typeof onMarkerSelected === 'function') {
                    onMarkerSelected(markerData);
                }
                
                chart.update();
            }
        }
    }
};

function initChart() {
    if (this.trailElevationChart) this.trailElevationChart.destroy();
    const ctx = document.getElementById('elevationProfile').getContext("2d");
    const distance = [], elevation = [], trailheads = [], campsites = [];
    for (let i = 0; i < trailFeature.geometry.coordinates.length; i++) {
        //prevent adding multiple points at the same distance (x value)
        if (i == 0 || trailFeature.geometry.coordinates[i][2] != trailFeature.geometry.coordinates[i-1][2]) {
            if ((trailCircuit && document.getElementById('cw').checked) || this.isPositiveDirection == undefined || this.isPositiveDirection) {
                distance.push(trailFeature.geometry.coordinates[i][3] * distanceConstant);
            } else {
                distance.push(Math.abs(trailLength - trailFeature.geometry.coordinates[i][3]) * distanceConstant);
            }
            elevation.push(trailFeature.geometry.coordinates[i][2] * elevationConstant);
        }
    }
    if (toggleTrailheads && toggleTrailheads.checked) {
        for (let i = 0; i < trailheadFeatures.length; i++) {
            if ((trailCircuit && document.getElementById('cw').checked) || this.isPositiveDirection == undefined || this.isPositiveDirection) {
                trailheads.push({
                    x: trailheadFeatures[i].geometry.coordinates[3] * distanceConstant,
                    y: trailheadFeatures[i].geometry.coordinates[2] * elevationConstant,
                    r: 6,
                    label: trailheadFeatures[i].properties.title
                });
            } else {
                trailheads.push({
                    x: Math.abs(trailLength - trailheadFeatures[i].geometry.coordinates[3]) * distanceConstant,
                    y: trailheadFeatures[i].geometry.coordinates[2] * elevationConstant,
                    r: 6,
                    label: trailheadFeatures[i].properties.title
                });
            }
        }
        if (trailCircuit) { // add the first trailhead again to the very end of the chart
            if (document.getElementById('cw').checked) {
                trailheads.push({
                    x: trailFeature.geometry.coordinates[trailFeature.geometry.coordinates.length - 1][3] * distanceConstant,
                    y: trailheadFeatures[0].geometry.coordinates[2] * elevationConstant,
                    r: 6,
                    label: trailheadFeatures[0].properties.title
                });
            } else {
                trailheads.push({
                    x: Math.abs(trailLength - trailFeature.geometry.coordinates[trailFeature.geometry.coordinates.length - 1][3]) * distanceConstant,
                    y: trailheadFeatures[0].geometry.coordinates[2] * elevationConstant,
                    r: 6,
                    label: trailheadFeatures[0].properties.title
                });
            }
        }
    }
    if (toggleCampsites && toggleCampsites.checked) {
        for (let i = 0; i < campsiteFeatures.length; i++) {
            if (campsiteFeatures[i].properties && campsiteFeatures[i].properties.title !== "*Dispersed Camping*") {
                if ((trailCircuit && document.getElementById('cw').checked) || this.isPositiveDirection == undefined || this.isPositiveDirection) {
                    campsites.push({
                        x: campsiteFeatures[i].geometry.coordinates[3] * distanceConstant,
                        y: campsiteFeatures[i].geometry.coordinates[2] * elevationConstant,
                        r: 6,
                        label: campsiteFeatures[i].properties.title
                    });
                } else {
                    campsites.push({
                        x: Math.abs(trailLength - campsiteFeatures[i].geometry.coordinates[3]) * distanceConstant,
                        y: campsiteFeatures[i].geometry.coordinates[2] * elevationConstant,
                        r: 6,
                        label: campsiteFeatures[i].properties.title
                    });
                }

            }
        }
    }
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
            spanGaps: true
        }]
    };

    let stickyElement = null;
      
    const config = {
        data: chartData,
        plugins: [{
            beforeInit: (chart, args, options) => {
            const maxHeight = Math.max(elevation);
            chart.options.scales.x.min = Math.min(...chart.data.labels);
            chart.options.scales.x.max = Math.max(...chart.data.labels);
            chart.options.scales.y.max = maxHeight + Math.round(maxHeight * 0.2);
            }
        },
        {
            id: 'stickyTooltip',
            afterEvent: (chart) => {
                if (stickyElement) {
                    chart.tooltip.setActiveElements([stickyElement]);
                }
            }
        }],
        options: 
        {

            onHover: (event, chartElement) => {
                // Show pointer if hovering a bubble OR if we are currently clicking one
                const isHoveringPoint = chartElement.length && chartElement[0].element.options.radius > 0;
                event.native.target.style.cursor = isHoveringPoint ? 'pointer' : 'default';
            },
            onClick: (evt, activeElements, chart) => {
                if (activeElements.length === 0) {
                    stickyElement = null;
                    chart.update();
                    return;
                }

                const element = activeElements[0];
                const datasetIndex = element.datasetIndex;
                const dataset = chart.data.datasets[datasetIndex];

                // Only trigger for bubbles (ignore the elevation line)
                if (dataset.type === 'bubble') {
                    const markerData = dataset.data[element.index];

                    // A. Update the "Sticky" element so the tooltip stays open
                    stickyElement = {
                        datasetIndex: datasetIndex,
                        index: element.index
                    };

                    // B. Call your EXTERNAL method
                    onMarkerSelected(markerData);
                    
                    // Force chart update to render the locked tooltip
                    chart.update();
                }
            },
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

function openTooltipByName(markerName) {
    console.log(markerName + " clicked");
    const chart = this.trailElevationChart; // Your chart instance
    
    let found = false;

    // Iterate over datasets to find the marker
    chart.data.datasets.forEach((dataset, datasetIndex) => {
        if (dataset.type === 'bubble') {
            dataset.data.forEach((point, index) => {
                if (point.label.replace(/^Night \d+: /, "") === markerName) {
                    
                    // 1. Update the sticky variable
                    stickyElement = {
                        datasetIndex: datasetIndex,
                        index: index
                    };

                    // 2. Force the tooltip to appear immediately
                    chart.tooltip.setActiveElements([stickyElement]);
                    chart.update();
                    
                    found = true;
                }
            });
        }
    });

    if (!found) {
        console.log(`Marker "${markerName}" not found.`);
    }
}

function updateChart() {
    if (this.trailElevationChart) this.trailElevationChart.destroy();

    const ctx = document.getElementById('elevationProfile').getContext("2d");
    let distances = [], elevations = [], days = [], trailheads = [], campsites = [];

    for (let i = 0; i < exportedRoute.features.length; i++) {
        let feature = exportedRoute.features[i];
        if (toggleTrail && toggleTrail.checked) {
            if (feature.geometry && feature.geometry.type === "LineString" && feature.properties.title == "Full Route") {
                for (let j = 0; j < trailFeature.properties.relativeDistances.length; j++) {
                    if (j === 0 || trailFeature.geometry.coordinates[j][2] !== trailFeature.geometry.coordinates[j-1][2]) {
                        if (trailCircuit) {
                            distances.push(trailFeature.properties.relativeDistances[j] * distanceConstant);
                         } else {
                            if (this.isPositiveDirection) {
                                distances.push(trailFeature.geometry.coordinates[j][3] * distanceConstant);
                            } else {
                                distances.push(Math.abs(trailLength - trailFeature.geometry.coordinates[j][3]) * distanceConstant);
                            }
                         }
                        elevations.push(trailFeature.geometry.coordinates[j][2] * elevationConstant);
                        days.push(trailFeature.properties.title);
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

    const combinedData = distances.map((dist, index) => {
        return { x: dist, y: elevations[index] };
    });

    // Sort the pairs based on distance (lowest to highest)
    combinedData.sort((a, b) => a.x - b.x);

    const sortedDistances = combinedData.map(point => point.x);
    const sortedElevations = combinedData.map(point => point.y);

    if (toggleCampsites && toggleCampsites.checked) {
        let nights = [];
        for (let i = 0; i < this.route.length - 1; i++) {
            nights.push(i+1);
            if (!equalCoordinates(this.route[i].end.geometry.coordinates, this.route[i + 1].end.geometry.coordinates, false)) {
                let x;
                const y = this.route[i].end.geometry.coordinates[2] * elevationConstant;
                const label = 'Night ' + nights.join(' & ') + ': ' + this.route[i].end.properties.title;
                if (toggleTrail && toggleTrail.checked) {
                    if (trailCircuit) {
                        x = this.route[i].end.properties.relativeDistance * distanceConstant;
                    } else {
                        if (this.isPositiveDirection) {
                            x = this.route[i].end.geometry.coordinates[3] * distanceConstant;
                        } else {
                            x = Math.abs(trailLength - this.route[i].end.geometry.coordinates[3]) * distanceConstant;
                        }
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
    }

    if (toggleTrailheads && toggleTrailheads.checked) {
        let x1;
        let x2;
        const y1 = this.route[0].start.geometry.coordinates[2] * elevationConstant;
        const y2 = this.route[this.route.length - 1].end.geometry.coordinates[2] * elevationConstant;
        const label1 = this.route[0].start.properties.title;
        const label2 = this.route[this.route.length - 1].end.properties.title;
        if (toggleTrail && toggleTrail.checked) {
            if (trailCircuit) {
                x1 = this.route[0].start.properties.relativeDistance * distanceConstant;
                x2 = this.route[this.route.length - 1].end.properties.relativeDistance * distanceConstant;
            } else {
                if (this.isPositiveDirection) {
                    x1 = this.route[0].start.geometry.coordinates[3] * distanceConstant; // actual distance from 0
                    x2 = this.route[this.route.length - 1].end.geometry.coordinates[3] * distanceConstant; // actual distance from 0
                } else {
                    x1 = Math.abs(trailLength - this.route[0].start.geometry.coordinates[3]) * distanceConstant; // actual distance from 0 (inverted)
                    x2 = Math.abs(trailLength - this.route[this.route.length - 1].end.geometry.coordinates[3]) * distanceConstant; // actual distance from 0 (inverted)
                }
            }
        } else {
            x1 = 0;
            x2 = distances[distances.length - 1];
        }

        // end trailhead will be 0 for full circuits, force it to the "end"
        if (x2 === 0) {
            x2 = sortedDistances[sortedDistances.length - 1];
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
                    mode: 'index',
                    axis: 'x'
                }
            }
        }]
    };

    let stickyElement = null;
      
    const config = {
        data: chartData,
        plugins: [{
            beforeInit: (chart, args, options) => {
            const maxHeight = Math.max(elevations);
            chart.options.scales.x.min = Math.min(...chart.data.labels);
            chart.options.scales.x.max = Math.max(...chart.data.labels);
            chart.options.scales.y.max = maxHeight + Math.round(maxHeight * 0.2);
            }
        },
        {
            id: 'stickyTooltip',
            afterEvent: (chart) => {
                if (stickyElement) {
                    chart.tooltip.setActiveElements([stickyElement]);
                }
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
            onHover: (event, chartElement) => {
                // Show pointer if hovering a bubble OR if we are currently clicking one
                const isHoveringPoint = chartElement.length && chartElement[0].element.options.radius > 0;
                event.native.target.style.cursor = isHoveringPoint ? 'pointer' : 'default';
            },
            onClick: (evt, activeElements, chart) => {
                if (activeElements.length === 0) {
                    stickyElement = null;
                    chart.update();
                    return;
                }

                const element = activeElements[0];
                const datasetIndex = element.datasetIndex;
                const dataset = chart.data.datasets[datasetIndex];

                // Only trigger for bubbles (ignore the elevation line)
                if (dataset.type === 'bubble') {
                    const markerData = dataset.data[element.index];

                    // A. Update the "Sticky" element so the tooltip stays open
                    stickyElement = {
                        datasetIndex: datasetIndex,
                        index: element.index
                    };

                    // B. Call your EXTERNAL method
                    onMarkerSelected(markerData);
                    
                    // Force chart update to render the locked tooltip
                    chart.update();
                }
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