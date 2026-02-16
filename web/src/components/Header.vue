<template>
    <header>
        <div class="brand">
            <img src="/Covenant Logo White.png" alt="Covenant" class="logo" />
            <div>
                <h1>Covenant Secure Cloud</h1>
                <p>Sovereign AI</p>
            </div>
        </div>

        <nav class="tabs" aria-label="Primary">
            <RouterLink to="/agents" class="tab" active-class="active"
                >Agents</RouterLink
            >
            <RouterLink to="/compute" class="tab" active-class="active"
                >Compute</RouterLink
            >
            <RouterLink to="/covenantclaw" class="tab" active-class="active"
                >CovenantClaw</RouterLink
            >
        </nav>

        <div class="header-actions">
            <div class="settings-wrapper" ref="settingsRef">
                <button
                    class="settings-btn"
                    :class="{ open: settingsOpen }"
                    @click="settingsOpen = !settingsOpen"
                    aria-label="Settings"
                >
                    <svg viewBox="0 0 20 20" fill="none" class="gear-icon">
                        <path d="M8.325 2.317a.75.75 0 0 1 .67-.417h2.01a.75.75 0 0 1 .67.417l.585 1.17a6.7 6.7 0 0 1 1.542.89l1.254-.313a.75.75 0 0 1 .738.24l1.005 1.74a.75.75 0 0 1-.068.757l-.67.858a6.7 6.7 0 0 1 0 1.782l.67.858a.75.75 0 0 1 .068.757l-1.005 1.74a.75.75 0 0 1-.738.24l-1.254-.312a6.7 6.7 0 0 1-1.542.89l-.586 1.169a.75.75 0 0 1-.67.417H8.996a.75.75 0 0 1-.67-.417l-.586-1.17a6.7 6.7 0 0 1-1.542-.89l-1.254.313a.75.75 0 0 1-.738-.24l-1.005-1.74a.75.75 0 0 1 .068-.757l.67-.858a6.7 6.7 0 0 1 0-1.782l-.67-.858a.75.75 0 0 1-.068-.756l1.005-1.74a.75.75 0 0 1 .738-.241l1.254.312a6.7 6.7 0 0 1 1.542-.89l.586-1.169Z" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
                        <circle cx="10" cy="10" r="2.5" stroke="currentColor" stroke-width="1.3"/>
                    </svg>
                </button>

                <Transition name="dropdown">
                    <div v-if="settingsOpen" class="settings-dropdown">
                        <RouterLink
                            to="/payments"
                            class="dropdown-item"
                            @click="settingsOpen = false"
                        >
                            <svg viewBox="0 0 20 20" fill="none" class="dropdown-icon">
                                <rect x="2" y="4" width="16" height="12" rx="2" stroke="currentColor" stroke-width="1.3"/>
                                <path d="M2 8h16" stroke="currentColor" stroke-width="1.3"/>
                                <path d="M5 12h3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
                            </svg>
                            <span>Payments</span>
                        </RouterLink>

                        <div class="dropdown-divider"></div>

                        <button class="dropdown-item" @click="toggleTheme">
                            <svg v-if="theme === 'dark'" viewBox="0 0 20 20" fill="none" class="dropdown-icon">
                                <circle cx="10" cy="10" r="4" stroke="currentColor" stroke-width="1.3"/>
                                <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.93 4.93l1.41 1.41M13.66 13.66l1.41 1.41M4.93 15.07l1.41-1.41M13.66 6.34l1.41-1.41" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
                            </svg>
                            <svg v-else viewBox="0 0 20 20" fill="none" class="dropdown-icon">
                                <path d="M17.293 13.293A8 8 0 0 1 6.707 2.707a8.003 8.003 0 1 0 10.586 10.586Z" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            <span>{{ theme === 'dark' ? 'Light Mode' : 'Dark Mode' }}</span>
                            <span class="theme-badge">{{ theme === 'dark' ? 'Dark' : 'Light' }}</span>
                        </button>

                        <div class="dropdown-divider"></div>

                        <div class="dropdown-about">
                            <span class="about-label">About</span>
                            <div class="about-row">
                                <span class="about-key">Conduit</span>
                                <span class="about-val mono">0.0.3</span>
                            </div>
                            <div class="about-row">
                                <span class="about-key">Network</span>
                                <span class="about-val mono">mainnet</span>
                            </div>
                        </div>
                    </div>
                </Transition>
            </div>
        </div>
    </header>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { RouterLink } from "vue-router";

