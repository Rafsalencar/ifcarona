

const P = {
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    car: '<path d="M4 16v-4l2-5h12l2 5v4zM6 19v-3M18 19v-3M4 12h16"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" fill="currentColor"/>',
    pin: '<path d="M12 21s7-6 7-11a7 7 0 10-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    check: '<path d="M5 12l5 5 9-10"/>',
    file: '<path d="M7 3h7l4 4v14H7zM14 3v5h5"/>',
    back: '<path d="M15 5l-7 7 7 7"/>'
};

const ic = (n, s = 22) =>
    `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n]}</svg>`;

const esc = s =>
    String(s).replace(/[&<>"]/g, c => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;'
    }[c]));


const EDU = /^[^\s@]+@([a-z0-9-]+\.)+edu\.br$/i;

const SEED = [
    { n: 'Aluno Demo', e: 'aluno@instituicao.edu.br', pw: '123456', r: 'p', st: 'aprovado' },
    { n: 'Motorista Demo', e: 'motorista@instituicao.edu.br', pw: '123456', r: 'm', st: 'aprovado' },
    { n: 'Administrador Demo', e: 'admin@instituicao.edu.br', pw: '123456', r: 'a', st: 'aprovado' },
    { n: 'Usuário Novo A', e: 'usuarionovoa@instituicao.edu.br', pw: '123456', r: 'm', st: 'pendente', d: '12/09' },
    { n: 'Usuário Novo B', e: 'usuarionovob@instituicao.edu.br', pw: '123456', r: 'p', st: 'pendente', d: '13/09' },
    { n: 'Usuário Novo C', e: 'usuarionovoc@instituicao.edu.br', pw: '123456', r: 'm', st: 'pendente', d: '14/09' }
];

function loadUsers() {
    try {
        const a = JSON.parse(localStorage.getItem('ifc_users') || 'null');

        if (Array.isArray(a)) {
            SEED.forEach(s => {
                if (!a.some(x => x.e === s.e)) {
                    a.push({ ...s });
                }
            });

            return a;
        }
    } catch (e) {}

    return SEED.map(x => ({ ...x }));
}


const save = () => {
    try {
        localStorage.setItem('ifc_users', JSON.stringify(S.users));
    } catch (e) {}
};

const reqs = () =>
    S.users
        .filter(u => u.st === 'pendente')
        .map(u => ({ ...u, role: ROLE[u.r] }));


const S = {
    role: 'p',
    screen: 'login',
    em: '',
    pw: '',
    err: '',
    user: null,
    users: loadUsers(),
    cn: '',
    ce: '',
    cpw: '',
    chip: 'Hoje',
    view: 'lista',
    q: '',
    sel: null,
    vagas: 3,
    pf: { m: 1, p: 1, n: 1 },
    pin: 0,
    adm: 'cad',
    toast: '',
    doc: '',
    file: null,
    tipo: 'p',

    rides: [
        { id: 'A', t: '07:30', r: '4,0', v: 3 },
        { id: 'B', t: '07:45', r: '5,0', v: 1 },
        { id: 'C', t: '08:00', r: '3,0', v: 2 }
    ],

    booked: [],
    mine: [],

    reps: [
        { who: 'Motorista C', why: 'Conduta inadequada durante a carona' },
        { who: 'Motorista B', why: 'Atraso de mais de 20 minutos' }
    ]
};

const HOME = {
    p: 'buscar',
    m: 'oferecer',
    a: 'admin'
};


const DEMO = {
    p: 'aluno@instituicao.edu.br (conta demo)',
    m: 'motorista@instituicao.edu.br (conta demo)',
    a: 'admin@instituicao.edu.br (conta demo)'
};

const stat = (l, v) =>
    `<div style="flex:1"><span class="lb">${l}</span><strong style="font-size:22px">${v}</strong></div>`;

const NAV = {
    p: [
        ['buscar', 'search', 'Buscar'],
        ['caronas', 'car', 'Caronas'],
        ['perfil', 'user', 'Perfil']
    ],
    m: [
        ['oferecer', 'plus', 'Oferecer'],
        ['caronas', 'car', 'Caronas'],
        ['perfil', 'user', 'Perfil']
    ],
    a: [
        ['caronas', 'car', 'Caronas'],
        ['perfil', 'user', 'Perfil'],
        ['admin', 'shield', 'Admin']
    ]
};

