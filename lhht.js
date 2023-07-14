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
            mile: 56.5,
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
    let difficulty = selectDifficulty.value * inputDays.value * 9;
    if (inputHalfDay.checked) difficulty -= (7.5 * selectDifficulty.value);

    const startTrailhead = selectStart.value == 0 ? selectStartTrailhead(trail.trailheads[selectEnd.value - 1], difficulty) : trail.trailheads[selectStart.value - 1];
    const endTrailhead = selectEnd.value == 0 ? selectEndTrailhead(startTrailhead, difficulty) : trail.trailheads[selectEnd.value - 1];

    console.log('Generating ' + Math.abs(startTrailhead.mile - endTrailhead.mile) + ' mile trip from ' + startTrailhead.name + ' to ' + endTrailhead.name);
    const route = generateRoute(startTrailhead, endTrailhead, inputDays.value, startDate, inputHalfDay.checked);

    displayRoute(route);
}

/* Given optional end trailhead and difficulty integer, return start trailhead */
function selectStartTrailhead(endTrailhead, difficulty) {
    if (endTrailhead === undefined) {
        if (difficulty <= trail.length / 2) {
            return trail.trailheads[Math.floor(Math.random() * trail.trailheads.length)];
        } else {
            let validTrailheads = [];
            for (let i = 0; i < trail.trailheads.length; i++) {
                if (trail.trailheads[i].mile <= (trail.length - difficulty) || trail.trailheads[i].mile >= difficulty) {
                    validTrailheads.push(i);
                }
            }
            console.log(validTrailheads);
            if (validTrailheads.length === 0) return trail.trailheads[Math.floor(Math.random() * 2) * (trail.trailheads.length - 1)];
            const r = Math.floor(Math.random() * validTrailheads.length);
            return trail.trailheads[validTrailheads[r]];
        }
    } else {
        const startCandidate1 = getNearestTrailhead(endTrailhead.mile + difficulty);
        const startCandidate2 = getNearestTrailhead(endTrailhead.mile - difficulty);
        if ((endTrailhead.mile + difficulty) > trail.length && (endTrailhead.mile - difficulty) < 0) {
            return Math.abs(endTrailhead.mile - startCandidate1.mile) > Math.abs(endTrailhead.mile - startCandidate2.mile) ? startCandidate1 : startCandidate2;
        } else if ((endTrailhead.mile + difficulty) > trail.length) {
            return startCandidate2;
        } else if ((endTrailhead.mile - difficulty) < 0) {
            return startCandidate1;
        }
        //return Math.abs(startCandidate1.mile - difficulty) < Math.abs(startCandidate2.mile - difficulty) ? startCandidate1 : startCandidate2;
        return Math.floor(Math.random() * 2) === 0 ? startCandidate1 : startCandidate2;
    }
}

/* Given start trailhead and difficulty integer, return end trailhead */
function selectEndTrailhead(startTrailhead, difficulty) {
    const endCandidate1 = getNearestTrailhead(startTrailhead.mile + difficulty);
    const endCandidate2 = getNearestTrailhead(startTrailhead.mile - difficulty);
    if ((startTrailhead.mile + difficulty) > trail.length && (startTrailhead.mile - difficulty) < 0) {
        return Math.abs(startTrailhead.mile - endCandidate1.mile) > Math.abs(startTrailhead.mile - endCandidate2.mile) ? endCandidate1 : endCandidate2;
    } else if ((startTrailhead.mile + difficulty) > trail.length) {
        return endCandidate2;
    } else if ((startTrailhead.mile - difficulty) < 0) {
        return endCandidate1;
    }
    //return Math.abs(endCandidate1.mile - difficulty) < Math.abs(endCandidate2.mile - difficulty) ? endCandidate1 : endCandidate2;
    return Math.floor(Math.random() * 2) === 0 ? endCandidate1 : endCandidate2;
}

/* Given mile number, return the nearest campsite in either direction */
function getNearestCampsite(mile) {
    if (mile < 0) return trail.campsites[0];
    if (mile > trail.length) return trail.campsites[trail.campsites.length - 1];
    for (let i = 0; i < trail.campsites.length; i++) {
        if (trail.campsites[i].mile > mile) {
            if (i == 0) return trail.campsites[0];
            return Math.abs(mile - trail.campsites[i].mile) < Math.abs(mile - trail.campsites[i - 1].mile) ? trail.campsites[i] : trail.campsites[i - 1];
        }
    }
    return trail.campsites[trail.campsites.length - 1];
}

/* Given mile number, return the nearest campsite with a greater mile */
function getNearestCampsiteGreaterThan(mile) {
    if (mile < 0) return trail.campsites[0];
    if (mile > trail.length) return;
    for (let i = 0; i < trail.campsites.length; i++) {
        if (trail.campsites[i].mile > mile) return trail.campsites[i];
    }
    return;
}

