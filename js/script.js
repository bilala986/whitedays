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
    const hijriMonths = [
        "", // index 0 placeholder (since months are 1–12)
        "Muharram",
        "Safar",
        "Rabiʿ al-Awwal",
        "Rabiʿ al-Thani",
        "Jumada al-Awwal",
        "Jumada al-Thani",
        "Rajab",
        "Shaʿban",
        "Ramadan",
        "Shawwal",
        "Dhu al-Qiʿdah",
        "Dhu al-Hijjah"
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


    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    



    
    
    
    
    
    
    
    
    
    
    
    
    // -----------------------------
    // Utility: Generate days of a month
    // -----------------------------
    function generateMonthDays(year, month) {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        return Array.from({ length: daysInMonth }, (_, i) => i + 1);
    }

    // -----------------------------
    // Utility: Approximate Hijri conversion (Gregorian -> Hijri)
    // -----------------------------
    function getHijriDate(gDate = new Date()) {
        // Very rough approximation
        const hijriEpoch = new Date(622, 6, 16); // July 16, 622 CE
        const dayMs = 1000 * 60 * 60 * 24;
        const diffDays = Math.floor((gDate - hijriEpoch) / dayMs);
        const hijriYear = Math.floor(diffDays / 354.367) + 1; // lunar year ~354.367 days
        const hijriMonth = Math.floor((diffDays % 354.367) / 29.53);
        const hijriDay = Math.floor((diffDays % 29.53)) + 1;
        return { hijriYear, hijriMonth, hijriDay };
    }

    // -----------------------------
    // Calculate moon phase info (returns Font Awesome icons)
    // Returns: { age, phaseName, iconClass, transform }
    // -----------------------------
    function getMoonPhaseInfo(year, month, day) {
        const knownNewMoon = new Date(2000, 0, 6);
        const date = new Date(year, month, day);
        const diff = (date - knownNewMoon) / (1000 * 60 * 60 * 24);
        const synodicMonth = 29.53058867;
        let age = diff % synodicMonth;
        if (age < 0) age += synodicMonth;

        let phaseName = '';
        let iconClass = '';
        let transform = '';

        if (age < 1.84566) {
            phaseName = 'New Moon';
            iconClass = 'fa-regular fa-circle';
        } else if (age < 5.53699) {
            phaseName = 'Waxing Crescent';
            iconClass = 'fa-solid fa-moon';
            transform = 'scaleX(1)';
        } else if (age < 9.22831) {
            phaseName = 'First Quarter';
            iconClass = 'fa-solid fa-moon';
            transform = 'scaleX(1)';
        } else if (age < 12.91963) {
            phaseName = 'Waxing Gibbous';
            iconClass = 'fa-solid fa-moon';
            transform = 'scaleX(1)';
        } else if (age < 16.61096) {
            phaseName = 'Full Moon';
            iconClass = 'fa-solid fa-circle';
        } else if (age < 20.30228) {
            phaseName = 'Waning Gibbous';
            iconClass = 'fa-solid fa-moon';
            transform = 'scaleX(-1)';
        } else if (age < 23.99361) {
            phaseName = 'Last Quarter';
            iconClass = 'fa-solid fa-moon';
            transform = 'scaleX(-1)';
        } else {
            phaseName = 'Waning Crescent';
            iconClass = 'fa-solid fa-moon';
            transform = 'scaleX(-1)';
        }

        return { age: age.toFixed(1), phaseName, iconClass, transform };
    }



    let currentCalendar = 'lunar'; // default

    // -----------------------------
    // Populate calendar
    // -----------------------------
    function populateCalendar(isHijri = false) {
        const container = document.getElementById('calendar-container');
        container.innerHTML = '';
        container.style.justifyContent = 'center'; // center the calendar

        const today = new Date();
        const hijriToday = getHijriDate(today);
        const year = today.getFullYear();
        const month = today.getMonth();
        const days = generateMonthDays(year, month);

        // Month name
        const monthNameDiv = document.createElement('div');
        monthNameDiv.className = 'fw-bold mb-3 text-center';
        monthNameDiv.id = 'calendar-month-name';
        monthNameDiv.textContent = isHijri
            ? `${hijriMonths[hijriToday.hijriMonth]} ${hijriToday.hijriYear} H`
            : today.toLocaleString('default', { month: 'long', year: 'numeric' });

        // Remove old month name if exists
        const oldMonthName = document.getElementById('calendar-month-name');
        if (oldMonthName) oldMonthName.remove();

        container.parentElement.insertBefore(monthNameDiv, container);

        // Days of week header
        const daysOfWeek = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
        const headerRow = document.createElement('div');
        headerRow.className = 'd-flex justify-content-center gap-2 mb-2 calendar-header-row';
        daysOfWeek.forEach(dayName => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'text-center fw-bold';
            dayHeader.style.width = '60px';
            dayHeader.textContent = dayName;
            headerRow.appendChild(dayHeader);
        });
        container.appendChild(headerRow);

        // Week grid
        const firstDay = isHijri
            ? (new Date(year, month, 1).getDay() + hijriToday.hijriDay - 1) % 7
            : new Date(year, month, 1).getDay();
        let weekRow = document.createElement('div');
        weekRow.className = 'd-flex justify-content-center gap-2 mb-2';

        // Empty slots before first day
        for (let i = 0; i < firstDay; i++) {
            const emptyDiv = document.createElement('div');
            emptyDiv.style.width = '60px';
            weekRow.appendChild(emptyDiv);
        }

        // Populate days
        days.forEach((day, idx) => {
            const { age, phaseName, iconClass, transform } = getMoonPhaseInfo(year, month, day);

            const dayDiv = document.createElement('div');
            dayDiv.className = 'text-center';
            dayDiv.style.width = '60px';
            dayDiv.style.padding = '2px';

            // Highlight current date
            const isCurrent = isHijri ? (day === hijriToday.hijriDay) : (day === today.getDate());
            if (isCurrent) {
                dayDiv.style.backgroundColor = '#555';
                dayDiv.style.borderRadius = '0.5rem';
            }

            const dayNumber = document.createElement('div');
            dayNumber.className = 'fw-bold mb-1';
            dayNumber.textContent = day;

            const moonIcon = document.createElement('i');
            moonIcon.className = `${iconClass} fs-4`;
            moonIcon.title = `${phaseName} (Age: ${age} days)`;

            if (transform) {
                moonIcon.style.transform = transform;
            }

            dayDiv.appendChild(dayNumber);
            dayDiv.appendChild(moonIcon);
            weekRow.appendChild(dayDiv);

            if ((idx + firstDay + 1) % 7 === 0) {
                container.appendChild(weekRow);
                weekRow = document.createElement('div');
                weekRow.className = 'd-flex justify-content-center gap-2 mb-2';
            }
        });

        // Fill remaining slots in last week
        if (weekRow.children.length > 0) {
            while (weekRow.children.length < 7) {
                const emptyDiv = document.createElement('div');
                emptyDiv.style.width = '60px';
                weekRow.appendChild(emptyDiv);
            }
            container.appendChild(weekRow);
        }
    }

    // -----------------------------
    // Update calendar view with fade
    // -----------------------------
    function updateCalendarView() {
        const isHijri = currentCalendar === 'lunar';
        const container = document.getElementById('calendar-container');
        const monthNameDiv = document.getElementById('calendar-month-name');
        const headerRow = document.querySelector('.calendar-header-row');

        // Fade out
        [container, monthNameDiv, headerRow].forEach(el => el?.classList.add('fade-out'));

        setTimeout(() => {
            populateCalendar(isHijri);

            // Update description
            const description = document.getElementById('calendar-description');
            description.innerHTML = isHijri
                ? 'Shows the moon phase for each Lunar day.<br><small style="color: #ccc; font-weight: normal;">Hover over the moon icon to see the phase and age.</small>'
                : 'Shows the moon phase for each Gregorian day.<br><small style="color: #ccc; font-weight: normal;">Hover over the moon icon to see the phase and age.</small>';




            // Toggle button active states
            document.getElementById('toggleLunar').classList.toggle('active', isHijri);
            document.getElementById('toggleGregorian').classList.toggle('active', !isHijri);

            // Fade in
            [document.getElementById('calendar-container'), 
             document.getElementById('calendar-month-name'), 
             document.querySelector('.calendar-header-row')].forEach(el => el?.classList.remove('fade-out'));
        }, 200); // fade duration
    }




    // -----------------------------
    // Toggle button events
    // -----------------------------
    document.getElementById('toggleLunar').addEventListener('click', () => {
        currentCalendar = 'lunar';
        updateCalendarView();
    });

    document.getElementById('toggleGregorian').addEventListener('click', () => {
        currentCalendar = 'gregorian';
        updateCalendarView();
    });

    // -----------------------------
    // Modal show event
    // -----------------------------
    document.getElementById('calendarModal').addEventListener('show.bs.modal', updateCalendarView);






    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    

    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    




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

});
