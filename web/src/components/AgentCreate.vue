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
                <div class="topbar">
                    <div class="title">
                        <div class="name">Deploy Agent</div>
                        <div class="sub mono">Step {{ step }} of 3</div>
                    </div>
                    <div class="topActions">
                        <button class="btn ghost" @click="emitClose">Close</button>
                        <button
                            v-if="step < 3"
                            class="btn primary"
                            :disabled="!canContinue"
                            @click="nextStep"
                        >
                            Continue
                        </button>
                        <button
                            v-else
                            class="btn primary"
                            :disabled="deploying"
                            @click="deploy"
                        >
                            {{ deploying ? 'Deploying...' : 'Deploy Agent' }}
                        </button>
                    </div>
                </div>

                <div class="stepper">
                    <div class="step-item" :class="{ active: step >= 1, done: step > 1 }">
                        <span class="step-num">1</span>
                        <span class="step-label">Source</span>
                    </div>
                    <div class="step-line" :class="{ active: step > 1 }"></div>
                    <div class="step-item" :class="{ active: step >= 2, done: step > 2 }">
                        <span class="step-num">2</span>
                        <span class="step-label">Compute</span>
                    </div>
                    <div class="step-line" :class="{ active: step > 2 }"></div>
                    <div class="step-item" :class="{ active: step >= 3 }">
                        <span class="step-num">3</span>
                        <span class="step-label">Review & Deploy</span>
                    </div>
                </div>

                <div class="body">
                    <!-- STEP 1: Source Selection -->
                    <div v-if="step === 1" class="panel">
                        <div class="source-toggle">
                            <button
                                class="source-btn"
                                :class="{ active: sourceMode === 'template' }"
                                @click="sourceMode = 'template'"
                            >
                                Select Template
                            </button>
                            <button
                                class="source-btn"
                                :class="{ active: sourceMode === 'upload' }"
                                @click="sourceMode = 'upload'"
                            >
                                Upload Conduit Code
                            </button>
                        </div>

                        <div v-if="sourceMode === 'template'" class="template-section">
                            <div class="section-label">Template Library</div>
                            <div class="template-grid">
                                <button
                                    v-for="t in templates"
                                    :key="t.id"
                                    class="template-card"
                                    :class="{ selected: selectedTemplate === t.id }"
                                    @click="selectedTemplate = t.id"
                                >
                                    <div class="tpl-icon">{{ t.icon }}</div>
                                    <div class="tpl-info">
                                        <div class="tpl-name">{{ t.name }}</div>
                                        <div class="tpl-desc">{{ t.desc }}</div>
                                        <div class="tpl-tags">
                                            <span class="tpl-tag mono" v-for="tag in t.tags" :key="tag">{{ tag }}</span>
                                        </div>
                                    </div>
                                    <div v-if="selectedTemplate === t.id" class="tpl-check">&#10003;</div>
                                </button>
                            </div>
                        </div>

                        <div v-if="sourceMode === 'upload'" class="upload-section">
                            <div class="section-label">Upload Conduit Code</div>
                            <div
                                class="drop-zone"
                                :class="{ dragover: isDragging, uploaded: uploadedFile }"
                                @dragover.prevent="isDragging = true"
                                @dragleave.prevent="isDragging = false"
                                @drop.prevent="onDrop"
                                @click="triggerUpload"
                            >
                                <template v-if="!uploadedFile">
                                    <div class="drop-icon">&#128193;</div>
                                    <div class="drop-title">Drag & drop your .zip file here</div>
                                    <div class="drop-hint mono">or click to browse</div>
                                    <div class="drop-formats mono">Accepted: .zip containing your Conduit agent code</div>
                                </template>
                                <template v-else>
                                    <div class="drop-icon">&#9989;</div>
                                    <div class="drop-title">{{ uploadedFile.name }}</div>
                                    <div class="drop-hint mono">{{ formatSize(uploadedFile.size) }}</div>
                                    <button class="remove-file" @click.stop="uploadedFile = null">Remove</button>
                                </template>
                            </div>
                            <input
                                ref="fileInput"
                                type="file"
                                accept=".zip"
                                style="display: none"
                                @change="onFileSelect"
                            />
                        </div>
                    </div>

                    <!-- STEP 2: Compute Selection -->
                    <div v-if="step === 2" class="panel">
                        <div class="section-label">Select Compute</div>

                        <div class="compute-options">
                            <button
                                class="compute-option"
                                :class="{ selected: computeMode === 'new' }"
                                @click="computeMode = 'new'"
                            >
                                <div class="co-icon">&#9889;</div>
                                <div class="co-info">
                                    <div class="co-name">Deploy New Compute</div>
                                    <div class="co-desc">Provision a new dedicated GPU for this agent</div>
                                </div>
                            </button>
                            <button
                                class="compute-option"
                                :class="{ selected: computeMode === 'existing' }"
                                @click="computeMode = 'existing'"
                            >
                                <div class="co-icon">&#128279;</div>
                                <div class="co-info">
                                    <div class="co-name">Select Deployed Compute</div>
                                    <div class="co-desc">Use an existing GPU deployment</div>
                                </div>
                            </button>
                            <button
                                class="compute-option"
                                :class="{ selected: computeMode === 'api' }"
                                @click="computeMode = 'api'"
                            >
                                <div class="co-icon">&#9729;&#65039;</div>
                                <div class="co-info">
                                    <div class="co-name">API-Based</div>
                                    <div class="co-desc">Use external API provider (OpenAI, Anthropic, etc.)</div>
                                </div>
                                <div class="co-warning">Less Secure</div>
                            </button>
                        </div>

                        <div v-if="computeMode === 'api'" class="api-warning">
                            <div class="warn-icon">&#9888;&#65039;</div>
                            <div class="warn-text">
                                API-based compute routes your data through third-party servers. For full data sovereignty and privacy, use dedicated GPU compute instead.
                            </div>
                        </div>

                        <!-- New compute: Model + GPU selection -->
                        <template v-if="computeMode === 'new'">
                            <div class="section-label" style="margin-top: 18px">Recommended Models</div>
                            <div class="model-tabs">
                                <button
                                    class="mtab"
                                    :class="{ active: modelCategory === 'general' }"
                                    @click="modelCategory = 'general'"
                                >General</button>
                                <button
                                    class="mtab"
                                    :class="{ active: modelCategory === 'finetuned' }"
                                    @click="modelCategory = 'finetuned'"
                                >Fine-tuned</button>
                            </div>
                            <div class="model-list">
                                <button
                                    v-for="m in activeModels"
                                    :key="m.id"
                                    class="model-row"
                                    :class="{ selected: selectedModel === m.id }"
                                    @click="selectedModel = m.id"
                                >
                                    <div class="mr-name">{{ m.name }}</div>
                                    <div class="mr-meta mono">
                                        <span>{{ m.params }}</span>
                                        <span>{{ m.ctx }}</span>
                                        <span>{{ m.gpu }}</span>
                                    </div>
                                </button>
                            </div>

                            <div class="section-label" style="margin-top: 18px">Region</div>
                            <div class="region-row">
                                <button
                                    v-for="r in regions"
                                    :key="r.id"
                                    class="region-btn"
                                    :class="{ selected: selectedRegion === r.id }"
                                    @click="selectedRegion = r.id"
                                >
                                    <span>{{ r.flag }}</span>
                                    <span>{{ r.name }}</span>
                                </button>
                            </div>
                        </template>

                        <!-- Existing compute -->
                        <template v-if="computeMode === 'existing'">
                            <div class="section-label" style="margin-top: 18px">Active Deployments</div>
                            <div class="deploy-list">
                                <button
                                    v-for="d in existingDeploys"
                                    :key="d.id"
                                    class="deploy-row"
                                    :class="{ selected: selectedDeploy === d.id }"
                                    @click="selectedDeploy = d.id"
                                >
                                    <div class="dr-left">
                                        <div class="dr-name">{{ d.model }}</div>
                                        <div class="dr-info mono">{{ d.gpu }} &middot; {{ d.region }}</div>
                                    </div>
                                    <div class="dr-status" :class="d.status">{{ d.status }}</div>
                                </button>
                            </div>
                        </template>

                        <!-- API-based model -->
                        <template v-if="computeMode === 'api'">
                            <div class="section-label" style="margin-top: 18px">API Provider</div>
                            <div class="model-list">
                                <button
                                    v-for="m in apiModels"
                                    :key="m.id"
                                    class="model-row"
                                    :class="{ selected: selectedApiModel === m.id }"
                                    @click="selectedApiModel = m.id"
                                >
                                    <div class="mr-name">{{ m.name }}</div>
                                    <div class="mr-meta mono">
                                        <span>{{ m.provider }}</span>
                                        <span>{{ m.cost }}</span>
                                    </div>
                                </button>
                            </div>
                        </template>
                    </div>

                    <!-- STEP 3: Review & Deploy -->
                    <div v-if="step === 3" class="panel">
                        <div class="section-label">Review Configuration</div>

                        <div class="review-grid">
                            <div class="review-item">
                                <div class="rv-label">Agent Source</div>
                                <div class="rv-value">
                                    <template v-if="sourceMode === 'template'">
                                        {{ templates.find(t => t.id === selectedTemplate)?.name || '—' }}
                                    </template>
                                    <template v-else>
                                        {{ uploadedFile?.name || 'Custom Upload' }}
                                    </template>
                                </div>
                            </div>
                            <div class="review-item">
                                <div class="rv-label">Compute</div>
                                <div class="rv-value">
                                    <template v-if="computeMode === 'new'">
                                        New &mdash; {{ activeModels.find(m => m.id === selectedModel)?.name || '—' }}
                                    </template>
                                    <template v-else-if="computeMode === 'existing'">
                                        {{ existingDeploys.find(d => d.id === selectedDeploy)?.model || '—' }}
                                    </template>
                                    <template v-else>
                                        API &mdash; {{ apiModels.find(m => m.id === selectedApiModel)?.name || '—' }}
                                    </template>
                                </div>
                            </div>
                            <div class="review-item" v-if="computeMode === 'new'">
                                <div class="rv-label">GPU</div>
                                <div class="rv-value mono">{{ activeModels.find(m => m.id === selectedModel)?.gpu || '—' }}</div>
                            </div>
                            <div class="review-item" v-if="computeMode === 'new'">
                                <div class="rv-label">Region</div>
                                <div class="rv-value">{{ regions.find(r => r.id === selectedRegion)?.name || '—' }}</div>
                            </div>
                        </div>

                        <div class="section-label" style="margin-top: 18px">Agent Name</div>
                        <input
                            v-model="agentName"
                            class="name-input mono"
                            placeholder="e.g. my-growth-agent"
                        />

                        <div v-if="computeMode === 'api'" class="api-warning" style="margin-top: 14px">
                            <div class="warn-icon">&#9888;&#65039;</div>
                            <div class="warn-text">
                                This agent will use API-based compute. Your data will be sent to external servers. Consider using dedicated compute for sensitive workloads.
                            </div>
                        </div>

                        <div v-if="deploySuccess" class="deploy-result">
                            <div class="dr-title">Agent Deployed Successfully</div>
                            <div class="section-label" style="margin-top: 12px">Endpoint</div>
                            <div class="endpoint-box">
                                <code class="endpoint-url mono">{{ deployedEndpoint }}</code>
                                <button class="copy-btn" @click="copyText(deployedEndpoint)">Copy</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="footer">
                    <button v-if="step > 1 && !deploySuccess" class="btn ghost" @click="step--">Back</button>
                    <div class="footer-spacer"></div>
                </div>
            </div>
        </div>
    </teleport>
