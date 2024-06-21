let route;
let routeLength;
let routeElevationGain;
let routeElevationLoss;
let isPositiveDirection;
let userSetDays = false;
let filteredCampsites;
let excludedCampsites;
let includedCampsites;

// Select DOM elements
const selectStart = document.getElementById('start');
const selectEnd = document.getElementById('end');
const selectExclude = document.getElementById('exclude');
const selectInclude = document.getElementById('include');
const inputDays = document.getElementById('days');
const inputDistance = document.getElementById('distance');
const inputDate = document.getElementById('start-date');
const inputShortHikeIn = document.getElementById('hike-in');
const inputShortHikeOut = document.getElementById('hike-out');
const inputCW = document.getElementById('cw');
const inputCCW = document.getElementById('ccw');
const inputMi = document.getElementById('mi');
const inputKm = document.getElementById('km');
const title = document.getElementById('title');
const table = document.getElementById('table');
const exportRoute = document.getElementById('exportRoute');
const shareRoute = document.getElementById('shareRoute');
const tableBody = document.getElementById('table-body');
const unitLabel1 = document.getElementById('unit1');
const unitLabel2 = document.getElementById('unit2');
const unitLabel3 = document.getElementById('unit3');
const daysLabel = document.getElementById('daysLabel');
const distanceLabel = document.getElementById('distanceLabel');
const loopDirectionLabel = document.getElementsByClassName('loop-direction-label');
const selectTrail = document.getElementById('select-trail');
const logo = document.getElementById('logo').addEventListener("click", refresh);
const includeDispersedCampsites = document.getElementById('toggle-dispersed');

populateSelectTrail();
reset();

function plan() {
    if (validateForm()) {
        filterCampsites(campsiteFeatures);
        const startDate = new Date(inputDate.value + 'T00:00');
        const days = getDays();
        const distancePerDay = getDistancePerDay();
        const distance = getDistance(days, distancePerDay);
        const startTrailhead = selectStart.value == 0 ? selectStartTrailhead(trailheadFeatures[selectEnd.value - 1], distance) : trailheadFeatures[selectStart.value - 1];
        const endTrailhead = selectEnd.value == 0 ? selectEndTrailhead(startTrailhead, distance) : trailheadFeatures[selectEnd.value - 1];
        this.isPositiveDirection = getDirection(startTrailhead, endTrailhead);
        const route = generateRoute(startTrailhead, endTrailhead, days, startDate, inputShortHikeIn.checked, inputShortHikeOut.checked);
        this.route = route;
        if (!route) {
            window.alert("Error: unable to generate route");
        } else {
            displayRoute(route);
            shareRoute.scrollIntoView({behavior: 'smooth'});
        }
    }
}

function filterCampsites(campsites) {
    filteredCampsites = [];
    excludedCampsites = [];
    includedCampsites = [];
    console.log(selectExclude.childNodes.length);
    for (let i = 0; i < selectExclude.childNodes.length; i++) {
        if (selectExclude.childNodes[i].selected) {
            excludedCampsites.push(selectExclude.childNodes[i].value);
        }
    }
    for (let i = 0; i < selectInclude.childNodes.length; i++) {
        if (selectInclude.childNodes[i].selected) {
            includedCampsites.push(selectInclude.childNodes[i].value);
        }
    }
    for (let i = 0; i < campsites.length; i++) {
        if (!excludedCampsites.includes(i+1+"") && (!campsites[i].properties.title.match(/[*]/) || includeDispersedCampsites.checked)) {
            filteredCampsites.push(campsites[i]);
        }
    }
}

function validateForm() {
    if (inputDays.value != '' && (inputDays.value < 0 || inputDays.value > 99)) return false;
    if (inputDistance.value != '' && (inputDistance.value < 0 || inputDistance.value > 99)) return false;
    if (selectStart.value < 0 || selectStart.value > trailheadFeatures.length + 1) return false;
    if (selectEnd.value < 0 || selectEnd.value > trailheadFeatures.length + 1) return false;
    if (selectStart.value > 0 && selectEnd.value > 0 && inputDays.value > 0 && inputDistance.value > 0) return false; 
    return true;
}

// If days is not provided, determine a reasonable number of days
function getDays() {
    if (inputDays.value > 0) {
        return inputDays.value;
    } else if ((selectStart.value != 0 && selectEnd.value != 0) || inputDistance.value > 0) {
        let days;
        if (selectStart.value != 0 && selectEnd.value != 0) {
            this.isPositiveDirection = getDirection(trailheadFeatures[selectStart.value - 1], trailheadFeatures[selectEnd.value - 1]);
            const totalDistance = (trailCircuit && selectStart.value == selectEnd.value) ? trailLength : getDistanceBetween(trailheadFeatures[selectStart.value - 1].properties.distance, trailheadFeatures[selectEnd.value - 1].properties.distance);
            const distancePerDay = getDistancePerDay();
            days = (totalDistance / distancePerDay) < filteredCampsites.length ? Math.round(totalDistance / distancePerDay) : filteredCampsites.length;
        } else if (inputDistance.value > 0) {
            if (trailCircuit) {
                days = Math.round(trailLength / inputDistance.value); // if start or end are not set, route length will always be full length so days must always be trail length / miles/days
            } else if (selectStart.value != 0) {
                days = Math.floor(Math.random() * (Math.round(Math.max(Math.abs(trailLength - trailheadFeatures[selectStart.value - 1].properties.distance), Math.abs(0 - trailheadFeatures[selectStart.value - 1].properties.distance)) / inputDistance.value)) + 1); // min = 1, max = longest possible distance in either direction / miles per day
            } else if (selectEnd.value != 0) {
                days = Math.floor(Math.random() * (Math.round(Math.max(Math.abs(trailLength - trailheadFeatures[selectEnd.value - 1].properties.distance), Math.abs(0 - trailheadFeatures[selectEnd.value - 1].properties.distance)) / inputDistance.value)) + 1); // min = 1, max = longest possible distance in either direction / miles per day
            } else {
                days = Math.floor(Math.random() * (Math.round(trailLength / inputDistance.value)) + 1); // min = 1, max = trail length / miles per day
            }
        }
        if (inputShortHikeIn.checked) days++; // add an additional day for short days so route gen will make the remaining days closer to the input value
        if (inputShortHikeOut.checked) days++;
        return Math.max(1, days);
    }
    return Math.floor(Math.random() * (Math.ceil(filteredCampsites.length / 2)) + 2); // min = 2, max = (# campsites / 2) + 2
}

