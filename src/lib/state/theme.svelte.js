import { browser } from '$app/environment';

class ThemeState {
	value = $state('dark');

	constructor() {
		if (browser) {
			const stored = localStorage.getItem('theme');
			if (stored === 'light' || stored === 'dark') {
				this.value = stored;
			} else {
				this.value = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
			}
			this.applyTheme(this.value);
		}
	}

	toggle() {
		this.value = this.value === 'dark' ? 'light' : 'dark';
		if (browser) {
			localStorage.setItem('theme', this.value);
			this.applyTheme(this.value);
		}
	}

	applyTheme(theme) {
		if (browser) {
			document.documentElement.setAttribute('data-theme', theme);
		}
	}
}

export const themeState = new ThemeState();
