let route;
let isPositiveDirection;
const trail = {
    name: 'Laurel Highlands Hiking Trail',
    length: 70,
    circuit: false,
    trailheads: [
        {
            name: "Rt. 381 Trailhead",
            mile: 0.0
        },
        {
            name: "Rt. 653 Trailhead",
            mile: 18.9
        },
        {
            name: "Rt. 31 Trailhead",
            mile: 30.9
        },
        {
            name: "Rt. 30 Trailhead",
            mile: 45.6
        },
        {
            name: "Rt. 271 Trailhead",
            mile: 56.8
        },
        {
            name: "Rt. 56 Trailhead",
            mile: 70.0
        }
    ],
    campsites: [
        {
            name: "Ohiopyle Shelter Area",
            mile: 6.3
        },
        {   
            name: "Rt. 653 Shelter Area",
            mile: 18.5
        },
        {
            name: "Grindle Ridge Shelter Area",
            mile: 24.0
        },
        {
            name: "Rt. 31 Shelter Area",
            mile: 32.5
        },
        {
            name: "Turnpike Shelter Area",
            mile: 38.2
        },
        {
            name: "Rt. 30 Shelter Area",
            mile: 46.5
        },
        {
            name: "Rt. 271 Shelter Area",
            mile: 56.5
        },
        {
            name: "Rt. 56 Shelter Area",
            mile: 64.9
        }
    ]
}
// const trail = {
//     name: 'Wonderland Trail',
//     length: 84.7,
//     circuit: true,
//     trailheads: [
//         {
//             name: "Longmire Trailhead",
//             mile: 0.0
//         },
//         {
//             name: "Mowich Lake Trailhead",
//             mile: 31.5
//         },
//         {
//             name: "White River Trailhead",
//             mile: 55
//         }  
//     ],
//     campsites:[
//         {
//             name: "Pyramid Creek",
//             mile: 3.0
//         },
//         {
//             name: "Devil's Dream",
//             mile: 5.2
//         },
//         {
//             name: "South Puyallup River",
//             mile: 11.2
//         },
//         {
//             name: "Klapatche Park",
//             mile: 15.0
//         },
//         {
//             name: "North Puyallup River",
//             mile: 17.5
//         },
//         {
//             name: "Golden Lakes",
//             mile: 22.1
//         },
//         {
//             name: "South Mowich River",
//             mile: 27.9
//         },
//         {
//             name: "Mowich Lake Campground",
//             mile: 31.5
//         },
//         {
//             name: "Ipsut Creek Campground",
//             mile: 36.1
//         },
//         {
//             name: "Carbon River",
//             mile: 39.3
//         },
//         {
//             name: "Dick Creek",
//             mile: 40.5
//         },
//         {
//             name: "Mystic Camp",
//             mile: 43.9
//         },
//         {
//             name: "Granite Creek",
//             mile: 47.4
//         },
//         {
//             name: "Sunrise Camp",
//             mile: 51.7
//         },
//         {
//             name: "White River Campground",
//             mile: 55.0
//         },
//         {
//             name: "Summerland",
//             mile: 61.6
//         },
//         {
//             name: "Indian Bar",
//             mile: 65.8
//         },
//         {
//             name: "Nickle Creek",
//             mile: 72.0
//         },
//         {
//             name: "Maple Creek",
//             mile: 75.0
//         },
//         {
//             name: "Paradise River",
//             mile: 81.3
//         },
//         {
//             name: "Cougar Rock Campground",
//             mile: 83.4
//         }
//     ]
// }

