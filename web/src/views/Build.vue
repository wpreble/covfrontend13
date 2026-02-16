<template>
    <div class="wrap">
        <div class="sidebar">
            <div class="sideHead">
                <h3>Agent Builder</h3>
                <p>Build & deploy via chat</p>
            </div>

            <div class="templates">
                <button
                    v-for="t in templates"
                    :key="t.id"
                    class="templateBtn"
                    @click="useTemplate(t)"
                >
                    <span class="tIcon">{{ t.icon }}</span>
                    <span class="tLabel">{{ t.label }}</span>
                </button>
            </div>

            <div class="sideFooter">
                <span class="tiny">Templates auto-fill a prompt</span>
            </div>
        </div>

        <div class="chatArea">
            <!-- Messages -->
            <div class="messages" ref="messagesEl">
                <div
                    v-for="(m, i) in messages"
                    :key="i"
                    class="msg"
                    :class="m.role"
                >
                    <div class="msgBubble">
                        <div class="msgRole">{{ m.role === "user" ? "You" : "Covenant AI" }}</div>
                        <div class="msgText" v-html="formatMsg(m.text)"></div>
                    </div>
                </div>

                <div v-if="thinking" class="msg assistant">
                    <div class="msgBubble">
                        <div class="msgRole">Covenant AI</div>
                        <div class="msgText thinking">
                            <span class="dot1">.</span><span class="dot2">.</span><span class="dot3">.</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Input -->
            <div class="inputBar">
                <input
                    v-model="input"
                    class="chatInput"
                    placeholder="Describe the agent you want to build..."
                    @keydown.enter="send"
                    :disabled="thinking"
                />
                <button
                    class="sendBtn"
                    :disabled="!input.trim() || thinking"
                    @click="send"
                >
                    Send
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, nextTick } from "vue";

const input = ref("");
const thinking = ref(false);
const messagesEl = ref(null);

const messages = reactive([
    {
        role: "assistant",
        text: "Welcome to the **Agent Builder**. Describe what you'd like to build and I'll help you configure, deploy, and manage it on the Covenant network.\n\nYou can also pick a template from the sidebar to get started quickly.",
    },
]);

const templates = [
    {
        id: "web-scraper",
        icon: "🌐",
        label: "Web Scraper Agent",
        prompt: "Build a web scraping agent that monitors a list of URLs for content changes and stores results in a database.",
    },
    {
        id: "llm-api",
        icon: "🧠",
        label: "LLM API Gateway",
        prompt: "Create an agent that serves as an LLM inference gateway with rate limiting, caching, and multi-model routing.",
    },
    {
        id: "trading-bot",
        icon: "📈",
        label: "Trading Signal Bot",
        prompt: "Deploy a trading signal agent that monitors on-chain DEX activity and sends alerts when specific patterns are detected.",
    },
    {
        id: "data-pipeline",
        icon: "🔄",
        label: "Data Pipeline",
        prompt: "Build an ETL agent that ingests data from multiple APIs, transforms it, and stores results in a vector database.",
    },
    {
        id: "monitor",
        icon: "🔍",
        label: "Uptime Monitor",
        prompt: "Create a monitoring agent that tracks the uptime and response times of my services and notifies me via webhook on failures.",
    },
    {
        id: "cron-agent",
        icon: "⏱️",
        label: "Scheduled Task Runner",
        prompt: "Deploy a cron-based agent that runs scheduled tasks across multiple compute nodes with retry logic and logging.",
    },
];

/* Pre-canned response map */
const cannedResponses = {
    default: `Great, I can help with that. Let me break this down:\n\n**1. Configuration**\nI'll set up the agent with the following defaults:\n- **Runtime:** Python 3.12 on CUDA-enabled container\n- **Compute:** 1x NVIDIA A100 80GB (auto-scaled)\n- **Region:** US-West (lowest latency to your wallet)\n- **Storage:** 10GB persistent volume\n\n**2. Dependencies**\nI'll auto-detect and install required packages from your description.\n\n**3. Deployment**\nOnce confirmed, the agent will be deployed to the Covenant compute network and accessible via your dashboard.\n\nShall I proceed with this configuration, or would you like to adjust anything?`,

    proceed: `Deploying your agent now...\n\n\`\`\`\n✓ Container image built          (3.2s)\n✓ Dependencies installed          (8.1s)\n✓ GPU node allocated: chi-1       (0.4s)\n✓ Health check passed             (1.1s)\n✓ Endpoint live                   (0.2s)\n\`\`\`\n\n**Agent is live!** 🟢\n\n- **Endpoint:** \`https://agent-x7k2.covenant.cloud/v1\`\n- **Node:** Chicago — Equinix CH1 — H100 SXM\n- **Status:** Running\n\nYou can manage this agent from the **Agents** tab, or ask me to make changes here.`,

    status: `Here's the current status of your agents:\n\n| Agent | Node | GPU | Status | Uptime |\n|-------|------|-----|--------|--------|\n| web-scraper-01 | sfo-1 | A100 80GB | 🟢 Running | 14d 6h |\n| llm-gateway | nyc-1 | H100 SXM | 🟢 Running | 7d 2h |\n| signal-bot | chi-1 | H100 SXM | 🟡 Scaling | 1d 18h |\n\nAll agents are healthy. Would you like to drill into any of them?`,

    help: `Here's what I can help you with:\n\n- **Build** — Describe an agent and I'll configure and deploy it\n- **Deploy** — Push a configured agent to the compute network\n- **Scale** — Adjust GPU allocation, replicas, and regions\n- **Monitor** — Check agent status, logs, and metrics\n- **Update** — Modify an agent's code, env vars, or schedule\n- **Destroy** — Tear down an agent and free its resources\n\nJust tell me what you need!`,
};

