let route;
let isPositiveDirection;
let userSetDays = false;

// Select DOM elements
const selectStart = document.getElementById('start');
const selectEnd = document.getElementById('end');
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

reset();

function plan() {
    if (validateForm()) {
        const startDate = new Date(inputDate.value + 'T00:00');
        const days = getDays();
        const distancePerDay = getDistancePerDay();
        const distance = getDistance(days, distancePerDay);
        const startTrailhead = selectStart.value == 0 ? selectStartTrailhead(trailheadFeatures[selectEnd.value - 1], distance) : trailheadFeatures[selectStart.value - 1];
        const endTrailhead = selectEnd.value == 0 ? selectEndTrailhead(startTrailhead, distance) : trailheadFeatures[selectEnd.value - 1];
        this.isPositiveDirection = getDirection(startTrailhead, endTrailhead);
        const route = generateRoute(startTrailhead, endTrailhead, days, startDate, inputShortHikeIn.checked, inputShortHikeOut.checked);
        this.route = route;
        displayRoute(route);
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
            days = totalDistance / distancePerDay < campsiteFeatures.length ? Math.round(totalDistance / distancePerDay) : campsiteFeatures.length;
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
    return Math.floor(Math.random() * (Math.ceil(campsiteFeatures.length / 2)) + 2); // min = 2, max = (# campsites / 2) + 2
}

function getDistancePerDay() {
    if (inputDistance.value > 0) return inputDistance.value;
    return trailUnit === 'km' ? Math.floor(Math.random() * (32 - 16 + 1) ) + 16 : Math.floor(Math.random() * (20 - 10 + 1) ) + 10; // min = 10, max = 20 for miles and min = 16, max = 32 for km
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
    console.log(endCandidate1);
    console.log(endCandidate2);
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
    console.log('Generating ' + days + ' day trip from ' + start.properties.title + ' to ' + end.properties.title);
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
    //return calculateRoute(start, end, days, startDate);  
}

function generateShortHikeIn(start, startDate) {
    const end = getNextCampsiteFromTrailhead(start.properties.distance, this.isPositiveDirection);
    return {
        start: start,
        date: startDate,
        end: end,
        length: getDistanceBetween(start.properties.distance, end.properties.distance),
        prev_site: getPrevCampsite(end),
        next_site: getNextCampsite(end)
    }
}

function generateShortHikeOut(end, startDate) {
    const start = getNextCampsiteFromTrailhead(end.properties.distance, !this.isPositiveDirection);
    return {
        start: start,
        date: startDate,
        end: end,
        length: getDistanceBetween(start.properties.distance, end.properties.distance),
        prev_site: undefined,
        next_site: undefined
    }
}

// Given a campsite, return the previous campsite in the list. Regardless of route direction, prev_site will always be the site in the list before the given site
function getPrevCampsite(campsite) {
    if (campsite.properties.index === undefined) return undefined;
    if (trailCircuit && campsite == campsiteFeatures[0]) return campsiteFeatures[campsiteFeatures.length - 1];
    return campsiteFeatures[campsite.properties.index - 1] === undefined ? undefined : campsiteFeatures[campsite.properties.index - 1];
}

// Given a campsite, return the next campsite in the list. Regardless of route direction, next_site will always be the site in the list after the given site
function getNextCampsite(campsite) {
    if (campsite.properties.index === undefined) return undefined;
    if (trailCircuit && campsite == campsiteFeatures[campsiteFeatures.length - 1]) return campsiteFeatures[0];
    return campsiteFeatures[campsite.properties.index + 1] === undefined ? undefined : campsiteFeatures[campsite.properties.index + 1];
}

// Return list of all campsites between a start and end distance in order (includes wrapping around a circuit)
function getAllCampsites(startDistance, endDistance) {
    let campsites = [];
    if (!trailCircuit && startDistance == endDistance) return campsites;
    else if (this.isPositiveDirection) {
        for (let i = 0; i < campsiteFeatures.length; i++) {
            if ((startDistance >= endDistance && (campsiteFeatures[i].properties.distance > startDistance || campsiteFeatures[i].properties.distance < endDistance)) || (startDistance < endDistance && (campsiteFeatures[i].properties.distance > startDistance && campsiteFeatures[i].properties.distance < endDistance))) campsites.push(campsiteFeatures[i]);
        }
        while (startDistance < campsiteFeatures[campsiteFeatures.length - 1].properties.distance && campsites[0].properties.distance < startDistance) campsites.push(campsites.shift());
    } else {
        for (let i = campsiteFeatures.length - 1; i >= 0; i--) {
            if ((startDistance <= endDistance && (campsiteFeatures[i].properties.distance < startDistance || campsiteFeatures[i].properties.distance > endDistance)) || (startDistance > endDistance && (campsiteFeatures[i].properties.distance < startDistance && campsiteFeatures[i].properties.distance > endDistance))) campsites.push(campsiteFeatures[i]);
        }
        while (startDistance > campsiteFeatures[0].properties.distance && campsites[0].properties.distance > startDistance) campsites.push(campsites.shift());
    }
    return campsites;
}

// Calculate distance between start and end (includes wrapping around a circuit)
function getDistanceBetween(startDistance, endDistance) {
    if (startDistance === endDistance) return 0;
    if (trailCircuit && this.isPositiveDirection && startDistance > endDistance) return Math.round((trailLength - startDistance + endDistance) * 10) / 10;
    if (trailCircuit && !this.isPositiveDirection && startDistance < endDistance) return Math.round((trailLength - endDistance + startDistance) * 10) / 10;
    return Math.round(Math.abs(startDistance - endDistance) * 10) / 10;
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
        }
        else {
            distance -= avgDistance;
            if (trailCircuit && distance < 0) distance += trailLength;
        }
        let campsiteCandidate1 = getNextCampsiteFromTrailhead(distance, !this.isPositiveDirection);
        let campsiteCandidate2 = getNextCampsiteFromTrailhead(distance, this.isPositiveDirection);
        if (includeBothCandidates) {
            campsites.add(campsiteCandidate1);
            campsites.add(campsiteCandidate2);
        } else {
            //only add the campsite closer to the average distance
            if (Math.abs(campsiteCandidate1.properties.distance - distance) < Math.abs(campsiteCandidate2.properties.distance - distance)) {
                campsites.add(campsiteCandidate1);
            } else {
                campsites.add(campsiteCandidate2);
            }
        }
    }
    return campsites;
}