const ROLE = {
    p: 'Passageiro',
    m: 'Motorista',
    a: 'Administrador'
};

const vg = n => n + (n === 1 ? ' vaga' : ' vagas');

const head = (t, r) =>
    `<div class="h"><h1>${t}</h1>${r === undefined ? '<button class="gh" data-act="sair">Sair</button>' : r}</div>`;

const star = `<span style="color:var(--am);display:flex">${ic('star', 16)}</span>`;

function card(r, click) {
    const body = `
        <span class="av">${r.id}</span>
        <span style="flex:1;min-width:0;display:block">
            <span style="display:flex;justify-content:space-between;align-items:baseline">
                <strong style="font-size:16px">Motorista ${r.id}</strong>
                <span style="font-weight:700;font-size:20px;letter-spacing:-.02em">${r.t}</span>
            </span>

            <span style="display:block;font-size:13px;color:var(--mut);margin:2px 0 8px">
                Bairro Centro → Campus Arapiraca
            </span>

            <span style="display:flex;justify-content:space-between;align-items:center">
                <span style="display:flex;align-items:center;gap:4px;font-weight:600;font-size:13px">
                    ${star}${r.r}
                </span>

                <span class="tag ${r.v < 2 ? 'w' : ''}">
                    ${r.v ? vg(r.v) : 'Lotada'}
                </span>
            </span>
        </span>`;


    return click
        ? `<button class="c rc" data-act="open" data-id="${r.id}" aria-label="Carona do Motorista ${r.id} às ${r.t}">${body}</button>`
        : `<div class="c rc" style="cursor:default">${body}</div>`;
}

const list = () => {
    const q = S.q.trim().toLowerCase();

    const a = S.rides.filter(r =>
        !q || ('bairro centro campus arapiraca motorista ' + r.id)
            .toLowerCase()
            .includes(q)
    );

    return a.length
        ? a.map(r => card(r, 1)).join('')
        : '<p class="mut">Nenhuma carona encontrada para essa busca.</p>';
};

function mapa() {
    const pos = {
        A: [60, 70],
        B: [200, 150],
        C: [130, 215]
    };

    return `<div class="mp">
        <svg width="100%" height="300" viewBox="0 0 340 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <rect width="340" height="300" fill="var(--map)"/>
            <rect x="14" y="14" width="90" height="60" rx="8" fill="var(--blk)"/>
            <rect x="150" y="30" width="110" height="70" rx="8" fill="var(--blk)"/>
            <rect x="190" y="180" width="120" height="90" rx="8" fill="var(--blk)"/>
            <rect x="20" y="130" width="100" height="70" rx="8" fill="var(--blk)"/>
            <path d="M0 110H340M140 0V300M280 0V300M0 250H340" stroke="var(--card)" stroke-width="9"/>
        </svg>

        ${S.rides.map(r =>
            `<button class="pin" style="left:${pos[r.id][0]}px;top:${pos[r.id][1]}px" data-act="open" data-id="${r.id}" aria-label="Carona do Motorista ${r.id}">${r.id}</button>`
        ).join('')}
    </div>`;
}

