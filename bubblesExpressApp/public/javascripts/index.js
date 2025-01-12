let activities = null;
const currentYear = new Date().getFullYear();

// Set up the sidebar
const yearSelect = document.getElementById('year-select');
let yearValue = currentYear;
for (let i=currentYear; i>=2009; i--) {
    yearOption = document.createElement("li");
    yearOption.value = i;
    yearOption.textContent = i;
    if (i == yearValue) yearOption.style.fontWeight = "bold";
    yearSelect.appendChild(yearOption);
}
yearSelect.addEventListener('click', (event) => {
    if (event.target.tagName == 'LI') {
        yearValue = event.target.textContent;
        for (let item of document.getElementsByTagName('li')) {
            item.style.fontWeight = "normal";
        }
        event.target.style.fontWeight = "bold";
        renderCalendar(parseInt(yearValue));
    }
});
const typeSelect = document.getElementById('type-select');
typeSelect.addEventListener('change', () => {
    sumMiles(typeSelect.value);
})

// Initial render
renderCalendar(currentYear);

function renderCalendar(year) {

    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May',
      'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const calendarTitle = document.getElementById('calendar-title');
    const calendarDays = document.getElementById('calendar-days');
    // Update title
    calendarTitle.textContent = `${year}`;

    // Clear previous days
    calendarDays.innerHTML = '';

    // Get day of week for Jan 1
    const firstDay = new Date(year, 0, 1).getDay();
    let weekDiv = document.createElement('div');
    weekDiv.classList.add('week');
    const spacerDiv = document.createElement('div');
    spacerDiv.classList.add('spacer');
    // Add week title
    const weekTitle = document.createElement('p');
    weekTitle.classList.add("week-title");
    // (firstDay+6)%7 resets first day to Mon, 7-x is number of empty days
    weekTitle.textContent = `Jan 1 - Jan ${7-(firstDay+6)%7}`;
    spacerDiv.appendChild(weekTitle);
    // Add mile count for week
    const weekMiles = document.createElement('p');
    weekMiles.classList.add('week-miles');
    spacerDiv.appendChild(weekMiles);
    weekDiv.appendChild(spacerDiv);
    calendarDays.appendChild(weekDiv);
    let total = 0;
    for (let i = 0; i < (firstDay+6)%7; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.classList.add('spacer');
        calendarDays.firstChild.appendChild(emptyDay);
        total += 1;
    }
    // Display full past years
    const today = new Date();
    let lastMonth;
    if (year == currentYear) {
        lastMonth = today.getMonth();
    } else {
        lastMonth = 11
    }
    for (let month=0; month<lastMonth+1; month++) {
        // Get date of last day of month (e.g., 31 for Jan)
        let lastDay = new Date(year, month+1, 0).getDate();
        if (month == lastMonth && year == currentYear) {
            // ((today.getDay()+6)%7) resets first day to Mon, subtract from 6 to get remaining days
            lastDay = today.getDate() + 6-((today.getDay()+6)%7);
        }
        // Add days of the month
        for (let day = 1; day <= lastDay; day++) {
            if (total % 7 == 0 && total > 0) {
                weekDiv = document.createElement('div');
                weekDiv.classList.add('week');
                const spacerDiv = document.createElement('div');
                spacerDiv.classList.add('spacer');
                // Add week title
                const weekTitle = document.createElement('p');
                weekTitle.classList.add("week-title");
                // Increment current date by 6 days to get end of week
                let date = new Date(year, month, day);
                date.setDate(date.getDate()+6);
                weekTitle.textContent = `${monthNames[month]} ${day} - ${monthNames[date.getMonth()]} ${date.getDate()}`;
                spacerDiv.appendChild(weekTitle);
                // Add mile count for week
                const weekMiles = document.createElement('p');
                weekMiles.classList.add('week-miles');
                spacerDiv.appendChild(weekMiles);
                weekDiv.appendChild(spacerDiv);
                calendarDays.insertBefore(weekDiv, calendarDays.firstChild);
            }
            const dayDiv = document.createElement('div');
            dayDiv.classList.add('day');
            if (activities) {
                for (act of activities) {
                    mn = String(month+1)
                    if (mn.length == 1) {
                        mn = "0" + mn
                    }
                    dy = String(day)
                    if (dy.length == 1) {
                        dy = "0" + dy
                    }
                    if (act.start_date_local.slice(0,10) == year + "-" + mn + "-" + dy) {
                        dayDiv.appendChild(makeBubble(act));
                    }
                }   
            }
            if (dayDiv.innerHTML == "" && new Date(year, month, day) <= today) {
                dayPlaceholderText = document.createElement('h1');
                // dayPlaceholderText.textContent = String(month+1) + "/" + String(day);
                dayPlaceholderText.textContent = 'Rest';
                dayDiv.appendChild(dayPlaceholderText);
            }
            calendarDays.firstChild.appendChild(dayDiv);
            total += 1;
        }
    }
    if (activities) {
        typeSelect.value = "All";
        sumMiles("All");
    }
}

