
<?php
require_once __DIR__ . "/conexao.php";

header("Content-Type: application/json; charset=utf-8");

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
    header("Content-Type: application/json; charset=utf-8");

    echo json_encode([
        "sucesso" => $sucesso,
        "mensagem" => $mensagem
    ]);

    exit;
}

if (empty($_SESSION["usuario_id"])) {
    resposta(false, "Faça login novamente.", 401);
}

$id = (int) $_SESSION["usuario_id"];

$pasta = __DIR__ . "/../uploads/fotos/";

if (!is_dir($pasta)) {
    resposta(false, "Pasta de fotos não encontrada.", 500);
}

// CONSULTAR E EXIBIR A FOTO
if ($_SERVER["REQUEST_METHOD"] === "GET") {
    $stmt = $conexao->prepare(
        "SELECT foto FROM usuarios WHERE id = ? LIMIT 1"
    );

    $stmt->bind_param("i", $id);
    $stmt->execute();

    $usuario = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (empty($usuario["foto"])) {
        http_response_code(404);
        exit;
    }

    $arquivo = $usuario["foto"];

    if (!preg_match('/^[a-f0-9]{32}\.(jpg|png|webp)$/', $arquivo)) {
        http_response_code(404);
        exit;
    }

    $caminho = $pasta . $arquivo;

    if (!is_file($caminho)) {
        http_response_code(404);
        exit;
    }

    $mime = mime_content_type($caminho);

    if (!in_array($mime, ["image/jpeg", "image/png", "image/webp"], true)) {
        http_response_code(404);
        exit;
    }

    header("Content-Type: " . $mime);
    header("Content-Length: " . filesize($caminho));
    header("Cache-Control: private, no-store");

    readfile($caminho);
    exit;
}

// ENVIAR OU REMOVER FOTO
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    resposta(false, "Método não permitido.", 405);
}

$acao = $_POST["acao"] ?? "";

// REMOVER FOTO
if ($acao === "remover") {
    $stmt = $conexao->prepare(
        "SELECT foto FROM usuarios WHERE id = ? LIMIT 1"
    );

    $stmt->bind_param("i", $id);
    $stmt->execute();

    $usuario = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    $stmt = $conexao->prepare(
        "UPDATE usuarios SET foto = NULL WHERE id = ?"
    );

    $stmt->bind_param("i", $id);

    if (!$stmt->execute()) {
        resposta(false, "Não foi possível remover a foto.", 500);
    }

    $stmt->close();

    if (!empty($usuario["foto"]) &&
        preg_match('/^[a-f0-9]{32}\.(jpg|png|webp)$/', $usuario["foto"])) {
        $antigo = $pasta . $usuario["foto"];

        if (is_file($antigo)) {
            unlink($antigo);
        }
    }

    resposta(true, "Foto removida com sucesso.");
}

// ENVIAR FOTO
if ($acao !== "enviar") {
    resposta(false, "Ação inválida.", 400);
}

if (!isset($_FILES["foto"])) {
    resposta(false, "Selecione uma imagem.", 400);
}

$foto = $_FILES["foto"];

if ($foto["error"] !== UPLOAD_ERR_OK) {
    resposta(false, "Erro ao receber a imagem.", 400);
}

if ($foto["size"] > 500 * 1024) {
    resposta(false, "A imagem deve ter no máximo 500 KB.", 400);
}

$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime = $finfo->file($foto["tmp_name"]);

$formatos = [
    "image/jpeg" => "jpg",
    "image/png" => "png",
    "image/webp" => "webp"
];

if (!isset($formatos[$mime])) {
    resposta(false, "Use uma imagem JPG, PNG ou WEBP.", 400);
}

$nomeArquivo = bin2hex(random_bytes(16)) . "." . $formatos[$mime];
$destino = $pasta . $nomeArquivo;

if (!move_uploaded_file($foto["tmp_name"], $destino)) {
    resposta(false, "Não foi possível salvar a imagem.", 500);
}

// Recupera o nome da foto anterior.
$stmt = $conexao->prepare(
    "SELECT foto FROM usuarios WHERE id = ? LIMIT 1"
);

$stmt->bind_param("i", $id);
$stmt->execute();

$usuario = $stmt->get_result()->fetch_assoc();
$stmt->close();

// Atualiza o banco.
$stmt = $conexao->prepare(
    "UPDATE usuarios SET foto = ? WHERE id = ?"
);

$stmt->bind_param("si", $nomeArquivo, $id);

if (!$stmt->execute()) {
    unlink($destino);
    resposta(false, "Não foi possível atualizar a foto.", 500);
}

$stmt->close();

// Apaga a foto anterior.
if (!empty($usuario["foto"]) &&
    preg_match('/^[a-f0-9]{32}\.(jpg|png|webp)$/', $usuario["foto"])) {
    $antigo = $pasta . $usuario["foto"];

    if (is_file($antigo)) {
        unlink($antigo);
    }
}

resposta(true, "Foto atualizada com sucesso.");
?>
