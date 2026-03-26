<script>
	import Badge from './Badge.svelte';

	/** @typedef {'pending'|'in_progress'|'on_hold'|'cancelled'|'complete'} Status */
	let { status = 'pending' } = $props();

	/** @type {Record<string, string>} */
	const labels = {
		pending: 'Pending',
		in_progress: 'Production',
		on_hold: 'On Hold',
		cancelled: 'Cancelled',
		complete: 'Finished'
	};

	/** @type {Record<string, any>} */
	const variants = {
		pending: 'info',
		in_progress: 'warning',
		on_hold: 'gray',
		cancelled: 'error',
		complete: 'success'
	};
</script>

<Badge variant={variants[status] || 'default'}>
	{labels[status] || status}
</Badge>
