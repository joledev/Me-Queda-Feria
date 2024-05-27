<?php
include_once '../models/Log.php';
include_once '../models/PaymentMethod.php';

class LogController {
    private $db;
    private $requestMethod;
    private $month;

    public function __construct($db, $requestMethod, $month = null) {
        $this->db = $db;
        $this->requestMethod = $requestMethod;
        $this->month = $month;
    }

    public function processRequest() {
        switch ($this->requestMethod) {
            case 'GET':
                if ($this->month) {
                    $this->getLogsByMonth();
                } else {
                    $this->notFoundResponse();
                }
                break;
            default:
                $this->notFoundResponse();
                break;
        }
    }

    private function getLogsByMonth() {
        $api_password = isset($_GET['api_password']) ? $_GET['api_password'] : '';

        if ($api_password !== API_PASSWORD) {
            http_response_code(401); // Unauthorized
            echo json_encode(array("message" => "Acceso no autorizado."));
            exit;
        }

        $log = new Log($this->db);
        $stmt = $log->getLogsByMonth($this->month);

        $logs = array();
        $totalIngresos = 0;
        $totalGastos = 0;
        $deletedIncomeIds = [];
        $deletedExpenseIds = [];
        $deletedTransactionIds = [];

        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $row['details'] = json_decode(html_entity_decode($row['details']), true);
            $logs[] = $row;

            if ($row['movement_type'] === 'Ingreso') {
                $totalIngresos += $row['details']['cantidad'];
            } elseif ($row['movement_type'] === 'Gasto') {
                $totalGastos += $row['details']['cantidad'];
            } elseif ($row['movement_type'] === 'Ingreso Eliminado') {
                $deletedIncomeIds[] = $row['movement_id'];
                $totalIngresos -= $row['details']['cantidad'];
            } elseif ($row['movement_type'] === 'Gasto Eliminado') {
                $deletedExpenseIds[] = $row['movement_id'];
                $totalGastos -= $row['details']['cantidad'];
            } elseif ($row['movement_type'] === 'Transferencia') {
                // No se suma o resta en el resumen
            } elseif ($row['movement_type'] === 'Transferencia Eliminada') {
                $deletedTransactionIds[] = $row['movement_id'];
            }
        }

        // Excluir movimientos eliminados
        $logs = array_filter($logs, function($log) use ($deletedIncomeIds, $deletedExpenseIds, $deletedTransactionIds) {
            if ($log['movement_type'] === 'Ingreso' && in_array($log['movement_id'], $deletedIncomeIds)) {
                return false;
            }
            if ($log['movement_type'] === 'Gasto' && in_array($log['movement_id'], $deletedExpenseIds)) {
                return false;
            }
            if ($log['movement_type'] === 'Transferencia' && in_array($log['movement_id'], $deletedTransactionIds)) {
                return false;
            }
            return true;
        });

        // Obtener el total de dinero en todos los paymentMethods
        $paymentMethod = new PaymentMethod($this->db);
        $stmt = $paymentMethod->read();
        $saldo = 0;
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $saldo += $row['cantidad'];
        }

        $resumen = array(
            "totalIngresos" => number_format($totalIngresos, 2, '.', ''),
            "totalGastos" => number_format($totalGastos, 2, '.', ''),
            "saldo" => number_format($saldo, 2, '.', ''),
        );

        $response = array(
            "resumen" => $resumen,
            "logs" => array_values($logs)
        );

        http_response_code(200); // OK
        echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    }

    private function notFoundResponse() {
        http_response_code(404);
        echo json_encode(array("message" => "No encontrado"));
    }
}
?>