function sumMiles(type) {
    const allWeeks = document.getElementsByClassName('week');
    for (let week of allWeeks) {
        let totalMiles = 0;
        const allBubbles = week.querySelectorAll('.bubble');
        for (let bub of allBubbles) {
            if ([...bub.classList].includes(`AAA-${type}`)) {
                bub.parentElement.style.display = "flex";
                totalMiles += parseFloat(bub.innerHTML.split(" ")[0]);
            } else {
                bub.parentElement.style.display = "none";
            }
        }
        week.children[0].children[1].textContent = `${totalMiles.toFixed(1)} mi`;
    }
}

function makeBubble(act) {
    const container = document.createElement("div");
    container.classList.add("bubble-container");
    const bubble = document.createElement("div");
    container.addEventListener('click', () => {
        window.open(`/activities?id=${act.id}`, '_blank');
    });
    // Popup description
    const popup = document.getElementById("popup");
    container.addEventListener('mouseover', () => {
        const rect = container.getBoundingClientRect();
        popup.style.display = 'block';
        popup.style.left = `${rect.left + rect.width/2 - popup.offsetWidth/2}px`;
        if (rect.bottom < window.innerHeight / 2) {
            popup.style.top = `${rect.bottom + window.scrollY}px`;
        } else {
            popup.style.top = `${rect.top - popup.offsetHeight + window.scrollY}px`;
        }
        document.getElementById("popup-title").textContent = `${act.name}`;
        const content = document.getElementById('activity-content');
        content.textContent = "";
        const labels = ["Moving Time", "Distance", "Pace"];
        const values = [
            convertTime(act.moving_time),
            (act.distance/1609.344).toFixed(1) + " mi",
            convertPace(act.moving_time/(act.distance/1609.344)) + " /mi",
        ];
        for (let i=0; i<labels.length; i++) {
            const stat = document.createElement("p");
            stat.classList.add("activity-stat");
            stat.textContent = labels[i] + ": " + values[i];
            content.appendChild(stat);
        }
        const descr = document.createElement("p");
        descr.textContent += `${act.description}`;
        content.appendChild(descr);
    });
    container.addEventListener('mouseout', () => {
        popup.style.display = 'none';
    });
    bubble.classList.add("bubble");
    bubble.classList.add("AAA-All");
    bubble.style.width = 117*(1/(1+(2.718**(-act.moving_time/60/90)))-1/6) + "px";
    bubble.style.height = 117*(1/(1+(2.718**(-act.moving_time/60/90)))-1/6) + "px";
    if (act.workout_type == 1) {
        bubble.style.outline = "2px dashed red";
        bubble.style.outlineOffset = "4px";
    }
    if (act.type == "Run") {
        bubble.classList.add("AAA-Run");
        bubble.style.backgroundColor = "rgb(30,170,30)";
        bubble.style.color = "black";
    } else if (act.type == "Walk") {
        bubble.classList.add("AAA-Walk");
        bubble.style.backgroundColor = "lightgreen";
        bubble.style.color = "black";
    } else if (act.type == "Swim") {
        bubble.classList.add("AAA-Swim");
        bubble.style.backgroundColor = "blue";
        bubble.style.color = "white";
    } else if (act.type == "Elliptical") {
        bubble.classList.add("AAA-Elliptical");
        bubble.style.backgroundColor = "purple";
        bubble.style.color = "white";
    } else {
        bubble.style.backgroundColor = "lightgrey";
        bubble.style.color = "black";
        console.log("Unknown activity type: ", act.type);
    }
    // Add mileage
    bubble.textContent = (act.distance/1609.344).toFixed(1) + " mi";
    container.appendChild(bubble);
    const bubbleTitle = document.createElement('p');
    bubbleTitle.textContent = act.name;
    container.appendChild(bubbleTitle);
    return container
}

function processActivities(acts) {
    activities = acts;
    renderCalendar(parseInt(yearValue));
}

/*---------------------------
----Strava Authentication----
---------------------------*/

