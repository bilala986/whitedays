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

    // --- Hijri date display ---
    function updateHijri() {
        const todayHijri = HijriJS.today();
        if (todayHijri) {
            $hijriInfo.text(`${todayHijri.day}/${todayHijri.month}/${todayHijri.year} H`);
            $hijriDay.text(`Day: ${todayHijri.day}`);
            $hijriMonth.text(`Month: ${todayHijri.month}`);
            $hijriYear.text(`Year: ${todayHijri.year}`);
        } else {
            $hijriInfo.text("Error calculating Hijri date");
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

    // AJAX call for moon
    function fetchMoon(lat, lon, date) {
        const $moonImg = $("#moon-img");
        const $preloader = $("#moon-preloader");

        $moonImg.hide();
        $preloader.show();

        // Use flags to track readiness
        window.moonImageReady = false;
        window.moonDetailsReady = false;

        $.getJSON("api/moon-image.php", { lat, lon, date })
            .done(function(data) {
                console.log("Moon Image API Response:", data);
                if (data.status === "success" && data.imageUrl) {
                    $moonImg.attr("src", data.imageUrl);
                    $moonImg.on("load", function() {
                        $moonImg.fadeIn(400);
                        window.moonImageReady = true;
                        if (window.moonDetailsReady) {
                            $preloader.fadeOut(400);
                        }
                    });
                } else {
                    console.warn("Moon image not available");
                    window.moonImageReady = true;
                    if (window.moonDetailsReady) $preloader.fadeOut(400);
                }
            })
            .fail(function() {
                console.error("Moon image AJAX error");
                window.moonImageReady = true;
                if (window.moonDetailsReady) $preloader.fadeOut(400);
            });
    }

    function fetchMoonDetails(lat, lon, date) {
        const $preloader = $("#moon-preloader");

        $.getJSON("api/moon-details.php", { lat, lon, date })
            .done(function(data) {
                console.log("Moon Details API Response:", data);
                if (data.status === "success") {
                    $("#moon-info").html(
                        `Current Phase: ${data.phaseName} (${data.illumination}%)<br>` +
                        `Next Full Moon: ${data.nextFullMoonDate} 🌕`
                    );
                } else {
                    $("#moon-info").text("Error: " + (data.message || "Unknown error"));
                }
                window.moonDetailsReady = true;
                if (window.moonImageReady) $preloader.fadeOut(400);
            })
            .fail(function() {
                $("#moon-info").text("Error: Could not contact server.");
                window.moonDetailsReady = true;
                if (window.moonImageReady) $preloader.fadeOut(400);
            });
    }





    // Load countries into dropdown
    $.getJSON("json/countries.json", function (data) {
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

    // Geolocation
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lon = pos.coords.longitude;
                const today = formatDate(new Date());
                fetchMoon(lat, lon, today);
                fetchMoonDetails(lat, lon, today);
            },
            (err) => {
                console.warn("Geolocation failed or denied.", err);
                $locationForm.show();
            }
        );
    } else {
        console.warn("Geolocation not supported.");
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
        fetchMoon(lat, lon, today);
        fetchMoonDetails(lat, lon, today);
    });
});