// Select DOM elements
const selectStart = document.getElementById('start');
const selectEnd = document.getElementById('end');
const inputDays = document.getElementById('days');
const inputMiles = document.getElementById('miles');
const inputDate = document.getElementById('start-date');
const inputShortHikeIn = document.getElementById('hike-in');
const inputShortHikeOut = document.getElementById('hike-out');
const inputCW = document.getElementById('cw');
const inputCCW = document.getElementById('ccw');
const title = document.getElementById('title');
const table = document.getElementById('table');
const tableBody = document.getElementById('table-body');
const loopDirectionLabel = document.getElementsByClassName('loop-direction-label');
const loopDirectionCWLabel = document.getElementById('loop-direction-cw');
const loopDirectionCCWLabel = document.getElementById('loop-direction-ccw');


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
    if (inputMiles.value != '' && (inputMiles.value < 0 || inputMiles.value > 99)) return false;
    if (selectStart.value < 0 || selectStart.value > trail.trailheads.length + 1) return false;
    if (selectEnd.value < 0 || selectEnd.value > trail.trailheads.length + 1) return false;
    if (selectStart.value > 0 && selectEnd.value > 0 && inputDays.value > 0 && inputMiles.value > 0) return false; 
    return true;
}

// If days is not provided, determine a reasonable number of days
function getDays() {
    if (inputDays.value > 0) {
        return inputDays.value;
    } else if ((selectStart.value != 0 && selectEnd.value != 0) || inputMiles.value > 0) {
        let days;
        if (selectStart.value != 0 && selectEnd.value != 0) {
            this.isPositiveDirection = getDirection(trail.trailheads[selectStart.value - 1], trail.trailheads[selectEnd.value - 1]);
            const totalDistance = (trail.circuit && selectStart.value == selectEnd.value) ? trail.length : getMiles(trail.trailheads[selectStart.value - 1].mile, trail.trailheads[selectEnd.value - 1].mile);
            const distancePerDay = getDistancePerDay();
            days = totalDistance / distancePerDay < trail.campsites.length ? Math.round(totalDistance / distancePerDay) : trail.campsites.length;
        } else if (inputMiles.value > 0) {
            if (!trail.circuit && selectStart.value != 0) {
                days = Math.floor(Math.random() * (Math.round(Math.max(Math.abs(trail.length - trail.trailheads[selectStart.value - 1].mile), Math.abs(0 - trail.trailheads[selectStart.value - 1].mile)) / inputMiles.value)) + 1); // min = 1, max = longest possible distance in either direction / miles per day
            } else if (!trail.circuit && selectEnd.value != 0) {
                days = Math.floor(Math.random() * (Math.round(Math.max(Math.abs(trail.length - trail.trailheads[selectEnd.value - 1].mile), Math.abs(0 - trail.trailheads[selectEnd.value - 1].mile)) / inputMiles.value)) + 1); // min = 1, max = longest possible distance in either direction / miles per day
            } else {
                days = Math.floor(Math.random() * (Math.round(trail.length / inputMiles.value)) + 1); // min = 1, max = trail length / miles per day
            }
        }
        if (days <= 0 || inputShortHikeIn.checked) days++;
        return days;
    }
    return Math.floor(Math.random() * (Math.ceil(trail.campsites.length / 2)) + 2); // min = 2, max = (# campsites / 2) + 2
}

function getDistancePerDay() {
    return inputMiles.value > 0 ? inputMiles.value : Math.floor(Math.random() * 11 + 10); // min = 10, max = 20
}

// Calculate distance given days and distance per day. Returned value is only used when trailheads are not set
function getDistance(days, distancePerDay) {
    if (selectStart.value != 0 && selectEnd.value != 0) return getMiles(trail.trailheads[selectStart.value - 1].mile, trail.trailheads[selectEnd.value - 1].mile);
    return !inputShortHikeIn.checked ? distancePerDay * days : (distancePerDay * days) - Math.round(distancePerDay / 2);
}

