<!-- src/components/AgentCreateModal.vue -->
<template>
    <teleport to="body">
        <div
            v-if="open"
            class="overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Create Agent"
            @click.self="emitClose"
        >
            <div class="modal" tabindex="-1" @keydown.esc="emitClose">
                <!-- Topbar -->
                <div class="topbar">
                    <div class="title">
                        <div class="name">Create Agent</div>
                        <div class="sub mono">
                            Choose a template or write a one-sentence prompt
                        </div>
                    </div>
                    <div class="topActions">
                        <button class="btn ghost" @click="emitClose">
                            Close
                        </button>
                        <button
                            class="btn primary"
                            :disabled="!canPrimary"
                            @click="primary"
                        >
                            {{ primaryLabel }}
                        </button>
                    </div>
                </div>

                <!-- Tabs -->
                <div
                    class="tabsBar"
                    role="tablist"
                    aria-label="Create agent tabs"
                >
                    <button
                        class="tab"
                        :class="{ active: tab === 'templates' }"
                        role="tab"
                        :aria-selected="tab === 'templates'"
                        @click="tab = 'templates'"
                        :disabled="stage !== 'choose' || refineLoading"
                    >
                        Templates
                    </button>
                    <button
                        class="tab"
                        :class="{ active: tab === 'prompt' }"
                        role="tab"
                        :aria-selected="tab === 'prompt'"
                        @click="tab = 'prompt'"
                        :disabled="stage !== 'choose' || refineLoading"
                    >
                        Prompt
                    </button>

                    <button
                        v-if="stage !== 'choose'"
                        class="tab"
                        :class="{ active: tab === 'refine' }"
                        role="tab"
                        :aria-selected="tab === 'refine'"
                        @click="tab = 'refine'"
                        :disabled="stage !== 'refine'"
                    >
                        Refine
                    </button>

                    <button
                        v-if="stage === 'code'"
                        class="tab"
                        :class="{ active: tab === 'code' }"
                        role="tab"
                        :aria-selected="tab === 'code'"
                        @click="tab = 'code'"
                    >
                        Code
                    </button>
                </div>

                <!-- Body -->
                <div class="body">
                    <!-- Templates -->
                    <section
                        v-if="tab === 'templates'"
                        class="panel"
                        role="tabpanel"
                    >
                        <div class="panelHead">
                            <div class="panelTitle">Pick a template</div>
                            <div class="hint">
                                Choose a model, then select a template
                            </div>
                        </div>

                        <div class="panelScroll">
                            <!-- Model selector -->
                            <div class="modelSection">
                                <div class="modelTabs">
                                    <button
                                        class="modelTab"
                                        :class="{ active: modelCategory === 'standard' }"
                                        @click="modelCategory = 'standard'; selectedModelId = 'gpt-4o'"
                                    >
                                        Standard
                                    </button>
                                    <button
                                        class="modelTab"
                                        :class="{ active: modelCategory === 'finetuned' }"
                                        @click="modelCategory = 'finetuned'; selectedModelId = 'ft-qwen3-covenant'"
                                    >
                                        Fine-tuned
                                    </button>
                                </div>

                                <div class="modelList">
                                    <button
                                        v-for="m in activeModels"
                                        :key="m.id"
                                        class="modelRow"
                                        :class="{ selected: selectedModelId === m.id }"
                                        @click="selectedModelId = m.id"
                                    >
                                        <div class="modelName">{{ m.name }}</div>
                                        <div class="modelMeta mono">
                                            <span>{{ m.params }}</span>
                                            <span>{{ m.ctx }} ctx</span>
                                            <span>{{ m.costPerMTok }}/MTok</span>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            <div
                                class="grid"
                                role="list"
                                aria-label="Template tiles"
                            >
                                <button
                                    v-for="t in templates"
                                    :key="t.id"
                                    class="tile"
                                    role="listitem"
                                    :class="{
                                        selected: selectedTemplateId === t.id,
                                    }"
                                    @click="selectTemplate(t.id)"
                                    type="button"
                                >
                                    <div class="tileInner">
                                        <div class="tileTop">
                                            <div class="tileTitle">
                                                {{ t.title }}
                                            </div>
                                            <div class="tileCost mono">
                                                ${{
                                                    t.costPerHour.toFixed(2)
                                                }}/hr
                                            </div>
                                        </div>
                                        <div class="tileDesc">{{ t.desc }}</div>
                                        <div class="tileMeta mono">
                                            {{ t.family }}
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        <div class="panelFooter">
                            <div class="tiny mono">
                                Tip: use Prompt if you want something custom.
                            </div>
                            <div class="footerActions">
                                <button
                                    class="btn ghost"
                                    @click="tab = 'prompt'"
                                >
                                    Use Prompt
                                </button>
                            </div>
                        </div>
                    </section>

                    <!-- Prompt -->
                    <section
                        v-else-if="tab === 'prompt'"
                        class="panel"
                        role="tabpanel"
                    >
                        <div class="panelHead">
                            <div class="panelTitle">One-sentence prompt</div>
                            <div class="hint">
                                No extras — just describe the job (press Enter
                                to continue)
                            </div>
                        </div>

                        <div class="panelScroll">
                            <div class="promptWrap">
                                <div class="promptBox">
                                    <textarea
                                        v-model="prompt"
                                        class="prompt"
                                        rows="6"
                                        placeholder='e.g. "Summarize support tickets"'
                                        spellcheck="false"
                                        :disabled="refineLoading"
                                        @keydown.enter.exact.prevent="
                                            onPromptEnter
                                        "
                                        @keydown.enter.shift.stop
                                    />
                                    <div
                                        v-if="refineLoading"
                                        class="promptOverlay"
                                        aria-label="Loading"
                                    >
                                        <div class="spinner" />
                                        <div class="mono tiny subtle">
                                            Generating questions…
                                        </div>
                                    </div>
                                </div>

                                <div class="promptHelp mono">
                                    Examples: “Extract invoice fields from PDFs”
                                    · “Watch a folder and classify files”
                                </div>
                            </div>
                        </div>

                        <div class="panelFooter">
                            <div class="tiny mono subtle">
                                Keep it short. Press Enter to continue.
                            </div>
                            <div class="footerActions">
                                <button
                                    class="btn ghost"
                                    @click="tab = 'templates'"
                                    :disabled="refineLoading"
                                >
                                    Browse Templates
                                </button>
                            </div>
                        </div>
                    </section>

                    <!-- Refine -->
                    <section
                        v-else-if="tab === 'refine'"
                        class="panel"
                        role="tabpanel"
                    >
                        <div class="panelHead">
                            <div class="panelTitle">Refine</div>
                            <div class="hint">
                                Answer a few questions to shape the agent
                            </div>
                        </div>

                        <div class="panelScroll">
                            <div v-if="refineLoading" class="skeletonWrap">
                                <div class="skeleton" />
                                <div class="skeleton" />
                                <div class="skeleton" />
                                <div class="spinnerRow">
                                    <div class="spinner" />
                                    <div class="mono tiny subtle">
                                        Waiting for refine service…
                                    </div>
                                </div>
                            </div>

                            <div v-else class="refineWrap">
                                <div
                                    v-if="!refineSchema"
                                    class="tiny mono subtle"
                                >
                                    No questions yet.
                                </div>

                                <div v-else class="qList">
                                    <div
                                        v-for="q in refineSchema.questions"
                                        :key="q.id"
                                        class="qRow"
                                    >
                                        <div class="qLabel">
                                            <div class="qTitle">
                                                {{ q.label }}
                                                <span
                                                    v-if="q.required"
                                                    class="req mono"
                                                    >*</span
                                                >
                                            </div>
                                            <div
                                                v-if="q.help"
                                                class="qHelp mono"
                                            >
                                                {{ q.help }}
                                            </div>
                                        </div>

                                        <!-- ALL QUESTIONS = TEXT INPUTS -->
                                        <input
                                            class="qInput"
                                            type="text"
                                            :placeholder="q.placeholder || ''"
                                            v-model="answers[q.id]"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="panelFooter">
                            <div class="tiny mono subtle">
                                Fill required fields, then continue.
                            </div>
                            <div class="footerActions">
                                <button class="btn ghost" @click="backToPrompt">
                                    Back to Prompt
                                </button>
                            </div>
                        </div>
                    </section>

                    <!-- Code -->
                    <section v-else class="panel" role="tabpanel">
                        <div class="panelHead">
                            <div class="panelTitle">Code</div>
                            <div class="hint">
                                Generated python · run a dry test before deploy
                            </div>
                        </div>

                        <div class="panelScroll">
                            <div class="codeWrap">
                                <pre
                                    class="codeBlock mono"
                                ><code>{{ code }}</code></pre>

                                <div class="codeActions">
                                    <button
                                        class="btn ghost"
                                        @click="test"
                                        :disabled="testLoading || !code"
                                    >
                                        {{ testLoading ? "Testing…" : "Test" }}
                                    </button>

                                    <button
                                        class="btn primary"
                                        @click="deploy"
                                        :disabled="!testPassed || deployLoading"
                                    >
                                        {{
                                            deployLoading
                                                ? "Deploying…"
                                                : "Deploy"
                                        }}
                                    </button>
                                </div>

                                <div
                                    v-if="testStatus"
                                    class="status mono"
                                    :class="{ ok: testPassed }"
                                >
                                    {{ testStatus }}
                                </div>
                            </div>
                        </div>

                        <div class="panelFooter">
                            <div class="tiny mono subtle">
                                Test must succeed before deploy.
                            </div>
                            <div class="footerActions">
                                <button
                                    class="btn ghost"
                                    @click="tab = 'refine'"
                                    :disabled="stage !== 'code'"
                                >
                                    Back to Refine
                                </button>
                            </div>
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