function pickResponse(userText) {
    const lower = userText.toLowerCase();
    if (lower.includes("proceed") || lower.includes("yes") || lower.includes("confirm") || lower.includes("deploy") || lower.includes("go ahead"))
        return cannedResponses.proceed;
    if (lower.includes("status") || lower.includes("running") || lower.includes("list"))
        return cannedResponses.status;
    if (lower.includes("help") || lower.includes("what can"))
        return cannedResponses.help;
    return cannedResponses.default;
}

function formatMsg(text) {
    // Minimal markdown: bold, inline code, code blocks, newlines
    return text
        .replace(/```([\s\S]*?)```/g, '<pre class="codeBlock">$1</pre>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\|(.+)\|/g, (match) => {
            // Simple table row rendering
            const cells = match
                .split("|")
                .filter((c) => c.trim())
                .map((c) => `<td>${c.trim()}</td>`)
                .join("");
            return `<tr>${cells}</tr>`;
        })
        .replace(
            /(<tr>.*<\/tr>\n?)+/g,
            (match) => `<table class="mdTable">${match}</table>`,
        )
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

    thinking.value = true;
    await scrollToBottom();

    // Simulate response delay
    const delay = 800 + Math.random() * 1500;
    await new Promise((r) => setTimeout(r, delay));

    const response = pickResponse(text);
    messages.push({ role: "assistant", text: response });
    thinking.value = false;
    await scrollToBottom();
}

function useTemplate(t) {
    input.value = t.prompt;
}
</script>

<style scoped>
.wrap {
    display: grid;
    grid-template-columns: 240px 1fr;
    height: calc(100vh - 60px);
    overflow: hidden;
}

/* SIDEBAR */
.sidebar {
    border-right: 1px solid var(--border);
    padding: 18px 14px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    overflow-y: auto;
}

.sideHead h3 {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.35px;
    text-transform: uppercase;
}
.sideHead p {
    margin: 4px 0 0;
    font-size: 12px;
    color: var(--muted);
}

.templates {
    display: grid;
    gap: 6px;
    flex: 1;
}

.templateBtn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border-radius: 12px;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--fg);
    font-size: 12px;
    cursor: pointer;
    text-align: left;
    transition:
        background 0.12s ease,
        border-color 0.12s ease;
}
.templateBtn:hover {
    background: var(--hover-bg);
    border-color: var(--fg);
}

.tIcon {
    font-size: 16px;
    flex-shrink: 0;
}
.tLabel {
    line-height: 1.35;
}

.sideFooter {
    padding-top: 8px;
    border-top: 1px solid var(--border);
}

/* CHAT AREA */
.chatArea {
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.messages {
    flex: 1;
    overflow-y: auto;
    padding: 24px 24px 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.msg {
    display: flex;
    max-width: 700px;
}

.msg.user {
    align-self: flex-end;
}
.msg.assistant {
    align-self: flex-start;
}

.msgBubble {
    padding: 14px 16px;
    border-radius: 16px;
    border: 1px solid var(--border);
    background: var(--card);
    max-width: 100%;
}

.msg.user .msgBubble {
    background: var(--hover-bg);
    border-color: var(--border);
}

.msgRole {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    color: var(--muted);
    margin-bottom: 6px;
}

.msgText {
    font-size: 13px;
    line-height: 1.6;
    color: var(--fg);
}

.msgText :deep(strong) {
    font-weight: 600;
}

.msgText :deep(code) {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
        monospace;
    font-size: 12px;
    background: var(--chip);
    padding: 2px 5px;
    border-radius: 4px;
}

.msgText :deep(.codeBlock) {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
        monospace;
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

.msgText :deep(.mdTable) {
    width: 100%;
    border-collapse: collapse;
    margin: 8px 0;
    font-size: 12px;
}
.msgText :deep(.mdTable td) {
    padding: 6px 10px;
    border-bottom: 1px solid var(--border);
}
.msgText :deep(.mdTable tr:first-child td) {
    font-weight: 600;
    color: var(--muted);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
}

/* Thinking dots */
.thinking {
    display: flex;
    gap: 2px;
    font-size: 24px;
    line-height: 1;
}
.thinking span {
    animation: blink 1.4s infinite;
}
.dot2 {
    animation-delay: 0.2s !important;
}
.dot3 {
    animation-delay: 0.4s !important;
}
@keyframes blink {
    0%,
    60%,
    100% {
        opacity: 0.2;
    }
    30% {
        opacity: 1;
    }
}

/* INPUT BAR */
.inputBar {
    display: flex;
    gap: 10px;
    padding: 14px 24px 20px;
    border-top: 1px solid var(--border);
}

.chatInput {
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
.chatInput::placeholder {
    color: var(--muted);
}
.chatInput:focus {
    border-color: var(--fg);
}

.sendBtn {
    border-radius: 12px;
    border: 1px solid var(--fg);
    background: var(--fg);
    color: var(--btn-primary-fg);
    padding: 12px 20px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition:
        background 0.12s ease,
        opacity 0.12s ease;
    white-space: nowrap;
}
.sendBtn:hover {
    background: var(--btn-primary-bg);
}
.sendBtn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
}

.tiny {
    font-size: 12px;
    color: var(--muted);
}

@media (max-width: 680px) {
    .wrap {
        grid-template-columns: 1fr;
    }
    .sidebar {
        display: none;
    }
}
</style>
