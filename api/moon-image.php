<?php
header("Content-Type: application/json");
require_once "config.php";

// ------------------- Input -------------------
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

// ------------------- Auth -------------------
$auth = base64_encode(ASTRO_APP_ID . ":" . ASTRO_APP_SECRET);

// ------------------- Utility: Call API -------------------
function callAPI($url, $payload = null, $auth) {
    $ch = curl_init($url);
    $headers = [
        "Authorization: Basic " . $auth,
        "Content-Type: application/json"
    ];
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    if ($payload) curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);

    $response = curl_exec($ch);
    $err = curl_error($ch);
    curl_close($ch);

    if ($err) {
        return ["error" => $err];
    }
    return json_decode($response, true);
}

// ------------------- Moon Image -------------------
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

echo json_encode([
    "status" => $imageUrl ? "success" : "error",
    "imageUrl" => $imageUrl
]);
