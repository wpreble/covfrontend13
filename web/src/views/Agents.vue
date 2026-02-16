<template>
    <div class="wrap">
        <div class="pagehead">
            <div>
                <h2>Agents</h2>
                <p>Sovereign AI agents deployed on dedicated compute.</p>
            </div>

            <div class="pillbar">
                <span class="pill"
                    >Total: <strong>{{ agents.length }}</strong></span
                >
                <span class="pill"
                    >Running: <strong>{{ runningCount }}</strong></span
                >
                <span class="pill"
                    >Halted: <strong>{{ haltedCount }}</strong></span
                >
            </div>
        </div>

        <section class="grid" aria-label="Agent cards">
            <article class="card" v-for="a in agents" :key="a.id" @click="openDetail(a)">
                <div class="cardtop">
                    <div class="titleblock">
                        <h3 class="agentname">{{ a.name }}</h3>
                        <div class="agent-role" v-if="a.role">{{ a.role }}</div>

                        <div class="subline">
                            <span
                                >GPU:
                                <span class="mono">{{ a.gpu }}</span></span
                            >
                            <span>&middot;</span>
                            <span>
                                Price/hr:
                                <span class="mono">{{
                                    fmtUSD(a.pricePerHour)
                                }}</span>
                            </span>
                        </div>

                        <div class="pillbar" style="margin-top: 2px">
                            <span class="pill">
                                State:
                                <strong>{{ a.state.toUpperCase() }}</strong>
                            </span>
                            <span class="pill">
                                Conduit: <strong class="mono">{{ a.conduitVersion }}</strong>
                            </span>
                        </div>
                    </div>

                    <div class="tiny right">
                        <div class="mono">{{ a.region }}</div>
                        <div>{{ a.runtime }}</div>
                    </div>
                </div>

                <div class="sep"></div>

                <div class="meta">
                    <div class="kv">
                        <div class="k">Requests completed</div>
                        <div class="v mono">
                            {{ fmtInt(a.requestsCompleted) }}
                        </div>
                    </div>
                    <div class="kv">
                        <div class="k">Tokens processed</div>
                        <div class="v mono">
                            {{ fmtInt(a.tokensProcessed) }}
                        </div>
                    </div>
                    <div class="kv">
                        <div class="k">Avg latency / request</div>
                        <div class="v mono">{{ fmtMs(a.avgLatencyMs) }}</div>
                    </div>
                </div>

                <div class="actions" @click.stop>
                    <div class="leftActions">
                        <button class="ghost" @click="logs(a)" title="logs">
                            Logs
                        </button>
                    </div>

                    <div class="rightActions">
                        <button
                            v-if="a.state !== 'halted'"
                            class="warn"
                            @click="halt(a)"
                            title="halt"
                        >
                            Halt
                        </button>
                        <template v-else>
                            <button
                                class="activate"
                                @click="activate(a)"
                                title="activate"
                            >
                                Activate
                            </button>
                            <button
                                class="danger"
                                @click="destroy(a)"
                                title="destroy"
                            >
                                Destroy
                            </button>
                        </template>

                        <button class="ghost" @click="edit(a)" title="edit">
                            Edit
                        </button>
                    </div>
                </div>
            </article>

            <div v-if="agents.length === 0" class="card empty-card">
                <h3 class="agentname" style="margin: 0 0 8px">No agents</h3>
                <p class="tiny" style="margin: 0">
                    Deploy your first agent to get started.
                </p>
            </div>
        </section>

        <button class="fab" @click="showCreate = true" title="Create Agent">
            <span class="fab-icon">+</span>
        </button>
    </div>

    <AgentCreate
        :open="showCreate"
        @close="showCreate = false"
        @deployed="onDeployed"
    />

    <AgentEditModal
        :open="!!editingId"
        :agent-id="editingId"
        @close="editingId = null"
        @redeploy="(payload) => console.log('redeploy', payload)"
        @test="(payload) => console.log('test', payload)"
    />

    <AgentDetail
        :open="!!detailAgent"
        :agent="detailAgent"
        @close="detailAgent = null"
    />
</template>

