const roundNum = (rawTempt) => {
    const decimal = rawTempt % Math.trunc(rawTempt);
    if (decimal < 0.5) {
        return Math.floor(rawTempt);
    }
    return Math.ceil(rawTempt)
}

const changeToCel = (farTemp) => {
    const rawTempt = (farTemp - 32) * 5 / 9;
    return roundNum(rawTempt);
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

    const time = rawDate.toLocaleString("en-GB", { timeZone: timeZone });
    const hourTime = time.split(" ")[1].split(":");
    dataFormat.push(hourTime[0]);
    dataFormat.push(hourTime[1])

    return dataFormat;
}

// rate result
const indexRating = (data, low, normal) => {
    if (data <= low) {
        return "Low"
    } else if (data <= normal) {
        return "Normal"
    } else {
        return "High"
    }
}

// change display on search
const changeWeatherToday = (resWeather) => {
    let celciusTemp;
    let temptSign;
    if (celciusType){
        celciusTemp = changeToCel(resWeather.temperature);
        temptSign = "°C";
    } else{
        celciusTemp = roundNum(resWeather.temperature);
        temptSign = "°F";
    }
    const date = new Date(resWeather.time * 1000);
    const dateFormatted = formatDate(date, resWeather.timeZone);

    document.getElementById("currentIcon").setAttribute("src", `./img/${resWeather.icon}.svg`)

    document.getElementById("featureState1").innerHTML = `
            <img src="./img/${resWeather.icon}.svg" alt="weather-icon">
            ${resWeather.summary}
    `;

    if (resWeather.precipType != undefined) {
        document.getElementById("featureState2").innerHTML = `
                <img src="./img/rain.svg" alt="weather-icon">
        
                ${resWeather.precipType}
            `
    }

    document.getElementById("currentTemp").innerHTML = `
            ${celciusTemp} 
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
        const date = new Date(weekDataList[i].time * 1000);
        if (i != 0) {
            currentCardChild[0].innerHTML = `${formatDate(date)[0]}`;
        }

        currentCardChild[1].setAttribute("src", `./img/${weekDataList[i].icon}.svg`);

        if (celciusType){
            currentCardChild[2].innerHTML = `
                ${changeToCel(weekDataList[i].apparentTemperatureHigh)}°
                <span class="temperature__type">${changeToCel(weekDataList[i].apparentTemperatureLow)}°</span>
            `;
        } else{
            currentCardChild[2].innerHTML = `
                ${roundNum(weekDataList[i].apparentTemperatureHigh)}°
                <span class="temperature__type">${roundNum(weekDataList[i].apparentTemperatureLow)}°</span>
            `;
        }

        
    }
}

const changeHighlight = (resWeather) => {
    document.getElementById("highlight__uv").innerHTML = resWeather.uvIndex;
    document.getElementById("quality__uv").innerHTML = `
            ${indexRating(resWeather.uvIndex, 3, 7)}
        `;

    document.getElementById("windVelocity").innerHTML = `
            ${resWeather.windSpeed}
            <span>km/h</span>
        `;

    const todayExtendedData = resWeather.data[0];
    const sunrise = new Date(todayExtendedData.sunriseTime * 1000)
    const sunset = new Date(todayExtendedData.sunsetTime * 1000)
    document.getElementById("sunriseTime").innerHTML = `
            ${formatDate(sunrise, resWeather.timeZone)[1]}:${formatDate(sunrise, resWeather.timeZone)[2]} AM
        `
    document.getElementById("sunsetTime").innerHTML = `
            ${formatDate(sunset, resWeather.timeZone)[1]}:${formatDate(sunset, resWeather.timeZone)[2]} AM
        `

    document.getElementById("highlight__humid").innerHTML = `
            ${resWeather.humidity * 100}
            <span>%</span>
        `;
    document.getElementById("quality__humid").innerHTML = `
            ${indexRating(resWeather.quality__humid, 0.3, 0.6)}
        `;

    document.getElementById("highlight__visibility").innerHTML = `
            ${roundNum(resWeather.visibility)}
            <span>km</span>
        `;
    document.getElementById("visibilityEvaluate").innerHTML = `
            ${indexRating(resWeather.quality__humid, 0.3, 0.6)}
        `;
}

const main = (e) => {
    const address = document.getElementById("inputSearch").value;

    const promiseGCode = getGeoCode(address);

    promiseGCode
        .then((res) => {
            return getWeather(res.lat, res.lng, res.fullAddress);    // nhận hàm then() tiếp theo

        }).then((resWeather) => {                   // res này là return của getWeather() => promise chain
            //today main weather
            changeWeatherToday(resWeather);

            //change week
            changeWeek(resWeather)

            //today highlight
            changeHighlight(resWeather);

        }).catch((err) => {
            console.log(err)
        })

    e.preventDefault();
}


// get information
const getGeoCode = (address) => {
    return new Promise((resolve, reject) => {
        // use superagent: lấy dữ liệu asyncronous: khi trả dữ liệu về mới chạy hàm end()
        superagent
            .get(`https://maps.googleapis.com/maps/api/geocode/json?key=AIzaSyDBunJ4GXNEC3KJlpoGJO-iB--CjPv4o-s&address=${address}`)
            .end((err, res) => {
                if (err) {
                    reject(err)
                }

                const fullAddress = res.body.results[0].formatted_address;
                const { lat, lng } = res.body.results[0].geometry.location;
                const data = { lat, lng, fullAddress };
                resolve(data);
            });
    })
}

const getWeather = (lat, lng, fullAddress) => {
    return new Promise((resolve, reject) => {
        superagent
            .get(`https://cors-anywhere.herokuapp.com/https://api.darksky.net/forecast/7bbecca28cbc31d7c6739e70baa64e46/${lat},${lng}`)
            .end((err, res) => {
                if (err) {
                    reject(err)
                }

                console.log(res)
                const { summary, temperature, time, icon, humidity, windSpeed, uvIndex, visibility, precipType } = res.body.currently;
                const timeZone = res.body.timezone;
                const data = res.body.daily.data;

                const dataNeeded = { summary, temperature, fullAddress, time, timeZone, icon, humidity, windSpeed, uvIndex, visibility, precipType, data };
                resolve(dataNeeded);
            })
    })
}

// change degree display
let celciusType = true;    //celcius
document.getElementById("celcius").onclick = () => {
    if (celciusType) {
        return;
    }
    celciusType = true;
    document.getElementById("fahrenheit").classList.remove("active");
    document.getElementById("celcius").classList.add("active");
    document.getElementById("temperature__sign").innerHTML = "°C"
    if(document.getElementById("inputSearch").value !=""){
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
    if(document.getElementById("inputSearch").value !=""){
        main();
    }
}

const locationForm = document.getElementById("locationForm");
locationForm.addEventListener('submit', main);