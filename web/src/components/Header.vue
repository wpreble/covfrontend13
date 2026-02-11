<template>
    <header>
        <div class="brand">
            <h1>Covenant Network</h1>
            <p>Sovereign + Secure</p>
        </div>

        <nav class="tabs" aria-label="Primary">
            <RouterLink to="/agents" class="tab" active-class="active"
                >Agents</RouterLink
            >

            <RouterLink to="/command" class="tab" active-class="active"
                >Command</RouterLink
            >
            <RouterLink to="/payments" class="tab" active-class="active"
                >Payments</RouterLink
            >
        </nav>

        <div class="pillbar">
            <span class="pill"
                >Conduit: <strong class="mono">0.0.1</strong></span
            >
        </div>
    </header>
</template>

<script>
import { RouterLink } from "vue-router";
</script>

<style scoped>
header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    padding: 14px;
    border-bottom: 1px solid var(--border);
}

.brand {
    display: flex;
    flex-direction: column;
    gap: 4px;
}
.brand h1 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    letter-spacing: 0.4px;
}
.brand p {
    margin: 0;
    font-size: 12px;
    color: var(--muted);
}

.tabs {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    flex: 1;
}
.tab {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 8px 12px;
    border-radius: 999px;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--muted);
    text-decoration: none;
    font-size: 12px;
    letter-spacing: 0.25px;
    transition:
        border 0.15s ease,
        color 0.15s ease,
        background 0.15s ease;
}
.tab:hover {
    color: var(--fg);
    border-color: var(--fg);
}
.tab.active {
    color: #000;
    background: var(--fg);
    border-color: var(--fg);
}

.pillbar {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}
.pill {
    font-size: 12px;
    padding: 6px 10px;
    border-radius: 999px;
    border: 1px solid var(--border);
    background: var(--chip);
    color: var(--fg);
}
.pill strong {
    font-weight: 600;
}
</style>
