const demoPanel = () => `
    <div class="c" style="display:flex;flex-direction:column;gap:8px">
        <span class="lb" style="margin:0">Contas de demonstração</span>

        ${['p', 'm', 'a'].map(key => `
            <button class="gh" data-act="preencher" data-v="${key}"
                style="width:100%;height:auto;min-height:44px;padding:8px 14px;border-radius:12px;justify-content:space-between;gap:12px;text-align:left">
                <span>${ROLE[key]}</span>
                <span class="mut" style="overflow-wrap:anywhere;text-align:right">${DEMO_ACCOUNTS[key].email}</span>
            </button>
        `).join('')}

        <p class="mut">
            Senha de todas as contas: ${DEMO_PASSWORD}. Esta é uma versão demonstrativa:
            os dados ficam apenas neste navegador e as senhas não são protegidas.
            Não use senhas reais.
        </p>

        <button class="gh d" data-act="restaurar">Restaurar dados da demonstração</button>
    </div>`;

const requestRow = request => {
    const passenger = Users.byId(request.passengerId);

    const actions = request.status === 'pendente'
        ? `<div style="display:flex;gap:8px">
                <button class="gh d" style="flex:1;padding:0;font-size:13px" data-act="recusar" data-id="${request.id}">Rejeitar</button>
                <button class="pr s" data-act="aceitar" data-id="${request.id}">Aceitar</button>
           </div>`
        : '';

    return `
        <div style="border-top:1px solid var(--line);padding-top:10px;display:flex;flex-direction:column;gap:8px">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
                <strong style="font-size:14px">${esc(passenger?.nome || 'Passageiro')}</strong>
                ${requestTag(request.status)}
            </div>
            ${actions}
        </div>`;
};

const driverRideCard = ride => {
    const free = Rides.freeSeats(ride);
    const requests = Requests.byRide(ride.id).filter(request => request.status !== 'rejeitada');

    return `
        <div class="c" style="display:flex;flex-direction:column;gap:10px">
            <div>
                <strong>${esc(ride.origem)} → ${esc(ride.destino)}</strong>
                <div style="font-size:13px;color:var(--mut);margin:4px 0 8px">
                    ${esc(fmtDate(ride.data))} · ${esc(ride.horario)}
                </div>
                <span class="tag ${free < 2 ? 'w' : ''}">${free ? vg(free) : 'Lotada'}</span>
            </div>

            ${requests.map(requestRow).join('')}

            <div style="display:flex;gap:8px">
                <button class="gh" style="flex:1;padding:0;font-size:13px" data-act="editarCarona" data-id="${ride.id}">Editar</button>
                <button class="gh d" style="flex:1;padding:0;font-size:13px" data-act="excluirCarona" data-id="${ride.id}">Excluir</button>
            </div>
        </div>`;
};

const passengerRequestCard = request => {
    const ride = Rides.byId(request.rideId);
    if (!ride) return '';

    const driver = Users.byId(ride.driverId);

    return `
        <div class="c" style="display:flex;flex-direction:column;gap:10px">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
                <strong>${esc(driver?.nome || 'Motorista')} · ${esc(ride.horario)}</strong>
                ${requestTag(request.status)}
            </div>

            <span style="font-size:13px;color:var(--mut)">${esc(ride.origem)} → ${esc(ride.destino)}</span>

            <button class="gh d" data-act="cancelar" data-id="${request.id}">
                ${request.status === 'rejeitada' ? 'Remover' : 'Cancelar solicitação'}
            </button>
        </div>`;
};