const clientId = '144350';
const redirectUriAll = 'http://localhost:3000/?timeframe=all';
const redirectUriRecent = 'http://localhost:3000/?timeframe=recent';
const redirectUriEarly = 'http://localhost:3000/?timeframe=early';
const authUrlAll = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUriAll}&scope=activity:read_all,read_all&approval_prompt=auto`;
const authUrlRecent = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUriRecent}&scope=activity:read_all,read_all&approval_prompt=auto`;
const authUrlEarly = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUriEarly}&scope=activity:read_all,read_all&approval_prompt=auto`;


document.getElementById('all').href = authUrlAll;
document.getElementById('recent').href = authUrlRecent;
document.getElementById('early').href = authUrlEarly;
pickDate = document.getElementById('pick-date');
pickDate.addEventListener('change', () => {
    const spec = document.getElementById('specific');
    const redirectUriSpecific = `http://localhost:3000/?timeframe=${pickDate.value}`;
    const authUrlSpecific = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUriSpecific}&scope=activity:read_all,read_all&approval_prompt=auto`;
    spec.href = authUrlSpecific;
    
})


const params = new URLSearchParams(window.location.search);
const authorizationCode = params.get('code'); // Get the "code" parameter

if (authorizationCode) {
    console.log('Fetching', params.get('timeframe'))

    // Exchange the authorization code for an access token
    requestAccessToken(authorizationCode, params.get('timeframe'));
}

async function requestAccessToken(authorizationCode, timeframe) {
    try {
        const response = await fetch('/fetchAccessToken', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                client_id: clientId,
                code: authorizationCode,
                grant_type: 'authorization_code',
                redirect_uri: redirectUriAll,
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch access token: ${response.status}`);
        }

        const data = await response.json();

        // Fetch user activity data
        fetchActivitiesStrava(data.access_token, timeframe);
    } catch (error) {
        console.error('Error requesting access token:', error);
    }
}

async function fetchActivitiesStrava(accessToken, timeframe) {
    let afterOption = '';
    let beforeOption = '';
    let overwrite = false;
    if (timeframe == "recent") {
        let afterDate = new Date(await getMostRecentActivity());
        afterOption = '&after=' + Math.floor(afterDate.getTime() / 1000);
    } else if (timeframe == "early") {
        let beforeDate = new Date(await getLeastRecentActivity());
        beforeOption = '&before=' + Math.floor(beforeDate.getTime() / 1000);
    } else if (timeframe) {
        year = parseInt(timeframe.slice(0,4));
        month = parseInt(timeframe.slice(5,7));
        day = parseInt(timeframe.slice(8,10));
        chosenDay = new Date(year, month-1, day);
        afterOption = '&after=' + Math.floor(chosenDay.getTime() / 1000);
        beforeOption = '&before=' + Math.floor(chosenDay.getTime() / 1000 + 60*60*24);
        overwrite = true;      
    }
    const perPage = 50;
    let stravaActivities;
    for (let i=1; i<10000; i++) {
        try {
            const response = await fetch(`https://www.strava.com/api/v3/athlete/activities?per_page=${perPage}&page=${i}${afterOption}${beforeOption}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch activities: ${response.status}`);
            }

            stravaActivities = await response.json();
            console.log('User Activities:', stravaActivities);
            let detailedActivities = [];
            for (let act of stravaActivities) {
                specificActivity = await fetchSpecificActivityStrava(accessToken, act.id);
                if (!specificActivity) {
                    console.log("Couldn't get specific activity");
                    break;
                }
                detailedActivities.push(specificActivity);
            }
            putActivitiesDB(detailedActivities, overwrite);
        } catch (error) {
            console.error('Error fetching activities:', error);
            break;
        } finally {
            if (stravaActivities.length == 0) break;
        }
    }
}

async function fetchSpecificActivityStrava(accessToken, id) {
    try {
        const response = await fetch(`https://www.strava.com/api/v3/activities/${id}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch activities: ${response.status}`);
        }

        singleActivity = await response.json();
        delete singleActivity.map;
        return singleActivity
    } catch (error) {
        console.error('Error fetching activities:', error);
    }
}

/*---------------------------
--------Database Stuff-------
---------------------------*/


async function requestActivitiesDB() {
    try {
        const response = await fetch('/queryDB', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                year: String(yearValue),
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to reach server for DB: ${response.status}`);
        }

        const data = await response.json();
        console.log('Server DB response (get):', data);
        processActivities(data);

    } catch (error) {
        console.error('Error reaching server for DB:', error);
    }
}

async function putActivitiesDB(activities, overwrite) {
    try {
        const response = await fetch('/sendDB', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                activity: activities,
                overwrite: overwrite,
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to reach server for DB: ${response.status}`);
        }

        const data = await response.json();
        console.log('Server DB response (send):', data);

    } catch (error) {
        console.error('Error reaching server for DB:', error);
    }
}

async function getMostRecentActivity() {
    try {
        const response = await fetch('/ultimateDB', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to reach server for DB: ${response.status}`);
        }

        const data = await response.json();
        console.log('Server DB response (get latest):', data);
        return data

    } catch (error) {
        console.error('Error reaching server for DB:', error);
    }
}

async function getLeastRecentActivity() {
    try {
        const response = await fetch('/earliestDB', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to reach server for DB: ${response.status}`);
        }

        const data = await response.json();
        console.log('Server DB response (get earliest):', data);
        return data

    } catch (error) {
        console.error('Error reaching server for DB:', error);
    }
}
