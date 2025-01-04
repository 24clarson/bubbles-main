let activities = null;
const currentYear = new Date().getFullYear();

const yearSelect = document.getElementById('year-select');
for (let i=currentYear; i>=2009; i--) {
    yearOption = document.createElement("option");
    yearOption.value = i;
    yearOption.textContent = i;
    yearSelect.appendChild(yearOption);
}

// Initial render
yearSelect.value = currentYear;
renderCalendar(currentYear);

// Update calendar on change
yearSelect.addEventListener('change', () => {
    renderCalendar(parseInt(yearSelect.value));
});

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

    // Add empty slots for days before the first day of the month
    const firstDay = new Date(year, 0, 1).getDay();
    let weekDiv = document.createElement('div');
    weekDiv.classList.add('week');
    const spacerDiv = document.createElement('div');
    spacerDiv.classList.add('spacer');
    spacerDiv.textContent = `Jan 1 - Jan ${7-(firstDay+6)%7}`;
    weekDiv.appendChild(spacerDiv);
    calendarDays.appendChild(weekDiv);
    let total = 0;
    for (let i = 0; i < (firstDay+6)%7; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.classList.add('day', 'empty');
        calendarDays.firstChild.appendChild(emptyDay);
        total += 1;
    }
    // Display full past years
    let lastMonth;
    if (year == currentYear) {
        lastMonth = new Date().getMonth();
    } else {
        lastMonth = 11
    }
    for (let month=0; month<lastMonth+1; month++) {
        let lastDay = new Date(year, month+1, 0).getDate();
        if (month == lastMonth && year == currentYear) {
            lastDay = Math.floor(total/7) + 5;
        }
        // Add days of the month
        for (let day = 1; day <= lastDay; day++) {
            if (total % 7 == 0 && total > 0) {
                weekDiv = document.createElement('div');
                weekDiv.classList.add('week');
                const spacerDiv = document.createElement('div');
                spacerDiv.classList.add('spacer');
                date = new Date(year, month, day-1);
                date.setDate(date.getDate()+6);
                spacerDiv.textContent = `${monthNames[month]} ${day} - ${monthNames[date.getMonth()]} ${date.getDate()+1}`;
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
                    if (act.start_date.slice(0,10) == year + "-" + mn + "-" + dy) {
                        dayDiv.appendChild(makeBubble(act));
                    }
                }   
            }
            if (dayDiv.innerHTML == "") {
                dayDiv.textContent = String(month+1) + "/" + String(day);
            }
            calendarDays.firstChild.appendChild(dayDiv);
            total += 1;
        }
    }    
}

function makeBubble(act) {
    bubble = document.createElement("div");
    bubble.classList.add("bubble");
    bubble.style.width = 117*(1/(1+(2.718**(-act.moving_time/60/90)))-1/6) + "px";
    bubble.style.height = 117*(1/(1+(2.718**(-act.moving_time/60/90)))-1/6) + "px";
    if (act.type == "Run") {
        bubble.style.backgroundColor = "rgb(30,170,30)";
        bubble.style.color = "black";
    } else if (act.type == "Walk") {
        bubble.style.backgroundColor = "lightgreen";
        bubble.style.color = "black";
    } else if (act.type == "Swim") {
        bubble.style.backgroundColor = "blue";
        bubble.style.color = "white";
    } else if (act.type == "Elliptical") {
        bubble.style.backgroundColor = "red";
        bubble.style.color = "white";
    } else {
        bubble.style.backgroundColor = "lightgrey";
        bubble.style.color = "black";
        console.log("Unknown activity type: ", act.type);
    }
    // Add mileage
    bubble.textContent = (act.distance/1609.344).toFixed(1) + " mi";
    return bubble
}

function processActivities(acts) {
    activities = acts;
    renderCalendar(parseInt(yearSelect.value));
}

/*---------------------------
----Strava Authentication----
---------------------------*/

const clientId = '142021';
const redirectUriAll = 'https://bubbles-vyp2.onrender.com/?timeframe=all';
const redirectUriRecent = 'https://bubbles-vyp2.onrender.com/?timeframe=recent';
const authUrlAll = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUriAll}&scope=activity:read_all,read_all&approval_prompt=auto`;
const authUrlRecent = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUriRecent}&scope=activity:read_all,read_all&approval_prompt=auto`;

document.getElementById('all').href = authUrlAll;
document.getElementById('recent').href = authUrlRecent;

const params = new URLSearchParams(window.location.search);
const authorizationCode = params.get('code'); // Get the "code" parameter

if (authorizationCode) {
    console.log('Authorization Code:', authorizationCode);
    console.log('Fetching ', params.get('timeframe'))

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
                redirect_uri: timeframe=="recent" ? redirectUriRecent : redirectUriAll,
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch access token: ${response.status}`);
        }

        const data = await response.json();
        console.log('Access Token:', data.access_token);

        // Fetch user activity data
        fetchActivitiesStrava(data.access_token, timeframe);
    } catch (error) {
        console.error('Error requesting access token:', error);
    }
}

async function fetchActivitiesStrava(accessToken, timeframe) {
    let afterOption = '';
    if (timeframe == "recent") {
        let afterDate = new Date(await getMostRecentActivity());
        afterOption = '?after=' + Math.floor(afterDate.getTime() / 1000);
    }
    try {
        const response = await fetch(`https://www.strava.com/api/v3/athlete/activities${afterOption}`, {
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
        putActivitiesDB(stravaActivities);
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
                year: String(yearSelect.value),
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

async function putActivitiesDB(activities) {
    try {
        const response = await fetch('/sendDB', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                activity: activities
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