<script setup lang="ts">
import { computed, reactive, ref } from "vue";

type Template = {
    id: string;
    title: string;
    desc: string;
    family: string;
    costPerHour: number;
};

// ALL QUESTIONS ARE TEXT INPUTS (coming from refine API)
type RefineQuestion = {
    id: string;
    type: "text";
    label: string;
    placeholder?: string;
    help?: string;
    required?: boolean;
};

type RefineSchema = {
    schemaId: string;
    title: string;
    questions: RefineQuestion[];
};

const props = defineProps<{ open: boolean }>();

const emit = defineEmits<{
    (e: "close"): void;
    (
        e: "create",
        payload:
            | { mode: "template"; templateId: string }
            | {
                  mode: "prompt";
                  prompt: string;
                  refine?: {
                      schemaId: string;
                      answers: Record<string, string>;
                  };
                  code?: string;
              },
    ): void;
}>();

const tab = ref<"templates" | "prompt" | "refine" | "code">("templates");
const stage = ref<"choose" | "refine" | "code">("choose");

const templates = ref<Template[]>([
    {
        id: "support_summarizer",
        title: "Support Ticket Summarizer",
        desc: "Summarize tickets into themes + action items.",
        family: "summarize",
        costPerHour: 0.18,
    },
    {
        id: "invoice_extractor",
        title: "Invoice Field Extractor",
        desc: "Extract vendor, total, date from PDFs.",
        family: "extract",
        costPerHour: 0.26,
    },
    {
        id: "folder_classifier",
        title: "Folder Watch Classifier",
        desc: "Watch a folder and classify new files.",
        family: "watch",
        costPerHour: 0.14,
    },
    {
        id: "shell_structurer",
        title: "Shell Output Structurer",
        desc: "Run a command and output structured JSON.",
        family: "shell",
        costPerHour: 0.1,
    },
]);

