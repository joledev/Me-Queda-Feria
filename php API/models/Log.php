<?php
class Log {
    private $conn;
    private $table_name = "logs";

    public $id;
    public $month;
    public $movement_type;
    public $movement_id;
    public $details;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function create() {
        $query = "INSERT INTO " . $this->table_name . " SET month=:month, movement_type=:movement_type, movement_id=:movement_id, details=:details";
        $stmt = $this->conn->prepare($query);

        $this->month = htmlspecialchars(strip_tags($this->month));
        $this->movement_type = htmlspecialchars(strip_tags($this->movement_type));
        $this->movement_id = htmlspecialchars(strip_tags($this->movement_id));
        $this->details = htmlspecialchars(strip_tags($this->details));

        $stmt->bindParam(":month", $this->month);
        $stmt->bindParam(":movement_type", $this->movement_type);
        $stmt->bindParam(":movement_id", $this->movement_id);
        $stmt->bindParam(":details", $this->details);

        if ($stmt->execute()) {
            return true;
        }

        return false;
    }

    public function getLogsByMonth($month) {
        $query = "SELECT * FROM " . $this->table_name . " WHERE month = :month";
        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(":month", $month);
        $stmt->execute();

        return $stmt;
    }
}
?>
