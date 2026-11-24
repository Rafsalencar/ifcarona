const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const newRideForm = (seats = 3) => ({
    vagas: clamp(seats, LIMITS.minRideSeats, LIMITS.maxRideSeats),
    pin: false,
    prefs: { m: false, p: true, n: true }
});

const state = {
    screen: 'login',
    role: 'p',
    userId: null,
    error: '',
    toast: '',
    chip: 'Hoje',
    view: 'lista',
    query: '',
    selectedRideId: null,
    editingRideId: null,
    rideForm: newRideForm(),
    adminTab: 'cad',
    profileEditing: false,
    signupType: 'p',
    signupFile: null,
    drafts: {}
};

const currentUser = () => (state.userId ? Users.byId(state.userId) : null);

const draftValue = (scope, name, fallback = '') =>
    state.drafts[scope]?.[name] ?? fallback;