const selectedTemplateId = ref("");
const prompt = ref("");
const toast = ref("");

/* =====================
   MODEL SELECTION
===================== */

type Model = {
    id: string;
    name: string;
    params: string;
    ctx: string;
    costPerMTok: string;
};

const modelCategory = ref<"standard" | "finetuned">("standard");

const standardModels: Model[] = [
    { id: "gpt-4o", name: "GPT-4o", params: "—", ctx: "128k", costPerMTok: "$2.50" },
    { id: "claude-sonnet-4", name: "Claude Sonnet 4", params: "—", ctx: "200k", costPerMTok: "$3.00" },
    { id: "kimi-k2", name: "Kimi K2", params: "1T MoE", ctx: "128k", costPerMTok: "$0.60" },
    { id: "minimax-m1", name: "MiniMax-M1", params: "456B", ctx: "1M", costPerMTok: "$1.10" },
    { id: "qwen-3-235b", name: "Qwen 3 235B", params: "235B MoE", ctx: "128k", costPerMTok: "$0.80" },
    { id: "deepseek-v3", name: "DeepSeek V3", params: "671B MoE", ctx: "128k", costPerMTok: "$0.90" },
];

const finetunedModels: Model[] = [
    { id: "ft-qwen3-covenant", name: "Qwen 3 235B · Covenant Custom", params: "235B MoE (FT)", ctx: "128k", costPerMTok: "$1.40" },
    { id: "ft-minimax-m1-ops", name: "MiniMax-M1 · Ops Fine-tune", params: "456B (FT)", ctx: "1M", costPerMTok: "$1.80" },
];