// Generate a subset of all optimal campsite combinations as routes, select the route with the lowest variance in daily mileage
function calculateRoute(start, end, days, startDate) {
    let allOptimalCampsites = Array.from(getOptimalCampsites(start, end, days, true));
    if (days > campsiteFeatures.length || days > allOptimalCampsites.length) {
        console.log("All optimal campsites:")
        console.log(allOptimalCampsites);
        console.info('Number of days is greater than or equal to the number of available campsites between start and end points. Generating route with all possible campsites');
        return buildRoute(start, end, allOptimalCampsites, days, startDate);
    } else if (allOptimalCampsites.length > 22) {
        console.info('Sample size is too large. Generating basic route using campsites closest to daily average');
        allOptimalCampsites = Array.from(getOptimalCampsites(start, end, days, false));
        return buildRoute(start, end, allOptimalCampsites, days, startDate);
    } else {
        const groupedCampsites = subset(allOptimalCampsites, days - 1);
        let routes = [];
        for (let campsites of groupedCampsites) {
            routes.push(buildRoute(start, end, campsites, days, startDate));
        }
        let bestRoute = routes[0], lowestSD = Number.MAX_VALUE;
        for(let i = 0; i < routes.length; i++) {
            let sd = calculateSD(calculateVariance(Array.from(routes[i], x => x.length)));
            if (sd < lowestSD) {
                bestRoute = routes[i];
                lowestSD = sd;
            }
        }
        console.log("Analyzed " + routes.length + " different candidates to find the optimal route with a daily mileage standard deviation of " + lowestSD + " " + trailUnit);
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
    }
    return route;
}

