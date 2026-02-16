<template>
    <div class="cc-wrap">
        <!-- ==================== PHASE 1: WELCOME / DEPLOY ==================== -->
        <div v-if="phase === 'welcome'" class="cc-welcome">
            <div class="cc-hero">
                <div class="cc-logo-ring">
                    <div class="cc-logo-inner">
                        <svg viewBox="0 0 48 48" class="cc-claw-icon">
                            <path d="M24 4C20 4 16 8 16 14c0 4 2 7 4 9l-6 8c-1.5 2-1 4.5 1 5.5s4.5 0 5.5-2l5.5-8 5.5 8c1 2 3.5 3 5.5 2s2.5-3.5 1-5.5l-6-8c2-2 4-5 4-9 0-6-4-10-8-10z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <circle cx="20" cy="14" r="2" fill="currentColor" opacity="0.6"/>
                            <circle cx="28" cy="14" r="2" fill="currentColor" opacity="0.6"/>
                            <path d="M20 20c1.5 1.5 6.5 1.5 8 0" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                        </svg>
                    </div>
                </div>

                <h1 class="cc-title">CovenantClaw</h1>
                <p class="cc-subtitle">Your autonomous AI agent on Covenant Secure Cloud</p>
                <p class="cc-desc">
                    Deploy a personal AI assistant that can manage your email, calendar, code,
                    browse the web, run commands, and orchestrate sub-agents — all running on the
                    Covenant Secure Cloud.
                </p>

                <div class="cc-model-badge">
                    <span class="cc-model-dot"></span>
                    Default Model: <strong>Kimi 2.5</strong> — Secure US-based deployment
                </div>

                <button class="cc-deploy-btn" @click="startOnboarding">
                    <span class="cc-deploy-icon">&#9889;</span>
                    Deploy CovenantClaw
                </button>

            </div>
        </div>

        <!-- ==================== PHASE 2: ONBOARDING ==================== -->
        <div v-if="phase === 'onboarding'" class="cc-onboarding">
            <div class="cc-ob-container">
                <div class="cc-ob-progress">
                    <div class="cc-ob-bar" :style="{ width: ((obStep + 1) / obSteps.length * 100) + '%' }"></div>
                </div>

                <div class="cc-ob-header">
                    <span class="cc-ob-step-label">Step {{ obStep + 1 }} of {{ obSteps.length }}</span>
                    <h2>{{ obSteps[obStep].title }}</h2>
                    <p>{{ obSteps[obStep].desc }}</p>
                </div>

                <!-- Step 0: Model Selection -->
                <div v-if="obStep === 0" class="cc-ob-body">
                    <div class="cc-model-grid">
                        <button
                            v-for="m in models"
                            :key="m.id"
                            class="cc-model-card"
                            :class="{ selected: selectedModel === m.id, 'has-warning': m.warning }"
                            @click="selectedModel = m.id"
                        >
                            <div class="cc-mc-top">
                                <span class="cc-mc-icon">{{ m.icon }}</span>
                                <div class="cc-mc-badges">
                                    <span v-if="m.recommended" class="cc-mc-badge">Recommended</span>
                                    <span v-if="m.badge" class="cc-mc-badge secure">{{ m.badge }}</span>
                                </div>
                            </div>
                            <strong>{{ m.name }}</strong>
                            <p>{{ m.desc }}</p>
                            <div v-if="m.warning" class="cc-mc-warning">
                                <span class="cc-mc-warn-icon">&#9888;</span>
                                {{ m.warning }}
                            </div>
                            <div class="cc-mc-pricing">{{ m.pricing }}</div>
                        </button>
                    </div>
                </div>

                <!-- Step 1: Integrations -->
                <div v-if="obStep === 1" class="cc-ob-body">
                    <div class="cc-int-grid">
                        <div
                            v-for="intg in integrations"
                            :key="intg.id"
                            class="cc-int-card"
                            :class="{ enabled: intg.enabled, locked: intg.needsAuth && !intg.authed }"
                        >
                            <div class="cc-int-top">
                                <span class="cc-int-icon">{{ intg.icon }}</span>
                                <div class="cc-int-info">
                                    <strong>{{ intg.name }}</strong>
                                    <span class="cc-int-cat">{{ intg.category }}</span>
                                </div>
                            </div>
                            <p class="cc-int-desc">{{ intg.desc }}</p>
                            <div class="cc-int-actions">
                                <button
                                    v-if="intg.needsAuth && !intg.authed"
                                    class="cc-int-auth-btn"
                                    @click="mockAuth(intg)"
                                >
                                    Connect Account
                                </button>
                                <span v-if="intg.needsAuth && intg.authed" class="cc-int-authed">
                                    Connected
                                </span>
                                <label class="cc-toggle">
                                    <input type="checkbox" v-model="intg.enabled" :disabled="intg.needsAuth && !intg.authed" />
                                    <span class="cc-toggle-track"></span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Step 2: Review & Deploy -->
                <div v-if="obStep === 2" class="cc-ob-body">
                    <div class="cc-review">
                        <div class="cc-review-section">
                            <h4>Model</h4>
                            <div class="cc-review-item">
                                <span class="cc-review-icon">{{ models.find(m => m.id === selectedModel)?.icon }}</span>
                                <span>{{ models.find(m => m.id === selectedModel)?.name }}</span>
                                <span class="cc-review-pricing">{{ models.find(m => m.id === selectedModel)?.pricing }}</span>
                            </div>
                            <div v-if="models.find(m => m.id === selectedModel)?.warning" class="cc-review-warning">
                                &#9888; {{ models.find(m => m.id === selectedModel)?.warning }}
                            </div>
                        </div>

                        <div class="cc-review-section">
                            <h4>Enabled Integrations</h4>
                            <div class="cc-review-tags">
                                <span
                                    v-for="intg in enabledIntegrations"
                                    :key="intg.id"
                                    class="cc-review-tag"
                                >
                                    {{ intg.icon }} {{ intg.name }}
                                </span>
                                <span v-if="enabledIntegrations.length === 0" class="cc-review-none">
                                    No advanced integrations selected (basic skills still active)
                                </span>
                            </div>
                        </div>

                        <div class="cc-review-section">
                            <h4>Always-On Skills</h4>
                            <div class="cc-review-tags">
                                <span v-for="s in coreSkills" :key="s" class="cc-review-tag core">{{ s }}</span>
                            </div>
                        </div>

                        <div class="cc-review-section">
                            <h4>Infrastructure</h4>
                            <div class="cc-review-infra">
                                <div><span class="cc-muted">Runtime:</span> Covenant Secure Container</div>
                                <div><span class="cc-muted">Region:</span> Auto (lowest latency)</div>
                                <div><span class="cc-muted">Data:</span> Encrypted at rest</div>
                                <div><span class="cc-muted">Uptime SLA:</span> 99.9%</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Nav -->
                <div class="cc-ob-nav">
                    <button v-if="obStep > 0" class="cc-ob-back" @click="obStep--">Back</button>
                    <div class="cc-ob-spacer"></div>
                    <button
                        v-if="obStep < obSteps.length - 1"
                        class="cc-ob-next"
                        @click="obStep++"
                    >
                        Continue
                    </button>
                    <button
                        v-if="obStep === obSteps.length - 1"
                        class="cc-ob-deploy"
                        @click="deploy"
                    >
                        <span v-if="!deploying">Deploy Now</span>
                        <span v-else class="cc-deploying">
                            <span class="cc-spinner"></span> Deploying...
                        </span>
                    </button>
                </div>
            </div>
        </div>

        <!-- ==================== PHASE 3: ACTIVE / CHAT ==================== -->
        <div v-if="phase === 'active'" class="cc-active">
            <!-- Left: Activity Panel -->
            <div class="cc-panel cc-activity" :class="{ collapsed: !showActivity }">
                <div class="cc-panel-head" @click="showActivity = !showActivity">
                    <h3>Activity</h3>
                    <span class="cc-panel-toggle">{{ showActivity ? '&#9666;' : '&#9656;' }}</span>
                </div>
                <div v-if="showActivity" class="cc-panel-body">
                    <div class="cc-status-bar">
                        <span class="cc-status-dot live"></span>
                        <span>CovenantClaw Online</span>
                    </div>

                    <div class="cc-activity-list">
                        <div
                            v-for="(act, i) in activities"
                            :key="i"
                            class="cc-act-item"
                            :class="act.type"
                        >
                            <div class="cc-act-icon">{{ act.icon }}</div>
                            <div class="cc-act-content">
                                <div class="cc-act-label">{{ act.label }}</div>
                                <div class="cc-act-detail">{{ act.detail }}</div>
                                <div class="cc-act-time">{{ act.time }}</div>
                            </div>
                            <div v-if="act.status" class="cc-act-status" :class="act.status">
                                {{ act.status }}
                            </div>
                        </div>
                    </div>

                    <div class="cc-subagents">
                        <h4>Sub-Agents</h4>
                        <div
                            v-for="sa in subAgents"
                            :key="sa.id"
                            class="cc-sa-item"
                        >
                            <span class="cc-sa-dot" :class="sa.status"></span>
                            <span class="cc-sa-name">{{ sa.name }}</span>
                            <span class="cc-sa-task">{{ sa.task }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Center: Chat / Monitor -->
            <div class="cc-chat-main">
                <div class="cc-center-tabs">
                    <button class="cc-center-tab" :class="{ active: centerTab === 'chat' }" @click="centerTab = 'chat'">
                        Chat
                    </button>
                    <button class="cc-center-tab" :class="{ active: centerTab === 'monitor' }" @click="centerTab = 'monitor'">
                        Monitor
                        <span v-if="unreadLogs > 0" class="cc-log-badge">{{ unreadLogs }}</span>
                    </button>
                </div>

                <template v-if="centerTab === 'chat'">
                    <div class="cc-chat-messages" ref="messagesEl">
                        <div
                            v-for="(m, i) in messages"
                            :key="i"
                            class="cc-msg"
                            :class="m.role"
                        >
                            <div class="cc-msg-bubble">
                                <div class="cc-msg-role">
                                    <span v-if="m.role === 'user'">You</span>
                                    <span v-else class="cc-msg-claw-label">
                                        CovenantClaw
                                        <span v-if="m.subagent" class="cc-msg-sa-tag">via {{ m.subagent }}</span>
                                    </span>
                                </div>
                                <div class="cc-msg-text" v-html="formatMsg(m.text)"></div>
                            </div>
                        </div>

                        <div v-if="thinking" class="cc-msg assistant">
                            <div class="cc-msg-bubble">
                                <div class="cc-msg-role">CovenantClaw</div>
                                <div class="cc-msg-text cc-thinking">
                                    <span class="dot1">.</span><span class="dot2">.</span><span class="dot3">.</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="cc-chat-input">
                        <input
                            v-model="input"
                            class="cc-input"
                            placeholder="Message CovenantClaw..."
                            @keydown.enter="send"
                            :disabled="thinking"
                        />
                        <button
                            class="cc-send"
                            :disabled="!input.trim() || thinking"
                            @click="send"
                        >
                            Send
                        </button>
                    </div>
                </template>

                <template v-if="centerTab === 'monitor'">
                    <div class="cc-monitor">
                        <div class="cc-mon-overview">
                            <div class="cc-mon-stat">
                                <div class="cc-mon-stat-label">Status</div>
                                <div class="cc-mon-stat-val">
                                    <span class="cc-status-dot live"></span>
                                    Online
                                </div>
                            </div>
                            <div class="cc-mon-stat">
                                <div class="cc-mon-stat-label">Model</div>
                                <div class="cc-mon-stat-val mono">{{ models.find(m => m.id === selectedModel)?.name || '—' }}</div>
                            </div>
                            <div class="cc-mon-stat">
                                <div class="cc-mon-stat-label">Compute</div>
                                <div class="cc-mon-stat-val mono">Dedicated GPU</div>
                            </div>
                            <div class="cc-mon-stat">
                                <div class="cc-mon-stat-label">Uptime</div>
                                <div class="cc-mon-stat-val mono">{{ agentUptime }}</div>
                            </div>
                            <div class="cc-mon-stat">
                                <div class="cc-mon-stat-label">Requests</div>
                                <div class="cc-mon-stat-val mono">{{ totalRequests }}</div>
                            </div>
                            <div class="cc-mon-stat">
                                <div class="cc-mon-stat-label">Sub-Agents</div>
                                <div class="cc-mon-stat-val mono">{{ subAgents.length }}</div>
                            </div>
                        </div>

                        <div class="cc-mon-log-header">
                            <h3>System Logs</h3>
                            <div class="cc-mon-log-controls">
                                <select v-model="logFilter" class="cc-mon-filter">
                                    <option value="all">All</option>
                                    <option value="system">System</option>
                                    <option value="agent">Agent</option>
                                    <option value="compute">Compute</option>
                                    <option value="error">Errors</option>
                                </select>
                                <button class="cc-mon-clear" @click="clearLogs">Clear</button>
                            </div>
                        </div>

                        <div class="cc-mon-terminal" ref="terminalEl">
                            <div
                                v-for="(log, i) in filteredLogs"
                                :key="i"
                                class="cc-log-line"
                                :class="log.level"
                            >
                                <span class="cc-log-time">{{ log.time }}</span>
                                <span class="cc-log-level" :class="log.level">{{ log.level.toUpperCase() }}</span>
                                <span class="cc-log-source">[{{ log.source }}]</span>
                                <span class="cc-log-msg">{{ log.message }}</span>
                            </div>
                            <div v-if="filteredLogs.length === 0" class="cc-log-empty">
                                No logs matching filter "{{ logFilter }}"
                            </div>
                        </div>
                    </div>
                </template>
            </div>

            <!-- Right: Settings -->
            <div class="cc-panel cc-settings" :class="{ collapsed: !showSettings }">
                <div class="cc-panel-head" @click="showSettings = !showSettings">
                    <h3>Settings</h3>
                    <span class="cc-panel-toggle">{{ showSettings ? '&#9656;' : '&#9666;' }}</span>
                </div>
                <div v-if="showSettings" class="cc-panel-body">
                    <div class="cc-setting-group">
                        <label class="cc-setting-label">Model</label>
                        <select v-model="selectedModel" class="cc-select">
                            <option v-for="m in models" :key="m.id" :value="m.id">
                                {{ m.icon }} {{ m.name }}
                            </option>
                        </select>
                    </div>

                    <div class="cc-setting-group">
                        <label class="cc-setting-label">Agent Name</label>
                        <input v-model="agentName" class="cc-setting-input" />
                    </div>

                    <div class="cc-setting-group">
                        <label class="cc-setting-label">System Prompt</label>
                        <textarea v-model="systemPrompt" class="cc-setting-textarea" rows="4"></textarea>
                    </div>

                    <div class="cc-setting-group">
                        <label class="cc-setting-label">Integrations</label>
                        <div class="cc-settings-int-list">
                            <div
                                v-for="intg in integrations"
                                :key="intg.id"
                                class="cc-settings-int-item"
                            >
                                <span class="cc-settings-int-icon">{{ intg.icon }}</span>
                                <span class="cc-settings-int-name">{{ intg.name }}</span>
                                <div class="cc-settings-int-right">
                                    <button
                                        v-if="intg.needsAuth && !intg.authed"
                                        class="cc-int-auth-btn sm"
                                        @click="mockAuth(intg)"
                                    >
                                        Connect
                                    </button>
                                    <span v-if="intg.needsAuth && intg.authed" class="cc-int-authed sm">
                                        OK
                                    </span>
                                    <label class="cc-toggle sm">
                                        <input type="checkbox" v-model="intg.enabled" :disabled="intg.needsAuth && !intg.authed" />
                                        <span class="cc-toggle-track"></span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="cc-setting-group">
                        <label class="cc-setting-label">Danger Zone</label>
                        <button class="cc-danger-btn" @click="resetDemo">Destroy & Reset</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick } from "vue";

