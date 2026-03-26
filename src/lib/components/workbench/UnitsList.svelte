<script>
	import { onMount } from 'svelte';
	import {
		fetchAllBuildOutputs,
		createSingleOutput,
		fetchBuildOrderById,
		fetchNextSerialNumber
	} from '$lib/api/builds';
	import UnitCard from './UnitCard.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { goto } from '$app/navigation';

	let { boId, bucketId } = $props();

	let bo = $state(null);
	let outputs = $state([]);
	let loading = $state(true);
	let creating = $state(false);
	let createError = $state(null);

	async function loadData() {
		if (!boId) return;
		loading = true;
		try {
			const [boData, outputsData] = await Promise.all([
				fetchBuildOrderById(boId),
				fetchAllBuildOutputs(boId)
			]);
			bo = boData;
			outputs = outputsData;
		} catch (e) {
			console.error('Failed to load UnitsList data', e);
		} finally {
			loading = false;
		}
	}

	onMount(loadData);

	$effect(() => {
		if (boId) {
			loadData();
		}
	});

	async function handleCreateOutput() {
		if (!boId || !bucketId || creating || !bo) return;
		createError = null;
		creating = true;
		try {
			let serial = '';
			const isTrackable = bo.raw?.part_detail?.trackable;

			if (isTrackable) {
				serial = await fetchNextSerialNumber(bo.partId);
			}

			const newOutput = await createSingleOutput(boId, bucketId, serial);
			outputs = [newOutput, ...outputs];
		} catch (e) {
			console.error('Failed to create output', e);
			createError = `Failed to create output: ${e.message}`;
		} finally {
			creating = false;
		}
	}

	function handleUnitClick(unit) {
		goto(`/workbench/${unit.pk}`);
	}
</script>

<div class="units-list">
	<div class="header">
		<h3>All Units</h3>
		<button class="create-btn" onclick={handleCreateOutput} disabled={!bucketId || creating || !bo}>
			<Icon name="plus" size={14} />
			{creating ? 'Creating...' : 'New Output'}
		</button>
	</div>
	{#if createError}
		<p class="create-error">{createError}</p>
	{/if}

	{#if loading}
		<p class="empty-text">Loading units...</p>
	{:else if outputs.length === 0}
		<div class="empty-state">
			<Icon name="wrench" size={36} />
			<p>No outputs started yet.</p>
			{#if bucketId}
				<button class="start-btn" onclick={handleCreateOutput} disabled={creating || !bo}>
					{creating ? 'Creating...' : 'Create First Output'}
				</button>
			{:else}
				<p class="hint">Select a WIP Location to start.</p>
			{/if}
		</div>
	{:else}
		<div class="grid">
			{#each outputs as output (output.pk)}
				<UnitCard {output} onclick={() => handleUnitClick(output)} />
			{/each}
		</div>
	{/if}
</div>

<style>
	.units-list {
		display: flex;
		flex-direction: column;
	}

	.header {
		margin-bottom: var(--space-lg);
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.header h3 {
		margin: 0;
		font-size: 1rem;
		font-weight: 800;
		color: var(--on-surface);
	}

	.create-btn {
		display: inline-flex;
		align-items: center;
		gap: var(--space-xs);
		padding: 8px var(--space-md);
		background: var(--primary);
		color: var(--on-primary);
		border-radius: var(--radius-md);
		font-weight: 800;
		font-size: 0.75rem;
		box-shadow: var(--shadow-ambient);
		transition: transform 0.1s ease;
	}

	.create-btn:active {
		transform: scale(0.98);
	}

	.create-btn:disabled {
		opacity: 0.5;
		background: var(--text-muted);
		box-shadow: none;
	}

	.empty-text {
		text-align: center;
		color: var(--text-muted);
		padding: var(--space-xl);
		font-weight: 500;
	}

	.empty-state {
		text-align: center;
		padding: var(--space-xl) var(--space-lg);
		background: var(--surface-container-high);
		border: 1px dashed var(--outline-variant);
		border-radius: var(--radius-xl);
		color: var(--text-muted);
	}

	.empty-state :global(svg) {
		margin-bottom: var(--space-md);
		opacity: 0.35;
		color: var(--text-muted);
	}

	.empty-state p {
		font-weight: 700;
		margin-bottom: var(--space-lg);
	}

	.start-btn {
		padding: var(--space-md) var(--space-xl);
		background: var(--primary);
		color: var(--on-primary);
		border-radius: var(--radius-lg);
		font-weight: 800;
		box-shadow: var(--shadow-ambient);
		transition: transform 0.1s ease;
	}

	.start-btn:active {
		transform: scale(0.98);
	}

	.start-btn:disabled {
		opacity: 0.5;
	}

	.hint {
		font-size: 0.75rem;
		color: var(--tertiary);
		font-weight: 800;
	}

	.grid {
		display: flex;
		flex-direction: column;
	}

	.create-error {
		font-size: 0.8125rem;
		font-weight: 700;
		color: var(--tertiary);
		margin: 0 0 var(--space-sm);
	}
</style>