// Given distance number, return the nearest campsite in the direction of the route
function getNextCampsiteFromTrailhead(distance, isPositiveDirection) {
    if (distance < 0 || distance > trailLength) return undefined;
    if (isPositiveDirection) {
        for (let i = 0; i < campsiteFeatures.length; i++) {
            if (campsiteFeatures[i].properties.distance > distance) return campsiteFeatures[i];
        }
        return trailCircuit ? campsiteFeatures[0] : undefined;
    } else {
        for (let i = campsiteFeatures.length - 1; i >= 0; i--) {
            if (campsiteFeatures[i].properties.distance < distance) return campsiteFeatures[i];
        }
        return trailCircuit ? campsiteFeatures[campsiteFeatures.length - 1] : undefined;
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
    } else if (trailCircuit && !this.isPositiveDirection && this.route[dayIndex].start.properties.distance < this.route[dayIndex].end.properties.distance) { //dest wraps around start of trail CCW
        this.route[dayIndex].length = this.route[dayIndex].start.properties.distance + (trailLength - this.route[dayIndex].end.properties.distance);
    } else {
        this.route[dayIndex].length = Math.round(Math.abs(this.route[dayIndex].start.properties.distance - this.route[dayIndex].end.properties.distance) * 10) / 10;
    }

    this.route[dayIndex].prev_site = trailCircuit && this.route[dayIndex].end == campsiteFeatures[0] ? campsiteFeatures[campsiteFeatures.length - 1] : campsiteFeatures[this.route[dayIndex].end.properties.index - 1];
    this.route[dayIndex].next_site = trailCircuit && this.route[dayIndex].end == campsiteFeatures[campsiteFeatures.length - 1] ? this.route[dayIndex].next_site = campsiteFeatures[0] : campsiteFeatures[this.route[dayIndex].end.properties.index + 1];
    this.route[dayIndex + 1].start = this.route[dayIndex].end;

    if (trailCircuit && this.isPositiveDirection && this.route[dayIndex + 1].start.properties.distance > this.route[dayIndex + 1].end.properties.distance) { //next day dest wraps around start of trail CW
        this.route[dayIndex + 1].length = (trailLength - this.route[dayIndex + 1].start.properties.distance) + this.route[dayIndex + 1].end.properties.distance;
    } else if (trailCircuit && !this.isPositiveDirection && this.route[dayIndex + 1].start.properties.distance < this.route[dayIndex + 1].end.properties.distance) { //next day dest wraps around start of trail CCW
        this.route[dayIndex + 1].length = this.route[dayIndex + 1].start.properties.distance + (trailLength - this.route[dayIndex + 1].end.properties.distance);
    } else {
        this.route[dayIndex + 1].length = Math.round(Math.abs(this.route[dayIndex + 1].start.properties.distance - this.route[dayIndex + 1].end.properties.distance) * 10) / 10;
    }
    displayRoute(this.route);
}

function onDistancePerDayChange() {
    if ((inputDays.value == "" || inputDays.value == 0) && (inputDistance.value == 0 || inputDistance.value == "")) {
        inputDistance.placeholder = trailUnit === 'mi' ? "10-20 Mile Range" : "16-32 Km Range";
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
        //inputDays.placeholder = trailUnit === 'mi' ? "Using Miles / Day" : "Using Km / Day";
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
        inputDays.value = trailUnit === 'km' ? Math.max(1, Math.round(length / 16.0934)) : Math.max(1, Math.round(length / 10));
    }

}