// All distances are stored in metric, regardless of the unit selected. Therefore we return distancePerDay in metric so it works with all calulcations
function getDistancePerDay() {
    if (inputDistance.value > 0 && distanceUnit === 'km') return inputDistance.value;
    if (inputDistance.value > 0 && distanceUnit === 'mi') return inputDistance.value * 1.60934;
    return Math.floor(Math.random() * (32 - 16 + 1) ) + 16; // min = 10, max = 20 for miles / min = 16, max = 32 for km
}

// Calculate distance given days and distance per day. Returned value is only used when trailheads are not set
function getDistance(days, distancePerDay) {
    if (selectStart.value != 0 && selectEnd.value != 0) return getDistanceBetween(trailheadFeatures[selectStart.value - 1].properties.distance, trailheadFeatures[selectEnd.value - 1].properties.distance);
    return !inputShortHikeIn.checked ? distancePerDay * days : (distancePerDay * days) - Math.round(distancePerDay / 2);
}

// If start trailhead is not provided, determine a reasonable start
function selectStartTrailhead(endTrailhead, length) {
    if (endTrailhead === undefined) {
        if (trailCircuit || length <= trailLength / 2) {
            return trailheadFeatures[Math.floor(Math.random() * trailheadFeatures.length)];
        } else {
            let validTrailheads = [];
            for (let i = 0; i < trailheadFeatures.length; i++) {
                if (trailheadFeatures[i].properties.distance <= (trailLength - length) || trailheadFeatures[i].properties.distance >= length) {
                    validTrailheads.push(i);
                }
            }
            if (validTrailheads.length === 0) return trailheadFeatures[Math.floor(Math.random() * 2) * (trailheadFeatures.length - 1)];
            const r = Math.floor(Math.random() * validTrailheads.length);
            return trailheadFeatures[validTrailheads[r]];
        }
    } else {
        if (trailCircuit) return endTrailhead; //prioritize full loops for route generation
        const startCandidate1 = getNearestTrailhead(endTrailhead.properties.distance + length);
        const startCandidate2 = getNearestTrailhead(endTrailhead.properties.distance - length);
        if ((endTrailhead.properties.distance + length) > trailLength && (endTrailhead.properties.distance - length) < 0) {
            return Math.abs(endTrailhead.properties.distance - startCandidate1.properties.distance) > Math.abs(endTrailhead.properties.distance - startCandidate2.properties.distance) ? startCandidate1 : startCandidate2;
        } else if ((endTrailhead.properties.distance + length) > trailLength) {
            return startCandidate2;
        } else if ((endTrailhead.properties.distance - length) < 0) {
            return startCandidate1;
        }
        //return Math.abs(startCandidate1.properties.distance - length) < Math.abs(startCandidate2.properties.distance - length) ? startCandidate1 : startCandidate2;
        return Math.floor(Math.random() * 2) === 0 ? startCandidate1 : startCandidate2;
    }
}

// If end trailhead is not provided, determine a reasonable end
function selectEndTrailhead(startTrailhead, length) {
    if (trailCircuit && ((inputDays.value == '' || inputDistance.value == '') || length >= trailLength)) return startTrailhead; //prioritize full loops for route generation
    const endCandidate1 = getNearestTrailhead(startTrailhead.properties.distance + length);
    const endCandidate2 = getNearestTrailhead(startTrailhead.properties.distance - length);
    if (trailCircuit && inputCW.checked) {
        return endCandidate1;
    } else if (trailCircuit && inputCCW.checked) {
        return endCandidate2;
    } else if ((startTrailhead.properties.distance + length) > trailLength && (startTrailhead.properties.distance - length) < 0) {
        return Math.abs(startTrailhead.properties.distance - endCandidate1.properties.distance) > Math.abs(startTrailhead.properties.distance - endCandidate2.properties.distance) ? endCandidate1 : endCandidate2;
    } else if ((startTrailhead.properties.distance + length) > trailLength) {
        return endCandidate2;
    } else if ((startTrailhead.properties.distance - length) < 0) {
        return endCandidate1;
    }
    //return Math.abs(endCandidate1.properties.distance - length) < Math.abs(endCandidate2.properties.distance - length) ? endCandidate1 : endCandidate2;
    return Math.floor(Math.random() * 2) === 0 ? endCandidate1 : endCandidate2;
}

function generateRoute(start, end, days, startDate, shortHikeIn, shortHikeOut) {
    console.info('Generating ' + days + ' day trip from ' + start.properties.title + ' to ' + end.properties.title);
    if (shortHikeIn && shortHikeOut && days > 2) {
        const firstDay = generateShortHikeIn(start, startDate);
        let lastDate = new Date(startDate);
        lastDate.setUTCDate(lastDate.getUTCDate() + (days - 1));
        const lastDay = generateShortHikeOut(end, lastDate);
        let tomorrow = new Date(firstDay.date);
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
        route = calculateRoute(firstDay.end, lastDay.start, days - 2, tomorrow);
        route.unshift(firstDay);
        route.push(lastDay);
        return route;
    } else if (shortHikeIn && days > 1) {
        const firstDay = generateShortHikeIn(start, startDate);
        let tomorrow = new Date(firstDay.date);
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
        route = calculateRoute(firstDay.end, end, days - 1, tomorrow);
        route.unshift(firstDay);
        return route;
    } else if (shortHikeOut && days > 1) {
        let lastDate = new Date(startDate);
        lastDate.setUTCDate(lastDate.getUTCDate() + (days - 1));
        const lastDay = generateShortHikeOut(end, lastDate);
        route = calculateRoute(start, lastDay.start, days - 1, startDate);
        route.push(lastDay);
        return route;
    }
    return calculateRoute(start, end, days, startDate);
}