</template>

<script setup>
import { computed, ref } from "vue";

const props = defineProps({ open: { type: Boolean, default: false } });
const emit = defineEmits(["close", "deployed"]);

const step = ref(1);
const sourceMode = ref("template");
const selectedTemplate = ref("");
const uploadedFile = ref(null);
const isDragging = ref(false);
const fileInput = ref(null);

const computeMode = ref("new");
const modelCategory = ref("general");
const selectedModel = ref("kimi-25-secure");
const selectedRegion = ref("us-west-2");
const selectedDeploy = ref("");
const selectedApiModel = ref("gpt-4o-api");

const agentName = ref("");
const deploying = ref(false);
const deploySuccess = ref(false);
const deployedEndpoint = ref("");

const templates = ref([
    {
        id: "covenant-claw",
        name: "Covenant Claw",
        icon: "\u{1F916}",
        desc: "Full-featured autonomous AI assistant with web browsing, code execution, email, and calendar management.",
        tags: ["autonomous", "multi-tool", "general"],
    },
    {
        id: "micro-chat",
        name: "Micro Chat",
        icon: "\u{1F4AC}",
        desc: "Lightweight conversational agent for customer support, FAQ, and quick interactions.",
        tags: ["chat", "lightweight", "fast"],
    },
    {
        id: "growth-stack",
        name: "Growth Stack (Sentinel)",
        icon: "\u{1F6E1}",
        desc: "System monitoring and logging bot. Tracks events, alerts on anomalies, and generates reports.",
        tags: ["monitoring", "logging", "alerts"],
    },
    {
        id: "growth-hacker",
        name: "Growth Hacker",
        icon: "\u{1F680}",
        desc: "SEO optimization, content generation, social media automation, and growth analytics.",
        tags: ["marketing", "seo", "automation"],
    },
    {
        id: "ops-automator",
        name: "Ops Automator",
        icon: "\u2699\uFE0F",
        desc: "DevOps and infrastructure automation. CI/CD pipelines, deployments, health checks.",
        tags: ["devops", "infra", "ci/cd"],
    },
    {
        id: "sales-concierge",
        name: "Sales Concierge",
        icon: "\u{1F91D}",
        desc: "Pipeline management, lead scoring, outreach drafting, and CRM integration.",
        tags: ["sales", "crm", "outreach"],
    },
]);