const selectedModelId = ref("gpt-4o");

const activeModels = computed(() =>
    modelCategory.value === "standard" ? standardModels : finetunedModels,
);

const refineLoading = ref(false);
const refineSchema = ref<RefineSchema | null>(null);
const answers = reactive<Record<string, string>>({});

// Code stage (mocked)
const code = ref("");
const testLoading = ref(false);
const testPassed = ref(false);
const testStatus = ref("");
const deployLoading = ref(false);

const canPrimary = computed(() => {
    if (refineLoading.value) return false;

    if (stage.value === "choose") {
        if (tab.value === "templates") return !!selectedTemplateId.value;
        return prompt.value.trim().length > 0;
    }

    if (stage.value === "refine") {
        if (!refineSchema.value) return false;
        for (const q of refineSchema.value.questions) {
            if (q.required && !String(answers[q.id] || "").trim()) return false;
        }
        return true;
    }

    if (stage.value === "code") {
        // primary in code stage is "Deploy" but only after test passes
        return testPassed.value && !deployLoading.value;
    }

    return false;
});

const primaryLabel = computed(() => {
    if (stage.value === "choose") return "Create";
    if (stage.value === "refine") return "Continue";
    return "Deploy";
});

function emitClose() {
    emit("close");
}

function selectTemplate(id: string) {
    selectedTemplateId.value = id;
}

function backToPrompt() {
    stage.value = "choose";
    tab.value = "prompt";
    refineSchema.value = null;
    Object.keys(answers).forEach((k) => delete answers[k]);
}

function onPromptEnter() {
    // Only act like "submit" in the prompt tab during choose stage.
    if (stage.value !== "choose" || tab.value !== "prompt") return;
    if (!prompt.value.trim()) return;
    void primary();
}

type AgentCreateRefineRequest = { start_prompt: string };
type AgentCreateRefineResponse = { code: string };

async function callRefineApi(
    startPrompt: string,
): Promise<AgentCreateRefineResponse> {
    const token = localStorage.getItem("jwt");
    const res = await fetch("/agents/refine", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
            start_prompt: startPrompt,
        } satisfies AgentCreateRefineRequest),
    });

    if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(body || `Refine failed (${res.status})`);
    }

    const json = (await res.json()) as AgentCreateRefineResponse;

    // Validate shape
    if (!json || typeof json.code !== "string") {
        throw new Error("Invalid refine response (expected { code: string })");
    }

    return json;
}

