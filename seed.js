const Demo = (() => {
    const DAY_MS = 24 * 60 * 60 * 1000;

    const dateOffset = days =>
        new Date(Date.now() + days * DAY_MS).toLocaleDateString('pt-BR');

    const vehicle = (modelo, cor, placa, vagas) => ({ modelo, cor, placa, vagas });

    const person = (id, nome, email, perfil, status, extra = {}) => ({
        id,
        nome,
        email,
        perfil,
        status,
        senha: DEMO_PASSWORD,
        telefone: '',
        foto: '',
        nota: '5,0',
        veiculo: vehicle('', '', '', ''),
        comprovante: { nome: 'comprovante-demo.pdf', tipo: 'application/pdf', tamanho: 120 * 1024 },
        criadoEm: dateOffset(0),
        ...extra
    });

    const buildUsers = () => [
        person('u-aluno', 'Aluno Demo', DEMO_ACCOUNTS.p.email, 'p', 'aprovado', {
            telefone: '(82) 99999-0000'
        }),
        person('u-motorista', 'Motorista Demo', DEMO_ACCOUNTS.m.email, 'm', 'aprovado', {
            nota: '4,0',
            telefone: '(82) 99999-0001',
            veiculo: vehicle('Fiat Uno', 'Prata', 'ABC1D23', '3')
        }),
        person('u-admin', 'Administrador Demo', DEMO_ACCOUNTS.a.email, 'a', 'aprovado', {
            comprovante: null
        }),
        person('u-motorista-b', 'Bruno Lima', 'bruno@instituicao.edu.br', 'm', 'aprovado', {
            nota: '5,0',
            veiculo: vehicle('VW Gol', 'Branco', 'BRA2E19', '1')
        }),
        person('u-motorista-c', 'Carla Souza', 'carla@instituicao.edu.br', 'm', 'aprovado', {
            nota: '3,0',
            veiculo: vehicle('Chevrolet Onix', 'Preto', 'QWE4R56', '2')
        }),
        person('u-novo-a', 'Usuário Novo A', 'usuarionovoa@instituicao.edu.br', 'm', 'pendente', {
            criadoEm: dateOffset(-3)
        }),
        person('u-novo-b', 'Usuário Novo B', 'usuarionovob@instituicao.edu.br', 'p', 'pendente', {
            criadoEm: dateOffset(-2)
        }),
        person('u-novo-c', 'Usuário Novo C', 'usuarionovoc@instituicao.edu.br', 'm', 'pendente', {
            criadoEm: dateOffset(-1)
        })
    ];

    const ride = (id, driverId, horario, vagas) => ({
        id,
        driverId,
        origem: 'Bairro Centro',
        destino: 'Campus Arapiraca',
        data: dateOffset(0),
        horario,
        vagas,
        observacoes: '',
        preferencias: { m: false, p: true, n: true },
        pontoMapa: false
    });

    const buildRides = () => [
        ride('r-a', 'u-motorista', '07:30', 3),
        ride('r-b', 'u-motorista-b', '07:45', 1),
        ride('r-c', 'u-motorista-c', '08:00', 2)
    ];

    const buildRequests = () => [
        { id: 'q-1', rideId: 'r-a', passengerId: 'u-aluno', status: 'pendente', criadoEm: dateOffset(0) }
    ];

    const buildReports = () => [
        {
            id: 'd-1',
            reportedId: 'u-motorista-c',
            rideId: 'r-c',
            autorId: 'u-aluno',
            motivo: 'Conduta inadequada durante a carona'
        },
        {
            id: 'd-2',
            reportedId: 'u-motorista-b',
            rideId: 'r-b',
            autorId: 'u-aluno',
            motivo: 'Atraso de mais de 20 minutos'
        }
    ];

    const populate = () => {
        Tables.users.replaceAll(buildUsers());
        Tables.rides.replaceAll(buildRides());
        Tables.requests.replaceAll(buildRequests());
        Tables.reports.replaceAll(buildReports());
        DB.write('seeded', true);
    };

    const init = () => {
        if (!DB.read('seeded', false)) populate();
    };

    const reset = () => {
        DB.clearAll();
        populate();
    };

    return { init, reset };
})();
