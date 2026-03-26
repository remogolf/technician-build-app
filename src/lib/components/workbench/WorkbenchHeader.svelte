<script>
	import { onMount } from 'svelte';
	import { workbench } from '$lib/state/workbench.svelte.js';
	import { fetchLocations } from '$lib/api/builds';
	import Modal from '$lib/components/Modal.svelte';
	import Icon from '$lib/components/Icon.svelte';

	let isConfiguring = $state(false);
	let locations = $state([]);
	let loadingLocations = $state(false);

	onMount(async () => {
		try {
			locations = await fetchLocations();
		} catch (e) {
			console.error('Failed to prefetch locations', e);
		}
	});

	async function openConfig() {
		isConfiguring = true;
		if (locations.length === 0) {
			loadingLocations = true;
			try {
				locations = await fetchLocations();
			} catch (e) {
				console.error('Failed to fetch locations', e);
			} finally {
				loadingLocations = false;
			}
		}
	}

	function handleLocationChange(loc) {
		workbench.setWipLocation(loc.id, loc.name);
	}

	function handleQtyChange(e) {
		workbench.setWorkQuantity(Number(e.target.value));
	}
</script>

<div class="workbench-header">
	<div class="session-info">
		<div class="item main">
			<span class="label">BUILD ORDER</span>
			<span class="value">{workbench.buildOrderRef || 'None Selected'}</span>
		</div>
		<div class="divider"></div>
		<div class="item qty">
			<span class="label">GOAL QTY</span>
			<input
				type="number"
				min="1"
				value={workbench.workQuantity}
				onchange={handleQtyChange}
				class="qty-input"
			/>
		</div>
	</div>
	<button class="config-btn" onclick={openConfig} aria-label="Configure session">
		<div class="bucket-info">
			<span class="label">BUCKET</span>
			<span class="value">{workbench.wipLocationName || 'Pick Location'}</span>
		</div>
		<Icon name="settings" size={18} />
	</button>
</div>

<Modal isOpen={isConfiguring} title="Workbench Config" onClose={() => (isConfiguring = false)}>
	<div class="config-modal">
		<section class="config-section">
			<h4>WIP Bucket Location</h4>
			<p class="desc">Select where you are physically building these units.</p>

			{#if loadingLocations}
				<div class="loading">Loading locations...</div>
			{:else}
				<div class="location-grid">
					{#each locations as loc (loc.id)}
						<button
							class="loc-card"
							class:active={String(loc.id) === workbench.wipLocationId}
							onclick={() => handleLocationChange(loc)}
						>
							<span class="loc-name">{loc.name}</span>
							<span class="loc-path">{loc.path}</span>
						</button>
					{/each}
				</div>
			{/if}
		</section>

		<section class="config-section">
			<button
				class="clear-btn"
				onclick={() => {
					workbench.clear();
					isConfiguring = false;
				}}
			>
				Reset Workbench Session
			</button>
		</section>
	</div>
</Modal>

<style>
	.workbench-header {
		display: flex;
		align-items: stretch;
		background: var(--surface-container-high);
		border-bottom: 1px solid var(--outline-variant);
	}

	.session-info {
		flex: 1;
		display: flex;
		align-items: center;
		padding: var(--space-sm) var(--space-lg);
		gap: var(--space-lg);
		min-width: 0;
	}

	.item {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.item.main {
		flex: 1;
	}

	.divider {
		width: 1px;
		height: 24px;
		background: var(--outline-variant);
	}

	.label {
		font-size: 0.625rem;
		font-weight: 900;
		color: var(--text-muted);
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.value {
		font-size: 0.875rem;
		font-weight: 800;
		color: var(--on-surface);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.qty-input {
		background: transparent;
		border: none;
		color: var(--primary-fixed-dim);
		font-size: 1rem;
		font-weight: 900;
		width: 40px;
		padding: 0;
		outline: none;
	}

	.config-btn {
		background: var(--surface-container-low);
		border-left: 1px solid var(--outline-variant);
		display: flex;
		align-items: center;
		padding: var(--space-sm) var(--space-lg);
		gap: var(--space-md);
		text-align: right;
		color: var(--text-muted);
		transition: background 0.15s ease;
	}

	.config-btn:active {
		background: var(--surface-container-high);
	}

	.bucket-info {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
	}

	.config-modal {
		display: flex;
		flex-direction: column;
		gap: var(--space-xl);
	}

	.config-section h4 {
		margin: 0 0 var(--space-xs);
		font-size: 0.875rem;
		font-weight: 800;
		color: var(--on-surface);
	}

	.config-section .desc {
		font-size: 0.75rem;
		color: var(--text-muted);
		margin-bottom: var(--space-lg);
	}

	.loading {
		color: var(--text-muted);
		font-size: 0.875rem;
		font-weight: 600;
		text-align: center;
		padding: var(--space-lg);
	}

	.location-grid {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		max-height: 300px;
		overflow-y: auto;
		padding-right: 4px;
	}

	.loc-card {
		text-align: left;
		padding: var(--space-md);
		background: var(--surface-container-highest);
		border-radius: var(--radius-md);
		border: 1px solid transparent;
		transition: all 0.15s ease;
	}

	.loc-card.active {
		border-color: var(--primary);
		background: var(--surface-container-high);
	}

	.loc-card:active {
		transform: scale(0.99);
	}

	.loc-name {
		display: block;
		font-weight: 800;
		color: var(--on-surface);
		font-size: 0.875rem;
	}

	.loc-path {
		display: block;
		font-size: 0.6875rem;
		color: var(--text-muted);
		margin-top: 2px;
	}

	.clear-btn {
		width: 100%;
		padding: var(--space-md) var(--space-lg);
		min-height: var(--space-12);
		background: transparent;
		border: 1px solid var(--tertiary);
		color: var(--tertiary);
		font-weight: 800;
		font-size: 0.875rem;
		border-radius: var(--radius-md);
		transition: transform 0.1s ease;
	}

	.clear-btn:active {
		transform: scale(0.98);
	}
</style>
