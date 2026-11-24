const PATHS = {
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

const MAP_PIN_POSITIONS = [
    [60, 70],
    [200, 150],
    [130, 215],
    [250, 60],
    [40, 170],
    [270, 230]
];

const ic = (name, size = 22) =>
    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PATHS[name]}</svg>`;

const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

const esc = value =>
    String(value ?? '').replace(/[&<>"']/g, char => HTML_ESCAPES[char]);

const vg = count => `${count} ${count === 1 ? 'vaga' : 'vagas'}`;

const initialOf = user => esc((user?.nome || 'U').charAt(0).toUpperCase());

const avatar = user => `
    <div class="profile-avatar">
        ${user?.foto
            ? `<img src="${esc(user.foto)}" alt="Foto de perfil">`
            : `<span>${initialOf(user)}</span>`}
    </div>`;

const badge = user =>
    `<span class="av">${user?.foto ? `<img src="${esc(user.foto)}" alt="">` : initialOf(user)}</span>`;

const stat = (label, value) =>
    `<div style="flex:1"><span class="lb">${label}</span><strong style="font-size:22px">${value}</strong></div>`;

const head = (title, right) =>
    `<div class="h"><h1>${title}</h1>${right === undefined ? '<button class="gh" data-act="sair">Sair</button>' : right}</div>`;

const bind = (scope, name) =>
    `id="${scope}-${name}" name="${name}" data-draft="${scope}"`;

const errorLine = () =>
    state.error ? `<p class="err" role="alert">${esc(state.error)}</p>` : '';

const STAR = `<span style="color:var(--am);display:flex">${ic('star', 16)}</span>`;

const statusTag = status => {
    const css = { pendente: 'w', rejeitado: 'r', suspenso: 'r' }[status] || '';
    return `<span class="tag ${css}">${esc(STATUS_LABEL[status] || status)}</span>`;
};

const requestTag = status => {
    const { css, label } = REQUEST_TAG[status];
    return `<span class="tag ${css}">${label}</span>`;
};

const openRides = () => Rides.all().filter(ride => Rides.freeSeats(ride) > 0);

const rideSearchText = ride => {
    const driver = Users.byId(ride.driverId);
    return [ride.origem, ride.destino, driver?.nome, 'motorista'].join(' ').toLowerCase();
};

const rideCard = (ride, clickable) => {
    const driver = Users.byId(ride.driverId);
    const free = Rides.freeSeats(ride);
    const name = esc(driver?.nome || 'Motorista');

    const body = `
        ${badge(driver)}
        <span style="flex:1;min-width:0;display:block">
            <span style="display:flex;justify-content:space-between;align-items:baseline">
                <strong style="font-size:16px">${name}</strong>
                <span style="font-weight:700;font-size:20px;letter-spacing:-.02em">${esc(ride.horario)}</span>
            </span>

            <span style="display:block;font-size:13px;color:var(--mut);margin:2px 0 8px">
                ${esc(ride.origem)} → ${esc(ride.destino)}
            </span>

            <span style="display:flex;justify-content:space-between;align-items:center">
                <span style="display:flex;align-items:center;gap:4px;font-weight:600;font-size:13px">
                    ${STAR}${esc(driver?.nota || '5,0')}
                </span>

                <span class="tag ${free < 2 ? 'w' : ''}">
                    ${free ? vg(free) : 'Lotada'}
                </span>
            </span>
        </span>`;

    return clickable
        ? `<button class="c rc" data-act="open" data-id="${ride.id}" aria-label="Carona de ${name} às ${esc(ride.horario)}">${body}</button>`
        : `<div class="c rc" style="cursor:default">${body}</div>`;
};

const rideList = () => {
    const query = state.query.trim().toLowerCase();
    const rides = Rides.all().filter(ride => !query || rideSearchText(ride).includes(query));

    return rides.length
        ? rides.map(ride => rideCard(ride, true)).join('')
        : '<p class="mut">Nenhuma carona encontrada para essa busca.</p>';
};

const mapView = () => `
    <div class="mp">
        <svg width="100%" height="300" viewBox="0 0 340 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <rect width="340" height="300" fill="var(--map)"/>
            <rect x="14" y="14" width="90" height="60" rx="8" fill="var(--blk)"/>
            <rect x="150" y="30" width="110" height="70" rx="8" fill="var(--blk)"/>
            <rect x="190" y="180" width="120" height="90" rx="8" fill="var(--blk)"/>
            <rect x="20" y="130" width="100" height="70" rx="8" fill="var(--blk)"/>
            <path d="M0 110H340M140 0V300M280 0V300M0 250H340" stroke="var(--card)" stroke-width="9"/>
        </svg>

        ${Rides.all().map((ride, index) => {
            const [left, top] = MAP_PIN_POSITIONS[index % MAP_PIN_POSITIONS.length];
            const driver = Users.byId(ride.driverId);

            return `<button class="pin" style="left:${left}px;top:${top}px" data-act="open" data-id="${ride.id}" aria-label="Carona de ${esc(driver?.nome || 'motorista')}">${initialOf(driver)}</button>`;
        }).join('')}
    </div>`;

const bottomNav = (role, screen) => `
    <nav class="nav" aria-label="Navegação">
        ${NAV[role].map(([key, icon, label]) =>
            `<button data-act="nav" data-v="${key}" ${screen === key ? 'aria-current="page"' : ''}>
                ${ic(icon)}${label}
            </button>`
        ).join('')}
    </nav>`;
