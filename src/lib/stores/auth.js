import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

function createAuthStore() {
  const initial = {
    serverUrl: '',
    token: '',
    username: ''
  };

  const { subscribe, set, update } = writable(initial);

  if (browser) {
    const saved = localStorage.getItem('inventree-auth');
    if (saved) {
      try {
        set(JSON.parse(saved));
      } catch {
        localStorage.removeItem('inventree-auth');
      }
    }
  }

  return {
    subscribe,
    /** @param {{serverUrl:string,token:string,username:string}} auth */
    setAuth: (auth) => {
      if (browser) {
        localStorage.setItem('inventree-auth', JSON.stringify(auth));
      }
      set(auth);
    },
    clear: () => {
      if (browser) {
        localStorage.removeItem('inventree-auth');
      }
      set(initial);
    },
    update
  };
}

export const auth = createAuthStore();

export const isAuthenticated = derived(auth, ($auth) => {
  return Boolean($auth.serverUrl && $auth.token);
});
