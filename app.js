const root = document.getElementById('app');

const TOAST_DURATION_MS = 2600;
let toastTimer;
let renderedScreen = null;

const isAllowed = (screen, user) => {
    if (PUBLIC_SCREENS.includes(screen)) return !user;
    if (!user) return false;
    if (screen === 'detalhe') return user.perfil === 'p' && Boolean(Rides.byId(state.selectedRideId));
    return NAV[user.perfil].some(([key]) => key === screen);
};

const render = () => {
    const user = currentUser();

    if (state.userId && !user) resetSession();

    if (!isAllowed(state.screen, currentUser())) {
        state.screen = currentUser() ? HOME[currentUser().perfil] : 'login';
    }

    const scrollTop = root.querySelector('.scr')?.scrollTop ?? 0;
    const sameScreen = renderedScreen === state.screen;

    const nav = SCREENS_WITHOUT_NAV.includes(state.screen)
        ? ''
        : bottomNav(currentUser().perfil, state.screen);

    const toast = state.toast
        ? `<div class="toast" role="status">${esc(state.toast)}</div>`
        : '';

    root.innerHTML = Screens[state.screen]() + nav + toast;
    renderedScreen = state.screen;

    const scroller = root.querySelector('.scr');
    if (scroller && sameScreen) scroller.scrollTop = scrollTop;
};

const notify = message => {
    state.toast = message;
    render();

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        state.toast = '';
        root.querySelector('.toast')?.remove();
    }, TOAST_DURATION_MS);
};

const goTo = screen => {
    state.screen = screen;
    state.error = '';
    render();
};

const showError = message => {
    state.error = message;
    render();
};

const collect = scope => {
    const values = {};

    root.querySelectorAll(`[data-draft="${scope}"]`).forEach(element => {
        values[element.name] = element.value;
    });

    state.drafts[scope] = { ...state.drafts[scope], ...values };
    return state.drafts[scope];
};

const resetRideForm = () => {
    const seats = Number(currentUser()?.veiculo?.vagas) || 3;

    state.editingRideId = null;
    state.rideForm = newRideForm(seats);
    delete state.drafts.ride;
};

const resetSession = () => {
    Auth.logout();

    state.userId = null;
    state.error = '';
    state.drafts = {};
    state.profileEditing = false;
    state.editingRideId = null;
    state.selectedRideId = null;
    state.query = '';
    state.rideForm = newRideForm();
    state.screen = 'login';
};

const startSession = user => {
    state.userId = user.id;
    state.role = user.perfil;
    state.drafts = {};
    resetRideForm();
    goTo(HOME[user.perfil]);
};

const rideFormPayload = form => ({
    origem: form.origem || '',
    destino: form.destino || '',
    data: form.data || '',
    horario: form.horario || '',
    observacoes: form.obs || '',
    vagas: state.rideForm.vagas,
    preferencias: { ...state.rideForm.prefs },
    pontoMapa: state.rideForm.pin
});

const profilePayload = (form, isDriver) => ({
    nome: (form.nome || '').trim(),
    email: (form.email || '').trim(),
    telefone: (form.telefone || '').trim(),
    veiculo: isDriver
        ? {
            modelo: (form.modelo || '').trim(),
            cor: (form.cor || '').trim(),
            placa: (form.placa || '').trim(),
            vagas: (form.vagas || '').trim()
        }
        : null
});

const respondTo = (result, successMessage, onSuccess) => {
    if (!result.ok) return notify(result.message);

    if (onSuccess) onSuccess(result);
    notify(successMessage);
};

