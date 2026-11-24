
<?php

$host = "sql310.infinityfree.com";
$usuario = "if0_43515879";
$senha = "salomao1104";
$banco = "if0_43515879_ifcarona";

$conexao = new mysqli(
    $host,
    $usuario,
    $senha,
    $banco
);

if ($conexao->connect_error) {
    http_response_code(500);
    die("Erro ao conectar ao banco de dados.");
}

$conexao->set_charset("utf8mb4");

?>
