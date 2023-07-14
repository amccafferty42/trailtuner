const trail = {
    name: 'Laurel Highlands Hiking Trail',
    length: 70,
    trailheads: [
        {
            name: "Rt. 381",
            mile: 0.0
        },
        {
            name: "Rt. 653",
            mile: 18.9
        },
        {
            name: "Rt. 31",
            mile: 30.9
        },
        {
            name: "Rt. 30",
            mile: 45.6
        },
        {
            name: "Rt. 271",
            mile: 56.8
        },
        {
            name: "Rt. 56",
            mile: 70.0
        }
    ],
    campsites: [
        {
            name: "Ohiopyle Shelter Area",
            mile: 6.3,
        },
        {   
            name: "Rt. 653 Shelter Area",
            mile: 18.5,
        },
        {
            name: "Grindle Ridge Shelter Area",
            mile: 24.0,
        },
        {
            name: "Rt. 31 Shelter Area",
            mile: 32.5,
        },
        {
            name: "Turnpike Shelter Area",
            mile: 38.2,
        },
        {
            name: "Rt. 30 Shelter Area",
            mile: 46.5,
        },
        {
            name: "Rt. 271 Shelter Area",
            mile: 56.9,
        },
        {
            name: "Rt. 56 Shelter Area",
            mile: 64.9,
        }
    ]
}

// select DOM elements
const selectStart = document.getElementById('start');
const selectEnd = document.getElementById('end');
const inputDays = document.getElementById('days');
const selectDifficulty = document.getElementById('difficulty');
const inputDate = document.getElementById('start-date');
const inputHalfDay = document.getElementById('half');
const pRoute = document.getElementById('route');

for (let i = 0; i < trail.trailheads.length; i++) {
    addOption(selectStart, trail.trailheads[i].name, i+1);
    addOption(selectEnd, trail.trailheads[i].name, i+1);
}

selectStart.value = 1;
selectEnd.value = selectEnd.length - 1;
inputDate.valueAsDate = new Date();

function addOption(element, name, value) {
    let el = document.createElement("option");
    el.text = name;
    el.value = value;
    element.appendChild(el);
}

function plan() {
    const startDate = new Date(inputDate.value + 'T00:00');
    let difficulty = (selectDifficulty.value * inputDays.value * 10);
    if (inputHalfDay.checked) difficulty -= (7.5 * selectDifficulty.value);

    const startTrailhead = selectStart.value == 0 ? selectStartTrailhead(trail.trailheads[selectEnd.value - 1], difficulty) : trail.trailheads[selectStart.value - 1];
    const endTrailhead = selectEnd.value == 0 ? selectEndTrailhead(startTrailhead, difficulty) : trail.trailheads[selectEnd.value - 1];

    console.log('Generating ' + Math.abs(startTrailhead.mile - endTrailhead.mile) + ' mile trip from ' + startTrailhead.name + ' to ' + endTrailhead.name);
    const route = generateRoute(startTrailhead, endTrailhead, inputDays.value, startDate, inputHalfDay.checked);
    displayRoute(route);
}

function selectStartTrailhead(endTrailhead, difficulty, halfDay) {
    if (endTrailhead === undefined) {
        if (difficulty <= trail.length / 2) {
            return trail.trailheads[Math.floor(Math.random() * trail.trailheads.length)];
        } else {
            return trail.trailheads[Math.floor(Math.random() * 2) * (trail.trailheads.length - 1)];
        }
    } else {
        const startCandidate1 = getNearestTrailhead(endTrailhead.mile + difficulty);
        const startCandidate2 = getNearestTrailhead(endTrailhead.mile - difficulty);
        return Math.abs(startCandidate1.mile - difficulty) < Math.abs(startCandidate2.mile - difficulty) ? startCandidate1 : startCandidate2;
    }
}

function selectEndTrailhead(startTrailhead, difficulty) {
    const endCandidate1 = getNearestTrailhead(startTrailhead.mile + difficulty);
    const endCandidate2 = getNearestTrailhead(startTrailhead.mile - difficulty);
    if (endCandidate1 != startTrailhead && Math.abs(endCandidate1.mile - difficulty) < Math.abs(endCandidate2.mile - difficulty)) {
        return endCandidate1;
    } else if (endCandidate2 != startTrailhead) {
        return endCandidate2;
    } else {
        console.error("Error selecting endTrailhead");
    }
    return undefined;
}

