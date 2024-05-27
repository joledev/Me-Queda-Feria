<?php
include_once '../models/PaymentMethod.php';
include_once '../models/Log.php';

class Income {
    private $conn;
    private $table_name = "incomes";

    public $id;
    public $id_payment;
    public $amount;
    public $description;
    public $date;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function create() {
        $query = "INSERT INTO " . $this->table_name . " SET id_payment=:id_payment, amount=:amount, description=:description";
        $stmt = $this->conn->prepare($query);

        $this->id_payment = htmlspecialchars(strip_tags($this->id_payment));
        $this->amount = htmlspecialchars(strip_tags($this->amount));
        $this->description = htmlspecialchars(strip_tags($this->description));

        $stmt->bindParam(":id_payment", $this->id_payment);
        $stmt->bindParam(":amount", $this->amount);
        $stmt->bindParam(":description", $this->description);

        if ($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return $this->updatePaymentMethod() && $this->createLog();
        }

        return false;
    }

    private function updatePaymentMethod() {
        $paymentMethod = new PaymentMethod($this->conn);
        $paymentMethod->id = $this->id_payment;
        $stmt = $paymentMethod->read_single();

        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $amountBefore = $row['cantidad'];
            $newAmount = $amountBefore + $this->amount;
            $newAmount = number_format($newAmount, 2, '.', '');

            $paymentMethod->cantidad = $newAmount;

            if ($paymentMethod->update()) {
                $this->amountBefore = $amountBefore;
                $this->newAmount = $newAmount;
                $this->paymentMethodName = $row['nombre'];  // Obtener el nombre del método de pago
                return true;
            }
        }

        return false;
    }

    private function createLog() {
        $log = new Log($this->conn);
        $log->month = date('Y-m');
        $log->movement_type = "Ingreso";
        $log->movement_id = $this->id;
        $log->details = json_encode([
            "cantidad" => $this->amount,
            "id_payment" => $this->id_payment,
            "payment_method_name" => $this->paymentMethodName,  // Agregar el nombre del método de pago
            "cantidad_antes" => $this->amountBefore,
            "cantidad_despues" => $this->newAmount,
            "descripcion" => $this->description,
            "fecha" => date('Y-m-d H:i:s')
        ], JSON_UNESCAPED_UNICODE);

        return $log->create();
    }

    public function delete() {
        // Obtener los detalles del ingreso antes de eliminarlo
        $query = "SELECT id_payment, amount FROM " . $this->table_name . " WHERE id = :id LIMIT 0,1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $this->id);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            $this->id_payment = $row['id_payment'];
            $this->amount = $row['amount'];

            // Obtener los detalles actuales del método de pago
            $paymentMethod = new PaymentMethod($this->conn);
            $paymentMethod->id = $this->id_payment;
            $stmt = $paymentMethod->read_single();
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $amountBefore = $row['cantidad'];
            $newAmount = $amountBefore - $this->amount;
            $this->paymentMethodName = $row['nombre'];  // Obtener el nombre del método de pago

            // Eliminar el ingreso
            $query = "DELETE FROM " . $this->table_name . " WHERE id = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":id", $this->id);

            if ($stmt->execute()) {
                // Revertir el saldo del método de pago
                $paymentMethod->cantidad = $newAmount;

                if ($paymentMethod->update()) {
                    // Crear log
                    $log = new Log($this->conn);
                    $log->month = date('Y-m');
                    $log->movement_type = "Ingreso Eliminado";
                    $log->movement_id = $this->id;
                    $log->details = json_encode([
                        "cantidad" => $this->amount,
                        "id_payment" => $this->id_payment,
                        "payment_method_name" => $this->paymentMethodName,  // Agregar el nombre del método de pago
                        "cantidad_antes" => $amountBefore,
                        "cantidad_despues" => $newAmount,
                        "descripcion" => $this->description,
                        "fecha" => date('Y-m-d H:i:s')
                    ], JSON_UNESCAPED_UNICODE);

                    if ($log->create()) {
                        return true;
                    } else {
                        // Manejo de error en caso de que no se pueda crear el log
                        return false;
                    }
                } else {
                    // Manejo de error en caso de que no se pueda actualizar el método de pago
                    return false;
                }
            } else {
                // Manejo de error en caso de que no se pueda eliminar el ingreso
                return false;
            }
        } else {
            // Manejo de error en caso de que no se pueda encontrar el ingreso
            return false;
        }
    }
}
?>