const generalModels = [
    { id: "kimi-25-secure", name: "Kimi K2 (Recommended)", params: "1T MoE", ctx: "128k", gpu: "NVIDIA H100 SXM 80GB" },
    { id: "qwen-3-235b", name: "Qwen 3 235B", params: "235B MoE", ctx: "128k", gpu: "NVIDIA A100 80GB" },
    { id: "deepseek-v3", name: "DeepSeek V3", params: "671B MoE", ctx: "128k", gpu: "NVIDIA H100 SXM 80GB" },
    { id: "llama-4-scout", name: "Llama 4 Scout", params: "109B MoE", ctx: "512k", gpu: "NVIDIA A100 80GB" },
    { id: "minimax-m1", name: "MiniMax-M1", params: "456B", ctx: "1M", gpu: "NVIDIA H100 SXM 80GB" },
];

const finetunedModels = [
    { id: "ft-qwen3-covenant", name: "Qwen 3 235B - Covenant Custom", params: "235B MoE (FT)", ctx: "128k", gpu: "NVIDIA A100 80GB" },
    { id: "ft-minimax-ops", name: "MiniMax-M1 - Ops Fine-tune", params: "456B (FT)", ctx: "1M", gpu: "NVIDIA H100 SXM 80GB" },
    { id: "ft-kimi-secure", name: "Kimi K2 - Secure Covenant", params: "1T MoE (FT)", ctx: "128k", gpu: "NVIDIA H100 SXM 80GB" },
];

