const roundNum = (rawTempt) => {
    const decimal = rawTempt % Math.trunc(rawTempt);
    if (decimal < 0.5) {
        return Math.floor(rawTempt);
    }
    return Math.ceil(rawTempt)
}

const changeToCel = (kelTemp) => {
    let farTemp = (kelTemp - 273.15) * 9 / 5 + 32;
    const rawTempt = (farTemp - 32) * 5 / 9;
    return roundNum(rawTempt);
}

const getTime = (dataList, rawDate, timeZone) => {
    const time = rawDate.toLocaleString('en-GB', { timeZone: timeZone });
    const hourTime = time.split(" ")[1].split(":");
    dataList.push(hourTime[0]);
    dataList.push(hourTime[1]);
}

const formatDate = (rawDate, timeZone) => {
    let dataFormat = []

    switch (rawDate.getDay()) {
        case 1:
            dataFormat.push("Monday");
            break;
        case 2:
            dataFormat.push("Tuesday");
            break;
        case 3:
            dataFormat.push("Wednesday");
            break;
        case 4:
            dataFormat.push("Thursday");
            break;
        case 5:
            dataFormat.push("Friday");
            break;
        case 6:
            dataFormat.push("Saturday");
            break;
        case 0:
            dataFormat.push("Sunday");
            break;
    }
    getTime(dataFormat, rawDate, timeZone);
    return dataFormat;
}

// rate result
const indexRating = (data, low, normal) => {
    if (data <= low) {
        return "Low"
    }
    if (data <= normal) {
        return "Normal"
    }
    return "High"
}

// change display on search
const changeWeatherToday = (resWeather) => {
    let celciusTemp;
    let temptSign;
    if (celciusType) {
        celciusTemp = changeToCel(resWeather.temp);
        temptSign = "°C";
    } else {
        celciusTemp = roundNum((resWeather.temp - 273.15) * 9 / 5 + 32);
        temptSign = "°F";
    }

    const date = new Date(resWeather.dt * 1000);

    const dateFormatted = formatDate(date, resWeather.timeZone);

    document.getElementById("currentIcon").setAttribute("src", `./img/${resWeather.icon}.png`)

    document.getElementById("featureState1").innerHTML = `
            <img src="./img/${resWeather.icon}.png" alt="weather-icon">
            ${resWeather.main}
    `;

    document.getElementById("featureState2").innerHTML = `
            <img src="./img/rain.svg" alt="weather-icon">
            ${resWeather.description}
    `;

    document.getElementById("currentTemp").innerHTML = ` ${celciusTemp} 
            <sup id="temperature__sign">${temptSign}</sup>
        `;

    document.getElementById("locationName").innerHTML = resWeather.fullAddress;
    document.getElementById("updateTime").innerHTML = `
            ${dateFormatted[0]},  
            <span>${dateFormatted[1]}:${dateFormatted[2]}</span>
        `
}

const changeWeek = (resWeather) => {
    const weekDataList = resWeather.data;

    for (let i = 0; i < 7; i++) {
        let currentCardChild = document.getElementById(`dayAfter-${i}`).children;
        const date = new Date(weekDataList[i].dt * 1000);
        if (i != 0) {
            currentCardChild[0].innerHTML = `${formatDate(date, resWeather.timeZone)[0]}`;
        }

        currentCardChild[1].setAttribute("src", `./img/${weekDataList[i].weather[0].icon}.png`);

        if (celciusType) {
            currentCardChild[2].innerHTML = `
                ${changeToCel(weekDataList[i].temp.min)}°
                <span class="temperature__type">${changeToCel(weekDataList[i].temp.max)}°</span>
            `;
        } else {
            currentCardChild[2].innerHTML = `
                ${roundNum((weekDataList[i].temp.min - 273.15) * 9 / 5 + 32)}°
                <span class="temperature__type">${roundNum((weekDataList[i].temp.max - 273.15) * 9 / 5 + 32)}°</span>
            `;
        }

    }
}

