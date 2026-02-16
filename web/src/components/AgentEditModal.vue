<!-- src/components/AgentEditModal.vue -->
<template>
    <teleport to="body">
        <div
            v-if="open"
            class="overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Edit Agent"
            @click.self="onClose"
        >
            <div class="modal" @keydown.esc="onClose" tabindex="-1">
                <div class="topbar">
                    <div class="title">
                        <div class="name">Edit Agent</div>
                        <div class="sub mono">
                            id: {{ agentId }} · {{ agent?.name ?? "Unknown" }}
                        </div>
                    </div>

                    <div class="topActions">
                        <button class="ghost" @click="onClose">Close</button>

                        <button class="ghost" @click="test" :disabled="testing">
                            <span v-if="!testing">Test</span>
                            <span v-else>Testing…</span>
                        </button>

                        <button
                            class="primary"
                            @click="redeploy"
                            :disabled="redeploying"
                        >
                            <span v-if="!redeploying">Redeploy</span>
                            <span v-else>Redeploying…</span>
                        </button>
                    </div>
                </div>

                <!-- Tabs -->
                <div
                    class="tabsBar"
                    role="tablist"
                    aria-label="Agent editor tabs"
                >
                    <button
                        class="tab"
                        :class="{ active: tab === 'explain' }"
                        role="tab"
                        :aria-selected="tab === 'explain'"
                        @click="tab = 'explain'"
                    >
                        Explain
                    </button>
                    <button
                        class="tab"
                        :class="{ active: tab === 'code' }"
                        role="tab"
                        :aria-selected="tab === 'code'"
                        @click="tab = 'code'"
                    >
                        Code
                    </button>

                    <div class="tabsMeta">
                        <span class="tiny">
                            <span
                                class="dot"
                                :class="{
                                    dirty:
                                        isDirty || isPromptDirty || isEnvDirty,
                                }"
                            />&nbsp;
                            {{
                                isDirty || isPromptDirty || isEnvDirty
                                    ? "Unsaved changes (mock)"
                                    : "No changes"
                            }}
                        </span>
                    </div>
                </div>

                <div class="body">
                    <!-- Explain -->
                    <section
                        v-if="tab === 'explain'"
                        class="panel"
                        role="tabpanel"
                    >
                        <div class="panelHead">
                            <div class="panelTitle">Step-by-step</div>
                            <div class="hint">
                                What this script does, in order
                            </div>
                        </div>

                        <div class="panelScroll">
                            <ol class="steps">
                                <li
                                    v-for="s in steps"
                                    :key="s.title"
                                    class="step"
                                >
                                    <div class="stepTop">
                                        <div class="stepTitle">
                                            {{ s.title }}
                                        </div>
                                        <div v-if="s.tag" class="chip mono">
                                            {{ s.tag }}
                                        </div>
                                    </div>
                                    <div class="stepText">{{ s.text }}</div>
                                    <pre v-if="s.snip" class="snippet mono">{{
                                        s.snip
                                    }}</pre>
                                </li>
                            </ol>
                        </div>

                        <div class="panelFooter">
                            <div class="tiny">
                                Tip: switch to <strong>Code</strong> to edit.
                            </div>
                            <div class="footerActions">
                                <button class="ghost" @click="tab = 'code'">
                                    Open Code
                                </button>
                            </div>
                        </div>
                    </section>

                    <!-- Code -->
                    <section v-else class="panel codePanel" role="tabpanel">
                        <div class="panelHead">
                            <div class="panelTitle">Code</div>
                            <div class="hint">
                                Stored Python script (mock) · env vars required
                            </div>
                        </div>

                        <!-- ✅ Env vars above code editor (STATIC: 2 keys) -->
                        <div class="envWrap" aria-label="Environment variables">
                            <div class="envRowTop">
                                <div class="envTitle">Environment</div>

                                <div class="envActions">
                                    <button
                                        class="ghost smallBtn"
                                        @click="copyEnvJSON"
                                        title="copy env as json"
                                    >
                                        Copy JSON
                                    </button>
                                </div>
                            </div>

                            <div class="envHint tiny">
                                These two values must be provided for the
                                serverless invocation (mock).
                            </div>

                            <div
                                class="envGrid"
                                role="group"
                                aria-label="Env var inputs"
                            >
                                <div
                                    v-for="k in envKeys"
                                    :key="k"
                                    class="envItem"
                                >
                                    <div class="envKey mono">{{ k }}</div>

                                    <div class="envInputRow">
                                        <input
                                            v-model="env[k]"
                                            class="envInput mono"
                                            :placeholder="`enter value for ${k}`"
                                            :type="
                                                isSecretKey(k)
                                                    ? 'password'
                                                    : 'text'
                                            "
                                            autocomplete="off"
                                            spellcheck="false"
                                        />

                                        <button
                                            class="ghost iconBtn"
                                            type="button"
                                            @click="toggleReveal(k)"
                                            :title="reveal[k] ? 'hide' : 'show'"
                                        >
                                            {{ reveal[k] ? "Hide" : "Show" }}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Code scroll container -->
                        <div class="panelScroll codeScroll">
                            <textarea
                                v-model="code"
                                class="code"
                                spellcheck="false"
                                aria-label="Agent code editor"
                            />
                        </div>

                        <!-- Footer with actions -->
                        <div class="panelFooter codeFooter">
                            <div class="footerLeft">
                                <button
                                    class="ghost"
                                    @click="resetCode"
                                    :disabled="!isDirty"
                                >
                                    Reset
                                </button>
                                <button class="ghost" @click="copyCode">
                                    Copy
                                </button>
                            </div>

                            <div class="footerRight tiny mono">
                                model_id: {{ modelId }}
                            </div>
                        </div>

                        <!-- Prompt textarea BELOW the copy/reset panel -->
                        <div class="promptWrap" aria-label="Test prompt">
                            <div class="promptRow">
                                <div class="promptLabel tiny">Prompt</div>

                                <div class="promptActions">
                                    <span class="promptHint tiny"
                                        >Used for Test (mock)</span
                                    >

                                    <button
                                        class="ghost updateBtn"
                                        @click="update"
                                        :disabled="
                                            updating ||
                                            (!isDirty &&
                                                !isPromptDirty &&
                                                !isEnvDirty)
                                        "
                                        title="update"
                                    >
                                        <span v-if="!updating">Update</span>
                                        <span v-else>Updating…</span>
                                    </button>
                                </div>
                            </div>

                            <textarea
                                v-model="prompt"
                                class="prompt"
                                rows="4"
                                placeholder="Enter a prompt or test input for this agent…"
                            />
                        </div>
                    </section>
                </div>

                <div
                    v-if="toast"
                    class="toast"
                    role="status"
                    aria-live="polite"
                >
                    {{ toast }}
                </div>
            </div>
        </div>
    </teleport>