<script setup>
import { computed, ref } from "vue";
import AgentEditModal from "@/components/AgentEditModal.vue";
import AgentCreate from "@/components/AgentCreate.vue";
import AgentDetail from "@/components/AgentDetail.vue";

const showCreate = ref(false);
const detailAgent = ref(null);

const agents = ref([
    {
        id: "ag_001",
        name: "Covenant Claw CMO",
        role: "Marketing Manager",
        gpu: "NVIDIA H100 SXM 80GB",
        pricePerHour: 3.50,
        requestsCompleted: 24891,
        tokensProcessed: 198344121,
        avgLatencyMs: 142,
        state: "running",
        region: "us-west-2",
        runtime: "dedicated",
        conduitVersion: "1.2.0",
        template: "covenant-claw",
        endpoint: "https://api.covenant.cloud/v1/agents/ag_001",
        apiKey: "cvnt_live_sk_a1b2c3d4e5f6...",
    },
    {
        id: "ag_002",
        name: "Growth Hacker",
        role: "SEO & Content Automation",
        gpu: "NVIDIA A100 80GB",
        pricePerHour: 2.90,
        requestsCompleted: 12438,
        tokensProcessed: 98344121,
        avgLatencyMs: 182,
        state: "running",
        region: "us-east-1",
        runtime: "dedicated",
        conduitVersion: "1.0.3",
        template: "growth-hacker",
        endpoint: "https://api.covenant.cloud/v1/agents/ag_002",
        apiKey: "cvnt_live_sk_g7h8i9j0k1l2...",
    },
    {
        id: "ag_003",
        name: "Sentinel",
        role: "System Monitor & Logging",
        gpu: "NVIDIA L4",
        pricePerHour: 0.48,
        requestsCompleted: 89031,
        tokensProcessed: 62190455,
        avgLatencyMs: 67,
        state: "running",
        region: "us-west-2",
        runtime: "dedicated",
        conduitVersion: "0.9.1",
        template: "growth-stack",
        endpoint: "https://api.covenant.cloud/v1/agents/ag_003",
        apiKey: "cvnt_live_sk_m3n4o5p6q7r8...",
    },
    {
        id: "ag_004",
        name: "Micro Chat",
        role: "Lightweight Conversational Agent",
        gpu: "NVIDIA A10G",
        pricePerHour: 0.62,
        requestsCompleted: 31220,
        tokensProcessed: 45890332,
        avgLatencyMs: 98,
        state: "running",
        region: "eu-central-1",
        runtime: "dedicated",
        conduitVersion: "1.1.0",
        template: "micro-chat",
        endpoint: "https://api.covenant.cloud/v1/agents/ag_004",
        apiKey: "cvnt_live_sk_s9t0u1v2w3x4...",
    },
    {
        id: "ag_005",
        name: "CTO Mode",
        role: "DevOps & Infrastructure Agent",
        gpu: "NVIDIA L4",
        pricePerHour: 0.48,
        requestsCompleted: 5417,
        tokensProcessed: 15890332,
        avgLatencyMs: 211,
        state: "halted",
        region: "us-east-1",
        runtime: "dedicated",
        conduitVersion: "0.8.2",
        template: "ops-automator",
        endpoint: "https://api.covenant.cloud/v1/agents/ag_005",
        apiKey: "cvnt_live_sk_y5z6a7b8c9d0...",
    },
]);

const editingId = ref(null);

const runningCount = computed(
    () => agents.value.filter((a) => a.state === "running").length,
);
const haltedCount = computed(
    () => agents.value.filter((a) => a.state === "halted").length,
);

function fmtUSD(n) {
    return `$${Number(n).toFixed(2)}`;
}
function fmtInt(n) {
    return Number(n).toLocaleString("en-US");
}
function fmtMs(ms) {
    return `${Math.round(Number(ms))} ms`;
}

function halt(agent) {
    agent.state = "halted";
}

function activate(agent) {
    agent.state = "running";
}

function destroy(agent) {
    agents.value = agents.value.filter((a) => a.id !== agent.id);
}

function edit(agent) {
    editingId.value = agent.id;
}

function logs(agent) {
    console.log("logs", agent.id);
}

function openDetail(agent) {
    detailAgent.value = agent;
}

function onDeployed(newAgent) {
    agents.value.unshift(newAgent);
    showCreate.value = false;
}
</script>