/* ── State ── */
const phase = ref("welcome"); // welcome | onboarding | active
const obStep = ref(0);
const deploying = ref(false);
const showActivity = ref(true);
const showSettings = ref(true);
const thinking = ref(false);
const input = ref("");
const messagesEl = ref(null);
const terminalEl = ref(null);
const agentName = ref("covenant-claw-01");
const centerTab = ref("chat");
const logFilter = ref("all");
const unreadLogs = ref(0);
const deployTimestamp = ref(null);
const totalRequests = ref(0);
const systemPrompt = ref(
    "You are CovenantClaw, an AI assistant running on Covenant Secure Cloud. You help the user manage their digital life — email, calendar, code, research, and automation."
);

/* ── Models ── */
const selectedModel = ref("kimi-25-secure");
const models = [
    {
        id: "kimi-25-secure",
        name: "Kimi 2.5",
        icon: "🛡️",
        desc: "Secure US-based deployment of Kimi 2.5. Strong reasoning and tool-use capabilities with data staying on Covenant infrastructure.",
        recommended: true,
        badge: "Secure",
        warning: null,
        pricing: "Per API call",
    },
    {
        id: "opus-46",
        name: "Opus 4.6",
        icon: "🧠",
        desc: "Anthropic's most capable reasoning model. Excellent for complex multi-step tasks, code generation, and deep analysis.",
        recommended: false,
        badge: null,
        warning: "Data will be exposed directly to Anthropic",
        pricing: "Per API call",
    },
    {
        id: "gpt-52",
        name: "GPT 5.2",
        icon: "⚡",
        desc: "OpenAI's flagship model. Fast, versatile general-purpose model with strong capability across all tasks.",
        recommended: false,
        badge: null,
        warning: "Data will be exposed directly to OpenAI",
        pricing: "Per API call",
    },
    {
        id: "minimax-25-dedicated",
        name: "MiniMax 2.5",
        icon: "🔒",
        desc: "MiniMax 2.5 running on dedicated Covenant compute. Full data isolation — no third-party API calls. Control your model uptime in the Compute tab.",
        recommended: false,
        badge: "Most Secure",
        warning: null,
        pricing: "$18.50/hr dedicated compute",
    },
];

