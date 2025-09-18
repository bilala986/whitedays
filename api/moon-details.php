<?php
header("Content-Type: application/json");

$lat  = $_POST['lat'] ?? $_GET['lat'] ?? null;
$lon  = $_POST['lon'] ?? $_GET['lon'] ?? null;
$date = $_POST['date'] ?? $_GET['date'] ?? date("Y-m-d");

if (!$lat || !$lon) {
    echo json_encode([
        "status" => "error",
        "message" => "Latitude and longitude required"
    ]);
    exit;
}

// Open-Meteo Moon API
$apiUrl = "https://api.open-meteo.com/v1/astronomy?latitude={$lat}&longitude={$lon}&start_date={$date}&end_date={$date}&timezone=auto";

// Log the API URL
file_put_contents("moon_debug.log", date("Y-m-d H:i:s") . " URL: $apiUrl\n", FILE_APPEND);

// Initialize cURL
$ch = curl_init($apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
$response = curl_exec($ch);
$err = curl_error($ch);
curl_close($ch);

// Log cURL errors
if ($err) {
    file_put_contents("moon_debug.log", date("Y-m-d H:i:s") . " cURL Error: $err\n", FILE_APPEND);
    echo json_encode(["status" => "error", "message" => "Could not contact Open-Meteo"]);
    exit;
}

// Decode the response
$data = json_decode($response, true);

// Log a preview of the response
file_put_contents("moon_debug.log", date("Y-m-d H:i:s") . " Response Preview: " . substr($response, 0, 500) . "\n\n", FILE_APPEND);

// Extract moon info from new format
$phaseDecimal = $data['moon_phase'] ?? 0;  // fraction 0-1
$illumination = isset($data['moon_illumination']) ? round($data['moon_illumination'] * 100) : 0;

// Convert fraction to human-readable phase
if ($phaseDecimal == 0) {
    $phaseName = "New Moon";
} elseif ($phaseDecimal > 0 && $phaseDecimal < 0.25) {
    $phaseName = "Waxing Crescent";
} elseif ($phaseDecimal == 0.25) {
    $phaseName = "First Quarter";
} elseif ($phaseDecimal > 0.25 && $phaseDecimal < 0.5) {
    $phaseName = "Waxing Gibbous";
} elseif ($phaseDecimal == 0.5) {
    $phaseName = "Full Moon";
} elseif ($phaseDecimal > 0.5 && $phaseDecimal < 0.75) {
    $phaseName = "Waning Gibbous";
} elseif ($phaseDecimal == 0.75) {
    $phaseName = "Last Quarter";
} else { // 0.75–1
    $phaseName = "Waning Crescent";
}

// Note: next full moon calculation is approximate; here we just echo the date as today
$nextFullMoonDate = $date;

echo json_encode([
    "status" => "success",
    "phaseName" => $phaseName,
    "illumination" => $illumination,
    "nextFullMoonDate" => $nextFullMoonDate
]);
