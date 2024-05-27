<?php
include_once '../models/Transaction.php';
include_once '../config/config.php'; // Incluir el archivo de configuración

class TransactionController {
    private $db;
    private $requestMethod;
    private $transactionId;

    public function __construct($db, $requestMethod, $transactionId = null) {
        $this->db = $db;
        $this->requestMethod = $requestMethod;
        $this->transactionId = $transactionId;
    }

    public function processRequest() {
        switch ($this->requestMethod) {
            case 'POST':
                $this->createTransaction();
                break;
            case 'DELETE':
                $this->deleteTransaction();
                break;
            default:
                $this->notFoundResponse();
                break;
        }
    }

    private function createTransaction() {
        $api_password = isset($_GET['api_password']) ? $_GET['api_password'] : '';

        if ($api_password !== API_PASSWORD) {
            http_response_code(401); // Unauthorized
            echo json_encode(array("message" => "Acceso no autorizado."));
            exit;
        }

        $data = json_decode(file_get_contents("php://input"));

        if (!empty($data->id_payment_sender) && !empty($data->id_payment_receiver) && !empty($data->amount) && !empty($data->description)) {
            $transaction = new Transaction($this->db);
            $transaction->id_payment_sender = $data->id_payment_sender;
            $transaction->id_payment_receiver = $data->id_payment_receiver;
            $transaction->amount = $data->amount;
            $transaction->description = $data->description;

            if ($transaction->create()) {
                http_response_code(201); // Created
                echo json_encode(array("message" => "Transferencia creada exitosamente."));
            } else {
                http_response_code(503); // Service unavailable
                echo json_encode(array("message" => "No se pudo crear la transferencia."));
            }
        } else {
            http_response_code(400); // Bad request
            echo json_encode(array("message" => "No se pudo crear la transferencia. Datos incompletos."));
        }
    }

    private function deleteTransaction() {
        $api_password = isset($_GET['api_password']) ? $_GET['api_password'] : '';

        if ($api_password !== API_PASSWORD) {
            http_response_code(401); // Unauthorized
            echo json_encode(array("message" => "Acceso no autorizado."));
            exit;
        }

        $transaction = new Transaction($this->db);
        $transaction->id = $this->transactionId;

        if ($transaction->delete()) {
            http_response_code(200); // OK
            echo json_encode(array("message" => "Movimiento eliminado exitosamente."));
        } else {
            http_response_code(503); // Service unavailable
            echo json_encode(array("message" => "No se pudo eliminar el movimiento."));
        }
    }

    private function notFoundResponse() {
        http_response_code(404);
        echo json_encode(array("message" => "No encontrado"));
    }
}
?>
