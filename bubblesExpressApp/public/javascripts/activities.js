document.addEventListener('DOMContentLoaded', () => {
    loadActivityDetails();
});

async function loadActivityDetails() {
    const params = new URLSearchParams(window.location.search);
    const actId = params.get("id");
    const act = await singleActivityDB(actId);
    document.getElementById("activity-title").textContent = act.name;
    document.getElementById("activity-description").innerHTML = act.description.replaceAll("\n", "<br>")||"No description";
    document.getElementById('link-strava').href = `https://www.strava.com/activities/${actId}`;
    const content = document.getElementById('activity-content');
    const labels = ["Moving Time", "Distance", "Pace"];
    const values = [
        convertTime(act.moving_time),
        (act.distance/1609.344).toFixed(1) + " mi",
        convertPace(act.moving_time/(act.distance/1609.344)) + " /mi",
    ];
    for (let i=0; i<labels.length; i++) {
        const stat = document.createElement("div");
        stat.classList.add("activity-stat");
        stat.textContent = labels[i] + ": " + values[i];
        content.insertBefore(stat, content.firstChild);
    }
}

async function singleActivityDB(id) {
    try {
        const response = await fetch('/singleDB', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id: id,
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to reach server for DB: ${response.status}`);
        }

        const data = await response.json();
        return data

    } catch (error) {
        console.error('Error reaching server for DB:', error);
    }
}

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