function displayRoute(route) {
    let totalMiles = 0;
    tableBody.innerHTML = '';
    for (let i = 0; i < route.length; i++) {
        totalMiles += route[i].length;
        let row = tableBody.insertRow(i);
        let cell1 = row.insertCell(0);
        let cell2 = row.insertCell(1);
        let cell3 = row.insertCell(2);
        let cell4 = row.insertCell(3);
        let cell5 = row.insertCell(4);
        cell5.classList.add("right", "blue");
        let cell6 = row.insertCell(5);
        cell6.classList.add("right");
        let cell7 = row.insertCell(6);
        let cell8 = row.insertCell(7);
        cell1.innerHTML = '<strong>' + (i + 1) + '</strong>';
        cell2.innerHTML = route[i].date.toLocaleDateString('en-us', { weekday:"short", year:"2-digit", month:"numeric", day:"numeric"});
        cell3.innerHTML = i == 0 ? '<u>' + route[i].start.properties.title + '</u>' : route[i].start.properties.title;
        cell4.innerHTML = i == route.length - 1 ? '<u>' + route[i].end.properties.title + '</u>' : route[i].end.properties.title;
        cell5.innerHTML = '<strong>' + route[i].length.toFixed(1) + ' ' + trailUnit + '</strong>';
        cell6.innerHTML = totalMiles.toFixed(1) + ' ' + trailUnit;
        cell7.innerHTML = closerCampBtn(route[i], route);
        cell8.innerHTML = furtherCampBtn(route[i], route);
    }
    table.style.marginTop = '20px';
    table.style.visibility = 'visible';
    shareRoute.disabled = false;
    exportRoute.disabled = false;
    shareRoute.scrollIntoView({behavior: 'smooth'});

    updateGeoJSON();

    console.log(route);
}


// Display the closer camp option as long as it does not compromise the direction of the route (i.e. change daily mileage < 0)
function closerCampBtn(day, route) {
    if (trailLength === 1 || day === route[route.length - 1] || day.length === 0 || (day.prev_site === undefined && day.next_site === undefined) || (!trailCircuit && this.isPositiveDirection && day.prev_site === undefined) || (!trailCircuit && !this.isPositiveDirection && day.next_site === undefined)) return '<button class="changeCampBtn btn btn-xs btn-secondary" disabled>Unavailable<br>&nbsp;</button>';
    
    let mileDif = 0;
    if (trailCircuit && this.isPositiveDirection && day.prev_site.properties.distance > day.end.properties.distance) mileDif = ((trailLength - day.prev_site.properties.distance) + day.end.properties.distance);
    else if (trailCircuit && !this.isPositiveDirection && day.next_site.properties.distance < day.end.properties.distance) mileDif = (day.next_site.properties.distance + (trailLength - day.end.properties.distance));
    else mileDif = (this.isPositiveDirection) ? Math.abs(day.end.properties.distance - day.prev_site.properties.distance) : Math.abs(day.end.properties.distance - day.next_site.properties.distance);

    if (day === route[0] && day.length - mileDif < 0) return '<button class="changeCampBtn btn btn-xs btn-secondary" disabled>Unavailable<br>&nbsp;</button>';
    if (this.isPositiveDirection) return '<button class="changeCampBtn btn btn-xs btn-success" onclick="changeCamp(' + route.indexOf(day) + ', false)" value="">' + day.prev_site.properties.title + '</br>-' + mileDif.toFixed(1) + ' ' + trailUnit + '</button>';
    return '<button class="changeCampBtn btn btn-xs btn-success" onclick="changeCamp(' + route.indexOf(day) + ', true)" value="">' + day.next_site.properties.title + '</br>-' + mileDif.toFixed(1) + ' ' + trailUnit + '</button>';    
}

