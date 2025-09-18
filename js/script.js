$(document).ready(function () {
    const $moonImg = $("#moon-img");
    const $moonInfo = $("#moon-info");
    const $currentDate = $("#current-date");
    const $locationForm = $("#location-form");
    const $hijriInfo = $("#hijri-info");

    // Element for 'Not a White Day' message
    const $whiteDayMsg = $("<p id='white-day-msg' class='text-center fs-5 mt-3'></p>"); 
    // mt-3 adds more spacing below the buttons
    $(".btn-group").parent().append($whiteDayMsg); 

    // Utility: format date as YYYY-MM-DD
    function formatDate(date) {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, "0");
        const dd = String(date.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
    }

    // Utility: display Hijri date and update modal
    function updateHijri(date) {
        const hDate = HijriJS.gregorianToHijri(date.getFullYear(), date.getMonth() + 1, date.getDate());

        // Save full details to modal
        $("#hijri-day").text(`Day: ${hDate.day}`);
        $("#hijri-month").text(`Month: ${HijriJS.lang.en.monthNames[hDate.month - 1]}`);
        $("#hijri-year").text(`Year: ${hDate.year} AH`);

        return hDate; // Return for White Day check
    }

    // AJAX call to moon.php using GET
    function fetchMoon(lat, lon, date) {
        $moonInfo.text("Loading...");

        $.getJSON("api/moon.php", { lat, lon, date })
            .done(function (data) {
                if (data.status === "success") {
                    $currentDate.text(data.date);

                    const gregDate = new Date(data.date);
                    const hDate = updateHijri(gregDate);

                    // White Day check (13th, 14th, 15th)
                    if ([13, 14, 15].includes(hDate.day)) {
                        $hijriInfo.text("🌙 Today is a White Day").css("color", "gold");
                        $whiteDayMsg.text(""); // hide 'Not a White Day'
                        $moonImg.addClass("white-day-glow"); // add glow
                    } else {
                        $hijriInfo.text(`${hDate.day}/${hDate.month}/${hDate.year}H`).css("color", "white");
                        $whiteDayMsg.text("Not a White Day").css({
                            "color": "#ccc",
                            "margin-top": "15px" // spacing below buttons
                        });
                        $moonImg.removeClass("white-day-glow"); // remove glow
                    }

                    // Update moon image and details
                    $moonImg.attr("src", data.imageUrl || "");
                    $moonInfo.html(`
                        Phase: ${data.phaseName || "N/A"}<br>
                        Illumination: ${data.illumination !== null ? data.illumination + "%" : "N/A"}<br>
                        Rise: ${data.moonrise || "N/A"}<br>
                        Set: ${data.moonset || "N/A"}
                    `);
                } else {
                    $moonInfo.text("Error: " + data.message);
                    $whiteDayMsg.text("");
                }
            })
            .fail(function () {
                $moonInfo.text("Error: Could not contact server.");
                $whiteDayMsg.text("");
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

    // Hijri info modal
    $("#hijri-info-btn").on("click", function () {
        const hijriModal = new bootstrap.Modal(document.getElementById('hijriModal'));
        hijriModal.show();
    });
});
