<script>
  import { goto } from '$app/navigation';
  import { auth } from '$lib/stores/auth';
  import { loginToInvenTree } from '$lib/api/auth';

  let serverUrl = '';
  let username = '';
  let password = '';
  let loading = false;
  let error = '';

  async function handleLogin() {
    loading = true;
    error = '';

    console.log('login attempt', { serverUrl, username });

    try {
      const session = await loginToInvenTree({
        serverUrl,
        username,
        password
      });

      console.log('login session', session);

      auth.setAuth(session);

      console.log('saved auth', session);
      await goto('/');
    } catch (/** @type {any} */ err) {
      console.error('login failed', err);
      error = err?.message || 'Login failed';
    } finally {
      loading = false;
    }
  }
</script>

<div class="page">
  <h1>Technician Build App</h1>

  <form on:submit|preventDefault={handleLogin} class="login-form">
    <label>
      Server URL
      <input bind:value={serverUrl} placeholder="https://inventree.example.com" />
    </label>

    <label>
      Username
      <input bind:value={username} />
    </label>

    <label>
      Password
      <input bind:value={password} type="password" />
    </label>

    <button type="submit" disabled={loading}>
      {#if loading}Signing in...{:else}Sign in{/if}
    </button>

    {#if error}
      <p class="error">{error}</p>
    {/if}
  </form>
</div>

<style>
  .page {
    padding: 1rem;
    max-width: 28rem;
    margin: 0 auto;
  }

  .login-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  input {
    width: 100%;
    padding: 0.75rem;
    box-sizing: border-box;
  }

  button {
    padding: 0.9rem;
  }

  .error {
    color: red;
  }
</style>