/* Given mile number, return the nearest campsite in either direction */
function getNearestCampsite(mile) {
    //console.log("Calculating nearest campsite to mile " + mile);
    if (mile < 0) return trail.campsites[0];
    if (mile > trail.trailLength) trail.campsites[trail.campsites.length - 1];
    for (let i = 0; i < trail.campsites.length; i++) {
        if (trail.campsites[i].mile > mile) {
            if (i == 0) return trail.campsites[0];
            return Math.abs(mile - trail.campsites[i].mile) < Math.abs(mile - trail.campsites[i - 1].mile) ? trail.campsites[i] : trail.campsites[i - 1];
        }
    }
    return trail.campsites[trail.campsites.length - 1];
}

/* Given mile number, return the nearest trailhead in either direction */
function getNearestTrailhead(mile) {
    //console.log("Calculating nearest trailhead to mile " + mile);
    if (mile < 0) return trail.trailheads[0];
    if (mile > trail.trailLength) trail.trailheads[trail.trailheads.length - 1];
    for (let i = 0; i < trail.trailheads.length; i++) {
        if (trail.trailheads[i].mile > mile) {
            if (i == 0) return trail.trailheads[0];
            return Math.abs(mile - trail.trailheads[i].mile) < Math.abs(mile - trail.trailheads[i - 1].mile) ? trail.trailheads[i] : trail.trailheads[i - 1];
        }
    }
    return trail.trailheads[trail.trailheads.length - 1];
}

/* Given campsite and direction, return the next campsite */
function getNextCampsite(campsite, isNobo) {
    if (isNobo) return trail.campsites[trail.campsites.indexOf(campsite) + 1];
    return trail.campsites[trail.campsites.indexOf(campsite) - 1];
}

/* Given a start, end, number of days, startDate, and halfDay boolean, 
    generate three route candidates and return the one with the lowest standard deviation */