const activeModels = computed(() =>
    modelCategory.value === "general" ? generalModels : finetunedModels,
);

const regions = [
    { id: "us-west-2", name: "US West (Oregon)", flag: "🇺🇸" },
    { id: "us-east-1", name: "US East (Virginia)", flag: "🇺🇸" },
    { id: "eu-central-1", name: "EU (Frankfurt)", flag: "🇩🇪" },
    { id: "ap-northeast-1", name: "Asia Pacific (Tokyo)", flag: "🇯🇵" },
];

const existingDeploys = [
    { id: "dep_001", model: "Kimi K2", gpu: "NVIDIA H100 SXM 80GB", region: "us-west-2", status: "running" },
    { id: "dep_002", model: "Qwen 3 235B", gpu: "NVIDIA A100 80GB", region: "us-east-1", status: "running" },
];

const apiModels = [
    { id: "gpt-4o-api", name: "GPT-4o", provider: "OpenAI", cost: "$2.50/MTok" },
    { id: "claude-sonnet-4-api", name: "Claude Sonnet 4", provider: "Anthropic", cost: "$3.00/MTok" },
    { id: "gemini-2-api", name: "Gemini 2.5 Pro", provider: "Google", cost: "$1.25/MTok" },
];

const canContinue = computed(() => {
    if (step.value === 1) {
        if (sourceMode.value === "template") return !!selectedTemplate.value;
        return !!uploadedFile.value;
    }
    if (step.value === 2) {
        if (computeMode.value === "new") return !!selectedModel.value && !!selectedRegion.value;
        if (computeMode.value === "existing") return !!selectedDeploy.value;
        if (computeMode.value === "api") return !!selectedApiModel.value;
    }
    return true;
});