const settingsOpen = ref(false);
const settingsRef = ref(null);

const theme = ref(localStorage.getItem("theme") || "dark");

function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem("theme", t);
}

function toggleTheme() {
    theme.value = theme.value === "dark" ? "light" : "dark";
    applyTheme(theme.value);
}

function handleClickOutside(e) {
    if (settingsRef.value && !settingsRef.value.contains(e.target)) {
        settingsOpen.value = false;
    }
}

onMounted(() => {
    applyTheme(theme.value);
    document.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
    document.removeEventListener("click", handleClickOutside);
});
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
    align-items: center;
    gap: 10px;
}
.logo {
    height: 32px;
    width: auto;
    object-fit: contain;
    transition: filter 0.25s ease;
}

:global([data-theme="light"]) .logo {
    filter: invert(1);
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
    padding: 6px 10px;
    border-radius: 999px;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--muted);
    text-decoration: none;
    font-size: 11px;
    letter-spacing: 0.2px;
    white-space: nowrap;
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
    color: var(--active-tab-text);
    background: var(--fg);
    border-color: var(--fg);
}

/* ── Header Actions (right side) ── */
.header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

.settings-wrapper {
    position: relative;
}

.settings-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--muted);
    cursor: pointer;
    transition: all 0.15s ease;
}
.settings-btn:hover,
.settings-btn.open {
    color: var(--fg);
    border-color: var(--fg);
    background: var(--chip);
}

.gear-icon {
    width: 18px;
    height: 18px;
    transition: transform 0.3s ease;
}
.settings-btn.open .gear-icon {
    transform: rotate(60deg);
}

/* ── Dropdown ── */
.settings-dropdown {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    min-width: 220px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 6px;
    z-index: 1000;
    box-shadow: 0 12px 40px var(--shadow-dropdown);
}

.dropdown-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 10px;
    border: none;
    background: transparent;
    color: var(--fg);
    font-size: 13px;
    cursor: pointer;
    text-decoration: none;
    width: 100%;
    transition: background 0.12s ease;
}
.dropdown-item:hover {
    background: var(--chip);
}

.dropdown-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    color: var(--muted);
}

.theme-badge {
    margin-left: auto;
    font-size: 10px;
    padding: 2px 8px;
    border-radius: 999px;
    border: 1px solid var(--border);
    color: var(--muted);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.dropdown-divider {
    height: 1px;
    background: var(--border);
    margin: 4px 8px;
}

.dropdown-about {
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.about-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: var(--muted);
    font-weight: 600;
    margin-bottom: 2px;
}

.about-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.about-key {
    font-size: 12px;
    color: var(--muted);
}

.about-val {
    font-size: 12px;
    color: var(--fg);
    font-weight: 600;
}

.mono {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

/* ── Dropdown transitions ── */
.dropdown-enter-active {
    transition: all 0.15s ease-out;
}
.dropdown-leave-active {
    transition: all 0.1s ease-in;
}
.dropdown-enter-from {
    opacity: 0;
    transform: translateY(-6px) scale(0.97);
}
.dropdown-leave-to {
    opacity: 0;
    transform: translateY(-4px) scale(0.98);
}

@media (max-width: 700px) {
    .brand h1 {
        font-size: 13px;
    }
    .brand p {
        display: none;
    }
}
</style>
