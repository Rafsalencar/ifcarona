
<?php
header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . "/conexao.php";

session_set_cookie_params([
    "lifetime" => 0,
    "path" => "/",
    "secure" => !empty($_SERVER["HTTPS"]) && $_SERVER["HTTPS"] !== "off",
    "httponly" => true,
    "samesite" => "Lax"
]);

session_start();

function resposta($sucesso, $mensagem, $codigo = 200) {
    http_response_code($codigo);

    echo json_encode([
        "sucesso" => $sucesso,
        "mensagem" => $mensagem
    ]);

    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    resposta(false, "Método não permitido.", 405);
}

if (empty($_SESSION["usuario_id"])) {
    resposta(false, "Faça login novamente.", 401);
}

$dados = json_decode(file_get_contents("php://input"), true);

if (!is_array($dados)) {
    resposta(false, "Dados inválidos.", 400);
}

$nome = trim($dados["nome"] ?? "");
$email = strtolower(trim($dados["email"] ?? ""));
$telefone = trim($dados["telefone"] ?? "");

$modelo = trim($dados["veiculoModelo"] ?? "");
$cor = trim($dados["veiculoCor"] ?? "");
$placa = strtoupper(trim($dados["veiculoPlaca"] ?? ""));
$vagas = $dados["veiculoVagas"] ?? null;

if (mb_strlen($nome) < 3 || mb_strlen($nome) > 120) {
    resposta(false, "Informe um nome válido.", 400);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL) ||
    !preg_match('/\.edu\.br$/i', $email)) {
    resposta(false, "Informe um e-mail institucional válido.", 400);
}

if (mb_strlen($telefone) > 20) {
    resposta(false, "Telefone muito longo.", 400);
}

if ($vagas !== null && $vagas !== "") {
    $vagas = filter_var($vagas, FILTER_VALIDATE_INT);

    if ($vagas === false || $vagas < 1 || $vagas > 6) {
        resposta(false, "A quantidade de vagas deve ser entre 1 e 6.", 400);
    }
} else {
    $vagas = null;
}

$id = (int) $_SESSION["usuario_id"];

// Verifica se o e-mail já pertence a outro usuário.
$sql = "SELECT id FROM usuarios
        WHERE email = ? AND id <> ?
        LIMIT 1";

$stmt = $conexao->prepare($sql);
$stmt->bind_param("si", $email, $id);
$stmt->execute();

if ($stmt->get_result()->num_rows > 0) {
    $stmt->close();
    resposta(false, "Este e-mail já está sendo utilizado.", 409);
}

$stmt->close();

// Atualiza os dados pessoais.
$sql = "UPDATE usuarios
        SET nome = ?,
            email = ?,
            telefone = ?,
            veiculo_modelo = ?,
            veiculo_cor = ?,
            veiculo_placa = ?,
            veiculo_vagas = ?
        WHERE id = ?";

$stmt = $conexao->prepare($sql);

$stmt->bind_param(
    "ssssssii",
    $nome,
    $email,
    $telefone,
    $modelo,
    $cor,
    $placa,
    $vagas,
    $id
);

if (!$stmt->execute()) {
    $stmt->close();
    resposta(false, "Não foi possível atualizar o perfil.", 500);
}

$stmt->close();
$conexao->close();

resposta(true, "Perfil atualizado com sucesso.");
?>