// Display the further camp option as long as it does not compromise the direction of the route (i.e. change next daily mileage < 0)
function furtherCampBtn(day, route) {
    const nextDay = route[route.indexOf(day) + 1];
    if (trailLength === 1 || day === route[route.length - 1] || nextDay.length === 0 || (this.isPositiveDirection && day.next_site === undefined) || (!this.isPositiveDirection && day.prev_site === undefined)) return '<button class="changeCampBtn btn btn-xs btn-secondary" disabled>Unavailable<br>&nbsp;</button>';
    
    let mileDif = 0;
    if (trailCircuit && this.isPositiveDirection && day.next_site.properties.distance < day.end.properties.distance) mileDif = (day.next_site.properties.distance + (trailLength - day.end.properties.distance));
    else if (trailCircuit && !this.isPositiveDirection && day.prev_site.properties.distance > day.end.properties.distance) mileDif = (day.end.properties.distance + (trailLength - day.prev_site.properties.distance));
    else mileDif = (this.isPositiveDirection) ? Math.abs(day.end.properties.distance - day.next_site.properties.distance) : Math.abs(day.end.properties.distance - day.prev_site.properties.distance);
    
    if ((day === route[route.length - 2] && nextDay.length - mileDif < 0)) return '<button class="changeCampBtn btn btn-xs btn-secondary" disabled>Unavailable<br>&nbsp;</button>';
    if (this.isPositiveDirection) return '<button class="changeCampBtn btn btn-xs btn-danger" onclick="changeCamp(' + route.indexOf(day) + ', true)" value="">' + day.next_site.properties.title + '</br>+' + mileDif.toFixed(1) + ' ' + trailUnit + '</button>';
    return '<button class="changeCampBtn btn btn-xs btn-danger" onclick="changeCamp(' + route.indexOf(day) + ', false)" value="">' + day.prev_site.properties.title+'</br>+' + mileDif.toFixed(1) +' ' + trailUnit + '</button>';
}

function reset() {
    removeOptions(selectStart);
    removeOptions(selectEnd);
    console.log(trailheadFeatures);
    for (let i = 0; i < trailheadFeatures.length; i++) {
        addOption(selectStart, trailheadFeatures[i].properties.title.replace(" Trailhead", ""), i+1);
        addOption(selectEnd, trailheadFeatures[i].properties.title.replace(" Trailhead", ""), i+1);
    }
    tableBody.innerHTML = '';
    selectStart.value = 1;
    selectEnd.value = trailCircuit ? 1 : selectEnd.length - 1;
    inputDate.valueAsDate = new Date();
    title.innerHTML = trailName;
    inputDays.value = trailUnit === 'km' ? Math.max(1, Math.round(trailLength / 16.0934)) : Math.max(1, Math.round(trailLength / 10));
    inputDistance.value = "";
    inputDistance.placeholder = "N/A";
    inputShortHikeIn.checked = false;
    inputShortHikeOut.checked = false;
    inputCW.disabled = trailCircuit ? false : true;
    inputCCW.disabled = trailCircuit ? false : true;
    inputCW.checked = trailCircuit ? true : false;
    inputCCW.checked = false;
    if (trailUnit === 'km') inputKm.click();
    else inputMi.click();
    setUnitLabels(trailUnit);
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
    resetMap();
    window.scrollTo(0, 0);
}

function removeOptions(element) {
    for (let i = element.options.length - 1; i > 0; i--) {
       element.remove(i);
    }
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
    if (trailUnit != unit) {
        console.log('Switching unit from ' + trailUnit + ' to ' + unit);
        trailUnit = unit;
        trailLength = unit === 'km' ? Math.round(trailLength * 1.609344 * 10) / 10 : Math.round(trailLength * 0.6213711922 * 10) / 10;
        setUnitLabels(unit);
        if (inputDays.value == 0 || inputDays.value == '') onDaysChange(); // update labels on days and distance / day inputs
        if (inputDistance.value != 0 && inputDistance.value != '') inputDistance.value = unit === 'km' ? Math.round(inputDistance.value * 1.609344) : Math.round(inputDistance.value * 0.6213711922);
        for (trailhead of trailheadFeatures) {
            trailhead.properties.distance = unit === 'km' ? Math.round(trailhead.properties.distance * 1.609344 * 10) / 10 : Math.round(trailhead.properties.distance * 0.6213711922 * 10) / 10;
        }
        for (campsite of campsiteFeatures) {
            campsite.properties.distance = unit === 'km' ? Math.round(campsite.properties.distance * 1.609344 * 10) / 10 : Math.round(campsite.properties.distance * 0.6213711922 * 10) / 10;
        }
        if (this.route != undefined && this.route.length > 0) {
            for (day of this.route) {
                day.length = unit === 'km' ? Math.round(day.length * 1.609344 * 10) / 10 : Math.round(day.length * 0.6213711922 * 10) / 10;
            }
            displayRoute(this.route);
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