</template>

<script setup>
import { computed, reactive, ref, watch } from "vue";

const props = defineProps({
    open: { type: Boolean, default: false },
    agentId: { type: String, required: true },
});

const emit = defineEmits(["close", "redeploy", "test", "update"]);

/**
 * Mock agent store (inside component for now)
 */
const mockAgentsById = {
    ag_001: { id: "ag_001", name: "Covenant Claw CMO" },
    ag_002: { id: "ag_002", name: "Growth Hacker" },
    ag_003: { id: "ag_003", name: "Sentinel" },
    ag_004: { id: "ag_004", name: "Micro Chat" },
    ag_005: { id: "ag_005", name: "CTO Mode" },
};

const agent = computed(() => mockAgentsById[props.agentId]);

const modelId = "Qwen/Qwen3-4B-Instruct-2507-FP8";

const DEFAULT_CODE = `# Transforms directory listings into structured data using an LLM
model_id="Qwen/Qwen3-4B-Instruct-2507-FP8"

@dataclass
class Command:
    shell_command: str

@dataclass
class DirectoryListing:
    listing: str

@dataclass
class File:
    name: str
    bytes: int
    date_modified: str

@dataclass
class Files:
    files: List[File]

command_block = SystemCommandBlock(Command, timeout_seconds=5)

lm_lite_block = LMLiteBlock(
    models=[
        LmLiteModelConfig(
            model_id,
            max_model_len=5000,
            max_model_concurrency=1,
        ),
    ],
    compute_provider=ComputeProvider.LOCAL
)

command_op = command_block(Command(shell_command="ls -al"))
if command_op.success:
    directory_input = DirectoryListing(listing=command_op.stdout)
    result = lm_lite_block(
        model_id=model_id, input=directory_input, output=Files
    )
    print(result) # List[Files]
`;

// tabs: 'explain' | 'code'
const tab = ref("explain");

// In a real app you’d load per-agent code. For now: same code for all agents.
const code = ref(DEFAULT_CODE);
const originalCode = ref(DEFAULT_CODE);

