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
const tableBody = document.getElementById('table-body');
const unitLabel1 = document.getElementById('unit1');
const unitLabel2 = document.getElementById('unit2');
const unitLabel3 = document.getElementById('unit3');
const loopDirectionLabel = document.getElementsByClassName('loop-direction-label');

reset();
appendPos();

function plan() {
    if (validateForm()) {
        const startDate = new Date(inputDate.value + 'T00:00');
        const days = getDays();
        const distancePerDay = getDistancePerDay();
        const distance = getDistance(days, distancePerDay);
        const startTrailhead = selectStart.value == 0 ? selectStartTrailhead(trail.trailheads[selectEnd.value - 1], distance) : trail.trailheads[selectStart.value - 1];
        const endTrailhead = selectEnd.value == 0 ? selectEndTrailhead(startTrailhead, distance) : trail.trailheads[selectEnd.value - 1];
        this.isPositiveDirection = getDirection(startTrailhead, endTrailhead);
        const route = generateRoute(startTrailhead, endTrailhead, days, startDate, inputShortHikeIn.checked, inputShortHikeOut.checked);
        this.route = route;
        displayRoute(route);
    }
}

function validateForm() {
    if (inputDays.value != '' && (inputDays.value < 0 || inputDays.value > 99)) return false;
    if (inputDistance.value != '' && (inputDistance.value < 0 || inputDistance.value > 99)) return false;
    if (selectStart.value < 0 || selectStart.value > trail.trailheads.length + 1) return false;
    if (selectEnd.value < 0 || selectEnd.value > trail.trailheads.length + 1) return false;
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
            this.isPositiveDirection = getDirection(trail.trailheads[selectStart.value - 1], trail.trailheads[selectEnd.value - 1]);
            const totalDistance = (trail.circuit && selectStart.value == selectEnd.value) ? trail.length : getDistanceBetween(trail.trailheads[selectStart.value - 1].distance, trail.trailheads[selectEnd.value - 1].distance);
            const distancePerDay = getDistancePerDay();
            days = totalDistance / distancePerDay < trail.campsites.length ? Math.round(totalDistance / distancePerDay) : trail.campsites.length;
        } else if (inputDistance.value > 0) {
            if (trail.circuit) {
                days = Math.round(trail.length / inputDistance.value); // if start or end are not set, route length will always be full length so days must always be trail length / miles/days
            } else if (selectStart.value != 0) {
                days = Math.floor(Math.random() * (Math.round(Math.max(Math.abs(trail.length - trail.trailheads[selectStart.value - 1].distance), Math.abs(0 - trail.trailheads[selectStart.value - 1].distance)) / inputDistance.value)) + 1); // min = 1, max = longest possible distance in either direction / miles per day
            } else if (selectEnd.value != 0) {
                days = Math.floor(Math.random() * (Math.round(Math.max(Math.abs(trail.length - trail.trailheads[selectEnd.value - 1].distance), Math.abs(0 - trail.trailheads[selectEnd.value - 1].distance)) / inputDistance.value)) + 1); // min = 1, max = longest possible distance in either direction / miles per day
            } else {
                days = Math.floor(Math.random() * (Math.round(trail.length / inputDistance.value)) + 1); // min = 1, max = trail length / miles per day
            }
        }
        if (inputShortHikeIn.checked) days++; // add an additional day for short days so route gen will make the remaining days closer to the input value
        if (inputShortHikeOut.checked) days++;
        return Math.max(1, days);
    }
    return Math.floor(Math.random() * (Math.ceil(trail.campsites.length / 2)) + 2); // min = 2, max = (# campsites / 2) + 2
}

function getDistancePerDay() {
    if (inputDistance.value > 0) return inputDistance.value;
    return trail.unit === 'km' ? Math.floor(Math.random() * (32 - 16 + 1) ) + 16 : Math.floor(Math.random() * (20 - 10 + 1) ) + 10; // min = 10, max = 20 for miles and min = 16, max = 32 for km
}

// Calculate distance given days and distance per day. Returned value is only used when trailheads are not set
function getDistance(days, distancePerDay) {
    if (selectStart.value != 0 && selectEnd.value != 0) return getDistanceBetween(trail.trailheads[selectStart.value - 1].distance, trail.trailheads[selectEnd.value - 1].distance);
    return !inputShortHikeIn.checked ? distancePerDay * days : (distancePerDay * days) - Math.round(distancePerDay / 2);
}