/* ── Onboarding Steps ── */
const obSteps = [
    { title: "Choose Your Model", desc: "Select the AI model that powers your CovenantClaw agent. You can change this anytime." },
    { title: "Connect Integrations", desc: "Enable advanced integrations that require account access. Basic skills like web browsing and shell are always on." },
    { title: "Review & Deploy", desc: "Review your configuration and deploy your personal AI agent." },
];

/* ── Core Skills (always on, no setup needed) ── */
const coreSkills = [
    "🌐 Web Browsing",
    "💻 Shell / Terminal",
    "📁 File System",
    "🧮 Code Interpreter",
    "🔍 Web Search",
    "📊 Data Analysis",
];

/* ── Integrations (advanced, need auth for some) ── */
const integrations = reactive([
    {
        id: "gmail",
        name: "Gmail",
        icon: "📧",
        category: "Google Suite",
        desc: "Read, send, and manage emails. Clear inbox, draft replies, search messages.",
        needsAuth: true,
        authed: false,
        enabled: false,
    },
    {
        id: "gcal",
        name: "Google Calendar",
        icon: "📅",
        category: "Google Suite",
        desc: "View, create, and manage calendar events. Schedule meetings and set reminders.",
        needsAuth: true,
        authed: false,
        enabled: false,
    },
    {
        id: "gdrive",
        name: "Google Drive",
        icon: "📂",
        category: "Google Suite",
        desc: "Access, create, and organize files in Google Drive. Read docs and spreadsheets.",
        needsAuth: true,
        authed: false,
        enabled: false,
    },
    {
        id: "slack",
        name: "Slack",
        icon: "💬",
        category: "Communication",
        desc: "Send and receive Slack messages, manage channels, respond to threads.",
        needsAuth: true,
        authed: false,
        enabled: false,
    },
    {
        id: "discord",
        name: "Discord",
        icon: "🎮",
        category: "Communication",
        desc: "Monitor and respond in Discord servers. Manage channels and roles.",
        needsAuth: true,
        authed: false,
        enabled: false,
    },
    {
        id: "telegram",
        name: "Telegram",
        icon: "✈️",
        category: "Communication",
        desc: "Send and receive Telegram messages. Bot management and group interactions.",
        needsAuth: true,
        authed: false,
        enabled: false,
    },
    {
        id: "whatsapp",
        name: "WhatsApp",
        icon: "📱",
        category: "Communication",
        desc: "Send and receive WhatsApp messages via Business API integration.",
        needsAuth: true,
        authed: false,
        enabled: false,
    },
    {
        id: "github",
        name: "GitHub",
        icon: "🐙",
        category: "Development",
        desc: "Manage repositories, issues, pull requests. Review code and automate workflows.",
        needsAuth: true,
        authed: false,
        enabled: false,
    },
    {
        id: "notion",
        name: "Notion",
        icon: "📝",
        category: "Productivity",
        desc: "Read and update Notion pages, databases, and workspaces.",
        needsAuth: true,
        authed: false,
        enabled: false,
    },
    {
        id: "linear",
        name: "Linear",
        icon: "📐",
        category: "Development",
        desc: "Create and manage issues, track sprints, and update project status.",
        needsAuth: true,
        authed: false,
        enabled: false,
    },
]);

const enabledIntegrations = computed(() => integrations.filter((i) => i.enabled));

/* ── Hero Features ── */
const heroFeatures = [
    { icon: "🔒", title: "Secure Infrastructure", desc: "Runs on the Covenant Secure Cloud with enterprise-grade security controls." },
    { icon: "🤖", title: "Autonomous Agents", desc: "Spins up sub-agents for complex tasks — email, research, code, and more." },
    { icon: "🔌", title: "Extensible Integrations", desc: "Connect Gmail, Slack, GitHub, and dozens more. Add new tools anytime." },
    { icon: "⚡", title: "One-Click Deploy", desc: "Go from zero to a running AI assistant in under 30 seconds." },
];