function mockCodeLLM(): Promise<string> {
    // For now, always return hello world
    return new Promise((resolve) => {
        window.setTimeout(() => resolve("print('hello world')\n"), 260);
    });
}

function mockBackendTest(): Promise<{ ok: boolean; message: string }> {
    return new Promise((resolve) => {
        window.setTimeout(
            () => resolve({ ok: true, message: "Dry run succeeded" }),
            420,
        );
    });
}

function mockBackendDeploy(): Promise<{ ok: boolean; message: string }> {
    return new Promise((resolve) => {
        window.setTimeout(
            () => resolve({ ok: true, message: "Deployed" }),
            520,
        );
    });
}

async function primary() {
    if (!canPrimary.value) return;

    // Templates flow unchanged
    if (stage.value === "choose" && tab.value === "templates") {
        emit("create", {
            mode: "template",
            templateId: selectedTemplateId.value,
        });
        toast.value = "Template selected";
        window.setTimeout(() => (toast.value = ""), 900);
        return;
    }

    // Prompt -> Refine (REAL API)
    if (stage.value === "choose" && tab.value === "prompt") {
        refineLoading.value = true;
        toast.value = "Generating questions…";
        try {
            const start = prompt.value.trim();
            const api = await callRefineApi(start);
            const schema = toSchemaFromQuestions(api.questions);

            refineSchema.value = schema;
            Object.keys(answers).forEach((k) => delete answers[k]);
            for (const q of schema.questions) answers[q.id] = "";

            stage.value = "refine";
            tab.value = "refine";
            toast.value = "Questions ready";
        } catch (e: any) {
            toast.value = e?.message ? String(e.message) : "Refine failed";
        } finally {
            refineLoading.value = false;
            window.setTimeout(() => (toast.value = ""), 1200);
        }
        return;
    }

    // Refine -> Code (mock LLM codegen)
    if (stage.value === "refine") {
        // reset test state when regenerating code
        testPassed.value = false;
        testStatus.value = "";
        testLoading.value = false;

        toast.value = "Generating code…";
        const gen = await mockCodeLLM();
        code.value = gen;

        stage.value = "code";
        tab.value = "code";
        toast.value = "Code ready";
        window.setTimeout(() => (toast.value = ""), 900);
        return;
    }

    // Code -> Deploy (only if testPassed)
    if (stage.value === "code" && testPassed.value) {
        await deploy();
    }
}

async function test() {
    if (testLoading.value) return;
    testLoading.value = true;
    testStatus.value = "Running dry test…";
    testPassed.value = false;

    try {
        const res = await mockBackendTest();
        if (res.ok) {
            testPassed.value = true;
            testStatus.value = "✓ " + res.message;
        } else {
            testPassed.value = false;
            testStatus.value = "✕ " + res.message;
        }
    } catch {
        testPassed.value = false;
        testStatus.value = "✕ Test failed";
    } finally {
        testLoading.value = false;
    }
}

async function deploy() {
    if (!testPassed.value || deployLoading.value) return;
    deployLoading.value = true;
    testStatus.value = "Deploying…";

    try {
        const res = await mockBackendDeploy();
        if (res.ok) {
            testStatus.value = "✓ " + res.message;
            toast.value = "Deployed";
            // optional: emit final payload
            emit("create", {
                mode: "prompt",
                prompt: prompt.value.trim(),
                refine: refineSchema.value
                    ? {
                          schemaId: refineSchema.value.schemaId,
                          answers: { ...answers },
                      }
                    : undefined,
                code: code.value,
            });
        } else {
            testStatus.value = "✕ " + res.message;
        }
    } catch {
        testStatus.value = "✕ Deploy failed";
    } finally {
        deployLoading.value = false;
        window.setTimeout(() => (toast.value = ""), 900);
    }
}
</script>

<style scoped>
/* BLACK / WHITE ONLY. No borders. Big modal. Square tiles. */

