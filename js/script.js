$(document).ready(function () {
    const $moonImg = $("#moon-img");
    const $moonInfo = $("#moon-info");
    const $currentDate = $("#current-date");
    const $locationForm = $("#location-form");

    // Utility: format date as YYYY-MM-DD
    function formatDate(date) {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, "0");
        const dd = String(date.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
    }

    // AJAX call to moon.php
    function fetchMoon(lat, lon, date) {
        $moonInfo.text("Loading...");

        $.getJSON("api/moon.php", { lat, lon, date })
            .done(function (data) {
                if (data.status === "success") {
                    $currentDate.text(data.date);
                    $moonImg.attr("src", data.imageUrl || "");
                    $moonInfo.html(data.detailsHtml || "");
                } else {
                    $moonInfo.text("Error: " + data.message);
                }
            })
            .fail(function () {
                $moonInfo.text("Error: Could not contact server.");
            });
    }

    // Geolocation
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lon = pos.coords.longitude;
                const today = formatDate(new Date());
                fetchMoon(lat, lon, today);
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
        const lat = parseFloat($("#city").find(":selected").data("lat"));
        const lon = parseFloat($("#city").find(":selected").data("lon"));
        const today = formatDate(new Date());
        if (!lat || !lon) {
            alert("Please select a valid city.");
            return;
        }
        fetchMoon(lat, lon, today);
    });
});