const SC = {

    login: () => `<div class="hero">
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
            <label class="lb" for="em">E-mail institucional</label>
            <input class="in" id="em" type="email" value="${esc(S.em)}" placeholder="${DEMO[S.role]}">
            ${S.err ? `<p class="err" role="alert">${S.err}</p>` : ''}
        </div>

        <div>
            <label class="lb" for="pw">Senha</label>
            <input class="in" id="pw" type="password" autocomplete="current-password" value="${esc(S.pw)}" placeholder="Senha da conta demo: 123456">
        </div>

        <div>
            <span class="lb">Entrar como</span>
            <div class="seg">
                ${['p', 'm', 'a'].map(k =>
                    `<button data-act="role" data-v="${k}" aria-pressed="${S.role === k}">${ROLE[k]}</button>`
                ).join('')}
            </div>
        </div>

        <button class="pr" data-act="login">Entrar</button>

        <p class="mut" style="text-align:center">
            Ainda não tem conta? <a href="#" data-act="cad">Cadastrar-se</a>
        </p>
    </div>`,

    cadastro: () => `${head('Cadastro', '<button class="gh" data-act="voltarLogin">Voltar</button>')}
    <div class="scr">
        <div>
            <label class="lb" for="cn">Nome completo</label>
            <input class="in" id="cn" value="${esc(S.cn)}" placeholder="Seu nome">
        </div>

        <div>
            <label class="lb" for="ce">E-mail institucional</label>
            <input class="in" id="ce" type="email" value="${esc(S.ce)}" placeholder="nome@instituicao.edu.br">
        </div>

        <div>
            <label class="lb" for="cp">Senha</label>
            <input class="in" id="cp" type="password" autocomplete="new-password" value="${esc(S.cpw)}" placeholder="Mínimo de 6 caracteres">
        </div>

        <div>
            <span class="lb">Quero ser</span>
            <div class="seg">
                ${['p', 'm'].map(k =>
                    `<button data-act="tipo" data-v="${k}" aria-pressed="${S.tipo === k}">${ROLE[k]}</button>`
                ).join('')}
            </div>
        </div>

        <div>
            <span class="lb">Comprovante de vínculo</span>
            <label class="c" style="display:flex;gap:10px;align-items:center;cursor:pointer;border-style:dashed">
                ${ic('file')}
                <span id="docn" style="font-size:14px">${esc(S.doc) || 'Anexar documento (matrícula ou carteirinha)'}</span>
                <input type="file" id="cd" style="display:none">
            </label>
        </div>

        <p class="mut">
            Use o e-mail institucional (terminado em .edu.br).
            Seu cadastro será analisado por um administrador antes do primeiro acesso.
            Apenas maiores de 18 anos.
        </p>

        ${S.err ? `<p class="err" role="alert">${S.err}</p>` : ''}
        <button class="pr" data-act="enviarCad">Enviar para aprovação</button>
    </div>`,

    buscar: () => `${head('Buscar Carona')}
    <div class="scr">
        <div style="position:relative">
            <span style="position:absolute;left:14px;top:13px;color:var(--mut);display:flex">
                ${ic('search')}
            </span>

            <input class="in" id="q" style="padding-left:44px" aria-label="Bairro ou rota" placeholder="Buscar rota ou bairro..." value="${esc(S.q)}">
        </div>

        <div style="display:flex;gap:8px;flex-wrap:wrap">
            ${['Hoje', 'Amanhã', 'Perto de mim'].map(c =>
                `<button class="chip" data-act="chip" data-v="${c}" aria-pressed="${S.chip === c}">${c === 'Perto de mim' ? ic('pin', 16) : ''}${c}</button>`
            ).join('')}
        </div>

        <div class="seg">
            <button data-act="view" data-v="lista" aria-pressed="${S.view === 'lista'}">Lista</button>
            <button data-act="view" data-v="mapa" aria-pressed="${S.view === 'mapa'}">Mapa</button>
        </div>

        <p class="mut">
            ${S.rides.filter(r => r.v).length} caronas com vagas para o Campus Arapiraca · ${S.chip.toLowerCase()}
        </p>

        ${S.view === 'mapa' ? mapa() : ''}

        <div id="list" style="display:flex;flex-direction:column;gap:12px">
            ${list()}
        </div>
    </div>`,

    detalhe: () => {
        const r = S.rides.find(x => x.id === S.sel);
        const b = S.booked.includes(r.id);

        return `${head('Detalhes', '<button class="gh" data-act="nav" data-v="buscar">' + ic('back', 16) + 'Voltar</button>')}
        <div class="scr">
            <div class="c">
                <div style="display:flex;gap:12px;align-items:center">
                    <span class="av">${r.id}</span>
                    <div>
                        <strong style="font-size:18px">Motorista ${r.id}</strong>
                        <div style="display:flex;align-items:center;gap:4px;font-weight:600;font-size:13px;margin-top:2px">
                            ${star}${r.r} · perfil verificado
                        </div>
                    </div>
                </div>
            </div>

            <div class="c" style="display:flex;flex-direction:column;gap:12px">
                <div>
                    <span class="lb">Trajeto</span>
                    <strong>Bairro Centro → Campus Arapiraca</strong>
                </div>

                <div style="display:flex;gap:24px">
                    <div>
                        <span class="lb">Data</span>
                        <strong>${S.chip === 'Amanhã' ? 'Amanhã' : 'Hoje'}</strong>
                    </div>
                    <div>
                        <span class="lb">Saída</span>
                        <strong>${r.t}</strong>
                    </div>
                    <div>
                        <span class="lb">Vagas</span>
                        <strong>${r.v}</strong>
                    </div>
                </div>

                <div>
                    <span class="lb">Preferências</span>
                    <span style="display:flex;gap:6px;flex-wrap:wrap">
                        <span class="tag">Sem pets</span>
                        <span class="tag">Não fumante</span>
                    </span>
                </div>

                <div>
                    <span class="lb">Ponto de encontro</span>
                    <strong>Combinado após a confirmação</strong>
                </div>

                <div>
                    <span class="lb">Contribuição</span>
                    <p class="mut" style="margin:0">Divisão simbólica do combustível, sem fins lucrativos.</p>
                </div>
            </div>

            <button class="pr" data-act="solicitar" ${b || !r.v ? 'disabled' : ''}>
                ${b ? 'Solicitação enviada' : r.v ? 'Solicitar carona' : 'Sem vagas'}
            </button>

            <button class="gh d" data-act="denunciar">Denunciar motorista</button>
        </div>`;
    },

    oferecer: () => `${head('Oferecer Carona')}
    <div class="scr" style="gap:14px">
        <div>
            <label class="lb" for="o">Origem</label>
            <input class="in" id="o" placeholder="Bairro / endereço de partida">
            ${S.err ? `<p class="err" role="alert">${S.err}</p>` : ''}
        </div>

        <div>
            <label class="lb" for="de">Destino</label>
            <input class="in" id="de" value="Campus Arapiraca">
        </div>

        <div style="display:flex;gap:12px">
            <div style="flex:1">
                <label class="lb" for="dt">Data</label>
                <input class="in" id="dt" placeholder="DD/MM/AAAA">
            </div>
            <div style="flex:1">
                <label class="lb" for="hr">Horário</label>
                <input class="in" id="hr" placeholder="HH:MM">
            </div>
        </div>

        <div>
            <span class="lb">Número de vagas</span>
            <div style="display:flex;align-items:center;gap:16px">
                <button class="gh" data-act="vag" data-v="-1"
                    aria-label="Diminuir vagas" style="width:44px;padding:0">
                    ${ic('minus')}
                </button>

                <strong style="font-size:22px;min-width:24px;text-align:center" aria-live="polite">
                    ${S.vagas}
                </strong>

                <button class="gh" data-act="vag" data-v="1"
                    aria-label="Aumentar vagas" style="width:44px;padding:0">
                    ${ic('plus')}
                </button>
            </div>
        </div>

        <div>
            <span class="lb">Ponto de partida no mapa</span>
            <div style="position:relative;height:128px;border-radius:16px;overflow:hidden;border:1px solid var(--in)">
                <svg width="100%" height="128" viewBox="0 0 350 128"
                    preserveAspectRatio="xMidYMid slice" aria-hidden="true">
                    <rect width="350" height="128" fill="var(--map)"/>
                    <rect x="20" y="14" width="90" height="40" rx="6" fill="var(--blk)"/>
                    <rect x="140" y="14" width="80" height="40" rx="6" fill="var(--blk)"/>
                    <rect x="250" y="70" width="80" height="44" rx="6" fill="var(--blk)"/>
                    <path d="M0 68H350M125 0V128M235 0V128"
                        stroke="var(--card)" stroke-width="8"/>

                    <g transform="translate(${S.pin ? 212 : 112} ${S.pin ? 30 : 40})" fill="#1B7A3B">
                        <path d="M13 30s13-11 13-21a13 13 0 10-26 0c0 10 13 21 13 21z"/>
                        <circle cx="13" cy="9" r="5" fill="#fff"/>
                    </g>
                </svg>

                <button class="gh" data-act="ponto"
                    style="position:absolute;right:10px;bottom:10px;height:36px;font-size:13px">
                    ${S.pin ? 'Ponto selecionado' : 'Selecionar ponto no mapa'}
                </button>
            </div>
        </div>

        <div>
            <span class="lb">Preferências</span>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
                ${[['m', 'Somente mulheres'], ['p', 'Sem pets'], ['n', 'Não fumante']].map(([k, l]) =>
                    `<button class="chip" data-act="pf" data-v="${k}" aria-pressed="${!!S.pf[k]}">${S.pf[k] ? ic('check', 16) : ''}${l}</button>`
                ).join('')}
            </div>
        </div>

        <div>
            <label class="lb" for="ob">Observações</label>
            <textarea class="in" id="ob" style="height:96px;padding:12px 14px;resize:none"
                placeholder="Ex.: saio pontualmente, aceito mochilas grandes"></textarea>
        </div>

        <p class="mut">O valor da carona deve ser apenas a divisão simbólica do combustível, sem fins lucrativos.</p>

        <button class="pr" data-act="publicar" style="flex:none">Publicar carona</button>
    </div>`,

    caronas: () => {
        let b = '';

        if (S.role === 'p') {
            b = S.booked.length
                ? S.booked.map(id => {
                    const r = S.rides.find(x => x.id === id);

                    return `<div class="c" style="display:flex;flex-direction:column;gap:10px">
                        <div style="display:flex;justify-content:space-between;align-items:center">
                            <strong>Motorista ${r.id} · ${r.t}</strong>
                            <span class="tag w">Aguardando motorista</span>
                        </div>

                        <span style="font-size:13px;color:var(--mut)">Bairro Centro → Campus Arapiraca</span>

                        <button class="gh d" data-act="cancelar" data-id="${r.id}">
                            Cancelar solicitação
                        </button>
                    </div>`;
                }).join('')
                : '<p class="mut">Você ainda não solicitou nenhuma carona.</p><button class="pr" data-act="nav" data-v="buscar">Buscar carona</button>';
        }

        else if (S.role === 'm') {
            b = S.mine.length
                ? S.mine.map(m =>
                    `<div class="c">
                        <strong>${esc(m.o)} → ${esc(m.d)}</strong>
                        <div style="font-size:13px;color:var(--mut);margin:4px 0 8px">
                            ${esc(m.dt || 'Data a definir')} · ${esc(m.hr || '--:--')}
                        </div>
                        <span class="tag">${vg(m.v)}</span>
                    </div>`
                ).join('')
                : '<p class="mut">Você ainda não publicou caronas.</p><button class="pr" data-act="nav" data-v="oferecer">Oferecer carona</button>';
        }

        else {
            b = S.rides.map(r => card(r, 0)).join('');
        }

        return `${head('Caronas')}<div class="scr">${b}</div>`;
    },

    perfil: () => `${head('Perfil')}
    <div class="scr">
        <div class="c" style="display:flex;gap:12px;align-items:center">
            <span class="av">${ROLE[S.role][0]}</span>
            <div>
                <strong>${esc(S.user.n)}</strong>
                <div style="font-size:13px;color:var(--mut);margin-top:2px">${esc(S.user.e)}</div>
                <div style="margin-top:6px">
                    <span class="tag ${S.role === 'a' ? 'b' : ''}">${ROLE[S.role]}</span>
                </div>
            </div>
        </div>

        <div class="c" style="display:flex;flex-direction:column;gap:14px">
            <div>
                <span class="lb">Instituição</span>
                <strong>${esc(S.user.e.split('@')[1])}</strong>
            </div>

            <div>
                <span class="lb">Situação do cadastro</span>
                <span class="tag">Verificado</span>
            </div>

            <div style="display:flex;gap:12px">
                ${S.role === 'p'
                    ? stat('Solicitadas', S.booked.length) + stat('Com vagas', S.rides.filter(r => r.v).length)
                    : S.role === 'm'
                        ? stat('Publicadas', S.mine.length) + stat('Vagas ofertadas', S.mine.reduce((a, m) => a + m.v, 0))
                        : stat('Pendentes', reqs().length) + stat('Denúncias', S.reps.length)}
            </div>
        </div>

        <div class="c">
            <span class="lb">Regras de uso</span>
            <p class="mut">Uso restrito a maiores de 18 anos. A divisão do combustível é simbólica, sem fins lucrativos, para não configurar transporte remunerado.</p>
        </div>

        <div class="c">
            <span class="lb">Dicas de segurança</span>
            <p class="mut">Confira a nota e o perfil verificado do motorista, combine o ponto de encontro dentro do campus e denuncie qualquer conduta inadequada.</p>
        </div>

        <button class="gh" data-act="sair">Sair da conta</button>
    </div>`,

    admin: () => `<div class="h" style="align-items:flex-start">
        <div>
            <h1 style="margin:0;font-size:24px;letter-spacing:-.02em">Painel Admin</h1>
            <span style="display:inline-flex;align-items:center;gap:6px;margin-top:8px;background:var(--ink);color:var(--bg);border-radius:999px;padding:5px 12px 5px 10px;font-weight:600;font-size:12px">
                ${ic('shield', 16)}Administrador
            </span>
        </div>
        <button class="gh" data-act="sair">Sair</button>
    </div>

    <div style="display:flex;gap:12px;padding:0 20px 14px">
        <div class="c" style="flex:1;padding:12px">${stat('Pendentes', reqs().length)}</div>
        <div class="c" style="flex:1;padding:12px">${stat('Denúncias', S.reps.length)}</div>
        <div class="c" style="flex:1;padding:12px">${stat('Caronas', S.rides.length)}</div>
    </div>

    <div class="tabs" role="tablist">
        <button role="tab" data-act="adm" data-v="cad" aria-selected="${S.adm === 'cad'}">
            Cadastros pendentes (${reqs().length})
        </button>
        <button role="tab" data-act="adm" data-v="den" aria-selected="${S.adm === 'den'}">
            Denúncias em aberto (${S.reps.length})
        </button>
    </div>

    <div class="scr">
        ${S.adm === 'cad'
            ? (reqs().length
                ? reqs().map((r, i) =>
                    `<article class="c">
                        <div style="display:flex;gap:12px;align-items:center">
                            <span class="av">${esc(r.n.charAt(0))}</span>
                            <div style="flex:1;min-width:0">
                                <strong>${esc(r.n)}</strong>
                                <div style="font-size:13px;color:var(--mut);margin-top:2px;overflow-wrap:anywhere">
                                    ${esc(r.e)}
                                </div>
                            </div>
                            <span class="tag ${r.role === 'Passageiro' ? 'b' : ''}">${r.role}</span>
                        </div>

                        <div style="font-size:12px;color:var(--mut);margin:10px 0 12px">
                            Solicitado em ${r.d}
                        </div>

                        <div style="display:flex;gap:8px">
                            <button class="gh" style="flex:1;padding:0;font-size:13px" data-act="doc">
                                ${ic('file', 16)}Ver doc.
                            </button>
                            <button class="gh d" style="flex:1;padding:0;font-size:13px" data-act="rej" data-i="${i}">
                                Rejeitar
                            </button>
                            <button class="pr s" data-act="apr" data-i="${i}">
                                Aprovar
                            </button>
                        </div>
                    </article>`
                ).join('')
                : '<p class="mut">Nenhum cadastro pendente.</p>')
            : (S.reps.length
                ? S.reps.map((r, i) =>
                    `<article class="c">
                        <strong>${esc(r.who)}</strong>
                        <p class="mut" style="margin:4px 0 12px">${esc(r.why)}</p>

                        <div style="display:flex;gap:8px">
                            <button class="gh" style="flex:1;padding:0;font-size:13px" data-act="arq" data-i="${i}">
                                Arquivar
                            </button>
                            <button class="gh d" style="flex:1;padding:0;font-size:13px" data-act="susp" data-i="${i}">
                                Suspender conta
                            </button>
                        </div>
                    </article>`
                ).join('')
                : '<p class="mut">Nenhuma denúncia em aberto.</p>')}
    </div>`
};


