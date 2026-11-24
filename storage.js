const DB = (() => {
    const PREFIX = 'ifc:';
    const LEGACY_KEYS = ['ifc_users'];

    const read = (key, fallback) => {
        try {
            const raw = localStorage.getItem(PREFIX + key);
            return raw === null ? fallback : JSON.parse(raw);
        } catch {
            return fallback;
        }
    };

    const write = (key, value) => {
        try {
            localStorage.setItem(PREFIX + key, JSON.stringify(value));
        } catch {
            throw new Error(
                'Não foi possível salvar os dados. O armazenamento do navegador está cheio ou bloqueado.'
            );
        }
    };

    const remove = key => {
        try {
            localStorage.removeItem(PREFIX + key);
        } catch {}
    };

    const clearAll = () => {
        try {
            Object.keys(localStorage)
                .filter(key => key.startsWith(PREFIX) || LEGACY_KEYS.includes(key))
                .forEach(key => localStorage.removeItem(key));
        } catch {}
    };

    const newId = () =>
        Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

    const collection = name => {
        const all = () => read(name, []);
        const save = items => write(name, items);

        return {
            all,
            replaceAll: save,
            find: id => all().find(item => item.id === id) || null,
            where: predicate => all().filter(predicate),

            insert(data) {
                const item = { id: newId(), ...data };
                save([...all(), item]);
                return item;
            },

            update(id, patch) {
                let updated = null;

                save(all().map(item => {
                    if (item.id !== id) return item;
                    updated = { ...item, ...patch };
                    return updated;
                }));

                return updated;
            },

            remove(id) {
                save(all().filter(item => item.id !== id));
            }
        };
    };

    return { read, write, remove, clearAll, collection };
})();

const Tables = {
    users: DB.collection('users'),
    rides: DB.collection('rides'),
    requests: DB.collection('requests'),
    reports: DB.collection('reports')
};
