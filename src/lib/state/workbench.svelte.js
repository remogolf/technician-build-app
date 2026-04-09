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
	const _savedTarget = browser ? parseInt(localStorage.getItem('active_bo_target') ?? '', 10) : NaN;
	let buildOrderTarget = $state(Number.isNaN(_savedTarget) ? 0 : _savedTarget);
	const _savedBuilt = browser ? parseInt(localStorage.getItem('active_bo_built') ?? '', 10) : NaN;
	let buildOrderBuilt = $state(Number.isNaN(_savedBuilt) ? 0 : _savedBuilt);

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
		get buildOrderTarget() {
			return buildOrderTarget;
		},
		get buildOrderBuilt() {
			return buildOrderBuilt;
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
			const cap = buildOrderTarget > 0 ? buildOrderTarget : Infinity;
			workQuantity = Math.max(1, Math.min(qty, cap));
			if (browser) {
				localStorage.setItem('active_work_qty', String(workQuantity));
			}
		},

		/**
		 * @param {number} target
		 * @param {number} built
		 */
		setOrderDetails(target, built) {
			buildOrderTarget = target;
			buildOrderBuilt = built;
			if (browser) {
				localStorage.setItem('active_bo_target', String(target));
				localStorage.setItem('active_bo_built', String(built));
			}
			// Clamp work quantity to new target
			if (target > 0 && workQuantity > target) {
				workQuantity = target;
				if (browser) localStorage.setItem('active_work_qty', String(target));
			}
		},

		clear() {
			this.selectOrder(null);
			this.setWipLocation(null);
			this.setWorkQuantity(1);
			buildOrderTarget = 0;
			buildOrderBuilt = 0;
			if (browser) {
				localStorage.removeItem('active_bo_target');
				localStorage.removeItem('active_bo_built');
			}
		}
	};
}

export const workbench = createWorkbenchState();