const changeHighlight = (resWeather) => {
    const rawSunrise = new Date(resWeather.sunrise * 1000);
    const rawSunset = new Date(resWeather.sunset * 1000);

    document.getElementById("sunriseTime").innerHTML = `
            ${formatDate(rawSunrise, resWeather.timeZone)[1]}:${formatDate(rawSunrise,resWeather.timeZone)[2]} AM
        `
    document.getElementById("sunsetTime").innerHTML = `
            ${formatDate(rawSunset,resWeather.timeZone)[1]}:${formatDate(rawSunset,resWeather.timeZone)[2]} PM
        `

    document.getElementById("highlight__uv").innerHTML = resWeather.uvi;
    document.getElementById("quality__uv").innerHTML = `
            ${indexRating(resWeather.uvi, 3, 5)}
        `;
    document.getElementById("windVelocity").innerHTML = `
            ${resWeather.wind_speed}
            <span>m/h</span>
        `;
    document.getElementById("highlight__humid").innerHTML = `
            ${resWeather.humidity}
            <span>%</span>
        `;
    document.getElementById("quality__humid").innerHTML = `
            ${indexRating(resWeather.humidity, 30, 60)}
        `;
    document.getElementById("highlight__visibility").innerHTML = `
            ${roundNum(resWeather.visibility) / 1000}
            <span>km</span>
        `;
    document.getElementById("visibilityEvaluate").innerHTML = `
            ${indexRating(resWeather.visibility / 1000, 5, 16)}
        `;
}

const main = (e) => {
    const address = document.getElementById("inputSearch").value;

    const promiseGCode = getGeoCode(address);

    promiseGCode
        .then((res) => {
            return getWeather(res.lat, res.lng, res.fullAddress);

        }).then((resWeather) => {
            changeWeatherToday(resWeather);
            changeWeek(resWeather)
            changeHighlight(resWeather);

        }).catch((err) => {
            console.log(err);
            alert("Error in getting data");
        })

    e.preventDefault();
}

const getGeoCode = (address) => {
    return new Promise((resolve, reject) => {
        superagent
            .get(`https://api.opencagedata.com/geocode/v1/json?q=${address}&key=5c8df751071e43bc928bb8db408cfef6`)
            .end((err, res) => {
                if (err) { reject(err); }

                const fullAddress = res.body.results[0].formatted;
                const { lat, lng } = res.body.results[0].geometry;
                const data = { lat, lng, fullAddress };
                resolve(data);
            });
    })
}

const getWeather = (lat, lng, fullAddress) => {
    return new Promise((resolve, reject) => {
        superagent
            .get(`https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lng}&exclude=hourly&appid=f6e57b8b0083d328b4e416fab95e15f3`)
            .end((err, res) => {
                if (err) { reject(err) }

                const { main, description, icon } = res.body.current.weather[0]; //main: (rain/snow), description: specific (light rain, hard snow)
                const { temp, humidity, sunrise, sunset, visibility, uvi, wind_speed } = res.body.current;
                const timeZone = res.body.timezone;
                const dt = res.body.current.dt;
                const data = res.body.daily;

                const dataNeeded = { main, description, icon, timeZone, temp, humidity, sunrise, sunset, visibility, uvi, wind_speed, fullAddress, dt, data };
                resolve(dataNeeded);
            })
    })
}

// change degree display
let celciusType = true;
document.getElementById("celcius").onclick = () => {
    if (celciusType) {
        return;
    }
    celciusType = true;
    document.getElementById("fahrenheit").classList.remove("active");
    document.getElementById("celcius").classList.add("active");
    document.getElementById("temperature__sign").innerHTML = "°C"
    if (document.getElementById("inputSearch").value != "") {
        main();
    }
}

document.getElementById("fahrenheit").onclick = () => {
    if (!celciusType) {
        return;
    }
    celciusType = false;
    document.getElementById("fahrenheit").classList.add("active");
    document.getElementById("celcius").classList.remove("active");
    document.getElementById("temperature__sign").innerHTML = "°F"
    if (document.getElementById("inputSearch").value != "") {
        main();
    }
}

const locationForm = document.getElementById("locationForm");
locationForm.addEventListener('submit', main);