/* ── Activity Feed (demo) ── */
const activities = reactive([]);
const subAgents = reactive([]);

/* ── Chat Messages ── */
const messages = reactive([]);

/* ── Actions ── */
function startOnboarding() {
    phase.value = "onboarding";
    obStep.value = 0;
}

function mockAuth(intg) {
    intg.authed = true;
    intg.enabled = true;
}

async function deploy() {
    deploying.value = true;
    systemLogs.splice(0);
    deployTimestamp.value = Date.now();
    totalRequests.value = 0;
    centerTab.value = "chat";
    unreadLogs.value = 0;

    addLog("info", "system", "Initializing deployment sequence...");
    await new Promise((r) => setTimeout(r, 400));
    addLog("info", "system", `Agent name: ${agentName.value}`);
    addLog("info", "compute", "Requesting dedicated GPU allocation...");
    await new Promise((r) => setTimeout(r, 500));
    addLog("info", "compute", "GPU node assigned: us-west-2 / NVIDIA H100 SXM 80GB");
    addLog("info", "compute", "Container runtime starting...");
    await new Promise((r) => setTimeout(r, 400));
    const modelName = models.find((m) => m.id === selectedModel.value)?.name || "Unknown";
    addLog("info", "agent", `Loading model: ${modelName}`);
    await new Promise((r) => setTimeout(r, 500));
    addLog("info", "agent", "Model weights loaded — inference engine ready");
    addLog("info", "agent", `System prompt configured (${systemPrompt.value.length} chars)`);

    if (enabledIntegrations.value.length > 0) {
        addLog("info", "system", `Syncing ${enabledIntegrations.value.length} integration(s)...`);
        for (const intg of enabledIntegrations.value) {
            await new Promise((r) => setTimeout(r, 200));
            addLog("info", "agent", `Integration connected: ${intg.name}`);
        }
    }

    addLog("info", "system", "Core skills activated: Web Browsing, Shell, File System, Code Interpreter, Web Search, Data Analysis");
    await new Promise((r) => setTimeout(r, 300));
    addLog("info", "compute", "Health check passed — all systems nominal");
    addLog("info", "system", "CovenantClaw deployment complete — agent is online");

    activities.splice(0, activities.length,
        { icon: "🚀", label: "Agent Deployed", detail: `${agentName.value} is now live`, time: "just now", type: "success", status: "complete" },
        { icon: "🛡️", label: "Model Loaded", detail: modelName, time: "just now", type: "info", status: "complete" },
        { icon: "🔌", label: "Integrations Synced", detail: `${enabledIntegrations.value.length} connected`, time: "just now", type: "info", status: "complete" },
        { icon: "🌐", label: "Web Browsing", detail: "Core skill activated", time: "just now", type: "info", status: "active" },
        { icon: "💻", label: "Shell Access", detail: "Core skill activated", time: "just now", type: "info", status: "active" },
    );

    subAgents.splice(0, subAgents.length,
        { id: "main", name: "CovenantClaw (Primary)", task: "Listening for instructions", status: "active" },
    );

    messages.splice(0, messages.length, {
        role: "assistant",
        text: `**CovenantClaw is online.** 🟢\n\nI'm your sovereign AI assistant running on Covenant Secure Cloud. Here's what I can do:\n\n- **Email & Calendar** — Manage your inbox, draft replies, schedule meetings\n- **Code & Terminal** — Write code, run commands, manage repositories\n- **Research & Web** — Browse the web, search, analyze documents\n- **Automate** — I'll spin up sub-agents for complex multi-step tasks\n\n${enabledIntegrations.value.length > 0 ? "**Connected integrations:** " + enabledIntegrations.value.map((i) => i.icon + " " + i.name).join(", ") + "\n\n" : ""}What would you like me to help with?`,
    });

    deploying.value = false;
    phase.value = "active";
}

/* ── Chat ── */

const demoResponses = {
    email: {
        text: `I'll check your inbox now.\n\n**Spinning up Email Sub-Agent...**\n\n\`\`\`\n✓ Connected to Gmail API\n✓ Fetching unread messages...\n✓ Found 12 unread emails\n\`\`\`\n\nHere's a summary of your unread inbox:\n\n| From | Subject | Priority |\n|------|---------|----------|\n| sarah@acme.co | Q1 Board Deck - Review Needed | 🔴 High |\n| github.com | [covenant-labs/core] PR #247 merged | 🟡 Medium |\n| cal-noreply@google.com | Meeting moved: Sync w/ DevRel | 🟢 Low |\n| newsletters@morning.brew | Morning Brew - Feb 16 | 🟢 Low |\n| aws-billing@amazon.com | AWS Invoice - January 2026 | 🟡 Medium |\n\n...and 7 more. Want me to draft replies to the high-priority ones?`,
        subagent: "Email Agent",
        activity: { icon: "📧", label: "Email Scan", detail: "Scanned inbox — 12 unread", time: "just now", type: "info", status: "complete" },
        sa: { id: "email-1", name: "Email Sub-Agent", task: "Scanned inbox (12 unread)", status: "idle" },
    },
    calendar: {
        text: `Let me pull up your schedule.\n\n**Spinning up Calendar Sub-Agent...**\n\n\`\`\`\n✓ Connected to Google Calendar\n✓ Fetching today's events...\n\`\`\`\n\nHere's your schedule for today (Monday, Feb 16):\n\n| Time | Event | Location |\n|------|-------|----------|\n| 9:00 AM | Daily Standup | Google Meet |\n| 10:30 AM | Design Review | Figma Room |\n| 12:00 PM | Lunch with Alex | Café Roma |\n| 2:00 PM | Sprint Planning | Zoom |\n| 4:30 PM | 1:1 with Manager | Office |\n\nYou have a 1.5 hour gap between 10:30 and 12:00. Want me to block some focus time there?`,
        subagent: "Calendar Agent",
        activity: { icon: "📅", label: "Calendar Sync", detail: "5 events today", time: "just now", type: "info", status: "complete" },
        sa: { id: "cal-1", name: "Calendar Sub-Agent", task: "Fetched today's schedule", status: "idle" },
    },
    code: {
        text: `Sure, I'll help with that.\n\n**Spinning up Code Sub-Agent...**\n\n\`\`\`\n✓ Initialized workspace\n✓ Analyzing project structure\n✓ Running linters and type-check\n\`\`\`\n\nI've analyzed the project. Here's what I found:\n\n- **Framework:** Vue 3 + TypeScript + Vite\n- **Components:** 8 views, 3 shared components\n- **Issues:** 2 type errors, 1 unused import\n\nI can fix those issues now, or would you prefer I focus on something specific?`,
        subagent: "Code Agent",
        activity: { icon: "💻", label: "Code Analysis", detail: "Analyzed project — 2 issues found", time: "just now", type: "info", status: "complete" },
        sa: { id: "code-1", name: "Code Sub-Agent", task: "Project analysis complete", status: "idle" },
    },
    research: {
        text: `I'll research that for you.\n\n**Spinning up Research Sub-Agent...**\n\n\`\`\`\n✓ Searching web for latest information\n✓ Cross-referencing 8 sources\n✓ Generating summary\n\`\`\`\n\nHere's what I found:\n\n**Summary:**\nThe latest developments show significant progress in the area you asked about. Key points:\n\n1. **Recent advances** — Multiple breakthroughs in the last quarter\n2. **Market trends** — Growing adoption across enterprise and consumer segments\n3. **Technical details** — New architectures achieving state-of-the-art results\n\nWould you like me to go deeper on any of these points, or compile this into a document?`,
        subagent: "Research Agent",
        activity: { icon: "🔍", label: "Web Research", detail: "8 sources analyzed", time: "just now", type: "info", status: "complete" },
        sa: { id: "research-1", name: "Research Sub-Agent", task: "Research complete", status: "idle" },
    },
    default: {
        text: `Got it! I'll work on that.\n\nLet me break this down into steps:\n\n1. **Analyze** the request and determine required tools\n2. **Execute** using the appropriate skills and sub-agents\n3. **Report** back with results\n\nProcessing now...\n\n\`\`\`\n✓ Request parsed\n✓ Tools selected: Web, Shell, Code Interpreter\n✓ Executing plan...\n✓ Complete\n\`\`\`\n\nDone! Here's what I did:\n\n- Analyzed your request using the Kimi 2.5 reasoning engine\n- Orchestrated the required tools autonomously\n- Validated the output\n\nIs there anything you'd like me to adjust or do next?`,
        subagent: null,
        activity: { icon: "⚡", label: "Task Completed", detail: "Autonomous execution", time: "just now", type: "success", status: "complete" },
        sa: null,
    },
};

