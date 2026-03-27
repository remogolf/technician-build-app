import { browser } from '$app/environment';

/**
 * Global state for the Workbench.
 * Persists the active Build Order and WIP Location.
 */
function createWorkbenchState() {
	let buildOrderId = $state(browser ? localStorage.getItem('active_bo_id') : null);
	let wipLocationId = $state(browser ? localStorage.getItem('active_wip_id') : null);
	let buildOrderRef = $state(browser ? localStorage.getItem('active_bo_ref') : '');
	let wipLocationName = $state(browser ? localStorage.getItem('active_wip_name') : '');
	const _savedQty = browser ? parseInt(localStorage.getItem('active_work_qty') ?? '', 10) : NaN;
	let workQuantity = $state(Number.isNaN(_savedQty) || _savedQty < 1 ? 1 : _savedQty);

	return {
		get buildOrderId() {
			return buildOrderId;
		},
		get wipLocationId() {
			return wipLocationId;
		},
		get buildOrderRef() {
			return buildOrderRef;
		},
		get wipLocationName() {
			return wipLocationName;
		},
		get workQuantity() {
			return workQuantity;
		},

		/**
		 * @param {string|number|null} id
		 * @param {string} [ref]
		 */
		selectOrder(id, ref = '') {
			buildOrderId = id ? String(id) : null;
			buildOrderRef = ref || (id ? `BO-${id}` : '');
			if (browser) {
				if (id) {
					localStorage.setItem('active_bo_id', String(id));
					localStorage.setItem('active_bo_ref', buildOrderRef);
				} else {
					localStorage.removeItem('active_bo_id');
					localStorage.removeItem('active_bo_ref');
				}
			}
		},

		/**
		 * @param {string|number|null} id
		 * @param {string} [name]
		 */
		setWipLocation(id, name = '') {
			wipLocationId = id ? String(id) : null;
			wipLocationName = name || (id ? `Loc ${id}` : '');
			if (browser) {
				if (id) {
					localStorage.setItem('active_wip_id', String(id));
					localStorage.setItem('active_wip_name', wipLocationName);
				} else {
					localStorage.removeItem('active_wip_id');
					localStorage.removeItem('active_wip_name');
				}
			}
		},

		/** @param {number} qty */
		setWorkQuantity(qty) {
			workQuantity = Math.max(1, qty);
			if (browser) {
				localStorage.setItem('active_work_qty', String(workQuantity));
			}
		},

		clear() {
			this.selectOrder(null);
			this.setWipLocation(null);
			this.setWorkQuantity(1);
		}
	};
}

export const workbench = createWorkbenchState();