const userCard = user => {
    const vehicle = user.veiculo?.modelo
        ? [user.veiculo.modelo, user.veiculo.cor, user.veiculo.placa].filter(Boolean).join(' · ')
        : '';

    const details = [
        `Solicitado em ${user.criadoEm}`,
        user.telefone && `Telefone: ${user.telefone}`,
        vehicle && `Veículo: ${vehicle}`,
        user.comprovante && `Comprovante: ${user.comprovante.nome}`
    ].filter(Boolean);

    const proofButton = user.comprovante
        ? `<button class="gh" style="flex:1;padding:0;font-size:13px" data-act="doc" data-id="${user.id}">${ic('file', 16)}Ver doc.</button>`
        : '';

    const rejectButton = `<button class="gh d" style="flex:1;padding:0;font-size:13px" data-act="rejeitar" data-id="${user.id}">Rejeitar</button>`;
    const approveButton = `<button class="pr s" data-act="aprovar" data-id="${user.id}">Aprovar</button>`;

    let actions = '';

    if (user.perfil !== 'a') {
        if (user.status === 'pendente') actions = proofButton + rejectButton + approveButton;
        else if (user.status === 'aprovado') actions = proofButton;
        else actions = proofButton + approveButton;
    }

    return `
        <article class="c">
            <div style="display:flex;gap:12px;align-items:center">
                ${badge(user)}
                <div style="flex:1;min-width:0">
                    <strong>${esc(user.nome)}</strong>
                    <div style="font-size:13px;color:var(--mut);margin-top:2px;overflow-wrap:anywhere">
                        ${esc(user.email)}
                    </div>
                </div>
                <span class="tag ${user.perfil === 'p' ? 'b' : ''}">${ROLE[user.perfil]}</span>
            </div>

            <div style="font-size:12px;color:var(--mut);margin:10px 0 12px;display:flex;flex-direction:column;gap:2px">
                <span>${statusTag(user.status)}</span>
                ${details.map(line => `<span style="overflow-wrap:anywhere">${esc(line)}</span>`).join('')}
            </div>

            ${actions ? `<div style="display:flex;gap:8px">${actions}</div>` : ''}
        </article>`;
};

const reportCard = report => {
    const reported = Users.byId(report.reportedId);

    return `
        <article class="c">
            <strong>${esc(reported?.nome || 'Usuário removido')}</strong>
            <p class="mut" style="margin:4px 0 12px">${esc(report.motivo)}</p>

            <div style="display:flex;gap:8px">
                <button class="gh" style="flex:1;padding:0;font-size:13px" data-act="arquivar" data-id="${report.id}">
                    Arquivar
                </button>
                <button class="gh d" style="flex:1;padding:0;font-size:13px" data-act="suspender" data-id="${report.id}">
                    Suspender conta
                </button>
            </div>
        </article>`;
};

const emptyOr = (items, renderItem, message) =>
    items.length ? items.map(renderItem).join('') : `<p class="mut">${message}</p>`;

