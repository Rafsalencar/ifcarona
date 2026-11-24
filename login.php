
<?php

header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . "/conexao.php";


$https = isset($_SERVER["HTTPS"]) &&
         $_SERVER["HTTPS"] !== "off";

session_set_cookie_params([
    "lifetime" => 0,
    "path" => "/",
    "secure" => $https,
    "httponly" => true,
    "samesite" => "Lax"
]);

session_start();


if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);

    echo json_encode([
        "sucesso" => false,
        "mensagem" => "Método não permitido."
    ]);

    exit;
}


$dados = $_POST;

if (empty($dados)) {
    $json = json_decode(
        file_get_contents("php://input"),
        true
    );

    if (is_array($json)) {
        $dados = $json;
    }
}

$email = strtolower(trim($dados["email"] ?? ""));
$senha = $dados["senha"] ?? "";


if (!$email || !$senha) {
    http_response_code(400);

    echo json_encode([
        "sucesso" => false,
        "mensagem" => "Informe e-mail e senha."
    ]);

    exit;
}



$sql = "SELECT
            id,
            nome,
            email,
            senha,
            perfil,
            status,
            comprovante,
            telefone,
            veiculo_modelo,
            veiculo_cor,
            veiculo_placa,
            veiculo_vagas,
            foto
        FROM usuarios
        WHERE email = ?
        LIMIT 1";


$stmt = $conexao->prepare($sql);
$stmt->bind_param("s", $email);
$stmt->execute();

$resultado = $stmt->get_result();
$usuario = $resultado->fetch_assoc();

$stmt->close();


if (!$usuario || !password_verify($senha, $usuario["senha"])) {
    http_response_code(401);

    echo json_encode([
        "sucesso" => false,
        "mensagem" => "E-mail ou senha incorretos."
    ]);

    exit;
}


session_regenerate_id(true);

$_SESSION["usuario_id"] = $usuario["id"];
$_SESSION["usuario_perfil"] = $usuario["perfil"];


echo json_encode([
    "sucesso" => true,
    "mensagem" => "Login realizado com sucesso.",

    "usuario" => [
        "id" => $usuario["id"],
        "nome" => $usuario["nome"],
        "email" => $usuario["email"],
        "perfil" => $usuario["perfil"],
        "status" => $usuario["status"],
        "tem_comprovante" => !empty($usuario["comprovante"]),
        "telefone" => $usuario["telefone"],
        "veiculo_modelo" => $usuario["veiculo_modelo"],
        "veiculo_cor" => $usuario["veiculo_cor"],
        "veiculo_placa" => $usuario["veiculo_placa"],
        "veiculo_vagas" => $usuario["veiculo_vagas"],
        "tem_foto" => !empty($usuario["foto"])
    ]

]);

$conexao->close();

?>
