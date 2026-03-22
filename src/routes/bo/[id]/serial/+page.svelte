<script>
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  $effect(() => {
    // eslint-disable-next-line svelte/no-navigation-without-resolve
    goto(`/bo/${$page.params.id}/outputs`, /** @type {any} */ ({ resolve: true }));
  });
</script>
