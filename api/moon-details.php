<?php
header("Content-Type: application/json");

// Simple moon-details implementation (no external API)
// Computes phase fraction, illumination %, phase name, and next full moon date (approx).

$lat  = $_POST['lat'] ?? $_GET['lat'] ?? null;   // kept for compatibility
$lon  = $_POST['lon'] ?? $_GET['lon'] ?? null;   // kept for compatibility
$date = $_POST['date'] ?? $_GET['date'] ?? date("Y-m-d");

if (!$date) {
    echo json_encode(["status" => "error", "message" => "Date required"]);
    exit;
}

// --- Debug helper ---
function dbg($msg) {
    file_put_contents(__DIR__ . "/moon_debug.log", date("Y-m-d H:i:s") . " " . $msg . "\n", FILE_APPEND);
}

// --- Date parse ---
$ts = strtotime($date);
if ($ts === false) {
    echo json_encode(["status" => "error", "message" => "Invalid date"]);
    exit;
}
list($Y, $M, $D) = explode('-', date('Y-m-d', $ts));

// --- Moon fraction ---
function moon_fraction($year, $month, $day) {
    if ($month < 3) {
        $year -= 1;
        $month += 12;
    }
    $yTerm = floor(365.25 * $year);
    $mTerm = floor(30.6 * ($month + 1));
    $jd = $yTerm + $mTerm + $day - 694039.09;
    $jd /= 29.5305882;
    $frac = $jd - floor($jd);
    if ($frac < 0) $frac += 1.0;
    return $frac;
}
function fraction_to_illumination($frac) {
    return (int) round((1 - cos(2 * M_PI * $frac)) * 50.0);
}
function fraction_to_phase_name($frac) {
    $eps = 0.03;
    if ($frac < $eps || $frac > 1 - $eps) return "New Moon";
    if ($frac < 0.25 - $eps) return "Waxing Crescent";
    if (abs($frac - 0.25) <= $eps) return "First Quarter";
    if ($frac < 0.5 - $eps) return "Waxing Gibbous";
    if (abs($frac - 0.5) <= $eps) return "Full Moon";
    if ($frac < 0.75 - $eps) return "Waning Gibbous";
    if (abs($frac - 0.75) <= $eps) return "Last Quarter";
    return "Waning Crescent";
}

// --- Today’s phase ---
$fracToday = moon_fraction((int)$Y, (int)$M, (int)$D);
$illumination = fraction_to_illumination($fracToday);
$phaseName = fraction_to_phase_name($fracToday);

// --- Next full moon (within 60 days) ---
$bestDiff = PHP_FLOAT_MAX;
$bestDate = null;
for ($i = 0; $i <= 60; $i++) {
    $ts2 = strtotime("+$i day", $ts);
    $f = moon_fraction((int)date('Y', $ts2), (int)date('n', $ts2), (int)date('j', $ts2));
    $diff = abs($f - 0.5);
    if ($diff < $bestDiff) {
        $bestDiff = $diff;
        $bestDate = date('d/m/Y', $ts2); // formatted DD/MM/YYYY
    }
    if ($diff <= 0.02 && $i > 0) break;
}
if (!$bestDate) $bestDate = date('d/m/Y', $ts);

// --- Debug log ---
dbg("Request date: $date | phase=$phaseName | illum=$illumination% | nextFull=$bestDate");

// --- Output ---
echo json_encode([
    "status" => "success",
    "phaseName" => $phaseName,
    "illumination" => $illumination,
    "nextFullMoonDate" => $bestDate,
    "date" => $date
]);