/* Given mile number, return the nearest campsite with a lesser mile */
function getNearestCampsiteLessThan(mile) {
    if (mile < 0) return;
    if (mile > trail.length) return trail.campsites[trail.campsites.length - 1];
    for (let i = trail.campsites.length - 1; i >= 0; i--) {
        if (trail.campsites[i].mile < mile) return trail.campsites[i];
    }
    return;
}

/* Given mile number, return the nearest trailhead in either direction */
function getNearestTrailhead(mile) {
    if (mile < 0) return trail.trailheads[0];
    if (mile > trail.length) return trail.trailheads[trail.trailheads.length - 1];
    for (let i = 0; i < trail.trailheads.length; i++) {
        if (trail.trailheads[i].mile > mile) {
            if (i == 0) return trail.trailheads[0];
            return Math.abs(mile - trail.trailheads[i].mile) < Math.abs(mile - trail.trailheads[i - 1].mile) ? trail.trailheads[i] : trail.trailheads[i - 1];
        }
    }
    return trail.trailheads[trail.trailheads.length - 1];
}

function generateHalfDay(start, startDate) {
    const end = getNearestCampsite(start.mile);
    return {
        start: start.name,
        start_mile: start.mile,
        date: startDate,
        end: end.name,
        end_mile: end.mile,
        miles: Math.round(Math.abs(start.mile - end.mile) * 10) / 10
    }
}

function generateRoute(start, end, days, startDate, halfDay) {
    if (halfDay) {
        let route = [];
        const halfDay = generateHalfDay(start, startDate);
        let newStart = {
            name: halfDay.end,
            mile: halfDay.end_mile
        };
        let tomorrow = new Date(halfDay.date);
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
        route.push(halfDay);
        return route.concat(calculateRoute(newStart, end, days - 1, tomorrow));
    }
    return calculateRoute(start, end, days, startDate);  
}

function buildRoute(startTrailhead, endTrailhead, campsites, days, startDate) {
    let route = [days];
    route[0] = {};
    route[0].date = startDate;
    route[0].start = startTrailhead.name;
    route[0].start_mile = startTrailhead.mile;
    for (let j = 0; j < days; j++) {
        if (j > 0) {
            let tomorrow = new Date(route[j-1].date);
            tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
            route[j] = {};
            route[j].date = tomorrow;
            route[j].start = route[j-1].end;
            route[j].start_mile = route[j-1].end_mile;
        }
        if (j == days - 1) {
            route[j].end = endTrailhead.name;
            route[j].end_mile = endTrailhead.mile;
        } else {
            route[j].end = campsites[j] === undefined ? route[j].start : campsites[j].name;
            route[j].end_mile = campsites[j] === undefined ? route[j].start_mile : campsites[j].mile;
        }
        route[j].miles = Math.round(Math.abs(route[j].end_mile - route[j].start_mile) * 10) / 10;
    }
    return route;
}

function calculateRoute(start, end, days, startDate) {
    const isNobo = start.mile < end.mile ? true : false;
    const firstPossibleCampsite = isNobo ? getNearestCampsiteGreaterThan(start.mile) : getNearestCampsiteLessThan(start.mile);
    const lastPossibleCampsite = isNobo ? getNearestCampsiteLessThan(end.mile) : getNearestCampsiteGreaterThan(end.mile);
    let allPossibleCampsites = isNobo ? trail.campsites.slice(trail.campsites.indexOf(firstPossibleCampsite), trail.campsites.indexOf(lastPossibleCampsite) + 1) : trail.campsites.slice(trail.campsites.indexOf(lastPossibleCampsite), trail.campsites.indexOf(firstPossibleCampsite) + 1).reverse();
    if (allPossibleCampsites.length < days) {
        console.info('Number of days is greater than or equal to the number of available campsites between start and end points');
        return buildRoute(start, end, allPossibleCampsites, days, startDate);
    }

    let campsites = subset(allPossibleCampsites, days - 1);
    let routes = [];
    for (let campsite of campsites) {
        routes.push(buildRoute(start, end, campsite, days, startDate));
    }

    let bestRoute = routes[0], lowestSD = Number.MAX_VALUE;
    for(let i = 0; i < routes.length; i++) {
        let sd = calculateSD(calculateVariance(Array.from(routes[i], x => x.miles)));
        if (sd < lowestSD) {
            bestRoute = routes[i];
            lowestSD = sd;
        }
    }
    console.log("Analyzed " + routes.length + " different routes to find ideal route with a daily mileage standard deviation of " + lowestSD);
    return bestRoute;
}

function subset(arra, arra_size) {
    var result_set = [], result;
    for (var x = 0; x < Math.pow(2, arra.length); x++) {
        result = [];
        i = arra.length - 1; 
        do {
            if ((x & (1 << i)) !== 0) {
                result.push({name: arra[i].name,mile: arra[i].mile});
            }
        } while(i--);
        if (result.length == arra_size) {
            result_set.push(result.reverse());
        }
    }
    return result_set; 
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