// If start trailhead is not provided, determine a reasonable start
function selectStartTrailhead(endTrailhead, length) {
    if (endTrailhead === undefined) {
        if (trail.circuit || length <= trail.length / 2) {
            return trail.trailheads[Math.floor(Math.random() * trail.trailheads.length)];
        } else {
            let validTrailheads = [];
            for (let i = 0; i < trail.trailheads.length; i++) {
                if (trail.trailheads[i].distance <= (trail.length - length) || trail.trailheads[i].distance >= length) {
                    validTrailheads.push(i);
                }
            }
            if (validTrailheads.length === 0) return trail.trailheads[Math.floor(Math.random() * 2) * (trail.trailheads.length - 1)];
            const r = Math.floor(Math.random() * validTrailheads.length);
            return trail.trailheads[validTrailheads[r]];
        }
    } else {
        if (trail.circuit) return endTrailhead; //prioritize full loops for route generation
        const startCandidate1 = getNearestTrailhead(endTrailhead.distance + length);
        const startCandidate2 = getNearestTrailhead(endTrailhead.distance - length);
        if ((endTrailhead.distance + length) > trail.length && (endTrailhead.distance - length) < 0) {
            return Math.abs(endTrailhead.distance - startCandidate1.distance) > Math.abs(endTrailhead.distance - startCandidate2.distance) ? startCandidate1 : startCandidate2;
        } else if ((endTrailhead.distance + length) > trail.length) {
            return startCandidate2;
        } else if ((endTrailhead.distance - length) < 0) {
            return startCandidate1;
        }
        //return Math.abs(startCandidate1.distance - length) < Math.abs(startCandidate2.distance - length) ? startCandidate1 : startCandidate2;
        return Math.floor(Math.random() * 2) === 0 ? startCandidate1 : startCandidate2;
    }
}

// If end trailhead is not provided, determine a reasonable end
function selectEndTrailhead(startTrailhead, length) {
    if (trail.circuit) return startTrailhead; //prioritize full loops for route generation
    const endCandidate1 = getNearestTrailhead(startTrailhead.distance + length);
    const endCandidate2 = getNearestTrailhead(startTrailhead.distance - length);
    if ((startTrailhead.distance + length) > trail.length && (startTrailhead.distance - length) < 0) {
        return Math.abs(startTrailhead.distance - endCandidate1.distance) > Math.abs(startTrailhead.distance - endCandidate2.distance) ? endCandidate1 : endCandidate2;
    } else if ((startTrailhead.distance + length) > trail.length) {
        return endCandidate2;
    } else if ((startTrailhead.distance - length) < 0) {
        return endCandidate1;
    }
    //return Math.abs(endCandidate1.distance - length) < Math.abs(endCandidate2.distance - length) ? endCandidate1 : endCandidate2;
    return Math.floor(Math.random() * 2) === 0 ? endCandidate1 : endCandidate2;
}

function generateRoute(start, end, days, startDate, shortHikeIn, shortHikeOut) {
    console.log('Generating ' + days + ' day trip from ' + start.name + ' to ' + end.name);
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
    const end = getNextCampsiteFromTrailhead(start.distance, this.isPositiveDirection);
    return {
        start: start,
        date: startDate,
        end: end,
        length: getDistanceBetween(start.distance, end.distance),
        prev_site: getPrevCampsite(end),
        next_site: getNextCampsite(end)
    }
}

function generateShortHikeOut(end, startDate) {
    const start = getNextCampsiteFromTrailhead(end.distance, !this.isPositiveDirection);
    return {
        start: start,
        date: startDate,
        end: end,
        length: getDistanceBetween(start.distance, end.distance),
        prev_site: undefined,
        next_site: undefined
    }
}

// Given a campsite, return the previous campsite in the list. Regardless of route direction, prev_site will always be the site in the list before the given site
function getPrevCampsite(campsite) {
    if (campsite.pos === undefined) return undefined;
    if (trail.circuit && campsite == trail.campsites[0]) return trail.campsites[trail.campsites.length - 1];
    return trail.campsites[campsite.pos - 1] === undefined ? undefined : trail.campsites[campsite.pos - 1];
}