function nextStep() {
    if (step.value === 1 && sourceMode.value === "template" && selectedTemplate.value) {
        const tpl = templates.value.find(t => t.id === selectedTemplate.value);
        if (tpl && !agentName.value) {
            agentName.value = tpl.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        }
    }
    step.value++;
}

function emitClose() {
    step.value = 1;
    sourceMode.value = "template";
    selectedTemplate.value = "";
    uploadedFile.value = null;
    computeMode.value = "new";
    selectedModel.value = "kimi-25-secure";
    selectedRegion.value = "us-west-2";
    selectedDeploy.value = "";
    selectedApiModel.value = "gpt-4o-api";
    agentName.value = "";
    deploying.value = false;
    deploySuccess.value = false;
    deployedEndpoint.value = "";
    modelCategory.value = "general";
    emit("close");
}

function triggerUpload() {
    fileInput.value?.click();
}

function onFileSelect(e) {
    const file = e.target.files[0];
    if (file && file.name.endsWith(".zip")) {
        uploadedFile.value = file;
    }
}

function onDrop(e) {
    isDragging.value = false;
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith(".zip")) {
        uploadedFile.value = file;
    }
}

function formatSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
}

async function deploy() {
    deploying.value = true;
    await new Promise((r) => setTimeout(r, 2200));

    const id = "ag_" + String(Date.now()).slice(-6);
    const tpl = templates.value.find(t => t.id === selectedTemplate.value);
    const name = agentName.value || (tpl?.name || "custom-agent");
    const endpoint = `https://api.covenant.cloud/v1/agents/${id}`;
    deployedEndpoint.value = endpoint;
    deploySuccess.value = true;
    deploying.value = false;

    let gpu = "API";
    let price = 0;
    let region = "api";
    let runtime = "api";

    if (computeMode.value === "new") {
        const model = activeModels.value.find(m => m.id === selectedModel.value);
        gpu = model?.gpu || "NVIDIA H100 SXM 80GB";
        price = gpu.includes("H100") ? 3.50 : gpu.includes("A100") ? 2.90 : 0.62;
        region = selectedRegion.value;
        runtime = "dedicated";
    } else if (computeMode.value === "existing") {
        const dep = existingDeploys.find(d => d.id === selectedDeploy.value);
        gpu = dep?.gpu || "NVIDIA H100 SXM 80GB";
        price = gpu.includes("H100") ? 3.50 : 2.90;
        region = dep?.region || "us-west-2";
        runtime = "dedicated";
    } else {
        const apiModel = apiModels.find(m => m.id === selectedApiModel.value);
        gpu = `API (${apiModel?.provider || "External"})`;
        price = 0;
        region = "cloud";
        runtime = "api";
    }

    emit("deployed", {
        id,
        name,
        role: tpl?.tags?.[0] ? tpl.tags[0].charAt(0).toUpperCase() + tpl.tags[0].slice(1) : "Custom Agent",
        gpu,
        pricePerHour: price,
        requestsCompleted: 0,
        tokensProcessed: 0,
        avgLatencyMs: 0,
        state: "running",
        region,
        runtime,
        conduitVersion: "1.0.0",
        template: selectedTemplate.value || "custom",
        endpoint,
        apiKey: `cvnt_live_sk_${id}...`,
    });
}

async function copyText(text) {
    try {
        await navigator.clipboard.writeText(text);
    } catch {}
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
    width: min(780px, 100%);
    max-height: 90vh;
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
    padding: 16px 22px;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
}

.title {
    display: grid;
    gap: 3px;
}
.name {
    font-size: 15px;
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

.btn {
    border-radius: 999px;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--fg);
    padding: 8px 18px;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
}
.btn:hover {
    border-color: var(--fg);
}
.btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
}
.btn.primary {
    background: var(--fg);
    color: var(--bg);
    border-color: var(--fg);
}
.btn.primary:hover {
    filter: brightness(1.1);
}
.btn.ghost {
    border-color: var(--border);
}

