<template>
    <teleport to="body">
        <div
            v-if="open && agent"
            class="overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Agent Details"
            @click.self="$emit('close')"
        >
            <div class="modal" tabindex="-1" @keydown.esc="$emit('close')">
                <div class="topbar">
                    <div class="title">
                        <div class="name">{{ agent.name }}</div>
                        <div class="sub mono" v-if="agent.role">{{ agent.role }}</div>
                    </div>
                    <div class="topActions">
                        <span class="state-badge" :class="agent.state">{{ agent.state.toUpperCase() }}</span>
                        <button class="btn ghost" @click="$emit('close')">Close</button>
                    </div>
                </div>

                <div class="body">
                    <div class="section">
                        <div class="section-title">Endpoint</div>
                        <div class="endpoint-box">
                            <code class="endpoint-url">{{ agent.endpoint }}</code>
                            <button class="copy-btn" @click="copy(agent.endpoint)">{{ copyLabel }}</button>
                        </div>
                    </div>

                    <div class="section">
                        <div class="section-title">API Key</div>
                        <div class="endpoint-box">
                            <code class="endpoint-url secret">{{ showKey ? agent.apiKey : maskKey(agent.apiKey) }}</code>
                            <button class="copy-btn" @click="showKey = !showKey">{{ showKey ? 'Hide' : 'Reveal' }}</button>
                            <button class="copy-btn" @click="copy(agent.apiKey)">Copy</button>
                        </div>
                    </div>

                    <div class="section">
                        <div class="section-title">Quick Start</div>
                        <div class="code-block">
                            <pre class="mono"><code>curl -X POST {{ agent.endpoint }}/invoke \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Your message here",
    "stream": false
  }'</code></pre>
                            <button class="copy-btn code-copy" @click="copyCurl(agent.endpoint)">Copy</button>
                        </div>
                    </div>

                    <div class="section">
                        <div class="section-title">Python SDK</div>
                        <div class="code-block">
                            <pre class="mono"><code>from covenant import Agent

agent = Agent("{{ agent.id }}", api_key="YOUR_API_KEY")
response = agent.invoke("Your message here")
print(response.output)</code></pre>
                        </div>
                    </div>

                    <div class="info-grid">
                        <div class="info-item">
                            <div class="info-label">GPU</div>
                            <div class="info-value mono">{{ agent.gpu }}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Region</div>
                            <div class="info-value mono">{{ agent.region }}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Runtime</div>
                            <div class="info-value mono">{{ agent.runtime }}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Conduit Version</div>
                            <div class="info-value mono">{{ agent.conduitVersion }}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Price/hr</div>
                            <div class="info-value mono">${{ agent.pricePerHour?.toFixed(2) }}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Avg Latency</div>
                            <div class="info-value mono">{{ agent.avgLatencyMs }} ms</div>
                        </div>
                    </div>

                    <div class="section">
                        <div class="section-title">Access Control</div>
                        <p class="access-hint">Share the endpoint URL and API key with authorized users. Keep the API key secure — it grants full invoke access to this agent.</p>
                        <div class="access-tips">
                            <div class="tip">Rotate keys regularly from the Settings panel</div>
                            <div class="tip">Use environment variables for API keys in production</div>
                            <div class="tip">Monitor usage via the Logs tab on the agent card</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </teleport>
</template>

<script setup>
import { ref } from "vue";

defineProps({
    open: { type: Boolean, default: false },
    agent: { type: Object, default: null },
});

defineEmits(["close"]);

const showKey = ref(false);
const copyLabel = ref("Copy");

function maskKey(key) {
    if (!key) return "";
    return key.substring(0, 14) + "••••••••••••";
}

async function copy(text) {
    try {
        await navigator.clipboard.writeText(text);
        copyLabel.value = "Copied!";
        setTimeout(() => (copyLabel.value = "Copy"), 1500);
    } catch {
        copyLabel.value = "Failed";
        setTimeout(() => (copyLabel.value = "Copy"), 1500);
    }
}

