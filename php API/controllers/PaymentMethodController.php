<?php
include_once '../models/PaymentMethod.php';
include_once '../config/config.php'; // Incluir el archivo de configuración

class PaymentMethodController {
    private $db;
    private $requestMethod;

    public function __construct($db, $requestMethod) {
        $this->db = $db;
        $this->requestMethod = $requestMethod;
    }

    public function processRequest() {
        switch ($this->requestMethod) {
            case 'GET':
                $this->listPaymentMethods();
                break;
            default:
                $this->notFoundResponse();
                break;
        }
    }

    private function listPaymentMethods() {
        $api_password = isset($_GET['api_password']) ? $_GET['api_password'] : '';

        if ($api_password !== API_PASSWORD) {
            http_response_code(401); // Unauthorized
            echo json_encode(array("message" => "Acceso no autorizado."));
            exit;
        }

        $paymentMethod = new PaymentMethod($this->db);
        $stmt = $paymentMethod->read();
        $payment_methods = array();

        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $payment_methods[] = [
                'id' => $row['id'],
                'nombre' => $row['nombre'],
                'saldo' => $row['cantidad'],
            ];
        }

        http_response_code(200); // OK
        echo json_encode($payment_methods);
    }

    public function updateAmount($id, $amount) {
        $paymentMethod = new PaymentMethod($this->db);
        $paymentMethod->id = $id;
        $stmt = $paymentMethod->read_single();

        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $amountBefore = $row['cantidad'];
            $newAmount = $amountBefore + $amount;

            $paymentMethod->cantidad = $newAmount;

            if ($paymentMethod->update()) {
                return [
                    'success' => true,
                    'amountBefore' => $amountBefore,
                    'newAmount' => $newAmount
                ];
            } else {
                return ['success' => false, 'message' => 'No se pudo actualizar el método de pago.'];
            }
        } else {
            return ['success' => false, 'message' => 'Método de pago no encontrado.'];
        }
    }

    private function notFoundResponse() {
        http_response_code(404);
        echo json_encode(array("message" => "Not Found"));
    }
}
?>