/* Overlay + modal */
.overlay {
    position: fixed;
    inset: 0;
    background: var(--overlay);
    display: grid;
    place-items: center;
    padding: 22px;
    z-index: 9999;
}
.modal {
    width: min(1080px, 96vw);
    height: min(760px, 92vh);
    background: var(--bg);
    color: var(--fg);
    border-radius: 16px;
    box-shadow: 0 30px 120px rgba(0, 0, 0, 0.7);
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

/* Topbar */
.topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 20px;
    background: var(--bg);
}
.title .name {
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 0.2px;
}
.title .sub {
    margin-top: 4px;
    font-size: 12px;
    opacity: 0.7;
}
.topActions {
    display: flex;
    gap: 10px;
}

/* Tabs */
.tabsBar {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px 14px;
    background: var(--bg);
}
.tab {
    appearance: none;
    border: 0;
    background: var(--chip);
    color: var(--fg);
    padding: 10px 12px;
    border-radius: 12px;
    font-size: 12px;
    cursor: pointer;
    transition:
        transform 0.06s ease,
        background 0.12s ease,
        opacity 0.12s ease;
}
.tab:hover {
    background: var(--chip);
}
.tab:active {
    transform: translateY(1px);
}
.tab.active {
    background: var(--chip);
}
.tab:disabled {
    opacity: 0.45;
    cursor: not-allowed;
}

/* Body */
.body {
    flex: 1;
    min-height: 0;
    display: flex;
}

/* Panel chrome */
.panel {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
}
.panelHead {
    padding: 12px 20px 10px;
}
.panelTitle {
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.2px;
}
.hint {
    margin-top: 4px;
    font-size: 12px;
    opacity: 0.65;
}
.panelScroll {
    padding: 0 20px 18px;
    overflow: auto;
}
.panelFooter {
    padding: 14px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    background: var(--bg);
}

/* Model selector */
.modelSection {
    margin-bottom: 16px;
}
.modelTabs {
    display: flex;
    gap: 6px;
    margin-bottom: 10px;
}
.modelTab {
    appearance: none;
    border: 0;
    background: var(--hover-bg);
    color: var(--muted);
    padding: 8px 14px;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.12s ease, color 0.12s ease;
}
.modelTab:hover {
    background: var(--chip);
    color: var(--fg);
}
.modelTab.active {
    background: var(--chip);
    color: var(--fg);
}
.modelList {
    display: grid;
    gap: 4px;
}
.modelRow {
    appearance: none;
    border: 0;
    background: var(--hover-bg);
    color: var(--fg);
    padding: 10px 14px;
    border-radius: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    transition: background 0.1s ease;
    text-align: left;
}
.modelRow:hover {
    background: var(--chip);
}
.modelRow.selected {
    background: var(--chip);
    box-shadow: inset 0 0 0 1px var(--border);
}
.modelName {
    font-size: 13px;
    font-weight: 600;
    white-space: nowrap;
}
.modelMeta {
    display: flex;
    gap: 14px;
    font-size: 11px;
    opacity: 0.55;
    white-space: nowrap;
}

/* Tiles */
.grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
}
@media (max-width: 980px) {
    .grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}
@media (max-width: 700px) {
    .grid {
        grid-template-columns: 1fr;
    }
}
.tile {
    appearance: none;
    border: 0;
    padding: 0;
    text-align: left;
    background: var(--hover-bg);
    color: var(--fg);
    border-radius: 14px;
    cursor: pointer;
    transition:
        transform 0.06s ease,
        background 0.12s ease;
    aspect-ratio: 1 / 1;
}
.tile:hover {
    background: var(--chip);
}
.tile:active {
    transform: translateY(1px);
}
.tile.selected {
    background: var(--chip);
}
.tileInner {
    height: 100%;
    padding: 14px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 10px;
}
.tileTop {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
}
.tileTitle {
    font-size: 14px;
    font-weight: 750;
    line-height: 1.15;
}
.tileCost {
    font-size: 12px;
    opacity: 0.75;
    white-space: nowrap;
}
.tileDesc {
    font-size: 12px;
    line-height: 1.35;
    opacity: 0.75;
    margin-top: 6px;
    flex: 1;
}
.tileMeta {
    font-size: 12px;
    opacity: 0.55;
}