function generateShortHikeIn(start, startDate) {
    const end = getNextCampsiteFromTrailhead(start.properties.distance, this.isPositiveDirection);
    const elevationChange = getElevationBetween(start, end);
    return {
        start: start,
        date: startDate,
        end: end,
        length: getDistanceBetween(start.properties.distance, end.properties.distance),
        prev_site: getPrevCampsite(end),
        next_site: getNextCampsite(end),
        elevationGain: elevationChange.gain,
        elevationLoss: elevationChange.loss
    }
}

function generateShortHikeOut(end, startDate) {
    const start = getNextCampsiteFromTrailhead(end.properties.distance, !this.isPositiveDirection);
    const elevationChange = getElevationBetween(start, end);
    return {
        start: start,
        date: startDate,
        end: end,
        length: getDistanceBetween(start.properties.distance, end.properties.distance),
        prev_site: undefined,
        next_site: undefined,
        elevationGain: elevationChange.gain,
        elevationLoss: elevationChange.loss
    }
}

// Given a campsite, return the previous campsite in the list. Regardless of route direction, prev_site will always be the site in the list before the given site
function getPrevCampsite(campsite) {
    if (campsite.properties.index === undefined) return undefined;
    if (trailCircuit && campsite == filteredCampsites[0]) return filteredCampsites[filteredCampsites.length - 1];
    return filteredCampsites[campsite.properties.index - 1] === undefined ? undefined : filteredCampsites[campsite.properties.index - 1];
}

// Given a campsite, return the next campsite in the list. Regardless of route direction, next_site will always be the site in the list after the given site
function getNextCampsite(campsite) {
    if (campsite.properties.index === undefined) return undefined;
    if (trailCircuit && campsite == filteredCampsites[filteredCampsites.length - 1]) return filteredCampsites[0];
    return filteredCampsites[campsite.properties.index + 1] === undefined ? undefined : filteredCampsites[campsite.properties.index + 1];
}

// Return list of all campsites between a start and end distance in order (includes wrapping around a circuit)
function getAllCampsites(startDistance, endDistance) {
    let campsites = [];
    if (!trailCircuit && startDistance == endDistance) return campsites;
    else if (this.isPositiveDirection) {
        for (let i = 0; i < filteredCampsites.length; i++) {
            if ((startDistance >= endDistance && (filteredCampsites[i].properties.distance > startDistance || filteredCampsites[i].properties.distance < endDistance)) || (startDistance < endDistance && (filteredCampsites[i].properties.distance > startDistance && filteredCampsites[i].properties.distance < endDistance))) campsites.push(filteredCampsites[i]);
        }
        while (startDistance < filteredCampsites[filteredCampsites.length - 1].properties.distance && campsites[0].properties.distance < startDistance) campsites.push(campsites.shift());
    } else {
        for (let i = filteredCampsites.length - 1; i >= 0; i--) {
            if ((startDistance <= endDistance && (filteredCampsites[i].properties.distance < startDistance || filteredCampsites[i].properties.distance > endDistance)) || (startDistance > endDistance && (filteredCampsites[i].properties.distance < startDistance && filteredCampsites[i].properties.distance > endDistance))) campsites.push(filteredCampsites[i]);
        }
        while (startDistance > filteredCampsites[0].properties.distance && campsites[0].properties.distance > startDistance) campsites.push(campsites.shift());
    }
    return campsites;
}

// Calculate distance between start and end (includes wrapping around a circuit)
function getDistanceBetween(startDistance, endDistance) {
    if (startDistance === endDistance) return 0;
    if (trailCircuit && this.isPositiveDirection && startDistance > endDistance) return (trailLength - startDistance + endDistance);
    if (trailCircuit && !this.isPositiveDirection && startDistance < endDistance) return (trailLength - endDistance + startDistance);
    return Math.abs(startDistance - endDistance);
}

function getElevationBetween(start, end) {
    let elevation = {
        gain: 0, 
        loss: 0
    };
    if (start.properties.distance === end.properties.distance) return elevation;
    else if (trailCircuit && this.isPositiveDirection && start.properties.distance > end.properties.distance) {
        elevation.gain = Math.abs(trailElevationGain - start.properties.elevationGain + end.properties.elevationGain);
        elevation.loss = Math.abs(trailElevationLoss - start.properties.elevationLoss + end.properties.elevationLoss);
    } else if (trailCircuit && !this.isPositiveDirection && start.properties.distance < end.properties.distance) {
        elevation.gain = Math.abs(trailElevationGain - end.properties.elevationGain + start.properties.elevationGain);
        elevation.loss = Math.abs(trailElevationLoss - end.properties.elevationLoss + start.properties.elevationLoss);
    } else {
        elevation.gain = Math.abs(end.properties.elevationGain - start.properties.elevationGain);
        elevation.loss = Math.abs(end.properties.elevationLoss - start.properties.elevationLoss);
    }

    // Elevation gain/loss is relative to the direction of travel. If travelling non-positive direction, swap the values.
    if (!this.isPositiveDirection) [elevation.gain, elevation.loss] = [elevation.loss, elevation.gain];

    return elevation;
}

