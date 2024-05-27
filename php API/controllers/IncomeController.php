<?php
include_once '../models/Income.php';
include_once '../config/config.php'; // Incluir el archivo de configuración

class IncomeController {
    private $db;
    private $requestMethod;
    private $incomeId;

    public function __construct($db, $requestMethod, $incomeId = null) {
        $this->db = $db;
        $this->requestMethod = $requestMethod;
        $this->incomeId = $incomeId;
    }

    public function processRequest() {
        switch ($this->requestMethod) {
            case 'POST':
                $this->createIncome();
                break;
            case 'DELETE':
                $this->deleteIncome();
                break;
            default:
                $this->notFoundResponse();
                break;
        }
    }

    private function createIncome() {
        $api_password = isset($_GET['api_password']) ? $_GET['api_password'] : '';

        if ($api_password !== API_PASSWORD) {
            http_response_code(401); // Unauthorized
            echo json_encode(array("message" => "Acceso no autorizado."));
            exit;
        }

        $data = json_decode(file_get_contents("php://input"));

        if (!empty($data->id_payment) && !empty($data->amount) && !empty($data->description)) {
            $income = new Income($this->db);
            $income->id_payment = $data->id_payment;
            $income->amount = $data->amount;
            $income->description = $data->description;

            if ($income->create()) {
                http_response_code(201); // Created
                echo json_encode(array("message" => "Ingreso creado exitosamente."));
            } else {
                http_response_code(503); // Service unavailable
                echo json_encode(array("message" => "No se pudo crear el ingreso."));
            }
        } else {
            http_response_code(400); // Bad request
            echo json_encode(array("message" => "No se pudo crear el ingreso. Datos incompletos."));
        }
    }

    private function deleteIncome() {
        $api_password = isset($_GET['api_password']) ? $_GET['api_password'] : '';

        if ($api_password !== API_PASSWORD) {
            http_response_code(401); // Unauthorized
            echo json_encode(array("message" => "Acceso no autorizado."));
            exit;
        }

        $income = new Income($this->db);
        $income->id = $this->incomeId;

        if ($income->delete()) {
            http_response_code(200); // OK
            echo json_encode(array("message" => "Ingreso eliminado exitosamente."));
        } else {
            http_response_code(503); // Service unavailable
            echo json_encode(array("message" => "No se pudo eliminar el ingreso."));
        }
    }

    private function notFoundResponse() {
        http_response_code(404);
        echo json_encode(array("message" => "No encontrado"));
    }
}
?>
