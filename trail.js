const file = document.getElementById('trailFile');
let newTrail;
let trail = {
    "name": "Laurel Highlands Hiking Trail",
    "length": 70,
    "unit": "mi",
    "circuit": false,
    "trailheads": [
        {
            "name": "Rt. 381 Trailhead",
            "mile": 0.0
        },
        {
            "name": "Rt. 653 Trailhead",
            "mile": 18.9
        },
        {
            "name": "Rt. 31 Trailhead",
            "mile": 30.9
        },
        {
            "name": "Rt. 30 Trailhead",
            "mile": 45.6
        },
        {
            "name": "Rt. 271 Trailhead",
            "mile": 56.8
        },
        {
            "name": "Rt. 56 Trailhead",
            "mile": 70.0
        }
    ],
    "campsites": [
        {
            "name": "Ohiopyle Shelter Area",
            "mile": 6.3
        },
        {   
            "name": "Rt. 653 Shelter Area",
            "mile": 18.5
        },
        {
            "name": "Grindle Ridge Shelter Area",
            "mile": 24.0
        },
        {
            "name": "Rt. 31 Shelter Area",
            "mile": 32.5
        },
        {
            "name": "Turnpike Shelter Area",
            "mile": 38.2
        },
        {
            "name": "Rt. 30 Shelter Area",
            "mile": 46.5
        },
        {
            "name": "Rt. 271 Shelter Area",
            "mile": 56.5
        },
        {
            "name": "Rt. 56 Shelter Area",
            "mile": 64.9
        }
    ]
}

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
        this.newTrail = trail;
    } else {
        this.newTrail = undefined;
    }
}

function changeTrail() {
    if (this.newTrail != undefined) {
        console.log("Changing trail to " + this.newTrail.name);
        console.log(this.newTrail);
        trail = this.newTrail;
        reset();
        appendPos();
    }
}

function validJson(file) {
    try {
        const trail = JSON.parse(file);
        if (!trail || typeof trail != "object") return false;
        if (!trail.name || typeof trail.name != "string" || trail.name == '' || trail.name.length > 50) return false;
        if (!trail.length || typeof trail.length != "number" || trail.length < 1 || trail.length > 999) return false;
        if (!trail.unit || (trail.unit !== 'mi' && trail.unit !== 'km')) return false;
        if (typeof trail.circuit != "boolean") return false;
        return trail;
    } catch (e) {
        console.error(e);
    }
    return false;
}