// Determine positive or negative direction
function getDirection(start, end) {
    return (trailCircuit && inputCW.checked) || (!trailCircuit && start.properties.distance < end.properties.distance) ? true : false;
}

function getOptimalCampsites(start, end, days, includeBothCandidates) {
    let length = getDistanceBetween(start.properties.distance, end.properties.distance);
    if ((trailCircuit && length == 0) || length > trailLength) length = trailLength;
    let avgDistance = length / days;
    let distance = start.properties.distance;
    let campsites = new Set();
    for (let i = 0; i < days - 1; i++) {
        if (this.isPositiveDirection) {
            distance += avgDistance;
            if (trailCircuit && distance > trailLength) distance -= trailLength;
        } else {
            distance -= avgDistance;
            if (trailCircuit && distance < 0) distance += trailLength;
        }
        let campsiteCandidate1 = getNextCampsiteFromTrailhead(distance, !this.isPositiveDirection);
        let campsiteCandidate2 = getNextCampsiteFromTrailhead(distance, this.isPositiveDirection);
        //complex validation necessary to ensure both campsite candidates are valid for all possible directions
        if (this.isPositiveDirection) { 
            if (campsiteCandidate1 && !((start.properties.distance >= end.properties.distance && (campsiteCandidate1.properties.distance > start.properties.distance || campsiteCandidate1.properties.distance < end.properties.distance)) || (start.properties.distance < end.properties.distance && (campsiteCandidate1.properties.distance > start.properties.distance && campsiteCandidate1.properties.distance < end.properties.distance)))) campsiteCandidate1 = undefined;
            if (campsiteCandidate2 && !((start.properties.distance >= end.properties.distance && (campsiteCandidate2.properties.distance > start.properties.distance || campsiteCandidate2.properties.distance < end.properties.distance)) || (start.properties.distance < end.properties.distance && (campsiteCandidate2.properties.distance > start.properties.distance && campsiteCandidate2.properties.distance < end.properties.distance)))) campsiteCandidate2 = undefined;
        } else {
            if (campsiteCandidate1 && !((start.properties.distance <= end.properties.distance && (campsiteCandidate1.properties.distance < start.properties.distance || campsiteCandidate1.properties.distance > end.properties.distance)) || (start.properties.distance > end.properties.distance && (campsiteCandidate1.properties.distance < start.properties.distance && campsiteCandidate1.properties.distance > end.properties.distance)))) campsiteCandidate1 = undefined;
            if (campsiteCandidate2 && !((start.properties.distance <= end.properties.distance && (campsiteCandidate2.properties.distance < start.properties.distance || campsiteCandidate2.properties.distance > end.properties.distance)) || (start.properties.distance > end.properties.distance && (campsiteCandidate2.properties.distance < start.properties.distance && campsiteCandidate2.properties.distance > end.properties.distance)))) campsiteCandidate2 = undefined;
        }
        if (campsiteCandidate1 && campsiteCandidate2 && includeBothCandidates) {
            campsites.add(campsiteCandidate1);
            campsites.add(campsiteCandidate2);
        } else {
            //only add the campsite closer to the average distance
            if (campsiteCandidate1 && campsiteCandidate2 && Math.abs(campsiteCandidate1.properties.distance - distance) < Math.abs(campsiteCandidate2.properties.distance - distance)) {
                campsites.add(campsiteCandidate1);
            } else if (campsiteCandidate2) {
                campsites.add(campsiteCandidate2);
            }
        }
    }
    for (campsite of includedCampsites) {
        campsites.add(campsiteFeatures[parseInt(campsite) - 1]);
    }
    return campsites;
}     

//TODO may want to modify how random start/end is selected if there are include/exclude sites added
// Generate a subset of all optimal campsite combinations as routes, select the route with the lowest variance in daily mileage
function calculateRoute(start, end, days, startDate) {
    let allOptimalCampsites = Array.from(getOptimalCampsites(start, end, days, true));
    if (days > filteredCampsites.length || days > allOptimalCampsites.length) {
        console.info('Number of days is greater than or equal to the number of available campsites between start and end points. Generating route with all possible campsites');
        return buildRoute(start, end, allOptimalCampsites, days, startDate);
    } else if (allOptimalCampsites.length > 22) {
        console.info('Sample size is too large. Generating basic route using campsites closest to daily average');
        allOptimalCampsites = Array.from(getOptimalCampsites(start, end, days, false));
        return buildRoute(start, end, allOptimalCampsites, days, startDate);
    } else {
        const groupedCampsites = subset(allOptimalCampsites, days - 1);
        let routes = [];

        if (includedCampsites.length > 0) {
            console.log("Included campsites:");
            console.log(includedCampsites);
            for (let campsites of groupedCampsites) {
                let validCampsites = false;
                for (let i = 0; i < includedCampsites.length; i++) {
                    for (campsite of campsites) {
                        if(campsite.properties && campsite.properties.index == (includedCampsites[i] - 1)) {
                            console.log("Route includes valid campsites:");
                            console.log(campsites);
                            validCampsites = true;
                        }
                    }
                    if (!validCampsites) {
                        break;
                    } else {
                        if (i == (includedCampsites.length - 1)) {
                            break;
                        } else {
                            validCampsites = false;
                        }
                    }
                }
                if (validCampsites) routes.push(buildRoute(start, end, campsites, days, startDate));
            }
        } else {
            for (let campsites of groupedCampsites) {
                routes.push(buildRoute(start, end, campsites, days, startDate));
            }
        }
        let bestRoute = routes[0], lowestSD = Number.MAX_VALUE;
        for(let i = 0; i < routes.length; i++) {
            let sd = calculateSD(calculateVariance(Array.from(routes[i], x => x.length)));
            if (sd < lowestSD) {
                bestRoute = routes[i];
                lowestSD = sd;
            }
        }
        console.info("Analyzed " + routes.length + " different candidates to find the optimal route with a daily mileage standard deviation of " + lowestSD + " " + distanceUnit);
        return bestRoute;
    }
}

