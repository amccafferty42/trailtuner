let trailheads = [
    {
        name: "Rt. 381 (Ohiopyle)",
        mile: 0.0,
        type: "trailhead"
    },
    {
        name: "Rt. 653",
        mile: 18.9,
        type: "trailhead"
    },
    {
        name: "Rt. 31",
        mile: 30.9,
        type: "trailhead"
    },
    {
        name: "Rt. 30",
        mile: 45.6,
        type: "trailhead"
    },
    {
        name: "Rt. 271",
        mile: 56.8,
        type: "trailhead"
    },
    {
        name: "Rt. 56 (Johnstown)",
        mile: 70.0,
        type: "trailhead"
    }
];
let shelters = [
    {
        name: "Ohiopyle Shelter Area",
        mile: 6.3,
        type: "shelter"
    },
    {
        name: "Rt. 653 Shelter Area",
        mile: 18.5,
        type: "shelter"
    },
    {
        name: "Grindle Ridge Shelter Area",
        mile: 24.0,
        type: "shelter"
    },
    {
        name: "Rt. 31 Shelter Area",
        mile: 32.5,
        type: "shelter"
    },
    {
        name: "Turnpike Shelter Area",
        mile: 38.2,
        type: "shelter"
    },
    {
        name: "Rt. 30 Shelter Area",
        mile: 46.5,
        type: "shelter"
    },
    {
        name: "Rt. 271 Shelter Area",
        mile: 56.9,
        type: "shelter"
    },
    {
        name: "Rt. 56 Shelter Area",
        mile: 64.9,
        type: "shelter"
    }
];

let startTrailhead;
let endTrailhead;
let genRoute = [];
let genRoutes = [];

// select DOM elements
const selectStart = document.getElementById('start');
const selectEnd = document.getElementById('end');
const inputDays = document.getElementById('days');
const selectDifficulty = document.getElementById('difficulty');
const inputDate = document.getElementById('start-date');
const inputHalfDay = document.getElementById('half');
const pRoute = document.getElementById('route');


// populate trailhead dropdowns
for (let i = 0; i < trailheads.length; i++) {
    addOption(selectStart, trailheads[i].name, i+1);
    addOption(selectEnd, trailheads[i].name, i+1);
}

selectStart.value = 1;
selectEnd.value = 6;
inputDate.valueAsDate = new Date();

function addOption(element, name, value) {
    let el = document.createElement("option");
    el.text = name;
    el.value = value;
    element.appendChild(el);
}

function plan() {
    const startDate = new Date(inputDate.value + 'T00:00');
    const days = inputDays.value;
    if (selectStart.value !== 0 && selectEnd.value !== 0) {
        let startTrailhead = trailheads[selectStart.value - 1];
        let endTrailhead = trailheads[selectEnd.value - 1];
        const route = generateRoute(startTrailhead, endTrailhead, days, startDate);
        pRoute.innerHTML = '';
        for (let i = 0; i < route.length; i++) {
            pRoute.innerHTML += route[i].date.toLocaleDateString() + ': ' + route[i].miles + ' miles from ' + route[i].start + ' to ' + route[i].end + '<br>';
            console.log(route[i]);
        }
    } else if (selectStart.value != 0) {
        //todo
    } else {
        //todo
    }
}

function generateRoute(start, end, days, startDate) {
    const isNobo = start.mile < end.mile ? true : false;
    const mileage = Math.abs(end.mile - start.mile);
    const avgMileage = mileage / days;
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

    for (let i = 0; i < days; i++) {
        idealEndMile = isNobo ? idealEndMile + avgMileage : idealEndMile - avgMileage;
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
        }
        if (i == days - 1) {
            routeCandidate1[i].end = end.name;
            routeCandidate1[i].end_mile = end.mile;
            routeCandidate2[i].end = end.name;
            routeCandidate2[i].end_mile = end.mile;
        } else {
            if (isNobo) {
                for (let j = 0; j < shelters.length; j++) {
                    if (shelters[j].mile > idealEndMile) {
                        selectedShelter = j > 0 && idealEndMile - Math.abs(shelters[j-1].mile - idealEndMile) <= 2.5 ? sheleters[j-1] : shelters[j];
                        routeCandidate1[i].end = selectedShelter.name;
                        routeCandidate1[i].end_mile = selectedShelter.mile;

                        selectedShelter = j > 0 && (Math.abs(shelters[j-1].mile - idealEndMile) < Math.abs(shelters[j].mile - idealEndMile)) ? shelters[j-1] : shelters[j];
                        routeCandidate2[i].end = selectedShelter.name;
                        routeCandidate2[i].end_mile = selectedShelter.mile;
                        break;
                    }
                }
            } else {
                for (let j = shelters.length - 1; j >= 0; j--) {
                    if (shelters[j].mile < idealEndMile) {
                        selectedShelter = j < shelters.length - 1 ? shelters[j+1] : shelters[j];
                        routeCandidate1[i].end = selectedShelter.name;
                        routeCandidate1[i].end_mile = selectedShelter.mile;

                        selectedShelter = j < shelters.length - 1 && (Math.abs(shelters[j+1].mile - idealEndMile) < Math.abs(shelters[j].mile - idealEndMile)) ? shelters[j+1] : shelters[j];
                        routeCandidate2[i].end = selectedShelter.name;
                        routeCandidate2[i].end_mile = selectedShelter.mile;
                        break;
                    }
                }
            }
        }
        routeCandidate1[i].miles = Math.round(Math.abs(routeCandidate1[i].end_mile - routeCandidate1[i].start_mile) * 10) / 10;
        routeCandidate2[i].miles = Math.round(Math.abs(routeCandidate2[i].end_mile - routeCandidate2[i].start_mile) * 10) / 10;
    }
    const sd1 = calculateSD(calculateVariance(Array.from(routeCandidate1, x => x.miles)));
    const sd2 = calculateSD(calculateVariance(Array.from(routeCandidate2, x => x.miles)));
    return sd1 < sd2 ? routeCandidate1 : routeCandidate2;
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