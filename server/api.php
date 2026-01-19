<?php
// CORS setup for local development
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

const ADMIN_EMAIL = '';
const GOOGLE_CLIENT_ID = '';

$dataFolder = __DIR__ . '/data';
$uploadFolder = __DIR__ . '/uploads';
$postsFile = $dataFolder . '/posts.json';
$settingsFile = $dataFolder . '/settings.json';

function verifyToken($token) {
    if (!$token || $token === 'null') return false;
    
    // Use cURL for better error handling and compatibility
    $url = "https://oauth2.googleapis.com/tokeninfo?id_token=" . $token;
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200 || !$response) return false;
    
    $data = json_decode($response, true);
    if (!$data || isset($data['error'])) return false;
    
    // Verify audience and email
    if ($data['aud'] !== GOOGLE_CLIENT_ID) return false;
    if ($data['email'] !== ADMIN_EMAIL) return false;
    if ($data['email_verified'] !== 'true') return false;
    
    return true;
}

function checkAuth() {
    $headers = getallheaders();
    $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
    if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        $token = $matches[1];
        if (verifyToken($token)) {
            return true;
        }
    }
    return false;
}

// Ensure folders exist
if (!file_exists($dataFolder)) mkdir($dataFolder, 0777, true);
if (!file_exists($uploadFolder)) mkdir($uploadFolder, 0777, true);

// Get the request path and extract the action
$requestUri = $_SERVER['REQUEST_URI'];
$action = '';

// Check if it's a posts request or upload request
if (preg_match('/api\/posts/', $requestUri)) {
    $action = 'posts';
} elseif (preg_match('/api\/upload/', $requestUri)) {
    $action = 'upload';
} elseif (preg_match('/api\/settings/', $requestUri)) {
    $action = 'settings';
}

switch ($action) {
    case 'posts':
        if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            if (file_exists($postsFile)) {
                echo file_get_contents($postsFile);
            } else {
                echo json_encode([]);
            }
        } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
            if (!checkAuth()) {
                http_response_code(401);
                echo json_encode(['error' => 'Unauthorized']);
                exit;
            }
            $json = file_get_contents('php://input');
            if (file_put_contents($postsFile, $json)) {
                echo json_encode(['success' => true]);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to save posts']);
            }
        }
        break;

    case 'upload':
        // Check if the request is potentially too large for PHP settings
        if ($_SERVER['REQUEST_METHOD'] === 'POST' && empty($_FILES) && empty($_POST) && $_SERVER['CONTENT_LENGTH'] > 0) {
            http_response_code(413); // Payload Too Large
            $maxPost = ini_get('post_max_size');
            $maxUpload = ini_get('upload_max_filesize');
            echo json_encode(['error' => "File is too large for the server. Server limits: post_max_size=$maxPost, upload_max_filesize=$maxUpload"]);
            exit;
        }

        if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['file'])) {
            if (!checkAuth()) {
                http_response_code(401);
                echo json_encode(['error' => 'Unauthorized']);
                exit;
            }
            $file = $_FILES['file'];
            if ($file['error'] !== UPLOAD_ERR_OK) {
                http_response_code(400);
                echo json_encode(['error' => 'Upload error code: ' . $file['error']]);
                exit;
            }

            if (!is_writable($uploadFolder)) {
                http_response_code(500);
                echo json_encode(['error' => 'Upload directory is not writable']);
                exit;
            }

            // Support UTF-8 filenames while removing truly dangerous characters
            $filename = preg_replace("/[^\p{L}\p{N}\._-]/u", "_", basename($file['name']));
            $targetPath = $uploadFolder . '/' . $filename;
            
            if (move_uploaded_file($file['tmp_name'], $targetPath)) {
                echo json_encode(['url' => 'uploads/' . $filename]);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'move_uploaded_file failed']);
            }
        } else {
            http_response_code(400);
            $msg = !isset($_FILES['file']) ? 'No file field in request' : 'Invalid method';
            echo json_encode(['error' => $msg, 'method' => $_SERVER['REQUEST_METHOD']]);
        }
        break;

    case 'settings':
        if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            if (file_exists($settingsFile)) {
                echo file_get_contents($settingsFile);
            } else {
                echo json_encode(['bannerUrl' => 'https://picsum.photos/seed/portfolio/1600/900']);
            }
        } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
            if (!checkAuth()) {
                http_response_code(401);
                echo json_encode(['error' => 'Unauthorized']);
                exit;
            }
            $json = file_get_contents('php://input');
            if (file_put_contents($settingsFile, $json)) {
                echo json_encode(['success' => true]);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to save settings']);
            }
        }
        break;

    default:
        http_response_code(404);
        echo json_encode(['error' => 'Not Found']);
        break;
}