// Generate subset of all campsite permutations that equal the number of nights
function subset(campsites, nights) {
    let result_set = [], result;
    for (let x = 0; x < Math.pow(2, campsites.length); x++) {
        result = [];
        i = campsites.length - 1; 
        do {
            if ((x & (1 << i)) !== 0) {
                result.push(campsites[i]);
            }
        } while(i--);
        if (result.length == nights) {
            result_set.push(result.reverse());
        }
    }
    return result_set; 
}

// Map trailheads, list of campsites, days, and startDate into a list of routes
function buildRoute(startTrailhead, endTrailhead, campsites, days, startDate) {   
    let route = [days];
    route[0] = {};
    route[0].date = startDate;
    route[0].start = startTrailhead;
    for (let j = 0; j < days; j++) {
        if (j > 0) {
            let tomorrow = new Date(route[j-1].date);
            tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
            route[j] = {};
            route[j].date = tomorrow;
            route[j].start = route[j-1].end;
        }
        if (j == days - 1) {
            route[j].end = endTrailhead;
        } else {
            route[j].end = campsites[j] === undefined ? route[j].start : campsites[j];    
        }
        route[j].prev_site = getPrevCampsite(route[j].end);
        route[j].next_site = getNextCampsite(route[j].end);     
        route[j].length = (days == 1 && trailCircuit && route[j].start === route[j].end) ? trailLength : getDistanceBetween(route[j].start.properties.distance, route[j].end.properties.distance);
        const elevation = getElevationBetween(route[j].start, route[j].end);
        route[j].elevationGain = (days == 1 && trailCircuit && route[j].start === route[j].end) ? trailElevationGain : elevation.gain;
        route[j].elevationLoss = (days == 1 && trailCircuit && route[j].start === route[j].end) ? trailElevationLoss : elevation.loss;
    }
    return route;
}

// Given distance number, return the nearest campsite in the direction of the route
function getNextCampsiteFromTrailhead(distance, isPositiveDirection) {
    if (distance < 0 || distance > trailLength) return undefined;
    if (isPositiveDirection) {
        for (let i = 0; i < filteredCampsites.length; i++) {
            if (filteredCampsites[i].properties.distance > distance) return filteredCampsites[i];
        }
        return trailCircuit ? filteredCampsites[0] : undefined;
    } else {
        for (let i = filteredCampsites.length - 1; i >= 0; i--) {
            if (filteredCampsites[i].properties.distance < distance) return filteredCampsites[i];
        }
        return trailCircuit ? filteredCampsites[filteredCampsites.length - 1] : undefined;
    }
}

// Given distance number, return the nearest trailhead in either direction
function getNearestTrailhead(distance) {
    if (!trailCircuit && distance < 0) return trailheadFeatures[0];
    else if (trailCircuit && distance < 0) distance = trailLength + distance;
    if (!trailCircuit && distance > trailLength) return trailheadFeatures[trailheadFeatures.length - 1];
    else if (trailCircuit && distance > trailLength) distance = distance - trailLength;
    for (let i = 0; i < trailheadFeatures.length; i++) {
        if (trailheadFeatures[i].properties.distance > distance) {
            if (i == 0) return trailheadFeatures[0];
            return Math.abs(distance - trailheadFeatures[i].properties.distance) < Math.abs(distance - trailheadFeatures[i - 1].properties.distance) ? trailheadFeatures[i] : trailheadFeatures[i - 1];
        }
    }
    return trailheadFeatures[trailheadFeatures.length - 1];
}