const actions = {
    cadastrar: () => goTo('cadastro'),

    voltarLogin: () => goTo('login'),

    role: ({ v }) => {
        collect('login');
        state.role = v;
        state.error = '';
        render();
    },

    tipo: ({ v }) => {
        collect('cadastro');
        state.signupType = v;
        render();
    },

    preencher: ({ v }) => {
        state.role = v;
        state.drafts.login = { email: DEMO_ACCOUNTS[v].email, senha: DEMO_PASSWORD };
        state.error = '';
        render();
    },

    restaurar: () => {
        const confirmed = window.confirm(
            'Restaurar os dados da demonstração? Todas as contas, caronas e solicitações criadas neste navegador serão apagadas.'
        );
        if (!confirmed) return;

        Demo.reset();
        resetSession();
        notify('Dados da demonstração restaurados.');
    },

    login: () => {
        const form = collect('login');

        const result = Auth.login({
            email: (form.email || '').trim(),
            senha: form.senha || '',
            perfil: state.role
        });

        if (!result.ok) return showError(result.message);

        startSession(result.data);
    },

    enviarCad: () => {
        const form = collect('cadastro');

        const result = Auth.register({
            nome: (form.nome || '').trim(),
            email: (form.email || '').trim(),
            senha: form.senha || '',
            perfil: state.signupType,
            arquivo: state.signupFile
        });

        if (!result.ok) return showError(result.message);

        state.drafts = { login: { email: (form.email || '').trim() } };
        state.signupFile = null;
        state.role = state.signupType;
        state.error = '';
        state.screen = 'login';
        notify('Cadastro realizado! Aguarde a aprovação de um administrador.');
    },

    sair: () => {
        resetSession();
        render();
    },

    nav: ({ v }) => {
        if (state.editingRideId) resetRideForm();
        state.profileEditing = false;
        delete state.drafts.perfil;
        goTo(v);
    },

    view: ({ v }) => {
        state.view = v;
        render();
    },

    chip: ({ v }) => {
        state.chip = v;
        render();
    },

    open: ({ id }) => {
        state.selectedRideId = id;
        goTo('detalhe');
    },

    solicitar: () => {
        const result = Requests.create(state.selectedRideId, state.userId);

        if (!result.ok) return notify(result.message);

        state.screen = 'caronas';
        notify('Solicitação enviada ao motorista.');
    },

    cancelar: ({ id }) => {
        respondTo(Requests.cancel(id, state.userId), 'Solicitação cancelada.');
    },

    denunciar: () => {
        respondTo(
            Reports.create(state.selectedRideId, state.userId),
            'Denúncia enviada ao administrador.'
        );
    },

    vagas: ({ v }) => {
        collect('ride');
        state.rideForm.vagas = clamp(
            state.rideForm.vagas + Number(v),
            LIMITS.minRideSeats,
            LIMITS.maxRideSeats
        );
        render();
    },

    pref: ({ v }) => {
        collect('ride');
        state.rideForm.prefs[v] = !state.rideForm.prefs[v];
        render();
    },

    ponto: () => {
        collect('ride');
        state.rideForm.pin = !state.rideForm.pin;
        render();
    },

    publicar: () => {
        const payload = rideFormPayload(collect('ride'));
        const editingId = state.editingRideId;

        const result = editingId
            ? Rides.update(editingId, state.userId, payload)
            : Rides.create(state.userId, payload);

        if (!result.ok) return showError(result.message);

        resetRideForm();
        state.screen = 'caronas';
        notify(editingId ? 'Carona atualizada.' : 'Carona publicada.');
    },

    editarCarona: ({ id }) => {
        const ride = Rides.byId(id);
        if (!ride || ride.driverId !== state.userId) return notify('Carona não encontrada.');

        state.editingRideId = id;
        state.rideForm = {
            vagas: ride.vagas,
            pin: ride.pontoMapa,
            prefs: { m: false, p: false, n: false, ...ride.preferencias }
        };
        state.drafts.ride = {
            origem: ride.origem,
            destino: ride.destino,
            data: ride.data,
            horario: ride.horario,
            obs: ride.observacoes
        };

        goTo('oferecer');
    },

    cancelarEdicaoCarona: () => {
        resetRideForm();
        goTo('caronas');
    },

    excluirCarona: ({ id }) => {
        if (!window.confirm('Excluir esta carona? As solicitações dela também serão removidas.')) return;

        respondTo(Rides.remove(id, state.userId), 'Carona excluída.');
    },

    aceitar: ({ id }) => {
        respondTo(Requests.respond(id, state.userId, 'aceita'), 'Solicitação aceita.');
    },

    recusar: ({ id }) => {
        respondTo(Requests.respond(id, state.userId, 'rejeitada'), 'Solicitação rejeitada.');
    },

    editarPerfil: () => {
        state.profileEditing = true;
        state.error = '';
        delete state.drafts.perfil;
        render();
    },

    cancelarEdicao: () => {
        state.profileEditing = false;
        state.error = '';
        delete state.drafts.perfil;
        render();
    },

    salvarPerfil: () => {
        const user = currentUser();
        const form = collect('perfil');

        const result = Users.updateProfile(
            user.id,
            profilePayload({ ...userToForm(user), ...form }, user.perfil === 'm')
        );

        if (!result.ok) return showError(result.message);

        state.profileEditing = false;
        delete state.drafts.perfil;
        state.error = '';
        notify('Perfil atualizado com sucesso!');
    },

    removerFoto: () => {
        collect('perfil');
        Users.setPhoto(state.userId, '');
        notify('Foto removida com sucesso.');
    },

    adm: ({ v }) => {
        state.adminTab = v;
        render();
    },

    doc: ({ id }) => {
        const proof = Users.byId(id)?.comprovante;

        notify(proof
            ? `Comprovante: ${proof.nome} (${Math.max(1, Math.round(proof.tamanho / 1024))} KB).`
            : 'Nenhum comprovante anexado.');
    },

    aprovar: ({ id }) => {
        const result = Users.setStatus(state.userId, id, 'aprovado');
        notify(result.ok ? `${result.data.nome} aprovado(a).` : result.message);
    },

    rejeitar: ({ id }) => {
        const result = Users.setStatus(state.userId, id, 'rejeitado');
        notify(result.ok ? `${result.data.nome} rejeitado(a).` : result.message);
    },

    arquivar: ({ id }) => {
        respondTo(Reports.archive(state.userId, id), 'Denúncia arquivada.');
    },

    suspender: ({ id }) => {
        respondTo(Reports.suspend(state.userId, id), 'Conta suspensa.');
    }
};