function copyCurl(endpoint) {
    copy(`curl -X POST ${endpoint}/invoke -H "Authorization: Bearer YOUR_API_KEY" -H "Content-Type: application/json" -d '{"input": "Your message here", "stream": false}'`);
}
</script>

<style scoped>
.overlay {
    position: fixed;
    inset: 0;
    background: var(--overlay);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    display: grid;
    place-items: center;
    padding: 18px;
    z-index: 1000;
}

.modal {
    width: min(680px, 100%);
    max-height: 86vh;
    border: 1px solid var(--border);
    background: var(--card);
    border-radius: 18px;
    overflow: hidden;
    box-shadow: 0 18px 60px rgba(0, 0, 0, 0.55);
    display: flex;
    flex-direction: column;
    outline: none;
}

.topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 18px 22px;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
}

.title {
    display: grid;
    gap: 4px;
}
.name {
    font-size: 16px;
    font-weight: 600;
    letter-spacing: 0.2px;
}
.sub {
    font-size: 12px;
    color: var(--muted);
}

.topActions {
    display: flex;
    gap: 10px;
    align-items: center;
}

.state-badge {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.5px;
    padding: 4px 10px;
    border-radius: 999px;
    border: 1px solid var(--border);
}
.state-badge.running {
    color: #4ade80;
    border-color: #4ade8040;
}
.state-badge.halted {
    color: #f87171;
    border-color: #f8717140;
}

.btn {
    border-radius: 999px;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--fg);
    padding: 8px 16px;
    font-size: 13px;
    cursor: pointer;
    transition: border-color 0.15s ease;
}
.btn:hover {
    border-color: var(--fg);
}

.body {
    overflow-y: auto;
    padding: 22px;
    display: flex;
    flex-direction: column;
    gap: 22px;
}

.section {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.section-title {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: var(--muted);
    font-weight: 600;
}

.endpoint-box {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: rgba(0, 0, 0, 0.2);
}

.endpoint-url {
    flex: 1;
    font-size: 12px;
    color: var(--fg);
    word-break: break-all;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}
.endpoint-url.secret {
    color: var(--muted);
}

.copy-btn {
    flex-shrink: 0;
    padding: 4px 10px;
    border-radius: 6px;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--muted);
    font-size: 11px;
    cursor: pointer;
    transition: all 0.12s ease;
    white-space: nowrap;
}
.copy-btn:hover {
    color: var(--fg);
    border-color: var(--fg);
}

.code-block {
    position: relative;
    padding: 14px 16px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: rgba(0, 0, 0, 0.3);
    overflow-x: auto;
}
.code-block pre {
    margin: 0;
    font-size: 11.5px;
    line-height: 1.6;
    color: var(--fg);
    white-space: pre;
}
.code-copy {
    position: absolute;
    top: 8px;
    right: 8px;
}

.info-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
}

.info-item {
    padding: 12px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: var(--chip);
}

.info-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: var(--muted);
    font-weight: 600;
    margin-bottom: 6px;
}

.info-value {
    font-size: 12px;
    font-weight: 600;
    color: var(--fg);
}

.access-hint {
    font-size: 12px;
    color: var(--muted);
    line-height: 1.6;
    margin: 0;
}

.access-tips {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.tip {
    font-size: 11px;
    color: var(--muted);
    padding-left: 14px;
    position: relative;
}
.tip::before {
    content: "\2022";
    position: absolute;
    left: 0;
    color: var(--muted);
}

.mono {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

@media (max-width: 600px) {
    .info-grid {
        grid-template-columns: repeat(2, 1fr);
    }
    .modal {
        width: 100%;
        height: 100%;
        border-radius: 0;
        max-height: 100vh;
    }
    .overlay {
        padding: 0;
    }
    .body {
        padding: 16px;
    }
    .topbar {
        padding: 14px 16px;
    }
    .code-block {
        overflow-x: auto;
    }
    .code-block pre {
        white-space: pre;
    }
}

@media (max-width: 400px) {
    .info-grid {
        grid-template-columns: 1fr;
    }
}
</style>
