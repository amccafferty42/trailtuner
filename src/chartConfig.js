// Variables for chart.js
let trailElevationChart;
let stickyElement = null;
let mapHoverMarker = null;

// 1. Define a custom interaction mode called 'magnetic'
Chart.Interaction.modes.magnetic = function(chart, e, options, useFinalPosition) {
    const radius = 30; // HIT_RADIUS: How close (in px) you need to be to snap to a bubble
    let closestBubble = null;
    let minDistance = radius;

    // 2. Loop through Trailheads (0) and Campsites (1) ONLY
    [0, 1].forEach(datasetIndex => {
        // Safety: Check if dataset exists and is visible
        if (!chart.data.datasets[datasetIndex] || !chart.isDatasetVisible(datasetIndex)) return;

        const meta = chart.getDatasetMeta(datasetIndex);
        
        meta.data.forEach((element, index) => {
            if (element.skip) return;

            // v4: Get precise coordinates
            // We use 'useFinalPosition' to handle animations correctly if needed
            const { x, y } = element.getProps(['x', 'y'], useFinalPosition);
            
            // Calculate distance from mouse (e.x, e.y) to bubble center
            const dist = Math.hypot(e.x - x, e.y - y);

            // Keep the closest one found so far
            if (dist < minDistance) {
                minDistance = dist;
                closestBubble = { element, datasetIndex, index };
            }
        });
    });

    // 3. PRIORITY LOGIC:
    // If we found a bubble within 30px, return ONLY that bubble.
    if (closestBubble) {
        return [closestBubble];
    }

    // 4. FALLBACK LOGIC:
    // If no bubble is nearby, use the standard 'index' mode (scrubbing behavior)
    return Chart.Interaction.modes.index(chart, e, options, useFinalPosition);
};