function render() {
    const s = S.screen;

    const nav = ['login', 'cadastro', 'detalhe'].includes(s)
        ? ''
        : `<nav class="nav" aria-label="Navegação">
            ${NAV[S.role].map(([k, i, l]) =>
                `<button data-act="nav" data-v="${k}" ${s === k ? 'aria-current="page"' : ''}>
                    ${ic(i)}${l}
                </button>`
            ).join('')}
        </nav>`;

    document.getElementById('app').innerHTML =
        SC[s]() +
        nav +
        (S.toast ? `<div class="toast" role="status">${S.toast}</div>` : '');
}

let tm;

function say(t) {
    S.toast = t;

    clearTimeout(tm);

    tm = setTimeout(() => {
        S.toast = '';
        render();
    }, 2600);
}

const val = id =>
    (document.getElementById(id) || {}).value || '';

function go(s) {
    S.screen = s;
    S.err = '';
    render();
}


document.addEventListener('click', async e => {
    const b = e.target.closest('[data-act]');

    if (!b) return;

    const d = b.dataset;
    const a = d.act;

    if (a === 'cad') {
        e.preventDefault();
    }

    if (a === 'role') {
        S.em = val('em');
        S.pw = val('pw');
        S.role = d.v;
        S.err = '';

        render();
    }

    else if (a === 'login') {
        S.em = val('em').trim();

        const pw = val('pw');
        S.pw = pw;

        const bad = t => {
            S.err = t;
            render();
        };

        if (!EDU.test(S.em)) {
            return bad('Use seu e-mail institucional (terminado em .edu.br).');
        }

        const u = S.users.find(
            x => x.e.toLowerCase() === S.em.toLowerCase()
        );

        if (!u || u.pw !== pw) {
            return bad('E-mail ou senha incorretos.');
        }

        if (u.st === 'pendente') {
            return bad('Seu cadastro ainda está em análise pelo administrador.');
        }

        if (u.st === 'rejeitado') {
            return bad('Seu cadastro não foi aprovado.');
        }

        if (u.r !== S.role) {
            return bad(
                'Este e-mail está cadastrado como ' +
                ROLE[u.r] +
                '. Selecione esse perfil.'
            );
        }

        S.user = u;
        S.pw = '';

        go(HOME[u.r]);
    }

    else if (a === 'cad') {
        go('cadastro');
    }

    else if (a === 'voltarLogin') {
        go('login');
    }

    else if (a === 'tipo') {
        S.cn = val('cn');
        S.ce = val('ce');
        S.cpw = val('cp');

        S.tipo = d.v;

        render();
    }

    
else if (a === 'enviarCad') {
    const n = val('cn').trim();
    const m = val('ce').trim();
    const p = val('cp');

    S.cn = n;
    S.ce = m;
    S.cpw = p;

    const bad = t => {
        S.err = t;
        render();
    };

    if (!n) {
        return bad('Informe seu nome completo.');
    }

    if (!EDU.test(m)) {
        return bad('Use seu e-mail institucional (terminado em .edu.br).');
    }

    if (p.length < 6) {
        return bad('A senha precisa ter ao menos 6 caracteres.');
    }

    if (!S.file) {
        return bad('Anexe o comprovante de vínculo.');
    }

    const dados = new FormData();

    dados.append('nome', n);
    dados.append('email', m);
    dados.append('senha', p);
    dados.append('perfil', S.tipo);
    dados.append('comprovante', S.file);

    try {
        const resposta = await fetch('api/cadastro.php', {
            method: 'POST',
            body: dados
        });

        const resultado = await resposta.json();

        if (!resposta.ok || !resultado.sucesso) {
            return bad(resultado.mensagem || 'Erro ao realizar cadastro.');
        }

        S.file = null;
        S.doc = '';
        S.cn = '';
        S.ce = '';
        S.cpw = '';

        S.em = m;
        S.pw = '';
        S.screen = 'login';
        S.err = '';

        say(resultado.mensagem);

        render();

    } catch (erro) {
        bad('Não foi possível conectar ao servidor. Tente novamente.');
    }
}


    else if (a === 'view') {
        S.view = d.v;
        render();
    }

    else if (a === 'open') {
        S.sel = d.id;
        go('detalhe');
    }

    else if (a === 'solicitar') {
        const r = S.rides.find(x => x.id === S.sel);

        if (r.v && !S.booked.includes(r.id)) {
            r.v--;
            S.booked.push(r.id);

            S.screen = 'caronas';

            say('Solicitação enviada ao motorista.');

            render();
        }
    }

    else if (a === 'cancelar') {
        const r = S.rides.find(x => x.id === d.id);

        S.booked = S.booked.filter(x => x !== d.id);

        r.v++;

        say('Solicitação cancelada.');

        render();
    }

    else if (a === 'denunciar') {
        S.reps.push({
            who: 'Motorista ' + S.sel,
            why: 'Denúncia enviada por passageiro'
        });

        say('Denúncia enviada ao administrador.');

        render();
    }

    else if (a === 'nav') {
        if (S.screen === 'buscar') {
            S.q = val('q');
        }

        go(d.v);
    }

    else if (a === 'sair') {
        S.user = null;
        S.pw = '';
        S.screen = 'login';
        S.err = '';

        render();
    }

    else if (a === 'vag') {
        S.vagas = Math.max(
            1,
            Math.min(6, S.vagas + Number(d.v))
        );

        S.draft = [
            val('o'),
            val('de'),
            val('dt'),
            val('hr')
        ];

        render();

        const f = ['o', 'de', 'dt', 'hr'];

        f.forEach((id, i) => {
            const el = document.getElementById(id);

            if (el && S.draft[i]) {
                el.value = S.draft[i];
            }
        });
    }
    
    else if (a === 'pf' || a === 'ponto') {
        const dr = ['o', 'de', 'dt', 'hr', 'ob'].map(val);

        if (a === 'pf') {
            S.pf[d.v] = S.pf[d.v] ? 0 : 1;
        } else {
            S.pin = S.pin ? 0 : 1;
        }

        render();

        ['o', 'de', 'dt', 'hr', 'ob'].forEach((id, i) => {
            const el = document.getElementById(id);

            if (el) {
                el.value = dr[i];
            }
        });
    }

    else if (a === 'publicar') {
        const o = val('o').trim();

        if (!o) {
            S.err = 'Informe a origem da carona.';
            render();
            return;
        }

        S.mine.push({
            o,
            d: val('de') || 'Campus Arapiraca',
            dt: val('dt'),
            hr: val('hr'),
            v: S.vagas
        });

        S.screen = 'caronas';

        say('Carona publicada.');

        render();
    }

    else if (a === 'adm') {
        S.adm = d.v;
        render();
    }

    else if (a === 'doc') {
        say('Abrindo documento do solicitante…');
    }

    else if (a === 'apr' || a === 'rej') {
        const r = reqs()[Number(d.i)];
        const u = S.users.find(x => x.e === r.e);

        u.st = a === 'apr' ? 'aprovado' : 'rejeitado';

        save();

        say(
            r.n +
            (a === 'apr' ? ' aprovado(a).' : ' rejeitado(a).')
        );

        render();
    }

    else if (a === 'arq' || a === 'susp') {
        S.reps.splice(Number(d.i), 1);

        say(
            a === 'arq'
                ? 'Denúncia arquivada.'
                : 'Conta suspensa.'
        );

        render();
    }
});

document.addEventListener('input', e => {
    if (e.target.id === 'q') {
        S.q = e.target.value;

        document.getElementById('list').innerHTML = list();
    }
});


document.addEventListener('change', e => {
     if (e.target.id === 'cd') {
        const arquivo = e.target.files[0];

        S.file = arquivo || null;
        S.doc = arquivo ? arquivo.name : '';

        render();
    }
});



render();