function pickDemoResponse(text) {
    const lower = text.toLowerCase();
    if (lower.includes("email") || lower.includes("inbox") || lower.includes("mail") || lower.includes("gmail"))
        return demoResponses.email;
    if (lower.includes("calendar") || lower.includes("schedule") || lower.includes("meeting") || lower.includes("events"))
        return demoResponses.calendar;
    if (lower.includes("code") || lower.includes("project") || lower.includes("debug") || lower.includes("pr") || lower.includes("github"))
        return demoResponses.code;
    if (lower.includes("search") || lower.includes("research") || lower.includes("find") || lower.includes("look up") || lower.includes("what is"))
        return demoResponses.research;
    return demoResponses.default;
}

function formatMsg(text) {
    return text
        .replace(/```([\s\S]*?)```/g, '<pre class="cc-code-block">$1</pre>')
        .replace(/`([^`]+)`/g, "<code>$1</code>")
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\|(.+)\|/g, (match) => {
            const cells = match.split("|").filter((c) => c.trim()).map((c) => `<td>${c.trim()}</td>`).join("");
            return `<tr>${cells}</tr>`;
        })
        .replace(/(<tr>.*<\/tr>\n?)+/g, (match) => `<table class="cc-md-table">${match}</table>`)
        .replace(/\n/g, "<br/>");
}

async function scrollToBottom() {
    await nextTick();
    if (messagesEl.value) {
        messagesEl.value.scrollTop = messagesEl.value.scrollHeight;
    }
}

async function send() {
    const text = input.value.trim();
    if (!text || thinking.value) return;

    messages.push({ role: "user", text });
    input.value = "";
    await scrollToBottom();

    totalRequests.value++;
    addLog("info", "agent", `User request received: "${text.substring(0, 80)}${text.length > 80 ? '...' : ''}"`);
    addLog("info", "agent", "Processing request — selecting tools...");

    thinking.value = true;
    await scrollToBottom();

    const delay = 1200 + Math.random() * 2000;
    await new Promise((r) => setTimeout(r, delay));

    const response = pickDemoResponse(text);

    if (response.subagent) {
        addLog("info", "agent", `Spawning sub-agent: ${response.subagent}`);
    }
    addLog("info", "compute", `Inference call — model: ${models.find((m) => m.id === selectedModel.value)?.name} — latency: ${Math.floor(delay)}ms`);

    messages.push({
        role: "assistant",
        text: response.text,
        subagent: response.subagent,
    });

    if (response.activity) {
        activities.unshift(response.activity);
        addLog("info", "agent", `Task completed: ${response.activity.label} — ${response.activity.detail}`);
    }
    if (response.sa) {
        subAgents.push(response.sa);
        addLog("info", "agent", `Sub-agent registered: ${response.sa.name}`);
    }

    addLog("info", "agent", "Response delivered to user");

    thinking.value = false;
    await scrollToBottom();
}

/* ── Monitor / Logging System ── */
const systemLogs = reactive([]);

function getLogTimestamp() {
    const now = new Date();
    return now.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }) + "." + String(now.getMilliseconds()).padStart(3, "0");
}

const agentUptime = computed(() => {
    if (!deployTimestamp.value) return "—";
    const diff = Date.now() - deployTimestamp.value;
    const s = Math.floor(diff / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}h ${m % 60}m`;
    if (m > 0) return `${m}m ${s % 60}s`;
    return `${s}s`;
});

const filteredLogs = computed(() => {
    if (logFilter.value === "all") return systemLogs;
    if (logFilter.value === "error") return systemLogs.filter((l) => l.level === "error" || l.level === "warn");
    return systemLogs.filter((l) => l.source.toLowerCase().includes(logFilter.value));
});

function addLog(level, source, message) {
    systemLogs.push({ time: getLogTimestamp(), level, source, message });
    if (centerTab.value !== "monitor") {
        unreadLogs.value++;
    }
    nextTick(() => {
        if (terminalEl.value) {
            terminalEl.value.scrollTop = terminalEl.value.scrollHeight;
        }
    });
}

function clearLogs() {
    systemLogs.splice(0);
}

watch(centerTab, (val) => {
    if (val === "monitor") {
        unreadLogs.value = 0;
    }
});

function resetDemo() {
    phase.value = "welcome";
    obStep.value = 0;
    deploying.value = false;
    messages.splice(0);
    activities.splice(0);
    subAgents.splice(0);
    systemLogs.splice(0);
    centerTab.value = "chat";
    unreadLogs.value = 0;
    deployTimestamp.value = null;
    totalRequests.value = 0;
    integrations.forEach((i) => {
        i.authed = false;
        i.enabled = false;
    });
    selectedModel.value = "kimi-25-secure";
}
</script>

<style scoped>
/* ===================== LAYOUT ===================== */
.cc-wrap {
    height: calc(100vh - 60px);
    overflow: hidden;
}

/* ===================== WELCOME ===================== */
.cc-welcome {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow-y: auto;
    padding: 40px 24px;
}

.cc-hero {
    max-width: 620px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
}

.cc-logo-ring {
    width: 88px;
    height: 88px;
    border-radius: 50%;
    border: 2px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: center;
    background: radial-gradient(circle, var(--hover-bg) 0%, transparent 70%);
    animation: cc-pulse 3s ease-in-out infinite;
}

@keyframes cc-pulse {
    0%, 100% { box-shadow: 0 0 0 0 var(--hover-bg); }
    50% { box-shadow: 0 0 40px 8px var(--hover-bg); }
}