// Given a campsite, return the next campsite in the list. Regardless of route direction, next_site will always be the site in the list after the given site
function getNextCampsite(campsite) {
    if (campsite.pos === undefined) return undefined;
    if (trail.circuit && campsite == trail.campsites[trail.campsites.length - 1]) return trail.campsites[0];
    return trail.campsites[campsite.pos + 1] === undefined ? undefined : trail.campsites[campsite.pos + 1];
}

// Return list of all campsites between a start and end distance (includes wrapping around a circuit)
function getAllCampsites(startDistance, endDistance) {
    let campsites = [];
    if (this.isPositiveDirection) {
        for (let i = 0; i < trail.campsites.length; i++) {
            if ((startDistance >= endDistance && (trail.campsites[i].distance > startDistance || trail.campsites[i].distance < endDistance)) || (startDistance < endDistance && (trail.campsites[i].distance > startDistance && trail.campsites[i].distance < endDistance))) campsites.push(trail.campsites[i]);
        }
        while (startDistance < trail.campsites[trail.campsites.length - 1].distance && campsites[0].distance < startDistance) campsites.push(campsites.shift());
    } else {
        for (let i = trail.campsites.length - 1; i >= 0; i--) {
            if ((startDistance <= endDistance && (trail.campsites[i].distance < startDistance || trail.campsites[i].distance > endDistance)) || (startDistance > endDistance && (trail.campsites[i].distance < startDistance && trail.campsites[i].distance > endDistance))) campsites.push(trail.campsites[i]);
        }
        while (startDistance > trail.campsites[0].distance && campsites[0].distance > startDistance) campsites.push(campsites.shift());
    }
    return campsites;
}

// Calculate distance between start and end (includes wrapping around a circuit)
function getDistanceBetween(startDistance, endDistance) {
    if (startDistance === endDistance) return 0;
    if (trail.circuit && this.isPositiveDirection && startDistance > endDistance) return Math.round((trail.length - startDistance + endDistance) * 10) / 10;
    if (trail.circuit && !this.isPositiveDirection && startDistance < endDistance) return Math.round((trail.length - endDistance + startDistance) * 10) / 10;
    return Math.round(Math.abs(startDistance - endDistance) * 10) / 10;
}

// Determine positive or negative direction
function getDirection(start, end) {
    return (trail.circuit && inputCW.checked) || (!trail.circuit && start.distance < end.distance) ? true : false;
}

// Generate a subset of all possible campsite combinations as routes, select the route with the lowest variance in daily mileage
function calculateRoute(start, end, days, startDate) {
    let allPossibleCampsites = getAllCampsites(start.distance, end.distance);
    if (allPossibleCampsites.length < days) {
        console.info('Number of days is greater than or equal to the number of available campsites between start and end points');
        return buildRoute(start, end, allPossibleCampsites, days, startDate);
    }
    const groupedCampsites = subset(allPossibleCampsites, days - 1);
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
    console.log("Analyzed " + routes.length + " different candidates to find the optimal route with a daily mileage standard deviation of " + lowestSD);
    return bestRoute;
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
        route[j].length = (days == 1 && trail.circuit && route[j].start === route[j].end) ? trail.length : getDistanceBetween(route[j].start.distance, route[j].end.distance);
    }
    return route;
}

// Given distance number, return the nearest campsite in the direction of the route
function getNextCampsiteFromTrailhead(distance, isPositiveDirection) {
    if (distance < 0 || distance > trail.length) return undefined;
    if (isPositiveDirection) {
        for (let i = 0; i < trail.campsites.length; i++) {
            if (trail.campsites[i].distance > distance) return trail.campsites[i];
        }
        return trail.circuit ? trail.campsites[0] : undefined;
    } else {
        for (let i = trail.campsites.length - 1; i >= 0; i--) {
            if (trail.campsites[i].distance < distance) return trail.campsites[i];
        }
        return trail.circuit ? trail.campsites[trail.campsites.length - 1] : undefined;
    }
}

