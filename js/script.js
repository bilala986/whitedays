$(document).ready(function () {
    const $moonImg = $("#moon-img");
    const $moonInfo = $("#moon-info");
    const $currentDate = $("#current-date");
    const $locationForm = $("#location-form");
    const $hijriInfo = $("#hijri-info");
    const $hijriDay = $("#hijri-day");
    const $hijriMonth = $("#hijri-month");
    const $hijriYear = $("#hijri-year");
    const $countrySelect = $("#country");
    const $gregorianDate = $("#gregorian-date");
    const gregorianMonths = [
    "January","February","March","April","May","June","July","August","September","October","November","December"
];

const hijriMonths = [
    "Muharram","Safar","Rabi’ al-Awwal","Rabi’ al-Thani","Jumada al-Awwal","Jumada al-Thani","Rajab","Sha’ban","Ramadan","Shawwal","Dhul Qa’dah","Dhul Hijjah"
];


    // --- Hijri & Gregorian date display ---
    function updateHijri() {
        const todayHijri = HijriJS.today();
        if (todayHijri) {
            // --- Main display: numeric only ---
            $hijriInfo.text(`${todayHijri.day}/${String(todayHijri.month).padStart(2, "0")}/${todayHijri.year}H`);

            // --- Modal display: with month name ---
            const hijriMonths = [
                "Muharram", "Safar", "Rabiʿ al-Awwal", "Rabiʿ al-Thani",
                "Jumada al-Awwal", "Jumada al-Thani", "Rajab", "Shaʿban",
                "Ramadan", "Shawwal", "Dhu al-Qadah", "Dhu al-Hijjah"
            ];
            const monthName = hijriMonths[todayHijri.month - 1];

            $hijriDay.text(`Day: ${todayHijri.day}`);
            $hijriMonth.text(`Month: ${monthName}`);
            $hijriYear.text(`Year: ${todayHijri.year}`);

            // Gregorian date numeric (unchanged)
            const todayGregorian = new Date();
            const dd = String(todayGregorian.getDate()).padStart(2, "0");
            const mm = String(todayGregorian.getMonth() + 1).padStart(2, "0");
            const yyyy = todayGregorian.getFullYear();
            $gregorianDate.text(`${dd}/${mm}/${yyyy}`);
        } else {
            $hijriInfo.text("Error calculating Hijri date");
            $gregorianDate.text("");
        }
    }




    updateHijri(); // Call once on page load
    
    
    // Utility: format date as YYYY-MM-DD
    function formatDate(date) {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, "0");
        const dd = String(date.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
    }
    
    
    
    

    // Helper: Rough timezone offset from longitude (approximate)
    function getUtcOffset(lon) {
        return Math.round(lon / 15);
    }

    // Update White Day Info for a specific location (lat/lon)
    function updateWhiteDayInfo(lat = null, lon = null) {
        const $info = $("#white-day-info");
        const $preloader = $("#white-day-preloader");

        $preloader.show();
        $info.hide();

        try {
            let now = new Date();
            if (lat !== null && lon !== null) {
                const offsetHours = getUtcOffset(lon);
                now = new Date(now.getTime() + offsetHours * 60 * 60 * 1000);
            }

            // Convert Gregorian date to Hijri using your Hijri.js
            const year = now.getFullYear();
            const month = now.getMonth() + 1; // JS months start at 0
            const day = now.getDate();

            const todayHijri = HijriJS.gregorianToHijri(year, month, day);
            if (!todayHijri) throw new Error("Hijri date not calculated");

            const hijriDay = todayHijri.day;
            const hijriMonth = todayHijri.month;
            const hijriYear = todayHijri.year;

            let message = "";
            let countdown = "";

            // White days: 13, 14, 15
            if (hijriDay >= 13 && hijriDay <= 15) {
                message = "<strong>It is currently a White Day!</strong>";
                countdown = "";
            } else {
                message = "<strong>It is not a White Day.</strong>";

                // Determine next 13th
                let next13Month = hijriMonth;
                let next13Year = hijriYear;
                if (hijriDay > 15) {
                    next13Month++;
                    if (next13Month > 12) {
                        next13Month = 1;
                        next13Year++;
                    }
                }

                // Hijri month length using Umm al-Qura
                const currentMonthIndex = (hijriYear - 1) * 12 + hijriMonth - 1;
                const nextMonthIndex = currentMonthIndex + 1;
                let daysThisMonth = HijriJS.ummalqura_dat[nextMonthIndex] - HijriJS.ummalqura_dat[currentMonthIndex];
                if (!daysThisMonth) daysThisMonth = 30;

                let daysUntilNext13;
                if (hijriDay < 13) {
                    daysUntilNext13 = 13 - hijriDay;
                } else {
                    daysUntilNext13 = daysThisMonth - hijriDay + 13;
                }

                countdown = `Next White Day in <strong>${daysUntilNext13}</strong> day(s)`;
            }

            $info.html(`${message}<br>${countdown}`);
        } catch (e) {
            $info.html("Error calculating White Day info");
            console.error(e);
        } finally {
            $preloader.hide();
            $info.fadeIn(300);
        }
    }

    // Call once on page load
    updateWhiteDayInfo();

    // Update dynamically every minute
    setInterval(() => updateWhiteDayInfo(), 60 * 1000);

    
    
    
    
    
    
    
    
    
    
    
    // AJAX call for moon image
    function fetchMoon(lat, lon, date) {
        const $moonImg = $("#moon-img");
        const $preloader = $("#moon-preloader");
        const $moonContent = $("#moon-content");

        // Hide content initially
        $moonContent.hide();
        $preloader.show();
        $moonImg.css("opacity", 0);

        window.moonImageReady = false;
        window.moonDetailsReady = false;

        $.getJSON("api/moon-image.php", { lat, lon, date })
            .done(function(data) {
                console.log("Moon Image API Response:", data);
                if (data.status === "success" && data.imageUrl) {
                    $moonImg.off("load")
                            .attr("src", data.imageUrl)
                            .one("load", function() {
                                $(this).css("opacity", 1);
                                window.moonImageReady = true;
                                // Only show content if details are ready
                                if (window.moonDetailsReady) {
                                    $preloader.fadeOut(400, () => $moonContent.fadeIn(400));
                                }
                            });
                } else {
                    console.warn("Moon image not available");
                    window.moonImageReady = true;
                    if (window.moonDetailsReady) {
                        $preloader.fadeOut(400, () => $moonContent.fadeIn(400));
                    }
                }
            })
            .fail(function() {
                console.error("Moon image AJAX error");
                window.moonImageReady = true;
                if (window.moonDetailsReady) {
                    $preloader.fadeOut(400, () => $moonContent.fadeIn(400));
                }
            });
    }


    // AJAX call for moon details
    function fetchMoonDetails(lat, lon, date) {
        const $preloader = $("#moon-preloader");
        const $moonContent = $("#moon-content");

        // Don't show content yet — wait for image
        $.getJSON("api/moon-details.php", { lat, lon, date })
            .done(function(data) {
                console.log("Moon Details API Response:", data);
                if (data.status === "success") {
                    $("#moon-info").html(
                        `Current Phase: ${data.phaseName} (${data.illumination}%)<br>` +
                        `Next Full Moon: ${data.nextFullMoonDate}<br>` +
                        `<small class="text-secondary">Disclaimer: These values are approximate and may be slightly inaccurate.</small>`
                    );
                } else {
                    $("#moon-info").text("Error: " + (data.message || "Unknown error"));
                }
                window.moonDetailsReady = true;
                // Only show content if image is ready
                if (window.moonImageReady) {
                    $preloader.fadeOut(400, () => $moonContent.fadeIn(400));
                }
            })
            .fail(function() {
                $("#moon-info").text("Error: Could not contact server.");
                window.moonDetailsReady = true;
                if (window.moonImageReady) {
                    $preloader.fadeOut(400, () => $moonContent.fadeIn(400));
                }
            });
    }


    
    


    let countriesData = [];

    $.getJSON("json/countries.json", function (data) {
        countriesData = data; // save all countries
        data.forEach(function (country) {
            $countrySelect.append(
                $("<option>", {
                    value: country.name,
                    text: `${country.emoji} ${country.name}`,
                    "data-lat": country.latitude,
                    "data-lon": country.longitude
                })
            );
        });
    }).fail(function () {
        console.error("Could not load countries.json");
    });


    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lon = pos.coords.longitude;
                const today = formatDate(new Date());

                // Find closest country
                let closestCountry = null;
                let minDistance = Infinity;

                countriesData.forEach((c) => {
                    const dLat = lat - c.latitude;
                    const dLon = lon - c.longitude;
                    const dist = Math.sqrt(dLat*dLat + dLon*dLon);
                    if (dist < minDistance) {
                        minDistance = dist;
                        closestCountry = c;
                    }
                });

                // If found, set dropdown value
                if (closestCountry) {
                    $countrySelect.val(closestCountry.name);
                }

                // Fetch moon image & details
                fetchMoon(lat, lon, today);
                fetchMoonDetails(lat, lon, today);
            },
            (err) => {
                console.warn("Geolocation failed or denied.", err);
                $countrySelect.val(""); // fallback: show default "Country"
                $locationForm.show();
            }
        );
    } else {
        console.warn("Geolocation not supported.");
        $countrySelect.val(""); // fallback: show default "Country"
        $locationForm.show();
    }


    // Manual location submission
    $locationForm.on("submit", function (e) {
        e.preventDefault();

        const selected = $countrySelect.find(":selected");
        const lat = parseFloat(selected.data("lat"));
        const lon = parseFloat(selected.data("lon"));
        const today = formatDate(new Date());

        if (!lat || !lon) {
            alert("Please select a valid country.");
            return;
        }

        // Show moon preloader
        $("#moon-preloader").show();
        window.moonImageReady = false;
        window.moonDetailsReady = false;
        fetchMoon(lat, lon, today);
        fetchMoonDetails(lat, lon, today);

        // Show countdown preloader and update white day info for selected country
        updateWhiteDayInfo(lat, lon);
    });
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    // Toggle between Hijri and Gregorian in Unified Calendar
    document.getElementById('toggleHijriCalendar').addEventListener('click', function () {
        document.getElementById('hijriCalendar').classList.remove('d-none');
        document.getElementById('gregorianCalendar').classList.add('d-none');
        this.classList.add('active');
        document.getElementById('toggleGregorianCalendar').classList.remove('active');
    });

    document.getElementById('toggleGregorianCalendar').addEventListener('click', function () {
        document.getElementById('gregorianCalendar').classList.remove('d-none');
        document.getElementById('hijriCalendar').classList.add('d-none');
        this.classList.add('active');
        document.getElementById('toggleHijriCalendar').classList.remove('active');
    });
    
    // Moon phase calculation helper (simplified)
    function getMoonPhaseIcon(date) {
        const lp = 2551443; // lunar period in seconds
        const now = date.getTime() / 1000;
        const newMoon = new Date(2000, 0, 6, 18, 14).getTime() / 1000;
        const phase = ((now - newMoon) % lp) / lp;

        if (phase < 0.03 || phase > 0.97) return '<i class="fa-solid fa-moon"></i>';        // New Moon
        if (phase < 0.22) return '<i class="fa-regular fa-moon"></i>';                      // Waxing Crescent
        if (phase < 0.28) return '<i class="fa-solid fa-circle-half-stroke"></i>';          // First Quarter
        if (phase < 0.47) return '<i class="fa-regular fa-circle"></i>';                     // Waxing Gibbous
        if (phase < 0.53) return '<i class="fa-solid fa-circle"></i>';                       // Full Moon
        if (phase < 0.72) return '<i class="fa-regular fa-circle"></i>';                     // Waning Gibbous
        if (phase < 0.78) return '<i class="fa-solid fa-circle-half-stroke"></i>';           // Last Quarter
        return '<i class="fa-regular fa-moon"></i>';                                         // Waning Crescent
    }

    // Build Gregorian Calendar
    function buildGregorianCalendar() {
        const tbody = document.getElementById('gregorianCalendarBody');
        tbody.innerHTML = "";

        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();

        // Set header month/year
        document.getElementById("gregorianMonthYear").innerText =
            `${gregorianMonths[month]} ${year}`;

        const firstDay = new Date(year, month, 1).getDay(); // Sunday=0
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        let row = document.createElement('tr');

        // Blank cells before first day
        for (let i = 0; i < firstDay; i++) {
            row.appendChild(document.createElement('td'));
        }

        for (let day = 1; day <= daysInMonth; day++) {
            if (row.children.length === 7) {
                tbody.appendChild(row);
                row = document.createElement('tr');
            }

            // Normalize date to noon to match Hijri calendar calculation
            const gDate = new Date(year, month, day);
            gDate.setHours(12, 0, 0, 0);

            const hijriDate = HijriJS.gregorianToHijri(year, month + 1, day);

            const cell = document.createElement('td');
            cell.innerHTML = `
                <div>${day}</div>
                <div class="small">${getMoonPhaseIcon(gDate)}</div>
            `;

            // Highlight White Days (Hijri 13–15)
            if (hijriDate.day >= 13 && hijriDate.day <= 15) {
                cell.classList.add("table-secondary", "text-dark");
                cell.querySelector("div:first-child").classList.add("fw-bold"); // only day number bold
            }

            // Highlight Today (Gregorian, exact match)
            if (
                gDate.getDate() === today.getDate() &&
                gDate.getMonth() === today.getMonth() &&
                gDate.getFullYear() === today.getFullYear()
            ) {
                cell.classList.add("table-active"); // light grey bg
                cell.querySelector("div:first-child").classList.add("fw-bold"); // only day number bold
            }

            row.appendChild(cell);
        }

        // Fill the rest of the row
        while (row.children.length < 7) {
            row.appendChild(document.createElement('td'));
        }
        tbody.appendChild(row);
    }

    // Build Hijri Calendar
    function buildHijriCalendar() {
        const tbody = document.getElementById('hijriCalendarBody');
        tbody.innerHTML = "";

        const today = HijriJS.today();
        const hijriYear = today.year;
        const hijriMonth = today.month;

        // Set header month/year
        document.getElementById("hijriMonthYear").innerText =
            `${hijriMonths[hijriMonth - 1]} ${hijriYear} AH`;

        const monthIndex = (hijriYear - 1) * 12 + hijriMonth - 1;
        const nextMonthIndex = monthIndex + 1;
        let daysInMonth = HijriJS.ummalqura_dat[nextMonthIndex] - HijriJS.ummalqura_dat[monthIndex];
        if (!daysInMonth) daysInMonth = 30;

        const firstHijriDate = HijriJS.hijriToGregorian(hijriYear, hijriMonth, 1);
        // UTC weekday to fix misalignment
        const firstDay = new Date(Date.UTC(firstHijriDate.gy, firstHijriDate.gm - 1, firstHijriDate.gd, 12, 0, 0)).getUTCDay();

        let row = document.createElement('tr');

        // Add empty cells before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            row.appendChild(document.createElement('td'));
        }

        for (let day = 1; day <= daysInMonth; day++) {
            if (row.children.length === 7) {
                tbody.appendChild(row);
                row = document.createElement('tr');
            }

            const gDateObj = HijriJS.hijriToGregorian(hijriYear, hijriMonth, day);
            const gDate = new Date(Date.UTC(gDateObj.gy, gDateObj.gm - 1, gDateObj.gd, 12, 0, 0)); // noon UTC

            const cell = document.createElement('td');
            cell.innerHTML = `
                <div>${day}</div>
                <div class="small">${getMoonPhaseIcon(gDate)}</div>
            `;

            if (day >= 13 && day <= 15) {
                cell.classList.add("table-secondary", "text-dark");
                cell.querySelector("div:first-child").classList.add("fw-bold");
            }

            if (day === today.day && hijriMonth === today.month && hijriYear === today.year) {
                cell.classList.add("table-active");
                cell.querySelector("div:first-child").classList.add("fw-bold");
            }

            row.appendChild(cell);
        }

        while (row.children.length < 7) {
            row.appendChild(document.createElement('td'));
        }
        tbody.appendChild(row);
    }



    // Initialize both calendars when modal opens
    $('#calendarModal').on('shown.bs.modal', function () {
        buildGregorianCalendar();
        buildHijriCalendar();
    });




    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    

});
