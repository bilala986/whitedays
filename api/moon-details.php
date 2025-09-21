<?php
header("Content-Type: application/json");

// Simple moon-details implementation (no external API)
// Computes phase fraction, illumination %, phase name and next full moon date (approx).

$lat  = $_POST['lat'] ?? $_GET['lat'] ?? null;   // kept for compatibility (not used)
$lon  = $_POST['lon'] ?? $_GET['lon'] ?? null;   // kept for compatibility (not used)
$date = $_POST['date'] ?? $_GET['date'] ?? date("Y-m-d");

// minimal validation
if (!$date) {
    echo json_encode(["status" => "error", "message" => "Date required"]);
    exit;
}

// logging helper
function dbg($msg) {
    file_put_contents(__DIR__ . "/moon_debug.log", date("Y-m-d H:i:s") . " " . $msg . "\n", FILE_APPEND);
}

// Parse date
$ts = strtotime($date);
if ($ts === false) {
    echo json_encode(["status" => "error", "message" => "Invalid date"]);
    exit;
}

list($Y, $M, $D) = explode('-', date('Y-m-d', $ts));

/**
 * Compute simple moon phase fraction (0..1) for a given date
 * Source: common simple algorithm found in public domain (approximate)
 * Returns fraction where 0 = new moon, 0.5 = full moon.
 */
function moon_fraction($year, $month, $day) {
    // convert to ints
    $y = (int)$year;
    $m = (int)$month;
    $d = (float)$day;

    if ($m < 3) {
        $y -= 1;
        $m += 12;
    }

    // the algorithm uses an epoch; values are tuned for reasonable accuracy
    $yTerm = floor(365.25 * $y);
    $mTerm = floor(30.6 * ($m + 1)); // month index shifted by +1
    $jd = $yTerm + $mTerm + $d - 694039.09; // days since known new moon epoch
    $jd /= 29.5305882; // divide by lunar cycle length
    $frac = $jd - floor($jd);
    if ($frac < 0) $frac += 1.0;
    return $frac; // 0..1
}

/**
 * Convert fraction -> illumination percent (approx)
 * illumination = (1 - cos(phase*2π)) * 50
 */
function fraction_to_illumination($frac) {
    $illum = (1 - cos(2 * M_PI * $frac)) * 50.0;
    return (int) round($illum);
}

/**
 * Convert fraction -> textual phase
 */
function fraction_to_phase_name($frac) {
    $eps = 0.03; // tolerance
    if ($frac < $eps || $frac > 1 - $eps) {
        return "New Moon";
    } elseif ($frac > 0 && $frac < 0.25 - $eps) {
        return "Waxing Crescent";
    } elseif (abs($frac - 0.25) <= $eps) {
        return "First Quarter";
    } elseif ($frac > 0.25 + $eps && $frac < 0.5 - $eps) {
        return "Waxing Gibbous";
    } elseif (abs($frac - 0.5) <= $eps) {
        return "Full Moon";
    } elseif ($frac > 0.5 + $eps && $frac < 0.75 - $eps) {
        return "Waning Gibbous";
    } elseif (abs($frac - 0.75) <= $eps) {
        return "Last Quarter";
    } else {
        return "Waning Crescent";
    }
}

// compute today's fraction & illumination
$fracToday = moon_fraction($Y, $M, $D);
$illumination = fraction_to_illumination($fracToday);
$phaseName = fraction_to_phase_name($fracToday);

// find next full moon within the next N days (use 60 days window to be safe)
$searchDays = 60;
$bestDiff = PHP_FLOAT_MAX;
$bestDate = null;

for ($i = 0; $i <= $searchDays; $i++) {
    $ts2 = strtotime("+$i day", $ts);
    $y2 = (int)date('Y', $ts2);
    $m2 = (int)date('n', $ts2);
    $d2 = (int)date('j', $ts2);
    $f = moon_fraction($y2, $m2, $d2);
    // distance from full moon (0.5)
    $diff = abs($f - 0.5);
    if ($diff < $bestDiff) {
        $bestDiff = $diff;
        $bestDate = date('Y-m-d', $ts2);
    }
    // stop early if very close to exact full moon
    if ($diff <= 0.02 && $i > 0) {
        break;
    }
}

// If for some reason we didn't find anything, fallback to current date
if (!$bestDate) $bestDate = $date;

// Log some debug info
dbg("Request date: $date | fracToday=" . round($fracToday,5) . " | illum={$illumination}% | phase={$phaseName} | nextFull={$bestDate}");

echo json_encode([
    "status" => "success",
    "phaseName" => $phaseName,
    "illumination" => $illumination,
    "nextFullMoonDate" => $bestDate,
    "date" => $date
]);
