<?php

include_once '../config/Database.php';
include_once '../controllers/IncomeController.php';
include_once '../config/config.php'; // Incluir el archivo de configuración

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

$database = new Database();
$db = $database->connect();

$requestMethod = $_SERVER["REQUEST_METHOD"];
$incomeId = isset($_GET['id']) ? $_GET['id'] : null;

$controller = new IncomeController($db, $requestMethod, $incomeId);
$controller->processRequest();
?>