<script>
	/**
	 * @typedef {Object} Props
	 * @property {boolean} isOpen
	 * @property {string} [title]
	 * @property {string} [subtitle]
	 * @property {import('svelte').Snippet} [children]
	 * @property {import('svelte').Snippet} [footer]
	 * @property {function} onClose
	 */

	/** @type {Props} */
	let { isOpen, title, subtitle, children, footer, onClose } = $props();

	function handleOverlayClick() {
		onClose();
	}

	/** @param {KeyboardEvent} event */
	function handleKeydown(event) {
		if (event.key === 'Escape') {
			onClose();
		}
	}

	/** @param {KeyboardEvent} event */
	function handleContentKeydown(event) {
		// Prevent modal close if interacting inside
		event.stopPropagation();
	}
</script>

{#if isOpen}
	<div
		class="modal-overlay"
		role="button"
		tabindex="0"
		onclick={handleOverlayClick}
		onkeydown={handleKeydown}
	>
		<div
			class="modal-content"
			role="dialog"
			aria-modal="true"
			tabindex="0"
			onclick={(e) => e.stopPropagation()}
			onkeydown={handleContentKeydown}
		>
			<div class="drag-handle"></div>
			<header>
				{#if title}<h3>{title}</h3>{/if}
				{#if subtitle}<p>{subtitle}</p>{/if}
			</header>

			<div class="modal-body">
				{@render children?.()}
			</div>

			{#if footer}
				<div class="modal-footer">
					{@render footer()}
				</div>
			{:else}
				<div class="modal-footer">
					<button class="cancel-btn" onclick={() => onClose()}>Close</button>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(6, 20, 35, 0.8); /* --surface at 80% */
		display: flex;
		align-items: flex-end;
		z-index: 2000;
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
	}

	.modal-content {
		background: var(--surface-container-high);
		width: 100%;
		max-width: 480px;
		margin: 0 auto;
		border-top-left-radius: var(--radius-lg);
		border-top-right-radius: var(--radius-lg);
		padding: var(--space-lg);
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.5);
		animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
		border-top: 1px solid var(--outline-variant); /* Ghost Border */
	}

	@keyframes slide-up {
		from {
			transform: translateY(100%);
		}
		to {
			transform: translateY(0);
		}
	}

	.drag-handle {
		width: 36px;
		height: 4px;
		background: var(--surface-container-highest);
		border-radius: 2px;
		margin: 0 auto var(--space-md);
		flex-shrink: 0;
	}

	header h3 {
		margin: 0;
		font-family: var(--font-display);
		font-size: 1.75rem; /* headline-md */
		font-weight: 700;
		color: var(--on-surface);
		letter-spacing: -0.02em;
	}

	header p {
		color: var(--text-muted);
		font-size: 0.875rem;
		font-weight: 500;
		margin: var(--space-xs) 0 var(--space-lg);
	}

	.modal-body {
		flex: 1;
		overflow-y: auto;
		margin-bottom: var(--space-lg);
		-webkit-overflow-scrolling: touch;
	}

	.modal-footer {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		padding-bottom: env(safe-area-inset-bottom);
	}

	.cancel-btn {
		width: 100%;
		min-height: var(--space-12);
		background: var(--surface-container-highest);
		border: 1px solid var(--outline-variant);
		border-radius: var(--radius-md);
		font-weight: 700;
		color: var(--on-surface);
		transition:
			transform 0.1s ease,
			background-color 0.1s ease;
	}

	.cancel-btn:active {
		transform: scale(0.98);
		background-color: var(--surface-container-low);
	}
</style>
