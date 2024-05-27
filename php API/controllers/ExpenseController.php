<?php
include_once '../models/Expense.php';
include_once '../config/config.php'; // Incluir el archivo de configuración

class ExpenseController {
    private $db;
    private $requestMethod;
    private $expenseId;

    public function __construct($db, $requestMethod, $expenseId = null) {
        $this->db = $db;
        $this->requestMethod = $requestMethod;
        $this->expenseId = $expenseId;
    }

    public function processRequest() {
        switch ($this->requestMethod) {
            case 'POST':
                $this->createExpense();
                break;
            case 'DELETE':
                $this->deleteExpense();
                break;
            default:
                $this->notFoundResponse();
                break;
        }
    }

    private function createExpense() {
        $api_password = isset($_GET['api_password']) ? $_GET['api_password'] : '';

        if ($api_password !== API_PASSWORD) {
            http_response_code(401); // Unauthorized
            echo json_encode(array("message" => "Acceso no autorizado."));
            exit;
        }

        $data = json_decode(file_get_contents("php://input"));

        if (!empty($data->id_payment) && !empty($data->amount) && !empty($data->description)) {
            $expense = new Expense($this->db);
            $expense->id_payment = $data->id_payment;
            $expense->amount = $data->amount;
            $expense->description = $data->description;

            if ($expense->create()) {
                http_response_code(201); // Created
                echo json_encode(array("message" => "Gasto creado exitosamente."));
            } else {
                http_response_code(503); // Service unavailable
                echo json_encode(array("message" => "No se pudo crear el gasto."));
            }
        } else {
            http_response_code(400); // Bad request
            echo json_encode(array("message" => "No se pudo crear el gasto. Datos incompletos."));
        }
    }

    private function deleteExpense() {
        $api_password = isset($_GET['api_password']) ? $_GET['api_password'] : '';

        if ($api_password !== API_PASSWORD) {
            http_response_code(401); // Unauthorized
            echo json_encode(array("message" => "Acceso no autorizado."));
            exit;
        }

        $expense = new Expense($this->db);
        $expense->id = $this->expenseId;

        if ($expense->delete()) {
            http_response_code(200); // OK
            echo json_encode(array("message" => "Gasto eliminado exitosamente."));
        } else {
            http_response_code(503); // Service unavailable
            echo json_encode(array("message" => "No se pudo eliminar el gasto."));
        }
    }

    private function notFoundResponse() {
        http_response_code(404);
        echo json_encode(array("message" => "No encontrado"));
    }
}
?>
