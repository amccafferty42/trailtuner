let newTrail;

const template = {
    "name": "Example Trail",
    "length": 30.0,
    "unit": "mi",
    "circuit": false,
    "trailheads": [
        {
            "name": "First Trailhead",
            "distance": 0.0
        },
        {
            "name": "Second Trailhead",
            "distance": 30.0
        }
    ],
    "campsites": [
        {
            "name": "First Campground",
            "distance": 10.0
        },
        {
            "name": "Second Campground",
            "distance": 20.0
        }
    ]
};
let trail = {
    "name": "Laurel Highlands Hiking Trail",
    "length": 70,
    "unit": "mi",
    "circuit": false,
    "trailheads": [
        {
            "name": "Rt. 381 Trailhead",
            "distance": 0.0
        },
        {
            "name": "Rt. 653 Trailhead",
            "distance": 18.9
        },
        {
            "name": "Rt. 31 Trailhead",
            "distance": 30.9
        },
        {
            "name": "Rt. 30 Trailhead",
            "distance": 45.6
        },
        {
            "name": "Rt. 271 Trailhead",
            "distance": 56.8
        },
        {
            "name": "Rt. 56 Trailhead",
            "distance": 70.0
        }
    ],
    "campsites": [
        {
            "name": "Ohiopyle Shelter Area",
            "distance": 6.3
        },
        {   
            "name": "Rt. 653 Shelter Area",
            "distance": 18.5
        },
        {
            "name": "Grindle Ridge Shelter Area",
            "distance": 24.0
        },
        {
            "name": "Rt. 31 Shelter Area",
            "distance": 32.5
        },
        {
            "name": "Turnpike Shelter Area",
            "distance": 38.2
        },
        {
            "name": "Rt. 30 Shelter Area",
            "distance": 46.5
        },
        {
            "name": "Rt. 271 Shelter Area",
            "distance": 56.5
        },
        {
            "name": "Rt. 56 Shelter Area",
            "distance": 64.9
        }
    ]
}

// Select DOM elements
const file = document.getElementById('trailFile');
const uploadTrailBtn = document.getElementById('upload-trail-btn');
const validJsonLabel = document.getElementById('validJson');
const jsonTemplate = document.getElementById('json-template');

jsonTemplate.innerHTML = JSON.stringify(template, null, 2);

function readFile(input) {
    let file = input.files[0];
    let fileReader = new FileReader();
    fileReader.readAsText(file); 
    fileReader.onload = function() {
        setNewTrail(fileReader.result)
    }; 
    fileReader.onerror = function() {
        alert(fileReader.error);
    }; 
}

function setNewTrail(file) {
    const trail = validJson(file);
    if (trail) {
        console.log("Successfully validated " + trail.name);
        validJsonLabel.innerHTML = '';
        this.newTrail = trail;
        changeTrail();
    } else {
        validJsonLabel.innerHTML = '&nbsp;invalid JSON';
        uploadTrailBtn.disabled = true;
        this.newTrail = undefined;
    }
}

function resetTemplate() {
    jsonTemplate.value = JSON.stringify(template, null, 2);
}

function changeTrail() {
    if (this.newTrail != undefined) {
        console.log("Changing trail to " + this.newTrail.name);
        console.log(this.newTrail);
        trail = this.newTrail;
        reset();
        appendPos();
        $('#changeTrail').modal('hide');
    }
}

function submitTrail() {
    const trail = validJson(jsonTemplate.value);
    this.newTrail = trail ? trail : undefined;
    changeTrail();
}

function validJson(file) {
    try {
        const trail = JSON.parse(file);
        if (!trail || typeof trail != "object") return false;
        if (!trail.name || typeof trail.name != "string" || trail.name == '' || trail.name.length > 50) return false;
        if (!trail.length || typeof trail.length != "number" || trail.length < 1 || trail.length > 999) return false;
        if (!trail.unit || (trail.unit !== 'mi' && trail.unit !== 'km')) return false;
        if (typeof trail.circuit != "boolean") return false;
        if (!trail.campsites || trail.campsites.length < 1 || trail.campsites > 99) return false;
        if (!trail.trailheads || trail.trailheads.length < 2 || trail.trailheads.length > 99 || trail.trailheads[0].distance != 0 || (!trail.circuit && trail.trailheads[trail.trailheads.length - 1].distance != trail.length)) return false;
        for (campsite of trail.campsites) if (!campsite.name || typeof campsite.name != "string" || campsite.name == '' || campsite.name.length > 50 || typeof campsite.distance != "number" || campsite.distance < 0 || campsite.distance > 999) return false;
        for (trailhead of trail.trailheads) if (!trailhead.name || typeof trailhead.name != "string" || trailhead.name == '' || trailhead.name.length > 50 || typeof trailhead.distance != "number" || trailhead.distance < 0 || trailhead.distance > 999) return false;
        return trail;
    } catch (e) {
        console.error(e);
    }
    return false;
}