let newTrail;

// Select DOM elements
const file = document.getElementById('trailFile');

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
        this.newTrail = trail;
        changeTrail();
    } else {
        this.newTrail = undefined;
    }
}

function changeTrail() {
    reset();
    if (this.newTrail != undefined) {
        trail = this.newTrail;
        initMap();
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
        let numLineStrings = 0, numTrailheadFolders = 0, numCampsiteFolders = 0;
        for (feature of trail.features) {
            if (!feature.geometry) {
                if (feature.properties.title === 'Trailheads') numTrailheadFolders++;
                else if (feature.properties.title === 'Campsites') numCampsiteFolders++;
                else return false;
            } else if (feature.geometry.type === 'LineString') { 
                numLineStrings++;
            } else if (feature.geometry.type !== 'Point') {
                return false;
            }
        }
        if (numLineStrings != 1 || numTrailheadFolders != 1 || numCampsiteFolders != 1) return false;
        setTrailDetails(trail); //set trail details to verify each marker is on trail and has "distance" appended to the properties
        for (campsite of campsiteFeatures) if (campsite.properties.distance === undefined) return false;
        for (trailhead of trailheadFeatures) if (trailhead.properties.distance === undefined) return false;
        //initMap();
        // if (!trail || typeof trail != "object") return false;
        // if (!trail.name || typeof trail.name != "string" || trail.name == '' || trail.name.length > 50) return false;
        // if (!trail.length || typeof trail.length != "number" || trail.length < 1 || trail.length > 999) return false;
        // if (!trail.unit || (trail.unit !== 'mi' && trail.unit !== 'km')) return false;
        // if (typeof trail.circuit != "boolean") return false;
        // if (!trail.campsites || trail.campsites.length < 1 || trail.campsites > 99) return false;
        // if (!trail.trailheads || trail.trailheads.length < 2 || trail.trailheads.length > 99 || trail.trailheads[0].distance != 0 || (!trail.circuit && trail.trailheads[trail.trailheads.length - 1].distance != trail.length)) return false;
        // for (campsite of trail.campsites) if (!campsite.name || typeof campsite.name != "string" || campsite.name == '' || campsite.name.length > 50 || typeof campsite.distance != "number" || campsite.distance < 0 || campsite.distance > 999) return false;
        // for (trailhead of trail.trailheads) if (!trailhead.name || typeof trailhead.name != "string" || trailhead.name == '' || trailhead.name.length > 50 || typeof trailhead.distance != "number" || trailhead.distance < 0 || trailhead.distance > 999) return false;
        return trail;
    } catch (e) {
        console.error(e);
    }
    return false;
}