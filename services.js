const ok = (data = null) => ({ ok: true, data });
const fail = message => ({ ok: false, message });

const today = () => new Date().toLocaleDateString('pt-BR');

const Validate = (() => {
    const EDU = /^[^\s@]+@([a-z0-9-]+\.)+edu\.br$/i;
    const PLATE = /^[A-Z]{3}-?\d[A-Z0-9]\d{2}$/;
    const DATE = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

    const date = value => {
        const match = DATE.exec(value);
        if (!match) return false;

        const day = Number(match[1]);
        const month = Number(match[2]);
        const year = Number(match[3]);
        const parsed = new Date(year, month - 1, day);

        return parsed.getFullYear() === year
            && parsed.getMonth() === month - 1
            && parsed.getDate() === day;
    };

    return {
        email: value => EDU.test(value),
        phone: value => !value || /^\d{10,11}$/.test(value.replace(/\D/g, '')),
        plate: value => !value || PLATE.test(value),
        seats: (value, max) => Number.isInteger(Number(value)) && Number(value) >= 1 && Number(value) <= max,
        date,
        time: value => TIME.test(value)
    };
})();

const isAdmin = userId => Users.byId(userId)?.perfil === 'a';

const Users = {
    all: () => Tables.users.all(),
    byId: id => Tables.users.find(id),
    pending: () => Tables.users.where(user => user.status === 'pendente'),

    byEmail: email =>
        Tables.users.all().find(user =>
            user.email.toLowerCase() === String(email).toLowerCase()
        ) || null,

    setStatus(actorId, targetId, status) {
        if (!isAdmin(actorId)) return fail('Ação permitida apenas ao administrador.');

        const target = Users.byId(targetId);
        if (!target) return fail('Usuário não encontrado.');
        if (target.perfil === 'a') return fail('A conta de administrador não pode ser alterada.');

        return ok(Tables.users.update(targetId, { status }));
    },

    setPhoto(id, foto) {
        return ok(Tables.users.update(id, { foto }));
    },

    updateProfile(id, { nome, email, telefone, veiculo }) {
        const user = Users.byId(id);
        if (!user) return fail('Usuário não encontrado.');

        if (!nome) return fail('Informe seu nome completo.');
        if (!Validate.email(email)) return fail('Informe um e-mail institucional válido.');

        const duplicate = Users.byEmail(email);
        if (duplicate && duplicate.id !== id) return fail('Já existe um cadastro com este e-mail.');

        if (!Validate.phone(telefone)) return fail('Informe um telefone válido com DDD.');

        const patch = { nome, email, telefone };

        if (user.perfil === 'm') {
            const placa = veiculo.placa.toUpperCase();

            if (!Validate.plate(placa)) return fail('Informe uma placa válida (ex.: ABC1D23).');
            if (!Validate.seats(veiculo.vagas, LIMITS.maxVehicleSeats)) {
                return fail(`A quantidade de vagas deve ficar entre 1 e ${LIMITS.maxVehicleSeats}.`);
            }

            patch.veiculo = { ...veiculo, placa };
        }

        return ok(Tables.users.update(id, patch));
    }
};

const Auth = {
    login({ email, senha, perfil }) {
        if (!Validate.email(email)) {
            return fail('Use seu e-mail institucional terminado em .edu.br.');
        }

        const user = Users.byEmail(email);

        if (!user || user.senha !== senha) return fail('E-mail ou senha inválidos.');

        if (user.perfil !== perfil) {
            return fail(`Este e-mail está cadastrado como ${ROLE[user.perfil]}. Selecione esse perfil.`);
        }

        if (user.status !== 'aprovado') {
            return fail(BLOCKED_LOGIN_MESSAGE[user.status] || 'Não foi possível validar seu cadastro.');
        }

        DB.write('session', user.id);
        return ok(user);
    },

    register({ nome, email, senha, perfil, arquivo }) {
        if (!nome) return fail('Informe seu nome completo.');
        if (!Validate.email(email)) return fail('Use seu e-mail institucional (terminado em .edu.br).');
        if (Users.byEmail(email)) return fail('Já existe um cadastro com este e-mail.');
        if (senha.length < LIMITS.minPasswordLength) {
            return fail(`A senha precisa ter ao menos ${LIMITS.minPasswordLength} caracteres.`);
        }
        if (!['p', 'm'].includes(perfil)) return fail('Escolha o tipo de cadastro.');
        if (!arquivo) return fail('Anexe o comprovante de vínculo.');

        Tables.users.insert({
            nome,
            email,
            senha,
            perfil,
            status: 'pendente',
            telefone: '',
            foto: '',
            nota: '5,0',
            veiculo: { modelo: '', cor: '', placa: '', vagas: '' },
            comprovante: { nome: arquivo.name, tipo: arquivo.type, tamanho: arquivo.size },
            criadoEm: today()
        });

        return ok();
    },

    restore() {
        const user = Users.byId(DB.read('session', null));
        return user && user.status === 'aprovado' ? user : null;
    },

    logout() {
        DB.remove('session');
    }
};

