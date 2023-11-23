<?php
header('Content-Type: application/json');

$filePath = 'events.json';
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!is_null($data)) {
    if (isset($data['type']) && $data['type'] === 'playEvent' && isset($data['data']['action']) && $data['data']['action'] === 'reset') {
        file_put_contents($filePath, json_encode([]));
        echo json_encode(['status' => 'success', 'message' => 'Data reset']);
    } else {
        if (file_exists($filePath)) {
            $currentData = json_decode(file_get_contents($filePath), true);
            if (!is_array($currentData)) {
                $currentData = [];
            }
        } else {
            $currentData = [];
        }

        $eventId = count($currentData) + 1;
        $data['id'] = $eventId;
        $data['serverTimestamp'] = date('c');

        array_push($currentData, $data);

        file_put_contents($filePath, json_encode($currentData, JSON_PRETTY_PRINT));
        echo json_encode(['status' => 'success', 'message' => 'Event logged']);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'No data received']);
}
?>
