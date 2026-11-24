

## Contas de demonstração

Senha de todas: `123456`

| Perfil        | E-mail                          |
|---------------|---------------------------------|
| Passageiro    | aluno@instituicao.edu.br        |
| Motorista     | motorista@instituicao.edu.br    |
| Administrador | admin@instituicao.edu.br        |

As credenciais também aparecem na tela de login. O botão "Restaurar dados da demonstração" apaga tudo o que foi criado e recria os dados iniciais (pede confirmação).

## Estrutura

| Arquivo             | Responsabilidade                                                       |
|---------------------|------------------------------------------------------------------------|
| `js/config.js`      | Constantes: perfis, navegação, mensagens, limites                      |
| `js/storage.js`     | Acesso ao `localStorage` e tabelas (`users`, `rides`, `requests`, `reports`) |
| `js/seed.js`        | Dados iniciais e restauração da demonstração                           |
| `js/services.js`    | Regras de negócio: validação, login, cadastro, caronas, solicitações, denúncias, fotos |
| `js/state.js`       | Estado da interface                                                    |
| `js/ui.js`          | Componentes visuais reutilizáveis                                      |
| `js/screens.js`     | Telas                                                                  |
| `js/app.js`         | Renderização, ações e eventos                                          |

As chaves do `localStorage` usam o prefixo `ifc:`.

## Avisos

- Senhas são salvas em texto simples, apenas para fins de demonstração. Não use senhas reais.
- A validação de perfil no frontend organiza o acesso às telas, mas não é segurança real: o usuário pode editar o `localStorage` pelo navegador.
- Os dados existem somente no navegador em que foram criados.
- Fotos de perfil (JPG, PNG ou WEBP, até 5 MB) são redimensionadas para no máximo 320 px e comprimidas via Canvas antes de serem salvas.