/* Stepper */
.stepper {
    display: flex;
    align-items: center;
    gap: 0;
    padding: 14px 22px;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
}

.step-item {
    display: flex;
    align-items: center;
    gap: 6px;
    opacity: 0.4;
    transition: opacity 0.15s ease;
}
.step-item.active {
    opacity: 1;
}
.step-item.done {
    opacity: 0.7;
}

.step-num {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 600;
}
.step-item.active .step-num {
    background: var(--fg);
    color: var(--bg);
    border-color: var(--fg);
}

.step-label {
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
}

.step-line {
    flex: 1;
    height: 1px;
    background: var(--border);
    margin: 0 12px;
    transition: background 0.15s ease;
}
.step-line.active {
    background: var(--fg);
}

/* Body */
.body {
    flex: 1;
    overflow-y: auto;
    padding: 22px;
}

.panel {
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.section-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: var(--muted);
    font-weight: 600;
}

/* Source toggle */
.source-toggle {
    display: flex;
    gap: 0;
    border: 1px solid var(--border);
    border-radius: 10px;
    overflow: hidden;
}
.source-btn {
    flex: 1;
    padding: 12px 16px;
    border: none;
    background: transparent;
    color: var(--muted);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
}
.source-btn.active {
    background: var(--fg);
    color: var(--bg);
}

/* Template grid */
.template-grid {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.template-card {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 14px 16px;
    border: 1px solid var(--border);
    border-radius: 12px;
    background: transparent;
    color: var(--fg);
    text-align: left;
    cursor: pointer;
    transition: all 0.12s ease;
}
.template-card:hover {
    border-color: color-mix(in oklab, var(--fg) 50%, var(--border));
}
.template-card.selected {
    border-color: var(--fg);
    background: rgba(255, 255, 255, 0.03);
}

.tpl-icon {
    font-size: 24px;
    flex-shrink: 0;
    margin-top: 2px;
}
.tpl-info {
    flex: 1;
    min-width: 0;
}
.tpl-name {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 4px;
}
.tpl-desc {
    font-size: 12px;
    color: var(--muted);
    line-height: 1.4;
    margin-bottom: 6px;
}
.tpl-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
}
.tpl-tag {
    font-size: 10px;
    padding: 2px 8px;
    border-radius: 999px;
    border: 1px solid var(--border);
    color: var(--muted);
}
.tpl-check {
    font-size: 16px;
    color: #4ade80;
    flex-shrink: 0;
    margin-top: 2px;
}

/* Upload drop zone */
.upload-section {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.drop-zone {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 40px 20px;
    border: 2px dashed var(--border);
    border-radius: 14px;
    cursor: pointer;
    transition: all 0.15s ease;
    text-align: center;
}
.drop-zone:hover,
.drop-zone.dragover {
    border-color: var(--fg);
    background: rgba(255, 255, 255, 0.02);
}
.drop-zone.uploaded {
    border-style: solid;
    border-color: #4ade8060;
    background: rgba(74, 222, 128, 0.03);
}

.drop-icon {
    font-size: 32px;
}
.drop-title {
    font-size: 14px;
    font-weight: 600;
}
.drop-hint {
    font-size: 12px;
    color: var(--muted);
}
.drop-formats {
    font-size: 11px;
    color: var(--muted);
    opacity: 0.6;
    margin-top: 6px;
}

.remove-file {
    margin-top: 6px;
    padding: 4px 12px;
    border-radius: 6px;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--muted);
    font-size: 11px;
    cursor: pointer;
}
.remove-file:hover {
    color: #f87171;
    border-color: #f87171;
}