/* Prompt */
.promptWrap {
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;
}
.promptBox {
    position: relative;
    width: 100%;
    flex: 1;
    min-height: 220px;
}
.prompt {
    width: 100%;
    height: 100%;
    resize: none;
    border: 0;
    outline: none;
    border-radius: 14px;
    padding: 16px 16px;
    background: var(--hover-bg);
    color: var(--fg);
    font-size: 13px;
    line-height: 1.35;
}
.prompt:focus {
    background: var(--chip);
}
.prompt:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}
.promptOverlay {
    position: absolute;
    inset: 0;
    border-radius: 14px;
    background: var(--overlay);
    display: grid;
    place-items: center;
    gap: 10px;
    align-content: center;
}
.promptHelp {
    font-size: 12px;
    opacity: 0.55;
}

/* Refine */
.refineWrap {
    display: flex;
    flex-direction: column;
    gap: 12px;
}
.qList {
    display: flex;
    flex-direction: column;
    gap: 12px;
}
.qRow {
    display: flex;
    flex-direction: column;
    gap: 8px;
}
.qLabel {
    display: flex;
    flex-direction: column;
    gap: 4px;
}
.qTitle {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.2px;
}
.req {
    opacity: 0.55;
    margin-left: 6px;
}
.qHelp {
    font-size: 12px;
    opacity: 0.55;
}
.qInput {
    width: 100%;
    border: 0;
    outline: none;
    border-radius: 14px;
    padding: 12px 12px;
    background: var(--hover-bg);
    color: var(--fg);
    font-size: 13px;
    line-height: 1.35;
}
.qInput:focus {
    background: var(--chip);
}

/* Code */
.codeWrap {
    display: flex;
    flex-direction: column;
    gap: 12px;
}
.codeBlock {
    margin: 0;
    padding: 14px;
    border-radius: 14px;
    background: var(--hover-bg);
    overflow: auto;
    font-size: 12px;
    line-height: 1.45;
    min-height: 220px;
}
.codeActions {
    display: flex;
    gap: 10px;
}
.status {
    font-size: 12px;
    opacity: 0.65;
}
.status.ok {
    opacity: 0.9;
}

/* Simple skeleton */
.skeletonWrap {
    display: flex;
    flex-direction: column;
    gap: 10px;
}
.skeleton {
    height: 46px;
    border-radius: 14px;
    background: var(--hover-bg);
}

/* Spinner */
.spinnerRow {
    margin-top: 6px;
    display: flex;
    align-items: center;
    gap: 10px;
}
.spinner {
    width: 18px;
    height: 18px;
    border-radius: 999px;
    border: 2px solid var(--border);
    border-top-color: var(--fg);
    animation: spin 0.9s linear infinite;
}
@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

/* Buttons */
.btn {
    appearance: none;
    border: 0;
    border-radius: 12px;
    padding: 10px 12px;
    font-size: 12px;
    cursor: pointer;
    transition:
        transform 0.06s ease,
        background 0.12s ease,
        opacity 0.12s ease;
}
.btn:active {
    transform: translateY(1px);
}
.ghost {
    background: var(--chip);
    color: var(--fg);
}
.ghost:hover {
    background: var(--chip);
}
.primary {
    background: var(--btn-primary-bg);
    color: var(--btn-primary-fg);
    font-weight: 750;
}
.primary:hover {
    opacity: 0.92;
}
.btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
}

/* Utilities */
.mono {
    font-family:
        ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
        "Liberation Mono", "Courier New", monospace;
}
.tiny {
    font-size: 12px;
}
.subtle {
    opacity: 0.65;
}

/* Toast */
.toast {
    position: absolute;
    right: 18px;
    bottom: 18px;
    background: var(--chip);
    color: var(--fg);
    border-radius: 12px;
    padding: 10px 12px;
    font-size: 12px;
}
</style>
