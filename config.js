const ROLE = {
    p: 'Passageiro',
    m: 'Motorista',
    a: 'Administrador'
};

const HOME = {
    p: 'buscar',
    m: 'oferecer',
    a: 'admin'
};

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

const PUBLIC_SCREENS = ['login', 'cadastro'];
const SCREENS_WITHOUT_NAV = ['login', 'cadastro', 'detalhe'];

const DEMO_PASSWORD = '123456';

const DEMO_ACCOUNTS = {
    p: { email: 'aluno@instituicao.edu.br' },
    m: { email: 'motorista@instituicao.edu.br' },
    a: { email: 'admin@instituicao.edu.br' }
};

const STATUS_LABEL = {
    pendente: 'Pendente',
    aprovado: 'Aprovado',
    rejeitado: 'Rejeitado',
    suspenso: 'Suspenso'
};

const BLOCKED_LOGIN_MESSAGE = {
    pendente: 'Seu cadastro ainda está em análise pelo administrador.',
    rejeitado: 'Seu cadastro não foi aprovado.',
    suspenso: 'Sua conta está suspensa. Procure um administrador.'
};

const REQUEST_TAG = {
    pendente: { css: 'w', label: 'Aguardando motorista' },
    aceita: { css: '', label: 'Confirmada' },
    rejeitada: { css: 'r', label: 'Recusada' }
};

const LIMITS = {
    minRideSeats: 1,
    maxRideSeats: 6,
    maxVehicleSeats: 8,
    minPasswordLength: 6
};