// If start trailhead is not provided, determine a reasonable start
function selectStartTrailhead(endTrailhead, miles) {
    if (endTrailhead === undefined) {
        if (trail.circuit || miles <= trail.length / 2) {
            return trail.trailheads[Math.floor(Math.random() * trail.trailheads.length)];
        } else {
            let validTrailheads = [];
            for (let i = 0; i < trail.trailheads.length; i++) {
                if (trail.trailheads[i].mile <= (trail.length - miles) || trail.trailheads[i].mile >= miles) {
                    validTrailheads.push(i);
                }
            }
            if (validTrailheads.length === 0) return trail.trailheads[Math.floor(Math.random() * 2) * (trail.trailheads.length - 1)];
            const r = Math.floor(Math.random() * validTrailheads.length);
            return trail.trailheads[validTrailheads[r]];
        }
    } else {
        if (trail.circuit) return endTrailhead; //prioritize full loops for route generation
        const startCandidate1 = getNearestTrailhead(endTrailhead.mile + miles);
        const startCandidate2 = getNearestTrailhead(endTrailhead.mile - miles);
        if ((endTrailhead.mile + miles) > trail.length && (endTrailhead.mile - miles) < 0) {
            return Math.abs(endTrailhead.mile - startCandidate1.mile) > Math.abs(endTrailhead.mile - startCandidate2.mile) ? startCandidate1 : startCandidate2;
        } else if ((endTrailhead.mile + miles) > trail.length) {
            return startCandidate2;
        } else if ((endTrailhead.mile - miles) < 0) {
            return startCandidate1;
        }
        //return Math.abs(startCandidate1.mile - miles) < Math.abs(startCandidate2.mile - miles) ? startCandidate1 : startCandidate2;
        return Math.floor(Math.random() * 2) === 0 ? startCandidate1 : startCandidate2;
    }
}

// If end trailhead is not provided, determine a reasonable end
function selectEndTrailhead(startTrailhead, miles) {
    if (trail.circuit) return startTrailhead; //prioritize full loops for route generation
    const endCandidate1 = getNearestTrailhead(startTrailhead.mile + miles);
    const endCandidate2 = getNearestTrailhead(startTrailhead.mile - miles);
    if ((startTrailhead.mile + miles) > trail.length && (startTrailhead.mile - miles) < 0) {
        return Math.abs(startTrailhead.mile - endCandidate1.mile) > Math.abs(startTrailhead.mile - endCandidate2.mile) ? endCandidate1 : endCandidate2;
    } else if ((startTrailhead.mile + miles) > trail.length) {
        return endCandidate2;
    } else if ((startTrailhead.mile - miles) < 0) {
        return endCandidate1;
    }
    //return Math.abs(endCandidate1.mile - miles) < Math.abs(endCandidate2.mile - miles) ? endCandidate1 : endCandidate2;
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
    const end = getNextCampsiteFromTrailhead(start.mile, this.isPositiveDirection);
    return {
        start: start,
        date: startDate,
        end: end,
        miles: getMiles(start.mile, end.mile),
        prev_site: getPrevCampsite(end),
        next_site: getNextCampsite(end)
    }
}