const userToForm = user => ({
    nome: user.nome,
    email: user.email,
    telefone: user.telefone,
    modelo: user.veiculo?.modelo,
    cor: user.veiculo?.cor,
    placa: user.veiculo?.placa,
    vagas: user.veiculo?.vagas
});

const handleError = error => {
    console.error(error);
    notify(error.message || 'Ocorreu um erro inesperado.');
};

document.addEventListener('click', async event => {
    const target = event.target.closest('[data-act]');
    const action = target && actions[target.dataset.act];

    if (!action) return;

    if (target.tagName === 'A') event.preventDefault();

    try {
        await action(target.dataset);
    } catch (error) {
        handleError(error);
    }
});

document.addEventListener('input', event => {
    const { target } = event;

    if (target.id === 'search-query') {
        state.query = target.value;
        document.getElementById('list').innerHTML = rideList();
        return;
    }

    if (target.name === 'telefone') target.value = formatPhone(target.value);

    const scope = target.dataset?.draft;

    if (scope) {
        state.drafts[scope] = { ...state.drafts[scope], [target.name]: target.value };
    }
});

document.addEventListener('change', async event => {
    const { target } = event;

    try {
        if (target.id === 'signup-file') {
            state.signupFile = target.files[0] || null;
            document.getElementById('signup-file-name').textContent =
                state.signupFile?.name || 'Anexar documento (matrícula ou carteirinha)';
        }

        if (target.id === 'profile-photo') {
            const file = target.files[0];
            target.value = '';

            if (!file) return;

            const photo = await Photos.process(file);
            collect('perfil');
            Users.setPhoto(state.userId, photo);
            notify('Foto de perfil atualizada.');
        }
    } catch (error) {
        handleError(error);
    }
});

const boot = () => {
    Demo.init();

    const user = Auth.restore();

    if (user) {
        state.userId = user.id;
        state.role = user.perfil;
        state.screen = HOME[user.perfil];
        resetRideForm();
    }

    render();
};

boot();