// Given distance number, return the nearest trailhead in either direction
function getNearestTrailhead(distance) {
    if (!trail.circuit && distance < 0) return trail.trailheads[0];
    else if (trail.circuit && distance < 0) distance = trail.length - distance;
    if (!trail.circuit && distance > trail.length) return trail.trailheads[trail.trailheads.length - 1];
    else if (trail.circuit && distance > trail.length) distance = distance - trail.length;
    for (let i = 0; i < trail.trailheads.length; i++) {
        if (trail.trailheads[i].distance > distance) {
            if (i == 0) return trail.trailheads[0];
            return Math.abs(distance - trail.trailheads[i].distance) < Math.abs(distance - trail.trailheads[i - 1].distance) ? trail.trailheads[i] : trail.trailheads[i - 1];
        }
    }
    return trail.trailheads[trail.trailheads.length - 1];
}

// Change destination and recalculate length, next_site, and prev_site, as well as the next day's start and length
function changeCamp(dayIndex, isNext) {
    this.route[dayIndex].end = isNext ? this.route[dayIndex].next_site : this.route[dayIndex].prev_site;

    if (trail.circuit && this.isPositiveDirection && this.route[dayIndex].start.distance > this.route[dayIndex].end.distance) { //dest wraps around start of trail CW
        this.route[dayIndex].length = (trail.length - this.route[dayIndex].start.distance) + this.route[dayIndex].end.distance;
    } else if (trail.circuit && !this.isPositiveDirection && this.route[dayIndex].start.distance < this.route[dayIndex].end.distance) { //dest wraps around start of trail CCW
        this.route[dayIndex].length = this.route[dayIndex].start.distance + (trail.length - this.route[dayIndex].end.distance);
    } else {
        this.route[dayIndex].length = Math.round(Math.abs(this.route[dayIndex].start.distance - this.route[dayIndex].end.distance) * 10) / 10;
    }

    this.route[dayIndex].prev_site = trail.circuit && this.route[dayIndex].end == trail.campsites[0] ? trail.campsites[trail.campsites.length - 1] : trail.campsites[this.route[dayIndex].end.pos - 1];
    this.route[dayIndex].next_site = trail.circuit && this.route[dayIndex].end == trail.campsites[trail.campsites.length - 1] ? this.route[dayIndex].next_site = trail.campsites[0] : trail.campsites[this.route[dayIndex].end.pos + 1];
    this.route[dayIndex + 1].start = this.route[dayIndex].end;

    if (trail.circuit && this.isPositiveDirection && this.route[dayIndex + 1].start.distance > this.route[dayIndex + 1].end.distance) { //next day dest wraps around start of trail CW
        this.route[dayIndex + 1].length = (trail.length - this.route[dayIndex + 1].start.distance) + this.route[dayIndex + 1].end.distance;
    } else if (trail.circuit && !this.isPositiveDirection && this.route[dayIndex + 1].start.distance < this.route[dayIndex + 1].end.distance) { //next day dest wraps around start of trail CCW
        this.route[dayIndex + 1].length = this.route[dayIndex + 1].start.distance + (trail.length - this.route[dayIndex + 1].end.distance);
    } else {
        this.route[dayIndex + 1].length = Math.round(Math.abs(this.route[dayIndex + 1].start.distance - this.route[dayIndex + 1].end.distance) * 10) / 10;
    }
    displayRoute(this.route);
}

function onMilesPerDayChange() {
    if ((inputDays.value == "" || inputDays.value == 0) && (inputDistance.value == 0 || inputDistance.value == "")) {
        inputDistance.placeholder = trail.unit === 'mi' ? "Using 10-20 Mile Range" : "Using 16-32 Km Range";
        inputDistance.value = "";
    } 
    else if (inputDistance.value == 0 || inputDistance.value == "") {
        inputDistance.placeholder = "Using Days";
        inputDistance.value = "";
    } else {
        inputDistance.placeholder = "";
        if (selectStart.value != 0 && selectEnd.value != 0) {
            inputDays.placeholder = trail.unit === 'mi' ? "Using Miles / Day" : "Using Km / Day";
            inputDays.value = "";
        }
    }
}

