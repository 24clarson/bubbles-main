function convertTime(secs) {
    if (secs >= 3600) {
        return Math.floor(secs/3600) + "h " + (secs%3600/60).toFixed(0) + "m";
    } else {
        return Math.floor(secs/60) + "m " + (secs%60).toFixed(0) + "s";
    }
}

function convertPace(secs) {
    if (secs >= 3600) {
        return Math.floor(secs/3600) + "h " + (secs%3600/60).toFixed(0) + "m";
    } else {
        seconds = String((secs%60).toFixed(0));
        if (seconds.length == 1) {
            seconds = "0" + seconds
        }
        return Math.floor(secs/60) + ":" + seconds;
    }
}