// Change destination and recalculate length, next_site, and prev_site, as well as the next day's start and length
function changeCamp(dayIndex, isNext) {
    this.route[dayIndex].end = isNext ? this.route[dayIndex].next_site : this.route[dayIndex].prev_site;

    if (trailCircuit && this.isPositiveDirection && this.route[dayIndex].start.properties.distance > this.route[dayIndex].end.properties.distance) { //dest wraps around start of trail CW
        this.route[dayIndex].length = (trailLength - this.route[dayIndex].start.properties.distance) + this.route[dayIndex].end.properties.distance;
        this.route[dayIndex].elevationGain = (trailElevationGain - this.route[dayIndex].start.properties.elevationGain) + this.route[dayIndex].end.properties.elevationGain;
        this.route[dayIndex].elevationLoss = (trailElevationLoss - this.route[dayIndex].start.properties.elevationLoss) + this.route[dayIndex].end.properties.elevationLoss;
    } else if (trailCircuit && !this.isPositiveDirection && this.route[dayIndex].start.properties.distance < this.route[dayIndex].end.properties.distance) { //dest wraps around start of trail CCW
        this.route[dayIndex].length = this.route[dayIndex].start.properties.distance + (trailLength - this.route[dayIndex].end.properties.distance);
        this.route[dayIndex].elevationGain = this.route[dayIndex].start.properties.elevationGain + (trailElevationGain - this.route[dayIndex].end.properties.elevationGain);
        this.route[dayIndex].elevationLoss = this.route[dayIndex].start.properties.elevationLoss + (trailElevationLoss - this.route[dayIndex].end.properties.elevationLoss);
    } else {
        this.route[dayIndex].length = Math.abs(this.route[dayIndex].start.properties.distance - this.route[dayIndex].end.properties.distance);
        this.route[dayIndex].elevationGain = Math.abs(this.route[dayIndex].start.properties.elevationGain - this.route[dayIndex].end.properties.elevationGain);
        this.route[dayIndex].elevationLoss = Math.abs(this.route[dayIndex].start.properties.elevationLoss - this.route[dayIndex].end.properties.elevationLoss);
    }

    this.route[dayIndex].prev_site = trailCircuit && this.route[dayIndex].end == filteredCampsites[0] ? filteredCampsites[filteredCampsites.length - 1] : filteredCampsites[this.route[dayIndex].end.properties.index - 1];
    this.route[dayIndex].next_site = trailCircuit && this.route[dayIndex].end == filteredCampsites[filteredCampsites.length - 1] ? this.route[dayIndex].next_site = filteredCampsites[0] : filteredCampsites[this.route[dayIndex].end.properties.index + 1];
    this.route[dayIndex + 1].start = this.route[dayIndex].end;

    if (trailCircuit && this.isPositiveDirection && this.route[dayIndex + 1].start.properties.distance > this.route[dayIndex + 1].end.properties.distance) { //next day dest wraps around start of trail CW
        this.route[dayIndex + 1].length = (trailLength - this.route[dayIndex + 1].start.properties.distance) + this.route[dayIndex + 1].end.properties.distance;
        this.route[dayIndex + 1].elevationGain = (trailElevationGain - this.route[dayIndex + 1].start.properties.elevationGain) + this.route[dayIndex + 1].end.properties.elevationGain;
        this.route[dayIndex + 1].elevationLoss = (trailElevationLoss - this.route[dayIndex + 1].start.properties.elevationLoss) + this.route[dayIndex + 1].end.properties.elevationLoss;
    } else if (trailCircuit && !this.isPositiveDirection && this.route[dayIndex + 1].start.properties.distance < this.route[dayIndex + 1].end.properties.distance) { //next day dest wraps around start of trail CCW
        this.route[dayIndex + 1].length = this.route[dayIndex + 1].start.properties.distance + (trailLength - this.route[dayIndex + 1].end.properties.distance);
        this.route[dayIndex + 1].elevationGain = this.route[dayIndex + 1].start.properties.elevationGain + (trailElevationGain - this.route[dayIndex + 1].end.properties.elevationGain);
        this.route[dayIndex + 1].elevationLoss = this.route[dayIndex + 1].start.properties.elevationLoss + (trailElevationLoss - this.route[dayIndex + 1].end.properties.elevationLoss);
    } else {
        this.route[dayIndex + 1].length = Math.abs(this.route[dayIndex + 1].start.properties.distance - this.route[dayIndex + 1].end.properties.distance);
        this.route[dayIndex + 1].elevationGain = Math.abs(this.route[dayIndex + 1].start.properties.elevationGain - this.route[dayIndex + 1].end.properties.elevationGain);
        this.route[dayIndex + 1].elevationLoss = Math.abs(this.route[dayIndex + 1].start.properties.elevationLoss - this.route[dayIndex + 1].end.properties.elevationLoss);
    }
    displayRoute(this.route);
}

function onDistancePerDayChange() {
    if ((inputDays.value == "" || inputDays.value == 0) && (inputDistance.value == 0 || inputDistance.value == "")) {
        inputDistance.placeholder = distanceUnit === 'mi' ? "10-20 Mile Range" : "16-32 Km Range";
        inputDistance.value = "";
    } 
    else if (inputDistance.value == 0 || inputDistance.value == "") {
        inputDistance.placeholder = "N/A";
        inputDistance.value = "";

    } else {
        inputDistance.placeholder = "";
        if (selectStart.value != 0 && selectEnd.value != 0) {
            //inputDays.placeholder = trailUnit === 'mi' ? "Using Miles / Day" : "Using Km / Day";
            inputDays.placeholder = "N/A";
            inputDays.value = "";
        }
    }
}

function onDaysChange() {
    this.userSetDays = true;
    if (inputDays.value == 0 || inputDays.value == "") {
        inputDays.placeholder = "N/A";
        inputDays.value = "";
    } else {
        inputDays.placeholder = "";
        if (selectStart.value != 0 && selectEnd.value != 0) {
            inputDistance.placeholder = "N/A";
            inputDistance.value = "";
        }
    }
    onDistancePerDayChange();
}

function onTrailheadsChange() {
    if (selectStart.value != 0 && selectEnd.value != 0 && (inputDays.value != "" || inputDays.value != 0) && (inputDistance.value != "" || inputDistance.value != 0)) {
        inputDistance.placeholder = "N/A";
        inputDistance.value = "";
    } 
    // If days has not been set by the user, determine a reasonable number based on distance between trailheads
    if (!this.userSetDays && selectStart.value != 0 && selectEnd.value != 0) {
        this.isPositiveDirection = getDirection(trailheadFeatures[selectStart.value - 1], trailheadFeatures[selectEnd.value - 1]);
        const length = (trailCircuit && selectStart.value == selectEnd.value) ? trailLength : getDistanceBetween(trailheadFeatures[selectStart.value - 1].properties.distance, trailheadFeatures[selectEnd.value - 1].properties.distance);
        inputDays.value = Math.max(1, Math.round(length / 16.0934)); // 10 miles/day
    }
}

