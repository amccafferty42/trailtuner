const file = document.getElementById('trailFile');
let newTrail;
let trail = {
    name: 'Wonderland Trail',
    length: 84.7,
    unit: 'mi',
    circuit: true,
    trailheads: [
        {
            name: "Longmire Trailhead",
            mile: 0.0
        },
        {
            name: "Mowich Lake Trailhead",
            mile: 31.5
        },
        {
            name: "White River Trailhead",
            mile: 55
        }  
    ],
    campsites:[
        {
            name: "Pyramid Creek",
            mile: 3.0
        },
        {
            name: "Devil's Dream",
            mile: 5.2
        },
        {
            name: "South Puyallup River",
            mile: 11.2
        },
        {
            name: "Klapatche Park",
            mile: 15.0
        },
        {
            name: "North Puyallup River",
            mile: 17.5
        },
        {
            name: "Golden Lakes",
            mile: 22.1
        },
        {
            name: "South Mowich River",
            mile: 27.9
        },
        {
            name: "Mowich Lake Campground",
            mile: 31.5
        },
        {
            name: "Ipsut Creek Campground",
            mile: 36.1
        },
        {
            name: "Carbon River",
            mile: 39.3
        },
        {
            name: "Dick Creek",
            mile: 40.5
        },
        {
            name: "Mystic Camp",
            mile: 43.9
        },
        {
            name: "Granite Creek",
            mile: 47.4
        },
        {
            name: "Sunrise Camp",
            mile: 51.7
        },
        {
            name: "White River Campground",
            mile: 55.0
        },
        {
            name: "Summerland",
            mile: 61.6
        },
        {
            name: "Indian Bar",
            mile: 65.8
        },
        {
            name: "Nickle Creek",
            mile: 72.0
        },
        {
            name: "Maple Creek",
            mile: 75.0
        },
        {
            name: "Paradise River",
            mile: 81.3
        },
        {
            name: "Cougar Rock Campground",
            mile: 83.4
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