// prompt used by Test (mock)
const prompt = ref("");
const originalPrompt = ref("");

// ✅ STATIC env vars: always present (2 keys)
const STATIC_ENV_KEYS = ["SERVERLESS_ENDPOINT", "INVOCATION_TOKEN"];

const env = reactive({});
const reveal = reactive({});

// store serialized baseline
const originalEnv = ref("{}");
const envKeys = computed(() => STATIC_ENV_KEYS);

function initStaticEnv() {
    for (const k of STATIC_ENV_KEYS) {
        if (!(k in env)) env[k] = "";
        if (!(k in reveal)) reveal[k] = false;
    }
    // remove any accidental extra keys
    for (const k of Object.keys(env)) {
        if (!STATIC_ENV_KEYS.includes(k)) delete env[k];
    }
    for (const k of Object.keys(reveal)) {
        if (!STATIC_ENV_KEYS.includes(k)) delete reveal[k];
    }
    originalEnv.value = JSON.stringify(env);
}

watch(
    () => props.agentId,
    () => {
        code.value = DEFAULT_CODE;
        originalCode.value = DEFAULT_CODE;

        prompt.value = "";
        originalPrompt.value = "";

        // reset env to the two static keys
        for (const k of Object.keys(env)) delete env[k];
        for (const k of Object.keys(reveal)) delete reveal[k];
        initStaticEnv();

        tab.value = "explain";
    },
    { immediate: true },
);

const isDirty = computed(() => code.value !== originalCode.value);
const isPromptDirty = computed(() => prompt.value !== originalPrompt.value);
const isEnvDirty = computed(() => JSON.stringify(env) !== originalEnv.value);

function resetCode() {
    code.value = originalCode.value;
}

const toast = ref("");
let toastTimer = null;
function showToast(msg) {
    toast.value = msg;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toast.value = ""), 1600);
}

async function copyCode() {
    try {
        await navigator.clipboard.writeText(code.value);
        showToast("Copied code to clipboard");
    } catch {
        showToast("Copy failed (clipboard not available)");
    }
}

function isSecretKey(k) {
    const kk = String(k).toUpperCase();
    return (
        kk.includes("KEY") ||
        kk.includes("SECRET") ||
        kk.includes("TOKEN") ||
        kk.includes("PASSWORD")
    );
}

function toggleReveal(k) {
    reveal[k] = !reveal[k];
}

async function copyEnvJSON() {
    try {
        await navigator.clipboard.writeText(JSON.stringify(env, null, 2));
        showToast("Copied env JSON");
    } catch {
        showToast("Copy failed (clipboard not available)");
    }
}

/**
 * Step-by-step explanation (static for now, tied to the hardcoded script)
 */
const steps = computed(() => [
    {
        title: "Choose the LLM model",
        tag: "model_id",
        text: "The script selects an LLM model identifier that will be used for the structured extraction step.",
        snip: `model_id="${modelId}"`,
    },
    {
        title: "Define typed inputs/outputs with dataclasses",
        tag: "@dataclass",
        text: "These classes describe the schema: a shell command input, a directory listing input, and the structured file outputs the model should return.",
        snip: "@dataclass\nclass Command:\n    shell_command: str\n\n@dataclass\nclass DirectoryListing:\n    listing: str\n\n@dataclass\nclass File:\n    name: str\n    bytes: int\n    date_modified: str\n\n@dataclass\nclass Files:\n    files: List[File]",
    },
    {
        title: "Create a command execution block",
        tag: "SystemCommandBlock",
        text: "This creates a block that can run a shell command (with a timeout) and capture stdout/stderr.",
        snip: "command_block = SystemCommandBlock(Command, timeout_seconds=5)",
    },
    {
        title: "Create the LLM block with model configuration",
        tag: "LMLiteBlock",
        text: "This configures the local compute provider and registers the model with max context length and concurrency limits.",
        snip: "lm_lite_block = LMLiteBlock(\n    models=[\n        LmLiteModelConfig(\n            model_id,\n            max_model_len=5000,\n            max_model_concurrency=1,\n        ),\n    ],\n    compute_provider=ComputeProvider.LOCAL\n)",
    },
    {
        title: "Run `ls -al` to produce a directory listing",
        tag: "command_op",
        text: "The script executes the system command and stores the result in `command_op`.",
        snip: 'command_op = command_block(Command(shell_command="ls -al"))',
    },
    {
        title: "If the command succeeded, wrap stdout into a typed input",
        tag: "DirectoryListing",
        text: "On success, the raw text output from `ls -al` becomes a `DirectoryListing` object that matches the LLM input schema.",
        snip: "if command_op.success:\n    directory_input = DirectoryListing(listing=command_op.stdout)",
    },
    {
        title: "Ask the LLM to transform the listing into structured `Files`",
        tag: "output=Files",
        text: "This is the core: you pass the listing text in, and request a typed `Files` output (a list of `File` entries).",
        snip: "result = lm_lite_block(\n    model_id=model_id, input=directory_input, output=Files\n)",
    },
    {
        title: "Print the structured result",
        tag: "print",
        text: "Finally, the script prints the structured output so you can see the parsed files.",
        snip: "print(result)  # List[Files]",
    },
]);