const commonChartOptions = { 
   options: {
        animation: false,
        maintainAspectRatio: false,
        clip: false,
        spanGaps: false,

        interaction: {
            mode: 'magnetic',
            intersect: false,
            axis: 'x'
        },

        scales: {
            x: { type: 'linear' },
            y: { type: 'linear', beginAtZero: false },
        },

        plugins: {
            legend: { display: false },
            
            tooltip: {
                position: 'average',
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
                        return '';
                        //return "Distance: " + Math.round(firstItem.label * 10) / 10 + ' ' + distanceUnit;
                    },
                    label: (context) => {
                        const tooltipModel = context.chart.tooltip;
                        // Check if ANY item in this hover event is a bubble
                        const hasBubble = tooltipModel.dataPoints.some(p => p.dataset.type === 'bubble');

                        // A. If this is the LINE dataset...
                        if (context.dataset.type === 'line') {
                            // ...and a bubble is present, return null to HIDE the line info
                            if (hasBubble) return null;
                            
                            // Otherwise, show line stats (scrubbing mode)
                            const dist = Math.round(context.label * 10) / 10 + ' ' + distanceUnit;
                            const yValue = context.raw.y !== undefined ? context.raw.y : context.raw;
                            const elev = Math.round(yValue) + ' ' + elevationUnit;
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
        onHover: (event, activeElements) => {
            event.native.target.style.cursor = activeElements.length ? 'pointer' : 'default';
        
            // 2. Map Synchronization
            if (activeElements.length > 0 && mapHoverMarker) {
                const element = activeElements[0];
                const dataset = this.trailElevationChart.data.datasets[element.datasetIndex];
                const pointData = dataset.data[element.index];

                // Check if this point has GPS data (The Line dataset now does!)
                if (pointData.lat !== undefined && pointData.lng !== undefined) {
                    mapHoverMarker.setLatLng([pointData.lat, pointData.lng]);
                    
                    // Ensure it is visible
                    if (!mapHoverMarker._map) mapHoverMarker.addTo(this.leafletMap);
                    mapHoverMarker.getElement().style.display = 'block';
                }
            } else {
                // Hide marker if not hovering anything
                if (mapHoverMarker && mapHoverMarker.getElement()) {
                    mapHoverMarker.getElement().style.display = 'none';
                }
            }
        },
        onClick: (evt, activeElements, chart) => {
            // 1. Default assumption: We should clear the sticky tooltip
            let shouldClear = true;

            // 2. Check if we actually hit a Bubble
            if (activeElements.length > 0) {
                const element = activeElements[0];
                const datasetIndex = element.datasetIndex;
                const dataset = chart.data.datasets[datasetIndex];

                if (dataset.type === 'bubble') {
                    // We hit a bubble! Don't clear automatically.
                    shouldClear = false;
                    
                    const markerData = dataset.data[element.index];

                    // TOGGLE LOGIC:
                    // If we clicked the exact same bubble that is already open...
                    if (stickyElement && 
                        stickyElement.datasetIndex === datasetIndex && 
                        stickyElement.index === element.index) {
                        
                        // ...then close it (Toggle Off)
                        stickyElement = null;
                    } else {
                        // ...otherwise, lock onto this new bubble (Toggle On)
                        stickyElement = { datasetIndex: datasetIndex, index: element.index };
                        
                        // Call your external method
                        if (typeof onMarkerSelected === 'function') {
                            onMarkerSelected(markerData);
                        }
                    }
                }
            }

            // 3. If we clicked the background OR the line (anything not a bubble), clear it.
            if (shouldClear) {
                stickyElement = null;
            }

            if (stickyElement === null) {
                markerClose();
            }

            chart.update();
        }
    }
};

function initChart() {
    if (this.trailElevationChart) this.trailElevationChart.destroy();
    const ctx = document.getElementById('elevationProfile').getContext("2d");
    const elevations = [], trailheads = [], campsites = [];
    for (let i = 0; i < trailFeature.geometry.coordinates.length; i++) {
        //prevent adding multiple points at the same distance (x value)
        if (i == 0 || trailFeature.geometry.coordinates[i][2] != trailFeature.geometry.coordinates[i-1][2]) {
            let distVal;
            const rawDist = trailFeature.geometry.coordinates[i][3];
            
            if ((trailCircuit && document.getElementById('cw').checked) || this.isPositiveDirection == undefined || this.isPositiveDirection) {
                distVal = rawDist * distanceConstant;
            } else {
                distVal = Math.abs(trailLength - rawDist) * distanceConstant;
            }
            
            elevations.push({
                x: distVal,
                y: trailFeature.geometry.coordinates[i][2] * elevationConstant,
                lat: trailFeature.geometry.coordinates[i][1],
                lng: trailFeature.geometry.coordinates[i][0]
            });
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
        labels: elevations.map(p => p.x),
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
            data: elevations,
            parsing: {
                xAxisKey: 'x',
                yAxisKey: 'y'
            },
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
        options: commonChartOptions.options,
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

function closeAllTooltips() {
    stickyElement = null;

    if (this.trailElevationChart) {
        this.trailElevationChart.update();
    }
}

function updateChart() {
    if (this.trailElevationChart) this.trailElevationChart.destroy();
    const ctx = document.getElementById('elevationProfile').getContext("2d");
    const elevations = [], trailheads = [], campsites = [];

    for (let i = 0; i < exportedRoute.features.length; i++) {
        let feature = exportedRoute.features[i];
        if (toggleTrail && toggleTrail.checked) {
            if (feature.geometry && feature.geometry.type === "LineString" && feature.properties.title == "Full Route") {
                for (let j = 0; j < trailFeature.properties.relativeDistances.length; j++) {
                    if (j === 0 || trailFeature.geometry.coordinates[j][2] !== trailFeature.geometry.coordinates[j-1][2]) {
                        let distVal;
                        if (trailCircuit) {
                            distVal = trailFeature.properties.relativeDistances[j] * distanceConstant;
                         } else {
                            if (this.isPositiveDirection) {
                                distVal = trailFeature.geometry.coordinates[j][3] * distanceConstant;
                            } else {
                                distVal = Math.abs(trailLength - trailFeature.geometry.coordinates[j][3]) * distanceConstant;
                            }
                         }
                        elevations.push({
                            x: distVal,
                            y: trailFeature.geometry.coordinates[j][2] * elevationConstant,
                            lat: trailFeature.geometry.coordinates[j][1],
                            lng: trailFeature.geometry.coordinates[j][0],
                            day: trailFeature.properties.title
                        });
                    }
                }
            }
        } else {
            if (feature.geometry && feature.geometry.type === "LineString" && feature.properties.title != "Full Route") {
                for (let j = 0; j < feature.properties.relativeDistances.length; j++) {
                    if (j === 0 || feature.geometry.coordinates[j][2] !== feature.geometry.coordinates[j-1][2]) {
                        elevations.push({
                            x: feature.properties.relativeDistances[j] * distanceConstant,
                            y: feature.geometry.coordinates[j][2] * elevationConstant,
                            lat: feature.geometry.coordinates[j][1],
                            lng: feature.geometry.coordinates[j][0],
                            day: feature.properties.title
                        });
                    }
                }
            }
        }
    }

    // Sort the pairs based on distance (lowest to highest)
    elevations.sort((a, b) => a.x - b.x);

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
            x2 = elevations[elevations.length - 1].x;
        }

        // end trailhead will be 0 for full circuits, force it to the "end"
        if (x2 === 0) {
            x2 = elevations[elevations.length - 1].x;
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
        labels: elevations.map(p => p.x),
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
            data: elevations,
            parsing: {
                xAxisKey: 'x',
                yAxisKey: 'y'
            },
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
        options: commonChartOptions.options
    };
    this.trailElevationChart = new Chart(ctx, config);
}