function generateRoute(start, end, days, startDate, halfDay) {
    const isNobo = start.mile < end.mile ? true : false;
    const mileage = Math.abs(end.mile - start.mile);
    let avgMileage = mileage / days;
    let idealEndMile = start.mile;
    let selectedShelter;

    let routeCandidate1 = [days];
    routeCandidate1[0] = {};
    routeCandidate1[0].date = startDate;
    routeCandidate1[0].start = start.name;
    routeCandidate1[0].start_mile = start.mile;

    let routeCandidate2 = [days];
    routeCandidate2[0] = {};
    routeCandidate2[0].date = startDate;
    routeCandidate2[0].start = start.name;
    routeCandidate2[0].start_mile = start.mile;

    let routeCandidate3 = [days];
    routeCandidate3[0] = {};
    routeCandidate3[0].date = startDate;
    routeCandidate3[0].start = start.name;
    routeCandidate3[0].start_mile = start.mile;

    for (let i = 0; i < days; i++) {
        if (halfDay) {
            const nearestCampsite = getNearestCampsite(start.mile);
            routeCandidate1[0].end = nearestCampsite.name;
            routeCandidate1[0].end_mile = nearestCampsite.mile;
            routeCandidate1[0].miles = Math.round(Math.abs(routeCandidate1[0].end_mile - routeCandidate1[0].start_mile) * 10) / 10;
            
            routeCandidate2[0].end = nearestCampsite.name;
            routeCandidate2[0].end_mile = nearestCampsite.mile;
            routeCandidate2[0].miles = Math.round(Math.abs(routeCandidate2[0].end_mile - routeCandidate2[0].start_mile) * 10) / 10;
            
            routeCandidate3[0].end = nearestCampsite.name;
            routeCandidate3[0].end_mile = nearestCampsite.mile;
            routeCandidate3[0].miles = Math.round(Math.abs(routeCandidate3[0].end_mile - routeCandidate3[0].start_mile) * 10) / 10;
    
            avgMileage = (Math.abs(end.mile - nearestCampsite.mile)) / (days - 1);
            idealEndMile = nearestCampsite.mile;
            i++;
            halfDay = false;
        }
        if (i > 0) {
            let tomorrow = new Date(routeCandidate1[i-1].date);
            tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

            routeCandidate1[i] = {};
            routeCandidate1[i].date = tomorrow;
            routeCandidate1[i].start = routeCandidate1[i-1].end;
            routeCandidate1[i].start_mile = routeCandidate1[i-1].end_mile;
    
            routeCandidate2[i] = {};
            routeCandidate2[i].date = tomorrow;
            routeCandidate2[i].start = routeCandidate2[i-1].end;
            routeCandidate2[i].start_mile = routeCandidate2[i-1].end_mile;

            routeCandidate3[i] = {};
            routeCandidate3[i].date = tomorrow;
            routeCandidate3[i].start = routeCandidate3[i-1].end;
            routeCandidate3[i].start_mile = routeCandidate3[i-1].end_mile;
        }
        if (i == days - 1) {
            routeCandidate1[i].end = end.name;
            routeCandidate1[i].end_mile = end.mile;
            routeCandidate2[i].end = end.name;
            routeCandidate2[i].end_mile = end.mile;
            routeCandidate3[i].end = end.name;
            routeCandidate3[i].end_mile = end.mile;
        } else {
            if (isNobo) {
                idealEndMile += avgMileage;
                for (let j = 0; j < trail.campsites.length; j++) {
                    if (trail.campsites[j].mile > idealEndMile || j == trail.campsites.length - 1) {
                        selectedShelter = trail.campsites[j];
                        routeCandidate1[i].end = selectedShelter.name;
                        routeCandidate1[i].end_mile = selectedShelter.mile;

                        selectedShelter = j > 0 ? trail.campsites[j-1] : trail.campsites[j];
                        routeCandidate2[i].end = selectedShelter.name;
                        routeCandidate2[i].end_mile = selectedShelter.mile;
                        
                        selectedShelter = j > 0 && (Math.abs(trail.campsites[j-1].mile - idealEndMile) < Math.abs(trail.campsites[j].mile - idealEndMile)) ? trail.campsites[j-1] : trail.campsites[j];
                        routeCandidate3[i].end = selectedShelter.name;
                        routeCandidate3[i].end_mile = selectedShelter.mile;
                        break;
                    }
                }
            } else {
                idealEndMile -= avgMileage;
                for (let j = trail.campsites.length - 1; j >= 0; j--) {
                    if (trail.campsites[j].mile < idealEndMile || j == 0) {
                        selectedShelter = trail.campsites[j];
                        routeCandidate1[i].end = selectedShelter.name;
                        routeCandidate1[i].end_mile = selectedShelter.mile;

                        selectedShelter = j < trail.campsites.length - 1 ? trail.campsites[j+1] : trail.campsites[j];
                        routeCandidate2[i].end = selectedShelter.name;
                        routeCandidate2[i].end_mile = selectedShelter.mile;

                        selectedShelter = j < trail.campsites.length - 1 && (Math.abs(trail.campsites[j+1].mile - idealEndMile) < Math.abs(trail.campsites[j].mile - idealEndMile)) ? trail.campsites[j+1] : trail.campsites[j];
                        routeCandidate3[i].end = selectedShelter.name;
                        routeCandidate3[i].end_mile = selectedShelter.mile;
                        break;
                    }
                }
            }
        }
        routeCandidate1[i].miles = Math.round(Math.abs(routeCandidate1[i].end_mile - routeCandidate1[i].start_mile) * 10) / 10;
        routeCandidate2[i].miles = Math.round(Math.abs(routeCandidate2[i].end_mile - routeCandidate2[i].start_mile) * 10) / 10;
        routeCandidate3[i].miles = Math.round(Math.abs(routeCandidate3[i].end_mile - routeCandidate3[i].start_mile) * 10) / 10;
    }
    const sd1 = calculateSD(calculateVariance(Array.from(routeCandidate1, x => x.miles)));
    console.log("routeCandidate1 (long) calculated with a standard deviation of " + sd1);
    const sd2 = calculateSD(calculateVariance(Array.from(routeCandidate2, x => x.miles)));
    console.log("routeCandidate2 (short) calculated with a standard deviation of " + sd2);
    const sd3 = calculateSD(calculateVariance(Array.from(routeCandidate3, x => x.miles)));
    console.log("routeCandidate3 (closest to average) calculated with a standard deviation of " + sd3);

    if (Math.min(sd1, sd2, sd3) === sd1) return routeCandidate1;
    if (Math.min(sd1, sd2, sd3) === sd2) return routeCandidate2;
    return routeCandidate3;
}

function enableDifficulty() {
    if (selectStart.value == 0 || selectEnd.value == 0) {
        selectDifficulty.disabled = false;
    } else {
        selectDifficulty.disabled = true;
    }
}

function displayRoute(route) {
    pRoute.innerHTML = '';
    for (let i = 0; i < route.length; i++) {
        pRoute.innerHTML += route[i].date.toLocaleDateString() + ': ' + route[i].miles + ' miles from ' + route[i].start + ' to ' + route[i].end + '<br>';
    }
}

// Calculate the average of all the numbers
const calculateMean = (values) => {
    const mean = (values.reduce((sum, current) => sum + current)) / values.length;
    return mean;
};

// Calculate variance
const calculateVariance = (values) => {
    const average = calculateMean(values);
    const squareDiffs = values.map((value) => {
        const diff = value - average;
        return diff * diff;
    });
    const variance = calculateMean(squareDiffs);
    return variance;
};

// Calculate stand deviation
const calculateSD = (variance) => {
    return Math.sqrt(variance);
};

//no pref -> rt 30
//moderate vs strenuous
// moderate is a tougher route