.cc-logo-inner {
    width: 56px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.cc-claw-icon {
    width: 48px;
    height: 48px;
    color: var(--fg);
}

.cc-title {
    margin: 0;
    font-size: 32px;
    font-weight: 700;
    letter-spacing: -0.5px;
}

.cc-subtitle {
    margin: -8px 0 0;
    font-size: 14px;
    color: var(--muted);
    letter-spacing: 0.3px;
}

.cc-desc {
    margin: 0;
    font-size: 13px;
    color: var(--muted);
    line-height: 1.7;
    max-width: 520px;
}

.cc-model-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: 999px;
    border: 1px solid var(--border);
    background: var(--hover-bg);
    font-size: 12px;
    color: var(--muted);
}

.cc-model-badge strong {
    color: var(--fg);
}

.cc-model-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #4ade80;
    box-shadow: 0 0 8px #4ade8060;
}

.cc-deploy-btn {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 16px 40px;
    border-radius: 14px;
    border: none;
    background: var(--btn-primary-bg);
    color: var(--btn-primary-fg);
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    letter-spacing: 0.3px;
    transition: all 0.2s ease;
    margin-top: 8px;
}

.cc-deploy-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 32px var(--shadow-dropdown);
    filter: brightness(1.1);
}

.cc-deploy-icon {
    font-size: 20px;
}

.cc-features {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-top: 16px;
    width: 100%;
}

.cc-feature {
    display: flex;
    gap: 10px;
    text-align: left;
    padding: 14px;
    border-radius: 12px;
    border: 1px solid var(--border);
    background: var(--card);
}

.cc-feat-icon {
    font-size: 20px;
    flex-shrink: 0;
    margin-top: 2px;
}

.cc-feature strong {
    font-size: 12px;
    display: block;
    margin-bottom: 2px;
}

.cc-feature p {
    margin: 0;
    font-size: 11px;
    color: var(--muted);
    line-height: 1.5;
}

/* ===================== ONBOARDING ===================== */
.cc-onboarding {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow-y: auto;
    padding: 32px 24px 0;
}

.cc-ob-container {
    max-width: 720px;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.cc-ob-progress {
    height: 4px;
    background: var(--border);
    border-radius: 999px;
    overflow: hidden;
}

.cc-ob-bar {
    height: 100%;
    background: var(--fg);
    border-radius: 999px;
    transition: width 0.4s ease;
}

.cc-ob-header {
    text-align: center;
}

.cc-ob-step-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--muted);
}

.cc-ob-header h2 {
    margin: 8px 0 4px;
    font-size: 22px;
    font-weight: 700;
}

.cc-ob-header p {
    margin: 0;
    font-size: 13px;
    color: var(--muted);
}

.cc-ob-body {
    min-height: 200px;
}

/* Model Grid */
.cc-model-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
}

.cc-model-card {
    padding: 18px;
    border-radius: 14px;
    border: 2px solid var(--border);
    background: var(--card);
    text-align: left;
    cursor: pointer;
    transition: all 0.15s ease;
    color: var(--fg);
}

.cc-model-card:hover {
    border-color: var(--muted);
}

.cc-model-card.selected {
    border-color: var(--fg);
    background: var(--hover-bg);
}

.cc-mc-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
}

.cc-mc-icon {
    font-size: 24px;
}

.cc-mc-badges {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
}

.cc-mc-badge {
    font-size: 10px;
    padding: 3px 8px;
    border-radius: 999px;
    background: #4ade8020;
    color: #4ade80;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.cc-mc-badge.secure {
    background: #3b82f620;
    color: #60a5fa;
}

.cc-model-card strong {
    font-size: 14px;
    display: block;
    margin-bottom: 4px;
}

.cc-model-card p {
    margin: 0;
    font-size: 11px;
    color: var(--muted);
    line-height: 1.5;
}

.cc-mc-warning {
    margin-top: 8px;
    padding: 6px 10px;
    border-radius: 8px;
    background: #f59e0b12;
    border: 1px solid #f59e0b30;
    font-size: 10px;
    color: #fbbf24;
    display: flex;
    align-items: center;
    gap: 5px;
    line-height: 1.4;
}

.cc-mc-warn-icon {
    font-size: 13px;
    flex-shrink: 0;
}

.cc-model-card.has-warning:not(.selected) {
    border-color: #f59e0b25;
}

.cc-mc-pricing {
    margin-top: 8px;
    font-size: 10px;
    color: var(--muted);
    font-weight: 600;
    letter-spacing: 0.3px;
    text-transform: uppercase;
}

/* Integration Grid */
.cc-int-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 10px;
}

.cc-int-card {
    padding: 14px;
    border-radius: 12px;
    border: 1px solid var(--border);
    background: var(--card);
    transition: all 0.15s ease;
}

.cc-int-card.enabled {
    border-color: #4ade8040;
    background: #4ade8008;
}

.cc-int-top {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    margin-bottom: 8px;
}

.cc-int-icon {
    font-size: 22px;
    flex-shrink: 0;
}

.cc-int-info {
    display: flex;
    flex-direction: column;
}

.cc-int-info strong {
    font-size: 13px;
}

.cc-int-cat {
    font-size: 10px;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.cc-int-desc {
    font-size: 11px;
    color: var(--muted);
    margin: 0 0 10px;
    line-height: 1.5;
}

.cc-int-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
}

.cc-int-auth-btn {
    padding: 5px 12px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--fg);
    font-size: 11px;
    cursor: pointer;
    transition: all 0.12s ease;
}

.cc-int-auth-btn:hover {
    background: var(--hover-bg);
    border-color: var(--fg);
}

.cc-int-auth-btn.sm {
    padding: 3px 8px;
    font-size: 10px;
}

.cc-int-authed {
    font-size: 11px;
    color: #4ade80;
    font-weight: 600;
}

.cc-int-authed.sm {
    font-size: 10px;
}

/* Toggle */
.cc-toggle {
    position: relative;
    display: inline-block;
    width: 36px;
    height: 20px;
    flex-shrink: 0;
}

.cc-toggle.sm {
    width: 30px;
    height: 16px;
}

.cc-toggle input {
    opacity: 0;
    width: 0;
    height: 0;
}

.cc-toggle-track {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--muted);
    border-radius: 999px;
    transition: 0.2s;
}

.cc-toggle-track::before {
    content: "";
    position: absolute;
    height: 14px;
    width: 14px;
    left: 3px;
    bottom: 3px;
    background: white;
    border-radius: 50%;
    transition: 0.2s;
}

.cc-toggle.sm .cc-toggle-track::before {
    height: 10px;
    width: 10px;
}

.cc-toggle input:checked + .cc-toggle-track {
    background: #4ade80;
}

.cc-toggle input:checked + .cc-toggle-track::before {
    transform: translateX(16px);
}

.cc-toggle.sm input:checked + .cc-toggle-track::before {
    transform: translateX(14px);
}

.cc-toggle input:disabled + .cc-toggle-track {
    opacity: 0.3;
    cursor: not-allowed;
}

/* Review */
.cc-review {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.cc-review-section h4 {
    margin: 0 0 8px;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: var(--muted);
}

.cc-review-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: var(--card);
    font-size: 14px;
    font-weight: 600;
}

.cc-review-icon {
    font-size: 20px;
}

.cc-review-pricing {
    margin-left: auto;
    font-size: 10px;
    color: var(--muted);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.3px;
}

.cc-review-warning {
    margin-top: 6px;
    padding: 8px 12px;
    border-radius: 8px;
    background: #f59e0b12;
    border: 1px solid #f59e0b30;
    font-size: 11px;
    color: #fbbf24;
    line-height: 1.4;
}