function onDaysChange() {
    this.userSetDays = true;
    if (inputDays.value == 0 || inputDays.value == "") {
        inputDays.placeholder = trail.unit === 'mi' ? "Using Miles / Day" : "Using Km / Day";
        inputDays.value = "";
    } else {
        inputDays.placeholder = "";
        if (selectStart.value != 0 && selectEnd.value != 0) {
            inputDistance.placeholder = "Using Days";
            inputDistance.value = "";
        }
    }
    onMilesPerDayChange();
}

function onTrailheadsChange() {
    if (selectStart.value != 0 && selectEnd.value != 0 && (inputDays.value != "" || inputDays.value != 0) && (inputDistance.value != "" || inputDistance.value != 0)) {
        inputDistance.placeholder = "Using Days";
        inputDistance.value = "";
    } 
    // If days has not been set by the user, determine a reasonable number based on distance between trailheads
    if (!this.userSetDays && selectStart.value != 0 && selectEnd.value != 0) {
        this.isPositiveDirection = getDirection(trail.trailheads[selectStart.value - 1], trail.trailheads[selectEnd.value - 1]);
        const length = (trail.circuit && selectStart.value == selectEnd.value) ? trail.length : getDistanceBetween(trail.trailheads[selectStart.value - 1].distance, trail.trailheads[selectEnd.value - 1].distance);
        inputDays.value = trail.unit === 'km' ? Math.max(1, Math.round(length / 16.0934)) : Math.max(1, Math.round(length / 10));
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
        cell3.innerHTML = i == 0 ? '<u>' + route[i].start.name + '</u>' : route[i].start.name;
        cell4.innerHTML = i == route.length - 1 ? '<u>' + route[i].end.name + '</u>' : route[i].end.name;
        cell5.innerHTML = '<strong>' + route[i].length.toFixed(1) + ' ' + trail.unit + '</strong>';
        cell6.innerHTML = totalMiles.toFixed(1) + ' ' + trail.unit;
        cell7.innerHTML = closerCampBtn(route[i], route);
        cell8.innerHTML = furtherCampBtn(route[i], route);
    }
    table.style.visibility = 'visible';
    table.scrollIntoView({behavior: 'smooth'});
    console.log(route);
}

// Display the closer camp option as long as it does not compromise the direction of the route (i.e. change daily mileage < 0)
function closerCampBtn(day, route) {
    if (trail.length === 1 || day === route[route.length - 1] || day.length === 0 || (day.prev_site === undefined && day.next_site === undefined) || (!trail.circuit && this.isPositiveDirection && day.prev_site === undefined) || (!trail.circuit && !this.isPositiveDirection && day.next_site === undefined)) return '<button class="changeCampBtn btn btn-xs btn-secondary" disabled>Unavailable<br>&nbsp;</button>';
    
    let mileDif = 0;
    if (trail.circuit && this.isPositiveDirection && day.prev_site.distance > day.end.distance) mileDif = ((trail.length - day.prev_site.distance) + day.end.distance);
    else if (trail.circuit && !this.isPositiveDirection && day.next_site.distance < day.end.distance) mileDif = (day.next_site.distance + (trail.length - day.end.distance));
    else mileDif = (this.isPositiveDirection) ? Math.abs(day.end.distance - day.prev_site.distance) : Math.abs(day.end.distance - day.next_site.distance);

    if (day === route[0] && day.length - mileDif < 0) return '<button class="changeCampBtn btn btn-xs btn-secondary" disabled>Unavailable<br>&nbsp;</button>';
    if (this.isPositiveDirection) return '<button class="changeCampBtn btn btn-xs btn-success" onclick="changeCamp(' + route.indexOf(day) + ', false)" value="">' + day.prev_site.name + '</br>-' + mileDif.toFixed(1) + ' ' + trail.unit + '</button>';
    return '<button class="changeCampBtn btn btn-xs btn-success" onclick="changeCamp(' + route.indexOf(day) + ', true)" value="">' + day.next_site.name + '</br>-' + mileDif.toFixed(1) + ' ' + trail.unit + '</button>';    
}

