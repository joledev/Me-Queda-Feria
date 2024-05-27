<?php

require 'vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

require 'routes/transaction.php';
require 'routes/income.php';
require 'routes/expense.php';
require 'routes/paymentMethod.php';
require 'routes/log.php';

?>