const Rides = {
    all: () => Tables.rides.all(),
    byId: id => Tables.rides.find(id),
    byDriver: driverId => Tables.rides.where(ride => ride.driverId === driverId),

    occupied: rideId =>
        Tables.requests.where(request =>
            request.rideId === rideId && request.status !== 'rejeitada'
        ).length,

    freeSeats: ride => Math.max(0, ride.vagas - Rides.occupied(ride.id)),

    normalize: data => ({
        origem: data.origem.trim(),
        destino: data.destino.trim(),
        data: data.data.trim(),
        horario: data.horario.trim(),
        vagas: Number(data.vagas),
        observacoes: data.observacoes.trim(),
        preferencias: { ...data.preferencias },
        pontoMapa: Boolean(data.pontoMapa)
    }),

    validate(ride) {
        if (!ride.origem) return 'Informe a origem da carona.';
        if (!ride.destino) return 'Informe o destino da carona.';
        if (!Validate.date(ride.data)) return 'Informe a data no formato DD/MM/AAAA.';
        if (!Validate.time(ride.horario)) return 'Informe o horário no formato HH:MM.';
        if (!Validate.seats(ride.vagas, LIMITS.maxRideSeats)) return 'Informe de 1 a 6 vagas.';
        return '';
    },

    create(driverId, data) {
        const driver = Users.byId(driverId);
        if (driver?.perfil !== 'm') return fail('Apenas motoristas podem publicar caronas.');

        const ride = Rides.normalize(data);
        const error = Rides.validate(ride);
        if (error) return fail(error);

        return ok(Tables.rides.insert({ driverId, ...ride }));
    },

    update(id, driverId, data) {
        const current = Rides.byId(id);
        if (!current || current.driverId !== driverId) return fail('Carona não encontrada.');

        const ride = Rides.normalize(data);
        const error = Rides.validate(ride);
        if (error) return fail(error);

        const occupied = Rides.occupied(id);
        if (ride.vagas < occupied) {
            return fail(`Já existem ${occupied} vagas reservadas. Defina ao menos esse número.`);
        }

        return ok(Tables.rides.update(id, ride));
    },

    remove(id, driverId) {
        const ride = Rides.byId(id);
        if (!ride || ride.driverId !== driverId) return fail('Carona não encontrada.');

        Tables.requests.replaceAll(Tables.requests.where(request => request.rideId !== id));
        Tables.rides.remove(id);

        return ok();
    }
};

const Requests = {
    byPassenger: passengerId => Tables.requests.where(request => request.passengerId === passengerId),
    byRide: rideId => Tables.requests.where(request => request.rideId === rideId),

    active: (rideId, passengerId) =>
        Tables.requests.all().find(request =>
            request.rideId === rideId
            && request.passengerId === passengerId
            && request.status !== 'rejeitada'
        ) || null,

    create(rideId, passengerId) {
        const passenger = Users.byId(passengerId);
        if (passenger?.perfil !== 'p') return fail('Apenas passageiros podem solicitar vagas.');

        const ride = Rides.byId(rideId);
        if (!ride) return fail('Esta carona não está mais disponível.');
        if (Requests.active(rideId, passengerId)) return fail('Você já solicitou esta carona.');
        if (!Rides.freeSeats(ride)) return fail('Esta carona não tem mais vagas.');

        Tables.requests.replaceAll(Tables.requests.where(request =>
            !(request.rideId === rideId && request.passengerId === passengerId)
        ));

        return ok(Tables.requests.insert({
            rideId,
            passengerId,
            status: 'pendente',
            criadoEm: today()
        }));
    },

    cancel(id, passengerId) {
        const request = Tables.requests.find(id);
        if (!request || request.passengerId !== passengerId) return fail('Solicitação não encontrada.');

        Tables.requests.remove(id);
        return ok();
    },

    respond(id, driverId, status) {
        const request = Tables.requests.find(id);
        const ride = request && Rides.byId(request.rideId);

        if (!ride || ride.driverId !== driverId) return fail('Solicitação não encontrada.');
        if (request.status !== 'pendente') return fail('Esta solicitação já foi respondida.');

        return ok(Tables.requests.update(id, { status }));
    }
};

const Reports = {
    all: () => Tables.reports.all(),

    create(rideId, authorId) {
        const ride = Rides.byId(rideId);
        if (!ride) return fail('Carona não encontrada.');

        const duplicate = Tables.reports.all().some(report =>
            report.autorId === authorId && report.reportedId === ride.driverId
        );
        if (duplicate) return fail('Você já denunciou este motorista.');

        return ok(Tables.reports.insert({
            reportedId: ride.driverId,
            rideId,
            autorId: authorId,
            motivo: 'Denúncia enviada por passageiro'
        }));
    },

    archive(actorId, id) {
        if (!isAdmin(actorId)) return fail('Ação permitida apenas ao administrador.');

        Tables.reports.remove(id);
        return ok();
    },

    suspend(actorId, id) {
        const report = Tables.reports.find(id);
        if (!report) return fail('Denúncia não encontrada.');

        const result = Users.setStatus(actorId, report.reportedId, 'suspenso');
        if (!result.ok) return result;

        Tables.reports.remove(id);
        return ok();
    }
};

const Photos = (() => {
    const TYPES = ['image/jpeg', 'image/png', 'image/webp'];
    const MAX_INPUT_BYTES = 5 * 1024 * 1024;
    const MAX_SIDE = 320;
    const QUALITY = 0.85;

    const readAsDataUrl = file =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
            reader.readAsDataURL(file);
        });

    const loadImage = src =>
        new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = () => reject(new Error('O arquivo escolhido não é uma imagem válida.'));
            image.src = src;
        });

    const compress = image => {
        const scale = Math.min(1, MAX_SIDE / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');

        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));

        const context = canvas.getContext('2d');
        context.fillStyle = '#fff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        return canvas.toDataURL('image/jpeg', QUALITY);
    };

    const process = async file => {
        if (!TYPES.includes(file.type)) throw new Error('Use uma imagem JPG, PNG ou WEBP.');
        if (file.size > MAX_INPUT_BYTES) throw new Error('A imagem deve ter no máximo 5 MB.');

        return compress(await loadImage(await readAsDataUrl(file)));
    };

    return { process };
})();