<style scoped>
.wrap {
    max-width: 980px;
    margin: 0 auto;
    padding: 28px 18px 100px;
}

.pagehead {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 12px;
    margin-top: 18px;
}
.pagehead h2 {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.35px;
    text-transform: uppercase;
}
.pagehead p {
    margin: 6px 0 0;
    font-size: 12px;
    color: var(--muted);
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

.mono {
    font-family:
        ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
        "Liberation Mono", "Courier New", monospace;
}

.sep {
    height: 1px;
    background: var(--border);
    margin: 14px 0;
}

.grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;
    margin-top: 14px;
}
@media (max-width: 880px) {
    .grid {
        grid-template-columns: 1fr;
    }
}

.card {
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 18px;
    background: var(--card);
    cursor: pointer;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.card:hover {
    border-color: color-mix(in oklab, var(--fg) 40%, var(--border));
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}
.empty-card {
    cursor: default;
}
.empty-card:hover {
    border-color: var(--border);
    box-shadow: none;
}

.cardtop {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
}

.titleblock {
    display: grid;
    gap: 4px;
}
.agentname {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    letter-spacing: 0.2px;
}
.agent-role {
    font-size: 12px;
    color: var(--muted);
    margin-top: -2px;
}
.subline {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    font-size: 12px;
    color: var(--muted);
}

.meta {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-top: 14px;
}
@media (max-width: 520px) {
    .meta {
        grid-template-columns: 1fr;
    }
}

.kv {
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 12px;
    background: var(--chip);
    min-height: 68px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 8px;
}
.kv .k {
    font-size: 12px;
    color: var(--muted);
}
.kv .v {
    font-size: 14px;
    font-weight: 600;
    color: var(--fg);
    letter-spacing: 0.2px;
}

.actions {
    display: flex;
    gap: 10px;
    justify-content: space-between;
    margin-top: 14px;
    align-items: center;
}
.leftActions,
.rightActions {
    display: flex;
    gap: 10px;
    align-items: center;
}

button {
    border-radius: 999px;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--fg);
    padding: 10px 14px;
    font-size: 13px;
    cursor: pointer;
    letter-spacing: 0.2px;
    transition:
        background 0.15s ease,
        color 0.15s ease,
        border 0.15s ease,
        opacity 0.15s ease;
    white-space: nowrap;
}
button:hover {
    border-color: var(--fg);
}
button:disabled {
    opacity: 0.35;
    cursor: not-allowed;
}

button.warn {
    border-color: color-mix(in oklab, var(--warn) 80%, var(--border));
    color: var(--warn);
}
button.warn:hover {
    border-color: var(--warn);
}
button.danger {
    border-color: color-mix(in oklab, var(--danger) 80%, var(--border));
    color: var(--danger);
}
button.danger:hover {
    border-color: var(--danger);
}
button.activate {
    border-color: color-mix(in oklab, #4ade80 80%, var(--border));
    color: #4ade80;
}
button.activate:hover {
    border-color: #4ade80;
}

button.ghost {
    border-color: var(--border);
    color: var(--fg);
}
button.ghost:hover {
    border-color: var(--fg);
}

.tiny {
    font-size: 12px;
    color: var(--muted);
}
.right {
    text-align: right;
}

/* FAB */
.fab {
    position: fixed;
    bottom: 28px;
    right: 28px;
    width: 56px;
    height: 56px;
    border-radius: 16px;
    border: 1px solid var(--border);
    background: var(--fg);
    color: var(--bg);
    font-size: 28px;
    font-weight: 300;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
    transition: transform 0.15s ease, box-shadow 0.15s ease;
    z-index: 50;
    padding: 0;
}
.fab:hover {
    transform: scale(1.08);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
    border-color: var(--fg);
}
.fab-icon {
    line-height: 1;
    margin-top: -2px;
}

@media (max-width: 480px) {
    .pagehead {
        flex-direction: column;
        align-items: flex-start;
    }
    .rightActions {
        flex-wrap: wrap;
    }
    button {
        padding: 8px 12px;
        font-size: 12px;
    }
    .fab {
        bottom: 20px;
        right: 20px;
    }
}
</style>