const testing = ref(false);
async function test() {
    testing.value = true;
    try {
        await new Promise((r) => setTimeout(r, 500));
        showToast("Test triggered");
        emit("test", {
            id: props.agentId,
            code: code.value,
            prompt: prompt.value,
            env: { ...env },
        });
    } finally {
        testing.value = false;
    }
}

const redeploying = ref(false);
async function redeploy() {
    redeploying.value = true;
    try {
        await new Promise((r) => setTimeout(r, 650));
        showToast("Redeploy triggered");
        emit("redeploy", {
            id: props.agentId,
            code: code.value,
            prompt: prompt.value,
            env: { ...env },
        });
    } finally {
        redeploying.value = false;
    }
}

const updating = ref(false);
async function update() {
    updating.value = true;
    try {
        await new Promise((r) => setTimeout(r, 400));
        showToast("Updated");

        // mock "save": accept current values as saved baseline
        originalCode.value = code.value;
        originalPrompt.value = prompt.value;
        originalEnv.value = JSON.stringify(env);

        emit("update", {
            id: props.agentId,
            code: code.value,
            prompt: prompt.value,
            env: { ...env },
        });
    } finally {
        updating.value = false;
    }
}

function onClose() {
    emit("close");
}
</script>

<style scoped>
/* Modal only (assumes your :root vars exist globally) */

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
    width: min(980px, 100%);
    height: min(86vh, 900px);
    border: 1px solid var(--border);
    background: var(--card);
    border-radius: 18px;
    overflow: hidden;
    box-shadow: 0 18px 60px rgba(0, 0, 0, 0.55);
    display: grid;
    grid-template-rows: auto auto 1fr auto;
    outline: none;
}

.topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 14px 12px;
    border-bottom: 1px solid var(--border);
}

.title {
    display: grid;
    gap: 4px;
}

.name {
    font-size: 14px;
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

.tabsBar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border-bottom: 1px solid var(--border);
}

.tab {
    border-radius: 999px;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--muted);
    padding: 8px 12px;
    font-size: 12px;
    cursor: pointer;
    transition:
        border 0.15s ease,
        color 0.15s ease,
        background 0.15s ease;
}
.tab:hover {
    border-color: var(--fg);
    color: var(--fg);
}
.tab.active {
    border-color: var(--fg);
    background: var(--fg);
    color: var(--btn-primary-fg);
}

.tabsMeta {
    margin-left: auto;
    display: flex;
    align-items: center;
}

.body {
    padding: 12px;
    min-height: 0;
    overflow: hidden;
    display: grid;
}

.panel {
    border: 1px solid var(--border);
    border-radius: 14px;
    background: var(--card);
    overflow: hidden;
    display: grid;
    grid-template-rows: auto 1fr auto;
    min-height: 0;
}

/* Code tab needs extra rows (env + prompt) */
.codePanel {
    grid-template-rows: auto auto 1fr auto auto;
}

.panelScroll {
    min-height: 0;
    overflow: auto;
    background: var(--chip);
    padding: 12px;
}

.codeScroll {
    padding: 0;
    background: var(--chip);
}

.panelHead {
    padding: 12px 12px 10px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
}

.panelTitle {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.35px;
    text-transform: uppercase;
}

.hint {
    font-size: 12px;
    color: var(--muted);
}

.panelFooter {
    padding: 10px 12px;
    border-top: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
}

.footerActions,
.footerLeft {
    display: flex;
    gap: 10px;
    align-items: center;
}
.footerRight {
    opacity: 0.9;
}

/* ✅ Env vars */
.envWrap {
    border-bottom: 1px solid var(--border);
    background: var(--chip);
    padding: 10px 12px 12px;
    display: grid;
    gap: 8px;
}

