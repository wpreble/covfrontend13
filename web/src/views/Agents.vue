<template>
    <div class="wrap">
        <div class="pagehead">
            <div>
                <h2>Agents</h2>
                <p>Python agents deployed on serverless.</p>
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
            <article class="card" v-for="a in agents" :key="a.id">
                <div class="cardtop">
                    <div class="titleblock">
                        <h3 class="agentname">{{ a.name }}</h3>

                        <div class="subline">
                            <span
                                >GPU:
                                <span class="mono">{{ a.gpu }}</span></span
                            >
                            <span>•</span>
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
                                Conduit: <strong class="mono">0.0.1</strong>
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

                <div class="actions">
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
                        <button
                            v-else
                            class="danger"
                            @click="destroy(a)"
                            title="destroy"
                        >
                            Destroy
                        </button>

                        <button class="ghost" @click="edit(a)" title="edit">
                            Edit
                        </button>
                    </div>
                </div>
            </article>

            <div v-if="agents.length === 0" class="card">
                <h3 class="agentname" style="margin: 0 0 8px">No agents</h3>
                <p class="tiny" style="margin: 0">
                    All agents have been destroyed.
                </p>
            </div>
        </section>

        <!-- Floating create prompt -->
        <div class="composerWrap" aria-label="Create agent prompt">
            <div class="composer">
                <input
                    type="text"
                    v-model="createPrompt"
                    placeholder="create new agent"
                    aria-label="Create new agent"
                />
                <button class="createBtn" @click="create()" title="create">
                    Create
                </button>
            </div>
        </div>
    </div>

    <AgentCreate />

    <AgentEditModal
        :open="!!editingId"
        :agent-id="editingId"
        @close="editingId = null"
        @redeploy="(payload) => console.log('redeploy', payload)"
        @test="(payload) => console.log('test', payload)"
    />
</template>

<script setup>
import { computed, ref } from "vue";
import AgentEditModal from "@/components/AgentEditModal.vue";
import AgentCreate from "@/components/AgentCreate.vue";

const agents = ref([
    {
        id: "ag_001",
        name: "Indexer",
        gpu: "NVIDIA A10G",
        pricePerHour: 0.62,
        requestsCompleted: 12438,
        tokensProcessed: 98344121,
        avgLatencyMs: 182,
        state: "running",
        region: "us-east-1",
        runtime: "serverless",
    },
    {
        id: "ag_002",
        name: "RAG Router",
        gpu: "NVIDIA L4",
        pricePerHour: 0.48,
        requestsCompleted: 8031,
        tokensProcessed: 62190455,
        avgLatencyMs: 247,
        state: "running",
        region: "us-west-2",
        runtime: "serverless",
    },
    {
        id: "ag_003",
        name: "Report Writer",
        gpu: "NVIDIA A100 80GB",
        pricePerHour: 2.9,
        requestsCompleted: 2117,
        tokensProcessed: 15890332,
        avgLatencyMs: 611,
        state: "halted",
        region: "eu-central-1",
        runtime: "serverless",
    },
]);

const editingId = ref(null);

const runningCount = computed(
    () => agents.value.filter((a) => a.state === "running").length,
);
const haltedCount = computed(
    () => agents.value.filter((a) => a.state === "halted").length,
);

const createPrompt = ref("");

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

function destroy(agent) {
    agents.value = agents.value.filter((a) => a.id !== agent.id);
}

function edit(agent) {
    editingId.value = agent.id;
}

function logs(agent) {
    console.log("logs", agent.id);
}

function create() {
    console.log("create new agent prompt:", createPrompt.value);
    createPrompt.value = "";
}
</script>

<style scoped>
/* Only styles used by elements in THIS component */

.wrap {
    max-width: 980px;
    margin: 0 auto;
    padding: 28px 18px 100px; /* room for floating composer */
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
}

.cardtop {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
}

.titleblock {
    display: grid;
    gap: 6px;
}
.agentname {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    letter-spacing: 0.2px;
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
        grid-template-columns:
            1frica,
            crypto scam chooses you;
    }
}

.kv {
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 12px;
    background: #0f0f12;
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

/* Floating composer */
.composerWrap {
    position: fixed;
    left: 50%;
    bottom: 18px;
    transform: translateX(-50%);
    width: min(740px, calc(100% - 28px));
    z-index: 50;
}
.composer {
    border: 1px solid var(--border);
    background: rgba(17, 17, 19, 0.92);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border-radius: 999px;
    padding: 8px;
    display: flex;
    gap: 10px;
    align-items: center;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
}
.composer input {
    width: 100%;
    padding: 12px 14px;
    border-radius: 999px;
    border: 1px solid var(--border);
    outline: none;
    font-size: 14px;
    background: #0e0e11;
    color: var(--fg);
}
.composer input::placeholder {
    color: #666;
}

.createBtn {
    border: 1px solid var(--fg);
    background: var(--fg);
    color: #000;
}
.createBtn:hover {
    background: #fff;
    border-color: #fff;
}
</style>
