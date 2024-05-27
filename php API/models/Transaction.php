<?php
include_once '../models/PaymentMethod.php';
include_once '../models/Log.php';

class Transaction {
    private $conn;
    private $table_name = "transactions";

    public $id;
    public $id_payment_sender;
    public $id_payment_receiver;
    public $amount;
    public $description;
    public $date;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function create() {
        $query = "INSERT INTO " . $this->table_name . " SET id_payment_sender=:id_payment_sender, id_payment_receiver=:id_payment_receiver, amount=:amount, description=:description";
        $stmt = $this->conn->prepare($query);

        $this->id_payment_sender = htmlspecialchars(strip_tags($this->id_payment_sender));
        $this->id_payment_receiver = htmlspecialchars(strip_tags($this->id_payment_receiver));
        $this->amount = htmlspecialchars(strip_tags($this->amount));
        $this->description = htmlspecialchars(strip_tags($this->description));

        $stmt->bindParam(":id_payment_sender", $this->id_payment_sender);
        $stmt->bindParam(":id_payment_receiver", $this->id_payment_receiver);
        $stmt->bindParam(":amount", $this->amount);
        $stmt->bindParam(":description", $this->description);

        if ($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return $this->updatePaymentMethods() && $this->createLog();
        }

        return false;
    }

    private function updatePaymentMethods() {
        $paymentMethodSender = new PaymentMethod($this->conn);
        $paymentMethodSender->id = $this->id_payment_sender;
        $stmtSender = $paymentMethodSender->read_single();

        $paymentMethodReceiver = new PaymentMethod($this->conn);
        $paymentMethodReceiver->id = $this->id_payment_receiver;
        $stmtReceiver = $paymentMethodReceiver->read_single();

        if ($stmtSender->rowCount() > 0 && $stmtReceiver->rowCount() > 0) {
            $rowSender = $stmtSender->fetch(PDO::FETCH_ASSOC);
            $amountBeforeSender = $rowSender['cantidad'];
            $paymentSenderName = $rowSender['nombre'];
            $newAmountSender = $amountBeforeSender - $this->amount;

            $rowReceiver = $stmtReceiver->fetch(PDO::FETCH_ASSOC);
            $amountBeforeReceiver = $rowReceiver['cantidad'];
            $paymentReceiverName = $rowReceiver['nombre'];
            $newAmountReceiver = $amountBeforeReceiver + $this->amount;

            $paymentMethodSender->cantidad = $newAmountSender;
            $paymentMethodReceiver->cantidad = $newAmountReceiver;

            if ($paymentMethodSender->update() && $paymentMethodReceiver->update()) {
                $this->amountBeforeSender = $amountBeforeSender;
                $this->newAmountSender = $newAmountSender;
                $this->amountBeforeReceiver = $amountBeforeReceiver;
                $this->newAmountReceiver = $newAmountReceiver;
                $this->paymentSenderName = $paymentSenderName;
                $this->paymentReceiverName = $paymentReceiverName;
                return true;
            }
        }

        return false;
    }

    private function createLog() {
        $log = new Log($this->conn);
        $log->month = date('Y-m');
        $log->movement_type = "Transferencia";
        $log->movement_id = $this->id;
        $log->details = json_encode([
            "cantidad" => $this->amount,
            "id_payment_sender" => $this->id_payment_sender,
            "nombre_payment_sender" => $this->paymentSenderName,
            "id_payment_receiver" => $this->id_payment_receiver,
            "nombre_payment_receiver" => $this->paymentReceiverName,
            "cantidad_antes_sender" => $this->amountBeforeSender,
            "cantidad_despues_sender" => $this->newAmountSender,
            "cantidad_antes_receiver" => $this->amountBeforeReceiver,
            "cantidad_despues_receiver" => $this->newAmountReceiver,
            "descripcion" => $this->description,
            "fecha" => date('Y-m-d H:i:s')
        ], JSON_UNESCAPED_UNICODE);

        return $log->create();
    }

    public function delete() {
        // Obtener los detalles de la transacción antes de eliminarla
        $query = "SELECT id_payment_sender, id_payment_receiver, amount FROM " . $this->table_name . " WHERE id = :id LIMIT 0,1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $this->id);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            $this->id_payment_sender = $row['id_payment_sender'];
            $this->id_payment_receiver = $row['id_payment_receiver'];
            $this->amount = $row['amount'];

            // Obtener los detalles actuales de los métodos de pago
            $paymentMethodSender = new PaymentMethod($this->conn);
            $paymentMethodSender->id = $this->id_payment_sender;
            $stmtSender = $paymentMethodSender->read_single();
            $rowSender = $stmtSender->fetch(PDO::FETCH_ASSOC);
            $amountBeforeSender = $rowSender['cantidad'];
            $paymentSenderName = $rowSender['nombre'];
            $newAmountSender = $amountBeforeSender + $this->amount;
            $newAmountSender = number_format($newAmountSender, 2, '.', '');

            $paymentMethodReceiver = new PaymentMethod($this->conn);
            $paymentMethodReceiver->id = $this->id_payment_receiver;
            $stmtReceiver = $paymentMethodReceiver->read_single();
            $rowReceiver = $stmtReceiver->fetch(PDO::FETCH_ASSOC);
            $amountBeforeReceiver = $rowReceiver['cantidad'];
            $paymentReceiverName = $rowReceiver['nombre'];
            $newAmountReceiver = $amountBeforeReceiver - $this->amount;
            $newAmountReceiver = number_format($newAmountReceiver, 2, '.', '');

            // Eliminar la transacción
            $query = "DELETE FROM " . $this->table_name . " WHERE id = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":id", $this->id);

            if ($stmt->execute()) {
                $paymentMethodSender->cantidad = $newAmountSender;
                $paymentMethodReceiver->cantidad = $newAmountReceiver;

                if ($paymentMethodSender->update() && $paymentMethodReceiver->update()) {
                    // Crear log
                    $log = new Log($this->conn);
                    $log->month = date('Y-m');
                    $log->movement_type = "Transferencia Eliminada";
                    $log->movement_id = $this->id;
                    $log->details = json_encode([
                        "cantidad" => $this->amount,
                        "id_payment_sender" => $this->id_payment_sender,
                        "nombre_payment_sender" => $paymentSenderName,
                        "id_payment_receiver" => $this->id_payment_receiver,
                        "nombre_payment_receiver" => $paymentReceiverName,
                        "cantidad_antes_sender" => $amountBeforeSender,
                        "cantidad_despues_sender" => $newAmountSender,
                        "cantidad_antes_receiver" => $amountBeforeReceiver,
                        "cantidad_despues_receiver" => $newAmountReceiver,
                        "descripcion" => $this->description,
                        "fecha" => date('Y-m-d H:i:s')
                    ], JSON_UNESCAPED_UNICODE);

                    return $log->create();
                }
            }
        }

        return false;
    }
}
?>