.cc-review-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.cc-review-tag {
    padding: 6px 12px;
    border-radius: 999px;
    border: 1px solid var(--border);
    background: var(--chip);
    font-size: 11px;
}

.cc-review-tag.core {
    border-color: #4ade8030;
    color: #4ade80;
    background: #4ade8010;
}

.cc-review-none {
    font-size: 12px;
    color: var(--muted);
}

.cc-review-infra {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 14px 16px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: var(--card);
    font-size: 12px;
}

.cc-muted {
    color: var(--muted);
}

/* Onboarding Nav */
.cc-ob-nav {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 0 32px;
    border-top: 1px solid var(--border);
    position: sticky;
    bottom: 0;
    background: var(--bg);
    margin-top: auto;
}

.cc-ob-spacer {
    flex: 1;
}

.cc-ob-back {
    padding: 10px 20px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--fg);
    font-size: 13px;
    cursor: pointer;
    transition: all 0.12s ease;
}

.cc-ob-back:hover {
    border-color: var(--fg);
}

.cc-ob-next {
    padding: 10px 28px;
    border-radius: 10px;
    border: 1px solid var(--btn-primary-bg);
    background: var(--btn-primary-bg);
    color: var(--btn-primary-fg);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.12s ease;
}

.cc-ob-next:hover {
    filter: brightness(1.1);
}

.cc-ob-deploy {
    padding: 10px 28px;
    border-radius: 10px;
    border: none;
    background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
    color: var(--btn-primary-fg);
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s ease;
    min-width: 140px;
}

.cc-ob-deploy:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 20px #4ade8040;
}

.cc-deploying {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}

.cc-spinner {
    width: 14px;
    height: 14px;
    border: 2px solid var(--border);
    border-top-color: var(--btn-primary-fg);
    border-radius: 50%;
    animation: cc-spin 0.6s linear infinite;
}

@keyframes cc-spin {
    to { transform: rotate(360deg); }
}

/* ===================== ACTIVE (CHAT) ===================== */
.cc-active {
    display: grid;
    grid-template-columns: 260px 1fr 280px;
    height: calc(100vh - 60px);
    overflow: hidden;
}

/* Panels */
.cc-panel {
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: width 0.2s ease;
}

.cc-panel.cc-settings {
    border-right: none;
    border-left: 1px solid var(--border);
}

.cc-panel.collapsed {
    width: 42px;
    min-width: 42px;
    max-width: 42px;
}

.cc-panel-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 14px;
    border-bottom: 1px solid var(--border);
    cursor: pointer;
    user-select: none;
}

.cc-panel-head h3 {
    margin: 0;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
    white-space: nowrap;
}

.cc-panel.collapsed .cc-panel-head h3 {
    display: none;
}

.cc-panel-toggle {
    font-size: 12px;
    color: var(--muted);
}

.cc-panel-body {
    flex: 1;
    overflow-y: auto;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 14px;
}

/* Status Bar */
.cc-status-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border-radius: 10px;
    background: #4ade8008;
    border: 1px solid #4ade8020;
    font-size: 12px;
    font-weight: 600;
    color: #4ade80;
}

.cc-status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
}

.cc-status-dot.live {
    background: #4ade80;
    box-shadow: 0 0 8px #4ade8060;
    animation: cc-glow 2s ease-in-out infinite;
}

@keyframes cc-glow {
    0%, 100% { box-shadow: 0 0 4px #4ade8040; }
    50% { box-shadow: 0 0 12px #4ade8080; }
}

/* Activity List */
.cc-activity-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.cc-act-item {
    display: flex;
    gap: 8px;
    padding: 8px 10px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--card);
    align-items: flex-start;
}

.cc-act-icon {
    font-size: 14px;
    flex-shrink: 0;
    margin-top: 1px;
}

.cc-act-content {
    flex: 1;
    min-width: 0;
}

.cc-act-label {
    font-size: 11px;
    font-weight: 600;
}

.cc-act-detail {
    font-size: 10px;
    color: var(--muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.cc-act-time {
    font-size: 9px;
    color: var(--muted);
    margin-top: 2px;
}

.cc-act-status {
    font-size: 9px;
    padding: 2px 6px;
    border-radius: 999px;
    font-weight: 600;
    flex-shrink: 0;
    text-transform: uppercase;
    letter-spacing: 0.3px;
}

.cc-act-status.complete {
    background: #4ade8015;
    color: #4ade80;
}

.cc-act-status.active {
    background: #3b82f615;
    color: #3b82f6;
}

/* Sub-Agents */
.cc-subagents h4 {
    margin: 0 0 8px;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: var(--muted);
}

.cc-sa-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 10px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--card);
    margin-bottom: 4px;
}

.cc-sa-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
}

.cc-sa-dot.active {
    background: #4ade80;
    box-shadow: 0 0 6px #4ade8060;
}

.cc-sa-dot.idle {
    background: #666;
}

.cc-sa-name {
    font-size: 11px;
    font-weight: 600;
    white-space: nowrap;
}

.cc-sa-task {
    font-size: 10px;
    color: var(--muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* ===================== CENTER TABS ===================== */
.cc-center-tabs {
    display: flex;
    gap: 0;
    border-bottom: 1px solid var(--border);
    padding: 0 24px;
    flex-shrink: 0;
}

.cc-center-tab {
    position: relative;
    padding: 12px 20px;
    border: none;
    background: transparent;
    color: var(--muted);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.3px;
    text-transform: uppercase;
    cursor: pointer;
    transition: color 0.15s ease;
    display: inline-flex;
    align-items: center;
    gap: 6px;
}

.cc-center-tab:hover {
    color: var(--fg);
}

.cc-center-tab.active {
    color: var(--fg);
}

.cc-center-tab.active::after {
    content: "";
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--fg);
    border-radius: 2px 2px 0 0;
}

.cc-log-badge {
    font-size: 10px;
    min-width: 18px;
    height: 18px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    background: #ef4444;
    color: #fff;
    font-weight: 700;
    padding: 0 5px;
    line-height: 1;
}

/* ===================== MONITOR ===================== */
.cc-monitor {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 0;
}

.cc-mon-overview {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 8px;
    padding: 16px 24px;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
}

.cc-mon-stat {
    padding: 10px 12px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: var(--card);
}

.cc-mon-stat-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: var(--muted);
    font-weight: 600;
    margin-bottom: 4px;
}

.cc-mon-stat-val {
    font-size: 13px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 6px;
}

.cc-mon-stat-val .cc-status-dot {
    width: 6px;
    height: 6px;
}

.cc-mon-log-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 24px;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
}

.cc-mon-log-header h3 {
    margin: 0;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    font-weight: 600;
}

.cc-mon-log-controls {
    display: flex;
    gap: 8px;
    align-items: center;
}

.cc-mon-filter {
    padding: 4px 10px;
    border-radius: 6px;
    border: 1px solid var(--border);
    background: var(--card);
    color: var(--fg);
    font-size: 11px;
    outline: none;
    cursor: pointer;
}

.cc-mon-clear {
    padding: 4px 10px;
    border-radius: 6px;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--muted);
    font-size: 11px;
    cursor: pointer;
    transition: all 0.12s ease;
}