function displayRoute(route) {
    routeLength = 0;
    routeElevationGain = 0;
    routeElevationLoss = 0;
    tableBody.innerHTML = '';
    for (let i = 0; i < route.length; i++) {
        routeLength += route[i].length;
        routeElevationGain += route[i].elevationGain;
        routeElevationLoss += route[i].elevationLoss;
        let row = tableBody.insertRow(i);
        let cell1 = row.insertCell(0);
        let cell2 = row.insertCell(1);
        let cell3 = row.insertCell(2);
        let cell4 = row.insertCell(3);
        let cell5 = row.insertCell(4);
        let cell6 = row.insertCell(5);
        let cell7 = row.insertCell(6);
        cell7.classList.add("right");
        let cell8 = row.insertCell(7);
        cell8.classList.add("right");
        cell1.innerHTML = '<strong>' + (i + 1) + '</strong>';
        cell2.innerHTML = route[i].date.toLocaleDateString('en-us', { weekday:"short", year:"2-digit", month:"numeric", day:"numeric"});
        cell3.innerHTML = i == 0 ? '<u>' + route[i].start.properties.title + '</u>' : route[i].start.properties.title;
        cell4.innerHTML = i == route.length - 1 ? '<u>' + route[i].end.properties.title + '</u>' : route[i].end.properties.title;
        cell5.innerHTML = closerCampBtn(route[i], route);
        cell6.innerHTML = furtherCampBtn(route[i], route);
        cell7.innerHTML = '<strong class="blue">' + Math.round(route[i].length * distanceConstant * 10) / 10 + ' ' + distanceUnit + '</strong>';
        cell8.innerHTML = '<strong><span class="red">+' + Math.trunc(route[i].elevationGain * elevationConstant).toLocaleString() + ' ' + elevationUnit +' </span><br><span class="green">-' + Math.trunc(route[i].elevationLoss * elevationConstant).toLocaleString() + ' ' + elevationUnit + '</span></strong>'
    }
    row = tableBody.insertRow();
    cell1 = row.insertCell(0);
    cell2 = row.insertCell(1);
    cell3 = row.insertCell(2);
    cell4 = row.insertCell(3);
    cell5 = row.insertCell(4);
    cell6 = row.insertCell(5);
    cell7 = row.insertCell(6);
    cell7.classList.add("right");
    cell8 = row.insertCell(7);
    cell8.classList.add("right");
    cell7.innerHTML = '<strong>Total:<br>' + Math.round(routeLength * distanceConstant * 10) / 10 + ' ' + distanceUnit + '</strong>';
    cell8.innerHTML = '<strong><span class="red">+' + Math.trunc(routeElevationGain * elevationConstant).toLocaleString() + ' ' + elevationUnit + ' </span><br><span class="green">-' + Math.trunc(routeElevationLoss * elevationConstant).toLocaleString() + ' ' + elevationUnit + '</span><strong>';
    table.style.marginTop = '20px';
    table.style.visibility = 'visible';
    shareRoute.disabled = false;
    exportRoute.disabled = false;
    toggleTrail.disabled = false;
    toggleTrail.checked = false;
    toggleTrailheads.checked = true;
    toggleCampsites.checked = true;

    updateGeoJSON();
    console.table(route);
}

// Display the closer camp option as long as it does not compromise the direction of the route (i.e. change daily mileage < 0)
function closerCampBtn(day, route) {
    if (trailLength === 1 || day === route[route.length - 1] || day.length === 0 || (day.prev_site === undefined && day.next_site === undefined) || (!trailCircuit && this.isPositiveDirection && day.prev_site === undefined) || (!trailCircuit && !this.isPositiveDirection && day.next_site === undefined)) return '<button class="changeCampBtn btn btn-sm btn-secondary" disabled>Unavailable<br>&nbsp;</button>';
    
    let dif = 0;
    if (trailCircuit && this.isPositiveDirection && day.prev_site.properties.distance > day.end.properties.distance) dif = ((trailLength - day.prev_site.properties.distance) + day.end.properties.distance);
    else if (trailCircuit && !this.isPositiveDirection && day.next_site.properties.distance < day.end.properties.distance) dif = (day.next_site.properties.distance + (trailLength - day.end.properties.distance));
    else dif = (this.isPositiveDirection) ? Math.abs(day.end.properties.distance - day.prev_site.properties.distance) : Math.abs(day.end.properties.distance - day.next_site.properties.distance);

    if (day === route[0] && day.length - dif < 0) return '<button class="changeCampBtn btn btn-sm btn-secondary" disabled>Unavailable<br>&nbsp;</button>';
    if (this.isPositiveDirection) return '<button class="changeCampBtn btn btn-sm btn-success" onclick="changeCamp(' + route.indexOf(day) + ', false)" value="">' + day.prev_site.properties.title + '</br>-' + Math.round(dif * distanceConstant * 10) / 10 + ' ' + distanceUnit + '</button>';
    return '<button class="changeCampBtn btn btn-sm btn-success" onclick="changeCamp(' + route.indexOf(day) + ', true)" value="">' + day.next_site.properties.title + '</br>-' + Math.round(dif * distanceConstant * 10) / 10 + ' ' + distanceUnit + '</button>';    
}

// Display the further camp option as long as it does not compromise the direction of the route (i.e. change next daily mileage < 0)
function furtherCampBtn(day, route) {
    const nextDay = route[route.indexOf(day) + 1];
    if (trailLength === 1 || day === route[route.length - 1] || nextDay.length === 0 || (this.isPositiveDirection && day.next_site === undefined) || (!this.isPositiveDirection && day.prev_site === undefined)) return '<button class="changeCampBtn btn btn-sm btn-secondary" disabled>Unavailable<br>&nbsp;</button>';
    
    let dif = 0;
    if (trailCircuit && this.isPositiveDirection && day.next_site.properties.distance < day.end.properties.distance) dif = (day.next_site.properties.distance + (trailLength - day.end.properties.distance));
    else if (trailCircuit && !this.isPositiveDirection && day.prev_site.properties.distance > day.end.properties.distance) dif = (day.end.properties.distance + (trailLength - day.prev_site.properties.distance));
    else dif = (this.isPositiveDirection) ? Math.abs(day.end.properties.distance - day.next_site.properties.distance) : Math.abs(day.end.properties.distance - day.prev_site.properties.distance);
    
    if ((day === route[route.length - 2] && nextDay.length - dif < 0)) return '<button class="changeCampBtn btn btn-sm btn-secondary" disabled>Unavailable<br>&nbsp;</button>';
    if (this.isPositiveDirection) return '<button class="changeCampBtn btn btn-sm btn-danger" onclick="changeCamp(' + route.indexOf(day) + ', true)" value="">' + day.next_site.properties.title + '</br>+' + Math.round(dif * distanceConstant * 10) / 10 + ' ' + distanceUnit + '</button>';
    return '<button class="changeCampBtn btn btn-sm btn-danger" onclick="changeCamp(' + route.indexOf(day) + ', false)" value="">' + day.prev_site.properties.title+'</br>+' + Math.round(dif * distanceConstant * 10) / 10 + ' ' + distanceUnit + '</button>';
}

