<?php
header('Content-Type: application/json');

$filePath = 'localstorage_events.json';
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!is_null($data)) {
    file_put_contents($filePath, json_encode($data, JSON_PRETTY_PRINT));
    echo json_encode(['status' => 'success', 'message' => 'LocalStorage data saved']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'No data received']);
}
?>