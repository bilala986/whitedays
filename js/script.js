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

    // --- Hijri & Gregorian date display ---
    function updateHijri() {
        const todayHijri = HijriJS.today();
        if (todayHijri) {
            // Hijri date
            $hijriInfo.text(`${todayHijri.day}/${todayHijri.month}/${todayHijri.year} H`);
            $hijriDay.text(`Day: ${todayHijri.day}`);
            $hijriMonth.text(`Month: ${todayHijri.month}`);
            $hijriYear.text(`Year: ${todayHijri.year}`);

            // Gregorian date in same format
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
    
    
    
    
    
    
    
    
    
    function updateWhiteDayInfo() {
        const todayHijri = HijriJS.today();
        if (!todayHijri) return;

        const day = todayHijri.day;
        const month = todayHijri.month;
        const year = todayHijri.year;

        const $info = $("#white-day-info");

        // Create message element
        let message = "";
        let countdown = "";

        // White days: 13th, 14th, 15th
        if (day >= 13 && day <= 15) {
            message = "<strong>It is currently a White Day!</strong>";
            countdown = ""; // no countdown during White Days
        } else {
            message = "<strong>It is not a White Day.</strong>";

            // Determine next 13th
            let next13Month = month;
            let next13Year = year;

            if (day > 15) {
                next13Month += 1;
                if (next13Month > 12) {
                    next13Month = 1;
                    next13Year += 1;
                }
            }

            // Hijri month length using Umm al-Qura data
            let currentMonthIndex = (year - 1) * 12 + month - 1;
            let nextMonthIndex = currentMonthIndex + 1;
            let daysThisMonth = HijriJS.ummalqura_dat[nextMonthIndex] - HijriJS.ummalqura_dat[currentMonthIndex];
            if (!daysThisMonth) daysThisMonth = 30; // fallback

            let daysUntilNext13;
            if (day < 13) {
                daysUntilNext13 = 13 - day;
            } else {
                daysUntilNext13 = daysThisMonth - day + 13;
            }

            countdown = `Next White Day in <strong>${daysUntilNext13}</strong> day(s)`;
        }

        // Render
        $info.html(`${message}<br>${countdown}`);
    }

    // Call once immediately
    updateWhiteDayInfo();

    // Update dynamically every minute
    setInterval(updateWhiteDayInfo, 60 * 1000);





    
    
    
    
    
    
    
    

    // AJAX call for moon image
    function fetchMoon(lat, lon, date) {
        const $moonImg = $("#moon-img");
        const $preloader = $("#moon-preloader");
        const $moonContent = $("#moon-content");

        $moonContent.hide();   // hide content while loading
        $preloader.show();

        window.moonImageReady = false;
        window.moonDetailsReady = false;

        $.getJSON("api/moon-image.php", { lat, lon, date })
            .done(function(data) {
                console.log("Moon Image API Response:", data);
                if (data.status === "success" && data.imageUrl) {
                    $moonImg.attr("src", data.imageUrl);
                    $moonImg.on("load", function() {
                        window.moonImageReady = true;
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

    function fetchMoonDetails(lat, lon, date) {
        const $preloader = $("#moon-preloader");
        const $moonContent = $("#moon-content");

        $.getJSON("api/moon-details.php", { lat, lon, date })
            .done(function(data) {
                console.log("Moon Details API Response:", data);
                if (data.status === "success") {
                    $("#moon-info").html(
                        `Current Phase: ${data.phaseName} (${data.illumination}%)<br>` +
                        `Next Full Moon: ${data.nextFullMoonDate}<br>` +
                        `<small class="text-muted">Disclaimer: These values are approximate and may be slightly inaccurate.</small>`
                    );
                } else {
                    $("#moon-info").text("Error: " + (data.message || "Unknown error"));
                }
                window.moonDetailsReady = true;
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

        // Show preloader over both image and details
        const $preloader = $("#moon-preloader");
        $preloader.show();

        // Reset flags for coordinated preloader fade-out
        window.moonImageReady = false;
        window.moonDetailsReady = false;

        // Fetch moon image and details for the selected country
        fetchMoon(lat, lon, today);
        fetchMoonDetails(lat, lon, today);
    });

});