function resetOptions() {
    if (!hasDispersedCampsites) {
        includeDispersedCampsites.checked = false;
        includeDispersedCampsites.disabled = true;
    } else {
        includeDispersedCampsites.checked = true;
        includeDispersedCampsites.disabled = false;
    }
    // $('.selectpicker').selectpicker('destroy');
    $('.selectpicker').selectpicker('deselectAll');
    $('.selectpicker').selectpicker('refresh');

}

function validateOptions() {
    let isValid = true;
    // 1. A site cannot be both excluded and included
    for (includedCampsite of includedCampsites) {
        if (excludedCampsites.includes(includedCampsite)) {
            isValid = false;
        }
    }
    // 2. A site cannot be outside of the 2 selected trailheads
    return isValid;
}

function reset() {
    removeOptions(selectStart);
    removeOptions(selectEnd);
    for (let i = 0; i < trailheadFeatures.length; i++) {
        addOption(selectStart, trailheadFeatures[i].properties.title.replace(" Trailhead", ""), i+1);
        addOption(selectEnd, trailheadFeatures[i].properties.title.replace(" Trailhead", ""), i+1);
    }
    removeAllOptions(selectExclude);
    removeAllOptions(selectInclude);
    for (let i = 0; i < campsiteFeatures.length; i++) {
        if (!campsiteFeatures[i].properties.title.match(/[*]/)) {
            addOption(selectExclude, campsiteFeatures[i].properties.title, i+1);
            addOption(selectInclude, campsiteFeatures[i].properties.title, i+1);
        }
    }
    console.log(selectExclude);
    resetOptions();
    tableBody.innerHTML = '';
    selectStart.value = 1;
    selectEnd.value = trailCircuit ? 1 : selectEnd.length - 1;
    inputDate.valueAsDate = new Date();
    title.innerHTML = trailName;
    inputDays.value = Math.max(1, Math.round(trailLength / 16.0934));
    inputDistance.value = "";
    inputDistance.placeholder = "N/A";
    inputShortHikeIn.checked = false;
    inputShortHikeOut.checked = false;
    inputCW.disabled = trailCircuit ? false : true;
    inputCCW.disabled = trailCircuit ? false : true;
    inputCW.checked = trailCircuit ? true : false;
    inputCCW.checked = false;
    if (distanceUnit === 'km') inputKm.click();
    else inputMi.click();
    setUnitLabels(distanceUnit);
    this.userSetDays = false;
    if (!trailCircuit) for (element of loopDirectionLabel) element.classList.add('lightgray');
    if (trailCircuit) for (element of loopDirectionLabel) element.classList.remove('lightgray');
    table.style.visibility = 'hidden';
    exportRoute.disabled = true;
    shareRoute.disabled = true;
    table.style.marginTop = 0;
    this.route = undefined;
    exportedRoute = undefined;
    fullRoute = undefined;
    toggleTrail.checked = true;
    toggleTrail.disabled = true;
    toggleTrailheads.checked = true;
    toggleCampsites.checked = false;
    resetMap();
    initChart();
    window.scrollTo(0, 0);
}

function refresh() {
    location.reload(); 
}

function removeOptions(element) {
    for (let i = element.options.length - 1; i > 0; i--) {
       element.remove(i);
    }
}

function removeAllOptions(element) {
    for (let i = element.options.length - 1; i >= 0; i--) {
       element.remove(i);
    }
}
 
// Populate dropdown with premade trails
function populateSelectTrail() {
    for (let i = 0; i < trails.length; i++) addOption(selectTrail, trails[i].name, i);
}

function addOption(element, name, value) {
    let opt = document.createElement("option");
    opt.text = name;
    opt.value = value;
    element.appendChild(opt);
}

function setUnitLabels(unit) {
    unitLabel1.innerHTML = unit === 'mi' ? 'miles' : 'km';
    unitLabel2.innerHTML = unit === 'mi' ? 'miles' : 'km';
    unitLabel3.innerHTML = unit === 'mi' ? 'Miles' : 'Km';
}

function setUnit(unit) {
    if (distanceUnit != unit) {
        console.info('Switching unit from ' + distanceUnit + ' to ' + unit);
        distanceUnit = unit;
        elevationUnit = unit === 'km' ? 'm' : 'ft';
        distanceConstant = unit === 'km' ? 1 : 0.621371;
        elevationConstant = unit === 'km' ? 1 : 3.28084;
        setUnitLabels(unit);
        if (inputDays.value == 0 || inputDays.value == '') onDaysChange(); // update labels on days and distance / day inputs
        if (inputDistance.value != 0 && inputDistance.value != '') inputDistance.value = unit === 'km' ? Math.round(inputDistance.value * 1.609344) : Math.round(inputDistance.value * 0.6213711922);
        if (this.route != undefined && this.route.length > 0) {
            displayRoute(this.route);
        } else { //re-initialize map and chart to show updated units
            initMap();
            initChart();
        }
    }
}

// Calculate the average of all the numbers
const calculateMean = (values) => {
    return (values.reduce((sum, current) => sum + current)) / values.length;
};

// Calculate variance
const calculateVariance = (values) => {
    const average = calculateMean(values);
    const squareDiffs = values.map((value) => {
        const diff = value - average;
        return diff * diff;
    });
    return calculateMean(squareDiffs);
};

// Calculate standard deviation
const calculateSD = (variance) => {
    return Math.sqrt(variance);
};