const Screens = {
    login: () => `
        <div class="hero">
            <svg aria-hidden="true" width="420" height="200" viewBox="0 0 420 200" style="position:absolute;top:0;left:0">
                <path d="M-20 160C80 40 160 190 260 80S380 0 440 30" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="3" stroke-dasharray="2 10" stroke-linecap="round"/>
                <circle cx="345" cy="22" r="5" fill="#fff"/>
            </svg>

            <div style="position:relative">
                <div style="width:64px;height:64px;border-radius:18px;background:#fff;color:#1B7A3B;display:flex;align-items:center;justify-content:center">
                    ${ic('car', 34)}
                </div>

                <h1 style="margin:20px 0 4px;font-size:36px;letter-spacing:-.03em;font-weight:700">IFCarona</h1>
                <p style="margin:0;font-size:16px;color:#E3F2E7">Caronas universitárias</p>
            </div>
        </div>

        <div class="form">
            <div>
                <label class="lb" for="login-email">E-mail institucional</label>
                <input class="in" ${bind('login', 'email')} type="email" autocomplete="username"
                    value="${esc(draftValue('login', 'email'))}" placeholder="${DEMO_ACCOUNTS[state.role].email}">
                ${errorLine()}
            </div>

            <div>
                <label class="lb" for="login-senha">Senha</label>
                <input class="in" ${bind('login', 'senha')} type="password" autocomplete="current-password"
                    value="${esc(draftValue('login', 'senha'))}" placeholder="Senha da conta demo: ${DEMO_PASSWORD}">
            </div>

            <div>
                <span class="lb">Entrar como</span>
                <div class="seg">
                    ${['p', 'm', 'a'].map(key =>
                        `<button data-act="role" data-v="${key}" aria-pressed="${state.role === key}">${ROLE[key]}</button>`
                    ).join('')}
                </div>
            </div>

            <button class="pr" data-act="login">Entrar</button>

            <p class="mut" style="text-align:center">
                Ainda não tem conta? <a href="#" data-act="cadastrar">Cadastrar-se</a>
            </p>

            ${demoPanel()}
        </div>`,

    cadastro: () => `
        ${head('Cadastro', '<button class="gh" data-act="voltarLogin">Voltar</button>')}
        <div class="scr">
            <div>
                <label class="lb" for="cadastro-nome">Nome completo</label>
                <input class="in" ${bind('cadastro', 'nome')} value="${esc(draftValue('cadastro', 'nome'))}" placeholder="Seu nome">
            </div>

            <div>
                <label class="lb" for="cadastro-email">E-mail institucional</label>
                <input class="in" ${bind('cadastro', 'email')} type="email" value="${esc(draftValue('cadastro', 'email'))}" placeholder="nome@instituicao.edu.br">
            </div>

            <div>
                <label class="lb" for="cadastro-senha">Senha</label>
                <input class="in" ${bind('cadastro', 'senha')} type="password" autocomplete="new-password"
                    value="${esc(draftValue('cadastro', 'senha'))}" placeholder="Mínimo de ${LIMITS.minPasswordLength} caracteres">
            </div>

            <div>
                <span class="lb">Quero ser</span>
                <div class="seg">
                    ${['p', 'm'].map(key =>
                        `<button data-act="tipo" data-v="${key}" aria-pressed="${state.signupType === key}">${ROLE[key]}</button>`
                    ).join('')}
                </div>
            </div>

            <div>
                <span class="lb">Comprovante de vínculo</span>
                <label class="c" style="display:flex;gap:10px;align-items:center;cursor:pointer;border-style:dashed">
                    ${ic('file')}
                    <span id="signup-file-name" style="font-size:14px">${esc(state.signupFile?.name) || 'Anexar documento (matrícula ou carteirinha)'}</span>
                    <input type="file" id="signup-file" style="display:none">
                </label>
            </div>

            <p class="mut">
                Use o e-mail institucional (terminado em .edu.br).
                Seu cadastro será analisado por um administrador antes do primeiro acesso.
                Apenas maiores de 18 anos.
                Nesta versão demonstrativa, qualquer arquivo serve como comprovante e somente o nome dele é guardado.
            </p>

            ${errorLine()}
            <button class="pr" data-act="enviarCad">Enviar para aprovação</button>
        </div>`,

    buscar: () => `
        ${head('Buscar Carona')}
        <div class="scr">
            <div style="position:relative">
                <span style="position:absolute;left:14px;top:13px;color:var(--mut);display:flex">
                    ${ic('search')}
                </span>

                <input class="in" id="search-query" style="padding-left:44px" aria-label="Bairro ou rota"
                    placeholder="Buscar rota ou bairro..." value="${esc(state.query)}">
            </div>

            <div style="display:flex;gap:8px;flex-wrap:wrap">
                ${['Hoje', 'Amanhã', 'Perto de mim'].map(chip =>
                    `<button class="chip" data-act="chip" data-v="${chip}" aria-pressed="${state.chip === chip}">${chip === 'Perto de mim' ? ic('pin', 16) : ''}${chip}</button>`
                ).join('')}
            </div>

            <div class="seg">
                <button data-act="view" data-v="lista" aria-pressed="${state.view === 'lista'}">Lista</button>
                <button data-act="view" data-v="mapa" aria-pressed="${state.view === 'mapa'}">Mapa</button>
            </div>

            <p class="mut">
                ${openRides().length} caronas com vagas para o Campus Arapiraca · ${state.chip.toLowerCase()}
            </p>

            ${state.view === 'mapa' ? mapView() : ''}

            <div id="list" style="display:flex;flex-direction:column;gap:12px">
                ${rideList()}
            </div>
        </div>`,

    detalhe: () => {
        const ride = Rides.byId(state.selectedRideId);
        const driver = Users.byId(ride.driverId);
        const request = Requests.active(ride.id, state.userId);
        const free = Rides.freeSeats(ride);

        const tags = [['m', 'Somente mulheres'], ['p', 'Sem pets'], ['n', 'Não fumante']]
            .filter(([key]) => ride.preferencias?.[key])
            .map(([, label]) => `<span class="tag">${label}</span>`)
            .join('') || '<span class="mut">Sem preferências informadas</span>';

        const buttonLabel = request
            ? (request.status === 'aceita' ? 'Carona confirmada' : 'Solicitação enviada')
            : (free ? 'Solicitar carona' : 'Sem vagas');

        return `
            ${head('Detalhes', `<button class="gh" data-act="nav" data-v="buscar">${ic('back', 16)}Voltar</button>`)}
            <div class="scr">
                <div class="c">
                    <div style="display:flex;gap:12px;align-items:center">
                        ${badge(driver)}
                        <div>
                            <strong style="font-size:18px">${esc(driver?.nome || 'Motorista')}</strong>
                            <div style="display:flex;align-items:center;gap:4px;font-weight:600;font-size:13px;margin-top:2px">
                                ${STAR}${esc(driver?.nota || '5,0')} · perfil verificado
                            </div>
                        </div>
                    </div>
                </div>

                <div class="c" style="display:flex;flex-direction:column;gap:12px">
                    <div>
                        <span class="lb">Trajeto</span>
                        <strong>${esc(ride.origem)} → ${esc(ride.destino)}</strong>
                    </div>

                    <div style="display:flex;gap:24px;flex-wrap:wrap">
                        <div>
                            <span class="lb">Data</span>
                            <strong>${esc(fmtDate(ride.data))}</strong>
                        </div>
                        <div>
                            <span class="lb">Saída</span>
                            <strong>${esc(ride.horario)}</strong>
                        </div>
                        <div>
                            <span class="lb">Vagas</span>
                            <strong>${free}</strong>
                        </div>
                    </div>

                    <div>
                        <span class="lb">Preferências</span>
                        <span style="display:flex;gap:6px;flex-wrap:wrap">${tags}</span>
                    </div>

                    ${ride.observacoes ? `
                        <div>
                            <span class="lb">Observações</span>
                            <p class="mut" style="margin:0">${esc(ride.observacoes)}</p>
                        </div>` : ''}

                    <div>
                        <span class="lb">Ponto de encontro</span>
                        <strong>Combinado após a confirmação</strong>
                    </div>

                    <div>
                        <span class="lb">Contribuição</span>
                        <p class="mut" style="margin:0">Divisão simbólica do combustível, sem fins lucrativos.</p>
                    </div>
                </div>

                <button class="pr" data-act="solicitar" ${request || !free ? 'disabled' : ''}>${buttonLabel}</button>

                <button class="gh d" data-act="denunciar">Denunciar motorista</button>
            </div>`;
    },

    oferecer: () => {
        const editing = Boolean(state.editingRideId);
        const { vagas, pin, prefs } = state.rideForm;

        const title = editing ? 'Editar Carona' : 'Oferecer Carona';
        const right = editing ? '<button class="gh" data-act="cancelarEdicaoCarona">Voltar</button>' : undefined;

        return `
            ${head(title, right)}
            <div class="scr" style="gap:14px">
                <div>
                    <label class="lb" for="ride-origem">Origem</label>
                    <input class="in" ${bind('ride', 'origem')} value="${esc(draftValue('ride', 'origem'))}" placeholder="Bairro / endereço de partida">
                    ${errorLine()}
                </div>

                <div>
                    <label class="lb" for="ride-destino">Destino</label>
                    <input class="in" ${bind('ride', 'destino')} value="${esc(draftValue('ride', 'destino', 'Campus Arapiraca'))}">
                </div>

                <div style="display:flex;gap:12px">
                    <div style="flex:1">
                        <label class="lb" for="ride-data">Data</label>
                        <input class="in" type="date" min="${isoDate()}" ${bind('ride', 'data')} value="${esc(draftValue('ride', 'data'))}">
                    </div>
                    <div style="flex:1">
                        <label class="lb" for="ride-horario">Horário</label>
                        <input class="in" type="time" ${bind('ride', 'horario')} value="${esc(draftValue('ride', 'horario'))}">
                    </div>
                </div>

                <div>
                    <span class="lb">Número de vagas</span>
                    <div style="display:flex;align-items:center;gap:16px">
                        <button class="gh" data-act="vagas" data-v="-1" aria-label="Diminuir vagas" style="width:44px;padding:0">
                            ${ic('minus')}
                        </button>

                        <strong style="font-size:22px;min-width:24px;text-align:center" aria-live="polite">${vagas}</strong>

                        <button class="gh" data-act="vagas" data-v="1" aria-label="Aumentar vagas" style="width:44px;padding:0">
                            ${ic('plus')}
                        </button>
                    </div>
                </div>

                <div>
                    <span class="lb">Ponto de partida no mapa</span>
                    <div style="position:relative;height:128px;border-radius:16px;overflow:hidden;border:1px solid var(--in)">
                        <svg width="100%" height="128" viewBox="0 0 350 128" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
                            <rect width="350" height="128" fill="var(--map)"/>
                            <rect x="20" y="14" width="90" height="40" rx="6" fill="var(--blk)"/>
                            <rect x="140" y="14" width="80" height="40" rx="6" fill="var(--blk)"/>
                            <rect x="250" y="70" width="80" height="44" rx="6" fill="var(--blk)"/>
                            <path d="M0 68H350M125 0V128M235 0V128" stroke="var(--card)" stroke-width="8"/>

                            <g transform="translate(${pin ? 212 : 112} ${pin ? 30 : 40})" fill="#1B7A3B">
                                <path d="M13 30s13-11 13-21a13 13 0 10-26 0c0 10 13 21 13 21z"/>
                                <circle cx="13" cy="9" r="5" fill="#fff"/>
                            </g>
                        </svg>

                        <button class="gh" data-act="ponto" style="position:absolute;right:10px;bottom:10px;height:36px;font-size:13px">
                            ${pin ? 'Ponto selecionado' : 'Selecionar ponto no mapa'}
                        </button>
                    </div>
                </div>

                <div>
                    <span class="lb">Preferências</span>
                    <div style="display:flex;gap:8px;flex-wrap:wrap">
                        ${[['m', 'Somente mulheres'], ['p', 'Sem pets'], ['n', 'Não fumante']].map(([key, label]) =>
                            `<button class="chip" data-act="pref" data-v="${key}" aria-pressed="${Boolean(prefs[key])}">${prefs[key] ? ic('check', 16) : ''}${label}</button>`
                        ).join('')}
                    </div>
                </div>

                <div>
                    <label class="lb" for="ride-obs">Observações</label>
                    <textarea class="in" ${bind('ride', 'obs')} style="height:96px;padding:12px 14px;resize:none"
                        placeholder="Ex.: saio pontualmente, aceito mochilas grandes">${esc(draftValue('ride', 'obs'))}</textarea>
                </div>

                <p class="mut">O valor da carona deve ser apenas a divisão simbólica do combustível, sem fins lucrativos.</p>

                <button class="pr" data-act="publicar" style="flex:none">
                    ${editing ? 'Salvar alterações' : 'Publicar carona'}
                </button>
            </div>`;
    },

    caronas: () => {
        const user = currentUser();
        let content;

        if (user.perfil === 'p') {
            content = Requests.byPassenger(user.id).length
                ? Requests.byPassenger(user.id).map(passengerRequestCard).join('')
                : '<p class="mut">Você ainda não solicitou nenhuma carona.</p><button class="pr" data-act="nav" data-v="buscar">Buscar carona</button>';
        } else if (user.perfil === 'm') {
            content = Rides.byDriver(user.id).length
                ? Rides.byDriver(user.id).map(driverRideCard).join('')
                : '<p class="mut">Você ainda não publicou caronas.</p><button class="pr" data-act="nav" data-v="oferecer">Oferecer carona</button>';
        } else {
            content = emptyOr(Rides.all(), ride => rideCard(ride, false), 'Nenhuma carona publicada.');
        }

        return `${head('Caronas')}<div class="scr">${content}</div>`;
    },

    perfil: () => {
        const user = currentUser();
        const editing = state.profileEditing;
        const isDriver = user.perfil === 'm';
        const vehicle = user.veiculo || {};

        const field = (name, label, value, type = 'text') => `
            <div>
                <label class="lb" for="perfil-${name}">${label}</label>
                <input class="in" ${bind('perfil', name)} type="${type}"
                    value="${esc(editing ? draftValue('perfil', name, value) : value)}"
                    ${editing ? '' : 'disabled'}>
            </div>`;

        const stats = {
            p: () => stat('Solicitadas', Requests.byPassenger(user.id).length) + stat('Com vagas', openRides().length),
            m: () => {
                const mine = Rides.byDriver(user.id);
                return stat('Publicadas', mine.length) + stat('Vagas ofertadas', mine.reduce((sum, ride) => sum + ride.vagas, 0));
            },
            a: () => stat('Usuários', Users.all().length) + stat('Pendentes', Users.pending().length)
        }[user.perfil]();

        return `
            ${head('Meu perfil')}
            <div class="scr">
                <div class="c profile-header">
                    <div class="profile-photo-area">
                        ${avatar(user)}

                        ${editing ? `
                            <label class="gh profile-photo-button" for="profile-photo">Alterar foto</label>
                            <input type="file" id="profile-photo" accept="image/png,image/jpeg,image/webp" hidden>
                            ${user.foto ? '<button class="gh d" data-act="removerFoto">Remover foto</button>' : ''}
                        ` : ''}
                    </div>

                    <div class="profile-identification">
                        <strong>${esc(user.nome)}</strong>
                        <span>${esc(user.email)}</span>
                        <span class="tag">${ROLE[user.perfil]}</span>
                    </div>
                </div>

                <div class="c">
                    <h3>Informações pessoais</h3>

                    <div class="profile-fields">
                        ${field('nome', 'Nome completo', user.nome)}
                        ${field('email', 'E-mail institucional', user.email, 'email')}
                        ${field('telefone', 'Telefone', user.telefone, 'tel')}
                    </div>
                </div>

                ${isDriver ? `
                    <div class="c">
                        <h3>Informações do veículo</h3>

                        <div class="profile-fields">
                            ${field('modelo', 'Modelo do veículo', vehicle.modelo)}
                            ${field('cor', 'Cor', vehicle.cor)}
                            ${field('placa', 'Placa', vehicle.placa)}
                            ${field('vagas', 'Quantidade de vagas', vehicle.vagas || '3', 'number')}
                        </div>
                    </div>
                ` : ''}

                <div class="c">
                    <span class="lb">Situação do cadastro</span>
                    ${user.status === 'aprovado' ? '<span class="tag">Verificado</span>' : statusTag(user.status)}
                </div>

                ${user.comprovante ? `
                    <div class="c">
                        <span class="lb">Comprovante de vínculo</span>
                        <span style="overflow-wrap:anywhere">${esc(user.comprovante.nome)}</span>
                    </div>
                ` : ''}

                <div class="c">
                    <div style="display:flex;gap:12px">${stats}</div>
                </div>

                ${editing ? `
                    ${errorLine()}
                    <button class="pr" data-act="salvarPerfil">Salvar alterações</button>
                    <button class="gh" data-act="cancelarEdicao">Cancelar</button>
                ` : '<button class="pr" data-act="editarPerfil">Editar perfil</button>'}

                <div class="c">
                    <span class="lb">Dicas de segurança</span>
                    <p class="mut">
                        Confira a nota e o perfil verificado do motorista,
                        combine o ponto de encontro dentro do campus e denuncie
                        qualquer conduta inadequada.
                    </p>
                </div>

                <button class="gh" data-act="sair">Sair da conta</button>
            </div>`;
    },

    admin: () => {
        const pending = Users.pending();
        const reports = Reports.all();
        const tab = state.adminTab;

        const tabs = [
            ['cad', `Pendentes (${pending.length})`],
            ['usr', `Usuários (${Users.all().length})`],
            ['den', `Denúncias (${reports.length})`]
        ];

        const content = {
            cad: () => emptyOr(pending, userCard, 'Nenhum cadastro pendente.'),
            usr: () => emptyOr(Users.all(), userCard, 'Nenhum usuário cadastrado.'),
            den: () => emptyOr(reports, reportCard, 'Nenhuma denúncia em aberto.')
        }[tab]();

        return `
            <div class="h" style="align-items:flex-start">
                <div>
                    <h1 style="margin:0;font-size:24px;letter-spacing:-.02em">Painel Admin</h1>
                    <span style="display:inline-flex;align-items:center;gap:6px;margin-top:8px;background:var(--ink);color:var(--bg);border-radius:999px;padding:5px 12px 5px 10px;font-weight:600;font-size:12px">
                        ${ic('shield', 16)}Administrador
                    </span>
                </div>
                <button class="gh" data-act="sair">Sair</button>
            </div>

            <div style="display:flex;gap:12px;padding:0 20px 14px">
                <div class="c" style="flex:1;padding:12px">${stat('Pendentes', pending.length)}</div>
                <div class="c" style="flex:1;padding:12px">${stat('Denúncias', reports.length)}</div>
                <div class="c" style="flex:1;padding:12px">${stat('Caronas', Rides.all().length)}</div>
            </div>

            <div class="tabs" role="tablist">
                ${tabs.map(([key, label]) =>
                    `<button role="tab" data-act="adm" data-v="${key}" aria-selected="${tab === key}">${label}</button>`
                ).join('')}
            </div>

            <div class="scr">${content}</div>`;
    }
};
