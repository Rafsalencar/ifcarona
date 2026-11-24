
<?php

header("X-Content-Type-Options: nosniff");


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

require_once __DIR__ . "/conexao.php";


if (!isset($_SESSION["usuario_id"])) {
    http_response_code(401);
    exit("Acesso não autorizado.");
}

$usuarioId = (int) $_SESSION["usuario_id"];


$sql = "SELECT comprovante
        FROM usuarios
        WHERE id = ?
        LIMIT 1";

$stmt = $conexao->prepare($sql);
$stmt->bind_param("i", $usuarioId);
$stmt->execute();

$resultado = $stmt->get_result();
$usuario = $resultado->fetch_assoc();

$stmt->close();
$conexao->close();

if (!$usuario || empty($usuario["comprovante"])) {
    http_response_code(404);
    exit("Comprovante não encontrado.");
}


$nomeArquivo = $usuario["comprovante"];

if (!preg_match('/^[a-f0-9]{32}\.(pdf|jpg|png)$/i', $nomeArquivo)) {
    http_response_code(400);
    exit("Arquivo inválido.");
}


$pasta = realpath(
    __DIR__ . "/../uploads/comprovantes"
);

if ($pasta === false) {
    http_response_code(500);
    exit("Pasta de comprovantes não encontrada.");
}

$caminho = realpath($pasta . DIRECTORY_SEPARATOR . $nomeArquivo);

if (
    $caminho === false ||
    !is_file($caminho) ||
    !is_readable($caminho) ||
    dirname($caminho) !== $pasta
) {
    http_response_code(404);
    exit("Documento não encontrado.");
}


$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime = $finfo->file($caminho);

$permitidos = [
    "application/pdf",
    "image/jpeg",
    "image/png"
];

if (!in_array($mime, $permitidos, true)) {
    http_response_code(415);
    exit("Formato de documento não permitido.");
}


header("Content-Type: " . $mime);
header("Content-Disposition: inline; filename=\"comprovante\"");
header("Content-Length: " . filesize($caminho));
header("Cache-Control: private, no-store, max-age=0");

readfile($caminho);

exit;

?>
