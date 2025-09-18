<?php
// moon.php

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

// Auth header
$auth = base64_encode(ASTRO_APP_ID . ":" . ASTRO_APP_SECRET);

// ---------- Moon Image (studio/moon-phase) ----------
$studioUrl = "https://api.astronomyapi.com/api/v2/studio/moon-phase";

$moonBody = [
    "format" => "png",
    "observer" => [
        "latitude" => (float)$lat,
        "longitude" => (float)$lon,
        "date" => $date
    ],
    "style" => [
        "moonStyle" => "default",
        "backgroundStyle" => "solid",      // plain background
        "backgroundColor" => "black",      // black background
        "headingColor" => "black",         // hide heading
        "textColor" => "black"             // hide phase labels
    ],
    "view" => [
        "type" => "portrait-simple",
        "orientation" => "south-up"
    ]
];

$studioPayload = json_encode($moonBody);

function callAPI($url, $payload = null, $auth, $isPost = true) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: Basic $auth",
        "Content-Type: application/json"
    ]);
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

// Get moon image
$studioData = callAPI($studioUrl, $studioPayload, $auth);
if (isset($studioData['error'])) {
    echo json_encode([
        "status" => "error",
        "message" => "Moon image request failed: " . $studioData['error']
    ]);
    exit;
}

// ---------- Moon Details (bodies/positions) ----------
$detailsUrl = "https://api.astronomyapi.com/api/v2/bodies/positions";
$detailsUrl .= "?latitude={$lat}&longitude={$lon}&from_date={$date}&to_date={$date}&elevation=0&bodies=moon";

$detailsData = callAPI($detailsUrl, null, $auth, false);
if (isset($detailsData['error'])) {
    echo json_encode([
        "status" => "error",
        "message" => "Moon details request failed: " . $detailsData['error']
    ]);
    exit;
}

// Extract details safely
$cell = $detailsData['data']['table']['rows'][0]['cells'][0] ?? null;

$phaseName    = $cell['position']['phase']['name'] ?? null;
$illumination = isset($cell['position']['phase']['illumination']) ? $cell['position']['phase']['illumination'] : null;
$moonrise     = $cell['rise'] ?? null;
$moonset      = $cell['set'] ?? null;

// Build moon details HTML without N/A
$detailsHtml = "";
if ($phaseName) $detailsHtml .= "Phase: {$phaseName}<br>";
if ($illumination !== null) $detailsHtml .= "Illumination: {$illumination}%<br>";
if ($moonrise) $detailsHtml .= "Moonrise: {$moonrise}<br>";
if ($moonset) $detailsHtml .= "Moonset: {$moonset}<br>";
if ($detailsHtml === "") $detailsHtml = "No moon data available.";

// Return JSON
echo json_encode([
    "status" => "success",
    "date" => $date,
    "imageUrl" => $studioData['data']['imageUrl'] ?? null,
    "phaseName" => $phaseName,
    "illumination" => $illumination,
    "moonrise" => $moonrise,
    "moonset" => $moonset,
    "detailsHtml" => $detailsHtml
]);