.envRowTop {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
}

.envTitle {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.35px;
    text-transform: uppercase;
    color: var(--fg);
}

.envActions {
    display: flex;
    gap: 8px;
    align-items: center;
}

.smallBtn {
    padding: 6px 12px;
    font-size: 12px;
}

.envHint {
    opacity: 0.95;
}

.envGrid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
}
@media (max-width: 860px) {
    .envGrid {
        grid-template-columns: 1fr;
    }
}

.envItem {
    border: 1px solid var(--border);
    border-radius: 14px;
    background: var(--card);
    padding: 10px;
    display: grid;
    gap: 8px;
}

.envKey {
    font-size: 12px;
    color: var(--muted);
}

.envInputRow {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 8px;
    align-items: center;
}

.envInput {
    width: 100%;
    border-radius: 12px;
    border: 1px solid var(--border);
    background: var(--input-bg);
    color: var(--fg);
    padding: 10px 12px;
    outline: none;
    font-size: 12px;
}
.envInput::placeholder {
    color: var(--muted);
}

.iconBtn {
    padding: 8px 10px;
    font-size: 12px;
}

/* Prompt sits below footer */
.promptWrap {
    border-top: 1px solid var(--border);
    background: var(--chip);
    padding: 10px 12px 12px;
    display: grid;
    gap: 8px;
}

.promptRow {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
}

.promptActions {
    display: flex;
    align-items: center;
    gap: 10px;
}

.promptHint {
    opacity: 0.9;
}

.updateBtn {
    padding: 6px 12px;
    font-size: 12px;
}

.prompt {
    width: 100%;
    resize: vertical;
    min-height: 86px;
    max-height: 220px;
    border-radius: 14px;
    border: 1px solid var(--border);
    background: var(--input-bg);
    color: var(--fg);
    padding: 10px 12px;
    outline: none;
    font-size: 12px;
    line-height: 1.5;
    font-family:
        ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
        "Liberation Mono", "Courier New", monospace;
}
.prompt::placeholder {
    color: var(--muted);
}

/* Explain list */
.steps {
    margin: 0;
    padding-left: 18px;
    display: grid;
    gap: 12px;
}

.step {
    border: 1px solid var(--border);
    border-radius: 14px;
    background: var(--card);
    padding: 12px;
}

.stepTop {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 8px;
}

.stepTitle {
    font-size: 13px;
    font-weight: 650;
}

.stepText {
    font-size: 12px;
    color: var(--muted);
    line-height: 1.55;
}

.chip {
    font-size: 11px;
    padding: 4px 8px;
    border-radius: 999px;
    border: 1px solid var(--border);
    background: var(--input-bg);
    color: var(--fg);
}

.snippet {
    margin: 10px 0 0;
    padding: 10px;
    border-radius: 12px;
    border: 1px solid var(--border);
    background: var(--input-bg);
    color: var(--fg);
    font-size: 12px;
    line-height: 1.5;
    white-space: pre;
    overflow: auto;
}

/* Code editor */
.code {
    width: 100%;
    height: 100%;
    min-height: 100%;
    resize: none;
    border: none;
    outline: none;
    padding: 12px;
    background: var(--chip);
    color: var(--fg);
    font-size: 12px;
    line-height: 1.5;
    font-family:
        ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
        "Liberation Mono", "Courier New", monospace;
    box-sizing: border-box;
}

.dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: color-mix(in oklab, var(--muted) 70%, var(--border));
}
.dot.dirty {
    background: var(--warn);
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
        border 0.15s ease,
        background 0.15s ease,
        opacity 0.15s ease;
    white-space: nowrap;
}
button:hover {
    border-color: var(--fg);
}
button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

button.ghost {
    border-color: var(--border);
}

button.primary {
    border-color: var(--fg);
    background: var(--fg);
    color: var(--btn-primary-fg);
}
button.primary:hover {
    border-color: var(--fg);
    background: var(--btn-primary-bg);
}

.mono {
    font-family:
        ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
        "Liberation Mono", "Courier New", monospace;
}

.tiny {
    font-size: 12px;
    color: var(--muted);
}

.toast {
    justify-self: center;
    margin: 10px 0 14px;
    padding: 8px 12px;
    border-radius: 999px;
    border: 1px solid var(--border);
    background: var(--card);
    color: var(--fg);
    font-size: 12px;
}
</style>
