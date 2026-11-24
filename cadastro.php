
<?php

header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . "/conexao.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode([
        "sucesso" => false,
        "mensagem" => "Método não permitido."
    ]);
    exit;
}

$nome = trim($_POST["nome"] ?? "");
$email = strtolower(trim($_POST["email"] ?? ""));
$senha = $_POST["senha"] ?? "";
$perfil = $_POST["perfil"] ?? "";

if (strlen($nome) < 3 || strlen($nome) > 120) {
    http_response_code(400);
    echo json_encode([
        "sucesso" => false,
        "mensagem" => "Informe um nome válido."
    ]);
    exit;
}

if (
    !filter_var($email, FILTER_VALIDATE_EMAIL) ||
    !preg_match('/@([a-z0-9-]+\.)+edu\.br$/i', $email)
) {
    http_response_code(400);
    echo json_encode([
        "sucesso" => false,
        "mensagem" => "Utilize um e-mail institucional .edu.br."
    ]);
    exit;
}

if (strlen($senha) < 6) {
    http_response_code(400);
    echo json_encode([
        "sucesso" => false,
        "mensagem" => "A senha deve ter pelo menos 6 caracteres."
    ]);
    exit;
}

if (!in_array($perfil, ["p", "m"], true)) {
    http_response_code(400);
    echo json_encode([
        "sucesso" => false,
        "mensagem" => "Perfil inválido."
    ]);
    exit;
}

$sql = "SELECT id FROM usuarios WHERE email = ?";

$stmt = $conexao->prepare($sql);
$stmt->bind_param("s", $email);
$stmt->execute();

$resultado = $stmt->get_result();

if ($resultado->num_rows > 0) {
    http_response_code(409);
    echo json_encode([
        "sucesso" => false,
        "mensagem" => "Este e-mail já está cadastrado."
    ]);
    exit;
}

$stmt->close();

if (
    !isset($_FILES["comprovante"]) ||
    $_FILES["comprovante"]["error"] !== UPLOAD_ERR_OK
) {
    http_response_code(400);
    echo json_encode([
        "sucesso" => false,
        "mensagem" => "Envie seu comprovante institucional."
    ]);
    exit;
}

$arquivo = $_FILES["comprovante"];

if ($arquivo["size"] > 5 * 1024 * 1024) {
    http_response_code(400);
    echo json_encode([
        "sucesso" => false,
        "mensagem" => "O comprovante deve ter no máximo 5 MB."
    ]);
    exit;
}

$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime = $finfo->file($arquivo["tmp_name"]);

$tiposPermitidos = [
    "application/pdf" => "pdf",
    "image/jpeg" => "jpg",
    "image/png" => "png"
];

if (!isset($tiposPermitidos[$mime])) {
    http_response_code(400);
    echo json_encode([
        "sucesso" => false,
        "mensagem" => "Envie um arquivo PDF, JPG ou PNG válido."
    ]);
    exit;
}

$extensao = $tiposPermitidos[$mime];
$nomeArquivo = bin2hex(random_bytes(16)) . "." . $extensao;
$pasta = __DIR__ . "/../uploads/comprovantes/";

if (!is_dir($pasta)) {
    http_response_code(500);
    echo json_encode([
        "sucesso" => false,
        "mensagem" => "Pasta de comprovantes não encontrada."
    ]);
    exit;
}

$caminho = $pasta . $nomeArquivo;

if (!move_uploaded_file($arquivo["tmp_name"], $caminho)) {
    http_response_code(500);
    echo json_encode([
        "sucesso" => false,
        "mensagem" => "Não foi possível salvar o comprovante."
    ]);
    exit;
}

$senhaHash = password_hash($senha, PASSWORD_DEFAULT);

$sql = "INSERT INTO usuarios
        (nome, email, senha, perfil, status, comprovante)
        VALUES (?, ?, ?, ?, 'pendente', ?)";

$stmt = $conexao->prepare($sql);

$stmt->bind_param(
    "sssss",
    $nome,
    $email,
    $senhaHash,
    $perfil,
    $nomeArquivo
);

if ($stmt->execute()) {
    http_response_code(201);
    echo json_encode([
        "sucesso" => true,
        "mensagem" => "Cadastro realizado! Aguarde a aprovação do administrador."
    ]);
} else {
    if (file_exists($caminho)) {
        unlink($caminho);
    }

    http_response_code(500);
    echo json_encode([
        "sucesso" => false,
        "mensagem" => "Não foi possível realizar o cadastro."
    ]);
}

$stmt->close();
$conexao->close();

?>