/* Compute options */
.compute-options {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.compute-option {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 16px;
    border: 1px solid var(--border);
    border-radius: 12px;
    background: transparent;
    color: var(--fg);
    text-align: left;
    cursor: pointer;
    transition: all 0.12s ease;
}
.compute-option:hover {
    border-color: color-mix(in oklab, var(--fg) 50%, var(--border));
}
.compute-option.selected {
    border-color: var(--fg);
    background: rgba(255, 255, 255, 0.03);
}

.co-icon {
    font-size: 22px;
    flex-shrink: 0;
}
.co-info {
    flex: 1;
}
.co-name {
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 2px;
}
.co-desc {
    font-size: 12px;
    color: var(--muted);
}
.co-warning {
    font-size: 10px;
    font-weight: 700;
    color: #fbbf24;
    padding: 3px 8px;
    border-radius: 6px;
    border: 1px solid #fbbf2440;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    flex-shrink: 0;
}

.api-warning {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 12px 16px;
    border-radius: 10px;
    border: 1px solid #fbbf2430;
    background: rgba(251, 191, 36, 0.04);
}
.warn-icon {
    font-size: 16px;
    flex-shrink: 0;
}
.warn-text {
    font-size: 12px;
    color: #fbbf24;
    line-height: 1.5;
}

/* Model tabs & list */
.model-tabs {
    display: flex;
    gap: 6px;
}
.mtab {
    padding: 6px 14px;
    border-radius: 999px;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--muted);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.12s ease;
}
.mtab:hover {
    color: var(--fg);
    border-color: var(--fg);
}
.mtab.active {
    background: var(--fg);
    color: var(--bg);
    border-color: var(--fg);
}

.model-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.model-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 14px;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: transparent;
    color: var(--fg);
    cursor: pointer;
    transition: all 0.12s ease;
    text-align: left;
}
.model-row:hover {
    border-color: color-mix(in oklab, var(--fg) 40%, var(--border));
}
.model-row.selected {
    border-color: var(--fg);
    background: rgba(255, 255, 255, 0.03);
}

.mr-name {
    font-size: 13px;
    font-weight: 600;
}
.mr-meta {
    display: flex;
    gap: 12px;
    font-size: 11px;
    color: var(--muted);
}

/* Region */
.region-row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}
.region-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: transparent;
    color: var(--fg);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.12s ease;
}
.region-btn:hover {
    border-color: var(--fg);
}
.region-btn.selected {
    border-color: var(--fg);
    background: rgba(255, 255, 255, 0.03);
}

/* Deploy list */
.deploy-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
}
.deploy-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: transparent;
    color: var(--fg);
    cursor: pointer;
    transition: all 0.12s ease;
    text-align: left;
}
.deploy-row:hover {
    border-color: color-mix(in oklab, var(--fg) 40%, var(--border));
}
.deploy-row.selected {
    border-color: var(--fg);
    background: rgba(255, 255, 255, 0.03);
}
.dr-left {
    display: grid;
    gap: 2px;
}
.dr-name {
    font-size: 13px;
    font-weight: 600;
}
.dr-info {
    font-size: 11px;
    color: var(--muted);
}
.dr-status {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}
.dr-status.running {
    color: #4ade80;
}

/* Review grid */
.review-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
}
.review-item {
    padding: 12px;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: var(--chip);
}
.rv-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: var(--muted);
    font-weight: 600;
    margin-bottom: 6px;
}
.rv-value {
    font-size: 13px;
    font-weight: 600;
}

.name-input {
    padding: 10px 14px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--fg);
    font-size: 13px;
    outline: none;
    width: 100%;
    box-sizing: border-box;
}
.name-input:focus {
    border-color: var(--fg);
}
.name-input::placeholder {
    color: var(--muted);
}

/* Deploy result */
.deploy-result {
    margin-top: 18px;
    padding: 18px;
    border-radius: 12px;
    border: 1px solid #4ade8040;
    background: rgba(74, 222, 128, 0.04);
}
.dr-title {
    font-size: 15px;
    font-weight: 600;
    color: #4ade80;
}

.endpoint-box {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: rgba(0, 0, 0, 0.2);
    margin-top: 6px;
}
.endpoint-url {
    flex: 1;
    font-size: 12px;
    word-break: break-all;
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
}
.copy-btn:hover {
    color: var(--fg);
    border-color: var(--fg);
}

/* Footer */
.footer {
    display: flex;
    align-items: center;
    padding: 12px 22px;
    border-top: 1px solid var(--border);
    flex-shrink: 0;
}
.footer-spacer {
    flex: 1;
}

.mono {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

@media (max-width: 600px) {
    .review-grid {
        grid-template-columns: 1fr;
    }
}
</style>