// Display the further camp option as long as it does not compromise the direction of the route (i.e. change next daily mileage < 0)
function furtherCampBtn(day, route) {
    const nextDay = route[route.indexOf(day) + 1];
    if (trail.length === 1 || day === route[route.length - 1] || nextDay.length === 0 || (this.isPositiveDirection && day.next_site === undefined) || (!this.isPositiveDirection && day.prev_site === undefined)) return '<button class="changeCampBtn btn btn-xs btn-secondary" disabled>Unavailable<br>&nbsp;</button>';
    
    let mileDif = 0;
    if (trail.circuit && this.isPositiveDirection && day.next_site.distance < day.end.distance) mileDif = (day.next_site.distance + (trail.length - day.end.distance));
    else if (trail.circuit && !this.isPositiveDirection && day.prev_site.distance > day.end.distance) mileDif = (day.end.distance + (trail.length - day.prev_site.distance));
    else mileDif = (this.isPositiveDirection) ? Math.abs(day.end.distance - day.next_site.distance) : Math.abs(day.end.distance - day.prev_site.distance);
    
    if ((day === route[route.length - 2] && nextDay.length - mileDif < 0)) return '<button class="changeCampBtn btn btn-xs btn-secondary" disabled>Unavailable<br>&nbsp;</button>';
    if (this.isPositiveDirection) return '<button class="changeCampBtn btn btn-xs btn-danger" onclick="changeCamp(' + route.indexOf(day) + ', true)" value="">' + day.next_site.name + '</br>+' + mileDif.toFixed(1) + ' ' + trail.unit + '</button>';
    return '<button class="changeCampBtn btn btn-xs btn-danger" onclick="changeCamp(' + route.indexOf(day) + ', false)" value="">' + day.prev_site.name+'</br>+' + mileDif.toFixed(1) +' ' + trail.unit + '</button>';
}

function reset() {
    removeOptions(selectStart);
    removeOptions(selectEnd);
    for (let i = 0; i < trail.trailheads.length; i++) {
        addOption(selectStart, trail.trailheads[i].name.replace(" Trailhead", ""), i+1);
        addOption(selectEnd, trail.trailheads[i].name.replace(" Trailhead", ""), i+1);
    }
    tableBody.innerHTML = '';
    selectStart.value = 1;
    selectEnd.value = trail.circuit ? 1 : selectEnd.length - 1;
    inputDate.valueAsDate = new Date();
    title.innerHTML = trail.name;
    inputDays.value = trail.unit === 'km' ? Math.round(trail.length / 16) : Math.round(trail.length / 10);
    inputDistance.value = "";
    inputDistance.placeholder = "Using Days";
    inputShortHikeIn.checked = false;
    inputShortHikeOut.checked = false;
    inputCW.disabled = trail.circuit ? false : true;
    inputCCW.disabled = trail.circuit ? false : true;
    inputCW.checked = trail.circuit ? true : false;
    inputCCW.checked = false;
    file.value = '';
    if (trail.unit === 'km') inputKm.click();
    else inputMi.click();
    setUnitLabels(trail.unit);
    this.userSetDays = false;
    if (!trail.circuit) for (element of loopDirectionLabel) element.classList.add('lightgray');
    if (trail.circuit) for (element of loopDirectionLabel) element.classList.remove('lightgray');
    table.style.visibility = 'hidden';
    title.scrollIntoView({behavior: 'smooth'});
}

function appendPos() {
    for (let i = 0; i < trail.campsites.length; i++) {
        trail.campsites[i].pos = i;
    }
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
    if (trail.unit != unit) {
        console.log('Switching unit from ' + trail.unit + ' to ' + unit);
        trail.unit = unit;
        trail.length = unit === 'km' ? Math.round(trail.length * 1.609344 * 10) / 10 : Math.round(trail.length * 0.6213711922 * 10) / 10;
        setUnitLabels(unit);
        if (inputDays.value == 0 || inputDays.value == '') onDaysChange(); // update labels on days and distance / day inputs
        for (trailhead of trail.trailheads) {
            trailhead.distance = unit === 'km' ? Math.round(trailhead.distance * 1.609344 * 10) / 10 : Math.round(trailhead.distance * 0.6213711922 * 10) / 10;
        }
        for (campsite of trail.campsites) {
            campsite.distance = unit === 'km' ? Math.round(campsite.distance * 1.609344 * 10) / 10 : Math.round(campsite.distance * 0.6213711922 * 10) / 10;
        }
        if (this.route != undefined) {
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