function generateShortHikeOut(end, startDate) {
    const start = getNextCampsiteFromTrailhead(end.mile, !this.isPositiveDirection);
    return {
        start: start,
        date: startDate,
        end: end,
        miles: getMiles(start.mile, end.mile),
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

// Return list of all campsites between a start and end mile (includes wrapping around a circuit)
function getAllCampsites(startMile, endMile) {
    let campsites = [];
    if (this.isPositiveDirection) {
        for (let i = 0; i < trail.campsites.length; i++) {
            if ((startMile >= endMile && (trail.campsites[i].mile > startMile || trail.campsites[i].mile < endMile)) || (startMile < endMile && (trail.campsites[i].mile > startMile && trail.campsites[i].mile < endMile))) campsites.push(trail.campsites[i]);
        }
        while (startMile < trail.campsites[trail.campsites.length - 1].mile && campsites[0].mile < startMile) campsites.push(campsites.shift());
    } else {
        for (let i = trail.campsites.length - 1; i >= 0; i--) {
            if ((startMile <= endMile && (trail.campsites[i].mile < startMile || trail.campsites[i].mile > endMile)) || (startMile > endMile && (trail.campsites[i].mile < startMile && trail.campsites[i].mile > endMile))) campsites.push(trail.campsites[i]);
        }
        while (startMile > trail.campsites[0].mile && campsites[0].mile > startMile) campsites.push(campsites.shift());
    }
    return campsites;
}

// Calculate miles between start and end (includes wrapping around a circuit)
function getMiles(startMile, endMile) {
    if (startMile === endMile) return 0;
    if (trail.circuit && this.isPositiveDirection && startMile > endMile) return Math.round((trail.length - startMile + endMile) * 10) / 10;
    if (trail.circuit && !this.isPositiveDirection && startMile < endMile) return Math.round((trail.length - endMile + startMile) * 10) / 10;
    return Math.round(Math.abs(startMile - endMile) * 10) / 10;
}

// Determine positive or negative direction
function getDirection(start, end) {
    return (trail.circuit && inputCW.checked) || (!trail.circuit && start.mile < end.mile) ? true : false;
}

// Generate a subset of all possible campsite combinations as routes, select the route with the lowest variance in daily mileage
function calculateRoute(start, end, days, startDate) {
    let allPossibleCampsites = getAllCampsites(start.mile, end.mile);
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
        let sd = calculateSD(calculateVariance(Array.from(routes[i], x => x.miles)));
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
        route[j].miles = (days == 1 && trail.circuit && route[j].start === route[j].end) ? trail.length : getMiles(route[j].start.mile, route[j].end.mile);
    }
    return route;
}

// Given mile number, return the nearest campsite in the direction of the route
function getNextCampsiteFromTrailhead(mile, isPositiveDirection) {
    if (mile < 0 || mile > trail.length) return undefined;
    if (isPositiveDirection) {
        for (let i = 0; i < trail.campsites.length; i++) {
            if (trail.campsites[i].mile > mile) return trail.campsites[i];
        }
        return trail.circuit ? trail.campsites[0] : undefined;
    } else {
        for (let i = trail.campsites.length - 1; i >= 0; i--) {
            if (trail.campsites[i].mile < mile) return trail.campsites[i];
        }
        return trail.circuit ? trail.campsites[trail.campsites.length - 1] : undefined;
    }
}

// Given mile number, return the nearest trailhead in either direction
function getNearestTrailhead(mile) {
    if (!trail.circuit && mile < 0) return trail.trailheads[0];
    else if (trail.circuit && mile < 0) mile = trail.length - mile;
    if (!trail.circuit && mile > trail.length) return trail.trailheads[trail.trailheads.length - 1];
    else if (trail.circuit && mile > trail.length) mile = mile - trail.length;
    for (let i = 0; i < trail.trailheads.length; i++) {
        if (trail.trailheads[i].mile > mile) {
            if (i == 0) return trail.trailheads[0];
            return Math.abs(mile - trail.trailheads[i].mile) < Math.abs(mile - trail.trailheads[i - 1].mile) ? trail.trailheads[i] : trail.trailheads[i - 1];
        }
    }
    return trail.trailheads[trail.trailheads.length - 1];
}

// Change destination and recalculate miles, next_site, and prev_site, as well as the next day's start and miles
function changeCamp(dayIndex, isNext) {
    this.route[dayIndex].end = isNext ? this.route[dayIndex].next_site : this.route[dayIndex].prev_site;

    if (trail.circuit && this.isPositiveDirection && this.route[dayIndex].start.mile > this.route[dayIndex].end.mile) { //dest wraps around start of trail CW
        this.route[dayIndex].miles = (trail.length - this.route[dayIndex].start.mile) + this.route[dayIndex].end.mile;
    } else if (trail.circuit && !this.isPositiveDirection && this.route[dayIndex].start.mile < this.route[dayIndex].end.mile) { //dest wraps around start of trail CCW
        this.route[dayIndex].miles = this.route[dayIndex].start.mile + (trail.length - this.route[dayIndex].end.mile);
    } else {
        this.route[dayIndex].miles = Math.round(Math.abs(this.route[dayIndex].start.mile - this.route[dayIndex].end.mile) * 10) / 10;
    }

    this.route[dayIndex].prev_site = trail.circuit && this.route[dayIndex].end == trail.campsites[0] ? trail.campsites[trail.campsites.length - 1] : trail.campsites[this.route[dayIndex].end.pos - 1];
    this.route[dayIndex].next_site = trail.circuit && this.route[dayIndex].end == trail.campsites[trail.campsites.length - 1] ? this.route[dayIndex].next_site = trail.campsites[0] : trail.campsites[this.route[dayIndex].end.pos + 1];
    this.route[dayIndex + 1].start = this.route[dayIndex].end;

    if (trail.circuit && this.isPositiveDirection && this.route[dayIndex + 1].start.mile > this.route[dayIndex + 1].end.mile) { //next day dest wraps around start of trail CW
        this.route[dayIndex + 1].miles = (trail.length - this.route[dayIndex + 1].start.mile) + this.route[dayIndex + 1].end.mile;
    } else if (trail.circuit && !this.isPositiveDirection && this.route[dayIndex + 1].start.mile < this.route[dayIndex + 1].end.mile) { //next day dest wraps around start of trail CCW
        this.route[dayIndex + 1].miles = this.route[dayIndex + 1].start.mile + (trail.length - this.route[dayIndex + 1].end.mile);
    } else {
        this.route[dayIndex + 1].miles = Math.round(Math.abs(this.route[dayIndex + 1].start.mile - this.route[dayIndex + 1].end.mile) * 10) / 10;
    }
    displayRoute(this.route);
}

function onMilesPerDayChange() {
    if ((inputDays.value == "" || inputDays.value == 0) && (inputMiles.value == 0 || inputMiles.value == "")) {
        inputMiles.placeholder = "Using 10-20 Mile Range";
        inputMiles.value = "";
    } 
    else if (inputMiles.value == 0 || inputMiles.value == "") {
        inputMiles.placeholder = "Using Days";
        inputMiles.value = "";
    } else {
        inputMiles.placeholder = "";
        if (selectStart.value != 0 && selectEnd.value != 0) {
            inputDays.placeholder = "Using Miles / Day";
            inputDays.value = "";
        }
    }
}

function onDaysChange() {
    if (inputDays.value == 0 || inputDays.value == "") {
        inputDays.placeholder = "Using Miles / Day";
        inputDays.value = "";
    } else {
        inputDays.placeholder = "";
        if (selectStart.value != 0 && selectEnd.value != 0) {
            inputMiles.placeholder = "Using Days";
            inputMiles.value = "";
        }
    }
    onMilesPerDayChange();
}

function onTrailheadsChange() {
    if (selectStart.value != 0 && selectEnd.value != 0 && (inputDays.value != "" || inputDays.value != 0) && (inputMiles.value != "" || inputMiles.value != 0)) {
        inputMiles.placeholder = "Using Days";
        inputMiles.value = "";
    }
}

function displayRoute(route) {
    let totalMiles = 0;
    tableBody.innerHTML = '';
    for (let i = 0; i < route.length; i++) {
        totalMiles += route[i].miles;
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
        cell5.innerHTML = '<strong>' + route[i].miles.toFixed(1) + ' mi</strong>';
        cell6.innerHTML = totalMiles.toFixed(1) + ' mi';
        cell7.innerHTML = closerCampBtn(route[i], route);
        cell8.innerHTML = furtherCampBtn(route[i], route);
    }
    table.style.visibility = 'visible';
    table.scrollIntoView({behavior: 'smooth'});
    console.log(route);
}

// Display the closer camp option as long as it does not compromise the direction of the route (i.e. change daily mileage < 0)
function closerCampBtn(day, route) {
    if (trail.length === 1 || day === route[route.length - 1] || day.miles === 0 || (day.prev_site === undefined && day.next_site === undefined) || (!trail.circuit && this.isPositiveDirection && day.prev_site === undefined) || (!trail.circuit && !this.isPositiveDirection && day.next_site === undefined)) return '<button class="changeCampBtn btn btn-xs btn-secondary" disabled>Unavailable<br>&nbsp;</button>';
    
    let mileDif = 0;
    if (trail.circuit && this.isPositiveDirection && day.prev_site.mile > day.end.mile) mileDif = ((trail.length - day.prev_site.mile) + day.end.mile).toFixed(1);
    else if (trail.circuit && !this.isPositiveDirection && day.next_site.mile < day.end.mile) mileDif = (day.next_site.mile + (trail.length - day.end.mile)).toFixed(1);
    else mileDif = (this.isPositiveDirection) ? Math.abs(day.end.mile - day.prev_site.mile).toFixed(1) : Math.abs(day.end.mile - day.next_site.mile).toFixed(1);
    
    if (day === route[0] && day.miles - mileDif < 0) return '<button class="changeCampBtn btn btn-xs btn-secondary" disabled>Unavailable<br>&nbsp;</button>';
    if (this.isPositiveDirection) return '<button class="changeCampBtn btn btn-xs btn-success" onclick="changeCamp(' + route.indexOf(day) + ', false)" value="">'+day.prev_site.name+'</br>-'+mileDif+' miles</button>';
    return '<button class="changeCampBtn btn btn-xs btn-success" onclick="changeCamp(' + route.indexOf(day) + ', true)" value="">'+day.next_site.name+'</br>-'+mileDif+' miles</button>';    
}

// Display the further camp option as long as it does not compromise the direction of the route (i.e. change next daily mileage < 0)
function furtherCampBtn(day, route) {
    const nextDay = route[route.indexOf(day) + 1];
    if (trail.length === 1 || day === route[route.length - 1] || nextDay.miles === 0 || (this.isPositiveDirection && day.next_site === undefined) || (!this.isPositiveDirection && day.prev_site === undefined)) return '<button class="changeCampBtn btn btn-xs btn-secondary" disabled>Unavailable<br>&nbsp;</button>';
    
    let mileDif = 0;
    if (trail.circuit && this.isPositiveDirection && day.next_site.mile < day.end.mile) mileDif = (day.next_site.mile + (trail.length - day.end.mile)).toFixed(1);
    else if (trail.circuit && !this.isPositiveDirection && day.prev_site.mile > day.end.mile) mileDif = (day.end.mile + (trail.length - day.prev_site.mile)).toFixed(1);
    else mileDif = (this.isPositiveDirection) ? Math.abs(day.end.mile - day.next_site.mile).toFixed(1) : Math.abs(day.end.mile - day.prev_site.mile).toFixed(1);
    
    if ((day === route[route.length - 2] && nextDay.miles - mileDif < 0)) return '<button class="changeCampBtn btn btn-xs btn-secondary" disabled>Unavailable<br>&nbsp;</button>';
    if (this.isPositiveDirection) return '<button class="changeCampBtn btn btn-xs btn-danger" onclick="changeCamp(' + route.indexOf(day) + ', true)" value="">'+day.next_site.name+'</br>+'+mileDif+' miles</button>';
    return '<button class="changeCampBtn btn btn-xs btn-danger" onclick="changeCamp(' + route.indexOf(day) + ', false)" value="">'+day.prev_site.name+'</br>+'+mileDif+' miles</button>';
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
    inputDays.value = Math.round(trail.length / 10);
    inputMiles.value = "";
    inputMiles.placeholder = "Using Days";
    inputShortHikeIn.checked = false;
    inputShortHikeOut.checked = false;
    inputCW.disabled = trail.circuit ? false : true;
    inputCCW.disabled = trail.circuit ? false : true;
    inputCW.checked = trail.circuit ? true : false;
    inputCCW.checked = false;
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