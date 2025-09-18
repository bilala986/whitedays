<?php
header("Content-Type: application/json");
require_once "config.php";

// Get input
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

// Auth
$auth = base64_encode(ASTRO_APP_ID . ":" . ASTRO_APP_SECRET);

// ---------- Utility: Call API ----------
function callAPI($url, $payload = null, $auth, $isPost = true) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ["Authorization: Basic $auth", "Content-Type: application/json"]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    if ($isPost && $payload) {
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    }
    $response = curl_exec($ch);
    $err = curl_error($ch);
    curl_close($ch);
    if ($err) return ["error" => $err];
    return json_decode($response, true);
}

// ---------- Moon Image ----------
$studioUrl = "https://api.astronomyapi.com/api/v2/studio/moon-phase";
$studioBody = [
    "format" => "png",
    "observer" => [
        "latitude" => (float)$lat,
        "longitude" => (float)$lon,
        "date" => $date
    ],
    "style" => [
        "moonStyle" => "default",
        "backgroundStyle" => "solid",
        "backgroundColor" => "black",
        "headingColor" => "black",
        "textColor" => "black"
    ],
    "view" => [
        "type" => "portrait-simple",
        "orientation" => "south-up"
    ]
];

$studioData = callAPI($studioUrl, json_encode($studioBody), $auth);
$imageUrl = $studioData['data']['imageUrl'] ?? null;

// ---------- Current Moon Phase ----------
$positionsUrl = "https://api.astronomyapi.com/api/v2/bodies/positions";
$positionsUrl .= "?latitude={$lat}&longitude={$lon}&from_date={$date}&to_date={$date}&elevation=0&bodies=moon";

$positionsData = callAPI($positionsUrl, null, $auth, false);

$phaseName = $positionsData['data']['table']['rows'][0]['cells'][0]['position']['phase']['name'] ?? "Unknown";
$illumination = $positionsData['data']['table']['rows'][0]['cells'][0]['position']['phase']['illumination'] ?? 0;

// ---------- Next Full Moon ----------
$phaseUrl = "https://api.astronomyapi.com/api/v2/astronomy/phase";
$phaseUrl .= "?latitude={$lat}&longitude={$lon}&date={$date}&type=full_moon";

$phaseData = callAPI($phaseUrl, null, $auth, false);
$nextFullMoon = $phaseData['data']['phase']['time'] ?? null;
$nextFullMoonDate = $nextFullMoon ? date("Y-m-d", strtotime($nextFullMoon)) : "Unknown";

// ---------- Build Details ----------
$detailsHtml = "Current Phase: $phaseName (" . round($illumination*100) . "%)<br>Next Full Moon: $nextFullMoonDate 🌕";

// Return JSON
echo json_encode([
    "status" => "success",
    "date" => $date,
    "imageUrl" => $imageUrl,
    "detailsHtml" => $detailsHtml
]);