.cc-mon-clear:hover {
    color: var(--fg);
    border-color: var(--fg);
}

.cc-mon-terminal {
    flex: 1;
    overflow-y: auto;
    padding: 12px 24px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 11px;
    line-height: 1.7;
    background: var(--code-bg, rgba(0, 0, 0, 0.3));
}

.cc-log-line {
    display: flex;
    gap: 8px;
    padding: 2px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

.cc-log-line:last-child {
    border-bottom: none;
}

.cc-log-time {
    color: var(--muted);
    flex-shrink: 0;
    opacity: 0.6;
}

.cc-log-level {
    flex-shrink: 0;
    font-weight: 700;
    min-width: 42px;
    text-align: right;
}

.cc-log-level.info {
    color: #60a5fa;
}

.cc-log-level.warn {
    color: #fbbf24;
}

.cc-log-level.error {
    color: #f87171;
}

.cc-log-level.debug {
    color: #a78bfa;
}

.cc-log-source {
    color: #4ade80;
    flex-shrink: 0;
}

.cc-log-msg {
    color: var(--fg);
    word-break: break-word;
}

.cc-log-line.error .cc-log-msg {
    color: #f87171;
}

.cc-log-line.warn .cc-log-msg {
    color: #fbbf24;
}

.cc-log-empty {
    text-align: center;
    padding: 40px 0;
    color: var(--muted);
    font-family: inherit;
    font-size: 13px;
}

.mono {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

/* ===================== CHAT ===================== */
.cc-chat-main {
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.cc-chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 24px 24px 16px;
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.cc-msg {
    display: flex;
    max-width: 680px;
}

.cc-msg.user {
    align-self: flex-end;
}

.cc-msg.assistant {
    align-self: flex-start;
}

.cc-msg-bubble {
    padding: 14px 16px;
    border-radius: 14px;
    border: 1px solid var(--border);
    background: var(--card);
    max-width: 100%;
}

.cc-msg.user .cc-msg-bubble {
    background: var(--bubble-user);
    border-color: var(--bubble-user-border);
}

.cc-msg-role {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--muted);
    margin-bottom: 6px;
}

.cc-msg-claw-label {
    display: flex;
    align-items: center;
    gap: 6px;
}

.cc-msg-sa-tag {
    font-size: 9px;
    padding: 1px 6px;
    border-radius: 999px;
    background: #3b82f615;
    color: #3b82f6;
    text-transform: none;
    letter-spacing: 0;
}

.cc-msg-text {
    font-size: 13px;
    line-height: 1.6;
    color: var(--fg);
}

.cc-msg-text :deep(strong) {
    font-weight: 600;
}

.cc-msg-text :deep(code) {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
    background: var(--hover-bg);
    padding: 2px 5px;
    border-radius: 4px;
}

.cc-msg-text :deep(.cc-code-block) {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
    background: var(--code-bg);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 14px;
    margin: 8px 0;
    overflow-x: auto;
    white-space: pre;
    display: block;
    line-height: 1.5;
}

.cc-msg-text :deep(.cc-md-table) {
    width: 100%;
    border-collapse: collapse;
    margin: 8px 0;
    font-size: 12px;
}

.cc-msg-text :deep(.cc-md-table td) {
    padding: 6px 10px;
    border-bottom: 1px solid var(--border);
}

.cc-msg-text :deep(.cc-md-table tr:first-child td) {
    font-weight: 600;
    color: var(--muted);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
}

/* Thinking dots */
.cc-thinking {
    display: flex;
    gap: 2px;
    font-size: 24px;
    line-height: 1;
}

.cc-thinking span {
    animation: cc-blink 1.4s infinite;
}

.cc-thinking .dot2 {
    animation-delay: 0.2s;
}

.cc-thinking .dot3 {
    animation-delay: 0.4s;
}

@keyframes cc-blink {
    0%, 60%, 100% { opacity: 0.2; }
    30% { opacity: 1; }
}

/* Chat Input */
.cc-chat-input {
    display: flex;
    gap: 10px;
    padding: 14px 24px 20px;
    border-top: 1px solid var(--border);
}

.cc-input {
    flex: 1;
    padding: 12px 16px;
    border-radius: 12px;
    border: 1px solid var(--border);
    outline: none;
    font-size: 13px;
    background: var(--input-bg);
    color: var(--fg);
    transition: border-color 0.15s ease;
}

.cc-input::placeholder {
    color: var(--muted);
}

.cc-input:focus {
    border-color: var(--fg);
}

.cc-send {
    border-radius: 12px;
    border: 1px solid var(--btn-primary-bg);
    background: var(--btn-primary-bg);
    color: var(--btn-primary-fg);
    padding: 12px 20px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.12s ease, opacity 0.12s ease;
    white-space: nowrap;
}

.cc-send:hover {
    filter: brightness(1.1);
}

.cc-send:disabled {
    opacity: 0.35;
    cursor: not-allowed;
}

/* ===================== SETTINGS ===================== */
.cc-setting-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.cc-setting-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: var(--muted);
    font-weight: 600;
}

.cc-select {
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--card);
    color: var(--fg);
    font-size: 12px;
    outline: none;
}

.cc-setting-input {
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--card);
    color: var(--fg);
    font-size: 12px;
    outline: none;
}

.cc-setting-input:focus,
.cc-select:focus {
    border-color: var(--muted);
}

.cc-setting-textarea {
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--card);
    color: var(--fg);
    font-size: 12px;
    outline: none;
    resize: vertical;
    font-family: inherit;
    line-height: 1.5;
}

.cc-setting-textarea:focus {
    border-color: var(--muted);
}

.cc-settings-int-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.cc-settings-int-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 8px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--card);
}

.cc-settings-int-icon {
    font-size: 14px;
    flex-shrink: 0;
}

.cc-settings-int-name {
    font-size: 11px;
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.cc-settings-int-right {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
}

.cc-danger-btn {
    padding: 8px 14px;
    border-radius: 8px;
    border: 1px solid var(--danger);
    background: transparent;
    color: var(--danger);
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.12s ease;
}

.cc-danger-btn:hover {
    background: #ff5b5b15;
}

/* ===================== RESPONSIVE ===================== */
@media (max-width: 1100px) {
    .cc-active {
        grid-template-columns: 1fr;
    }
    .cc-panel {
        display: none;
    }
}
@media (max-width: 900px) {
    .cc-features {
        grid-template-columns: 1fr;
    }
    .cc-model-grid {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 600px) {
    .cc-title {
        font-size: 28px;
    }
    .cc-hero {
        padding: 24px 16px;
    }
    .cc-onboarding {
        padding: 16px 12px 0;
    }
    .cc-ob-container {
        max-width: 100%;
    }
    .cc-int-grid {
        grid-template-columns: 1fr;
    }
    .cc-chat-input {
        padding: 10px 12px 14px;
    }
    .cc-input {
        padding: 10px 12px;
        font-size: 14px;
    }
    .cc-send {
        padding: 10px 14px;
    }
    .cc-chat-messages {
        padding: 16px 12px;
    }
    .cc-mon-terminal {
        padding: 10px 12px;
        font-size: 10px;
    }
    .cc-log-line {
        flex-wrap: wrap;
    }
    .cc-mon-overview {
        padding: 12px;
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    }
    .cc-center-tabs {
        padding: 0 12px;
    }
}
</style>
