function readFile(input) {
    let file = input.files[0];
    let fileReader = new FileReader();
    fileReader.readAsText(file); 
    fileReader.onload = function() {
        changeTrail(fileReader.result)
    }; 
    fileReader.onerror = function() {
        alert(fileReader.error);
    }; 
}

function changeTrail(file) {
    const newTrail = validJson(file);
    if (newTrail) {
        trail = newTrail;
        reset();
        initMap();
        document.getElementById('trailFile').value = '';
        $('#changeTrail').modal('hide');
    }
}

function validJson(file) {
    try {
        const trail = JSON.parse(file);
        let numTrailFolders = 0, numTrailheadFolders = 0, numCampsiteFolders = 0;
        for (feature of trail.features) {
            if (!feature.geometry) {
                if (feature.properties.title === 'Trailheads') numTrailheadFolders++;
                else if (feature.properties.title === 'Campsites') numCampsiteFolders++;
                else if (feature.properties.title === 'Trail') numTrailFolders++;
            }
        }
        if (numTrailFolders != 1 || numTrailheadFolders != 1 || numCampsiteFolders != 1) return false;
        setTrailDetails(trail); //set trail details to verify each marker is on trail and has "distance" appended to the properties
        for (campsite of campsiteFeatures) if (campsite.properties.distance === undefined) return false;
        for (trailhead of trailheadFeatures) if (trailhead.properties.distance === undefined) return false;
        return trail;
    } catch (e) {
        console.error(e);
    }
    return false;
}