<template>
    <div class="alfredRoot">
        <!-- ── SIDEBAR ── -->
        <aside class="sidePanel">
            <!-- Crest -->
            <div class="crest">
                <div class="crestMonogram">A</div>
                <div class="crestName">Alfred</div>
                <div class="crestSub">Personal Agent Concierge</div>
                <div class="statusRow">
                    <span class="statusDot"></span>
                    <span class="statusLabel">On Duty</span>
                </div>
            </div>

            <!-- Services -->
            <div class="servicesList">
                <div class="servicesLabel">Services</div>
                <button
                    v-for="s in services"
                    :key="s.id"
                    class="serviceBtn"
                    @click="useService(s)"
                >
                    <span class="svcSymbol">{{ s.symbol }}</span>
                    <div class="svcMeta">
                        <div class="svcLabel">{{ s.label }}</div>
                        <div class="svcDesc">{{ s.desc }}</div>
                    </div>
                </button>
            </div>

            <!-- Footer -->
            <div class="sideBase">
                <div class="sideBaseLine">Covenant Secure Cloud</div>
                <div class="sideBaseLine dim">v0.0.3 — Trusted Computing</div>
            </div>
        </aside>

        <!-- ── CHAT ── -->
        <div class="chatWrap">
            <!-- Channel bar -->
            <div class="channelBar">
                <div class="channelTitle">Secured Channel</div>
                <div class="channelPills">
                    <span class="cpill">E2E Encrypted</span>
                    <span class="cpill">TEE-verified</span>
                </div>
            </div>

            <!-- Messages -->
            <div class="messages" ref="messagesEl">
                <div
                    v-for="(m, i) in messages"
                    :key="i"
                    class="msg"
                    :class="m.role"
                >
                    <div class="msgBubble" :class="m.role">
                        <div class="msgRole">{{ m.role === "user" ? "You" : "Alfred" }}</div>
                        <div class="msgText" v-html="formatMsg(m.text)"></div>
                    </div>
                </div>

                <!-- Thinking -->
                <div v-if="thinking" class="msg assistant">
                    <div class="msgBubble assistant">
                        <div class="msgRole">Alfred</div>
                        <div class="thinkWrap">
                            <span class="thinkLabel">One moment</span>
                            <span class="thinkDots">
                                <span class="td1">.</span><span class="td2">.</span><span class="td3">.</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Input bar -->
            <div class="inputBar">
                <input
                    v-model="input"
                    class="chatInput"
                    placeholder="Your instructions, sir…"
                    @keydown.enter="send"
                    :disabled="thinking"
                />
                <button
                    class="dispatchBtn"
                    :disabled="!input.trim() || thinking"
                    @click="send"
                >
                    Dispatch
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
        text: "Good evening. I am **Alfred**, your personal agent concierge on the Covenant network.\n\nI am at your complete disposal — whether you require an agent deployed, a status briefing, resource allocation, or simply need something done with precision and discretion.\n\nHow may I be of service?",
    },
]);

const services = [
    {
        id: "deploy",
        symbol: "◆",
        label: "Deploy Agent",
        desc: "Configure and launch a new agent",
        prompt: "I need a new agent deployed. Here are the requirements:",
    },
    {
        id: "status",
        symbol: "◈",
        label: "Status Report",
        desc: "Review active agent disposition",
        prompt: "Give me a full status report on all running agents.",
    },
    {
        id: "briefing",
        symbol: "○",
        label: "Briefing",
        desc: "Intelligence summary of your stack",
        prompt: "Provide me with a full briefing on my Covenant infrastructure.",
    },
    {
        id: "scale",
        symbol: "⬡",
        label: "Scale Resources",
        desc: "Adjust compute allocation",
        prompt: "I need to scale my compute resources. Help me allocate GPU capacity.",
    },
    {
        id: "logs",
        symbol: "≡",
        label: "Review Logs",
        desc: "Examine agent activity records",
        prompt: "Pull the logs for my agents and summarize any anomalies.",
    },
    {
        id: "decommission",
        symbol: "✕",
        label: "Decommission",
        desc: "Terminate and retire an agent",
        prompt: "I need to decommission an agent. Guide me through the process.",
    },
];

const responses = {
    default: `Very good, sir. Allow me to break that down.\n\n**Configuration Recommendation**\nBased on your specifications, I would suggest the following:\n- **Runtime:** Python 3.12 — CUDA-enabled container\n- **Compute:** 1× NVIDIA H100 SXM (80GB HBM3)\n- **Region:** US-West — lowest latency to your registered wallet\n- **Storage:** 10GB persistent volume, encrypted at rest\n\n**Dependencies**\nI shall auto-detect and install the required packages from your description.\n\n**Deployment**\nUpon your confirmation, I will have the agent deployed to the Covenant compute network forthwith.\n\nShall I proceed with this configuration, or would you prefer to adjust the specifications?`,

    proceed: `Understood. Deploying your agent now.\n\n\`\`\`\n✓ Container image built          3.2s\n✓ Dependencies installed          8.1s\n✓ GPU node allocated: chi-1       0.4s\n✓ Secure enclave initialized      1.0s\n✓ Health check passed             1.1s\n✓ Endpoint live                   0.2s\n\`\`\`\n\nYour agent is live and operational, sir.\n\n- **Endpoint:** \`https://agent-x7k2.covenant.cloud/v1\`\n- **Node:** Chicago — Equinix CH1 — H100 SXM\n- **Enclave:** TEE-verified — attestation confirmed\n- **Status:** Running\n\nI'll keep watch. You may manage this agent from the Agents tab, or instruct me directly should anything require adjustment.`,

    status: `Here is the current disposition of your agents, sir.\n\n| Agent | Node | GPU | Status | Uptime |\n|-------|------|-----|--------|--------|\n| web-scraper-01 | sfo-1 | A100 80GB | Running | 14d 6h |\n| llm-gateway | nyc-1 | H100 SXM | Running | 7d 2h |\n| signal-bot | chi-1 | H100 SXM | Scaling | 1d 18h |\n\nAll agents are performing within acceptable parameters. The signal-bot is currently scaling to accommodate elevated load — nothing to be concerned about.\n\nShall I drill into any of them?`,

    briefing: `Certainly. Here is your infrastructure briefing.\n\n**Active Agents:** 3 running, 1 halted\n**Monthly Compute Cost:** $842.40 (projected)\n**Vault Balance:** 1,240 USDC\n**Nodes:** Chicago, San Francisco, New York\n\n**Incidents (last 7 days):** None worth your attention.\n\n**Recommendations:**\n- signal-bot is nearing capacity — I'd suggest pre-emptive scaling\n- The halted agent has been idle for 12 days; consider decommissioning\n- Your vault balance covers approximately 17 more days at current burn rate\n\nShall I take action on any of the above?`,

    logs: `Of course. Reviewing agent logs now.\n\n\`\`\`\n[web-scraper-01]  No anomalies detected. 1,847 URLs processed today.\n[llm-gateway]     Elevated latency at 03:14 UTC — resolved in 42s. No data loss.\n[signal-bot]      Auto-scaled from 1→3 replicas at 08:22 UTC. Operating normally.\n\`\`\`\n\nOverall, your stack is running cleanly, sir. The latency spike on llm-gateway was a transient network event — I have noted it in the incident log.\n\nIs there a specific agent or timeframe you'd like examined in more detail?`,

    decommission: `Understood. Decommissioning an agent is irreversible, so I'll walk you through the process carefully.\n\nPlease specify which agent you wish to terminate, and I will:\n\n1. **Halt** — cease all active processes gracefully\n2. **Archive** — preserve logs and configuration for 30 days\n3. **Release** — free GPU allocation and terminate billing\n4. **Confirm** — provide a full decommission receipt\n\nWhich agent shall I decommission?`,

    scale: `Certainly. Let's review your current allocation and determine the optimal scaling strategy.\n\n**Current Resources:**\n- 3 active GPU nodes (2× A100, 1× H100 SXM)\n- Average utilization: 64%\n- Peak utilization: 91% (signal-bot, this morning)\n\n**Available Options:**\n- **Vertical scaling** — upgrade signal-bot to H100 SXM (recommended)\n- **Horizontal scaling** — add a replica for redundancy\n- **Pre-emptive scaling** — schedule additional capacity for expected peak\n\nWhich approach suits your requirements, sir?`,

    help: `My capabilities are rather extensive. Allow me to enumerate them.\n\n- **Deploy** — Describe an agent and I'll configure and launch it on the Covenant network\n- **Status** — Full disposition report of your active agents\n- **Briefing** — Infrastructure summary with cost analysis and recommendations\n- **Scale** — Adjust GPU allocation, replicas, and regions\n- **Logs** — Review agent activity and surface anomalies\n- **Decommission** — Retire agents with proper archival\n- **Secure Comms** — All interactions are TEE-verified and end-to-end encrypted\n\nSimply tell me what you need, and consider it done.`,
};

function pickResponse(text) {
    const lower = text.toLowerCase();
    if (
        lower.includes("proceed") ||
        lower.includes("yes") ||
        lower.includes("confirm") ||
        lower.includes("deploy") ||
        lower.includes("go ahead") ||
        lower.includes("launch")
    )
        return responses.proceed;
    if (
        lower.includes("status") ||
        lower.includes("running") ||
        lower.includes("list agents")
    )
        return responses.status;
    if (
        lower.includes("brief") ||
        lower.includes("overview") ||
        lower.includes("summary") ||
        lower.includes("infrastructure")
    )
        return responses.briefing;
    if (
        lower.includes("log") ||
        lower.includes("anomal") ||
        lower.includes("review")
    )
        return responses.logs;
    if (
        lower.includes("decommission") ||
        lower.includes("destroy") ||
        lower.includes("terminate") ||
        lower.includes("retire")
    )
        return responses.decommission;
    if (
        lower.includes("scale") ||
        lower.includes("gpu") ||
        lower.includes("resource") ||
        lower.includes("compute")
    )
        return responses.scale;
    if (lower.includes("help") || lower.includes("what can") || lower.includes("capabilities"))
        return responses.help;
    return responses.default;
}

function formatMsg(text) {
    return text
        .replace(/```([\s\S]*?)```/g, '<pre class="codeBlock">$1</pre>')
        .replace(/`([^`]+)`/g, "<code>$1</code>")
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\|(.+)\|/g, (match) => {
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

    const delay = 900 + Math.random() * 1400;
    await new Promise((r) => setTimeout(r, delay));

    messages.push({ role: "assistant", text: pickResponse(text) });
    thinking.value = false;
    await scrollToBottom();
}

function useService(s) {
    input.value = s.prompt;
}
</script>

<style scoped>
/* ── Alfred Design Tokens ── */
.alfredRoot {
    --a-bg: #09090b;
    --a-surface: #0c0b0f;
    --a-card: #0f0d12;
    --a-border: #1d1b21;
    --a-fg: #f0ede8;
    --a-muted: #6e6a65;
    --a-gold: #c9a84c;
    --a-gold-glow: rgba(201, 168, 76, 0.18);
    --a-gold-dim: rgba(201, 168, 76, 0.22);
    --a-green: #4ade80;

    display: grid;
    grid-template-columns: 268px 1fr;
    height: calc(100vh - 61px);
    overflow: hidden;
    background: var(--a-bg);
    color: var(--a-fg);
    font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
}

/* ══════════════════════════════
   SIDEBAR
══════════════════════════════ */
.sidePanel {
    background: var(--a-surface);
    border-right: 1px solid var(--a-border);
    display: flex;
    flex-direction: column;
    overflow-y: auto;
}

/* Crest */
.crest {
    padding: 30px 22px 26px;
    border-bottom: 1px solid var(--a-border);
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 3px;
}

.crestMonogram {
    font-family: Georgia, "Times New Roman", serif;
    font-size: 52px;
    font-weight: 700;
    line-height: 1;
    letter-spacing: -2px;
    color: var(--a-gold);
    margin-bottom: 10px;
    /* subtle glow */
    text-shadow: 0 0 32px var(--a-gold-glow);
}

.crestName {
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 3.5px;
    text-transform: uppercase;
    color: var(--a-fg);
}

.crestSub {
    font-size: 11px;
    color: var(--a-muted);
    letter-spacing: 0.3px;
    margin-top: 2px;
}

.statusRow {
    display: flex;
    align-items: center;
    gap: 7px;
    margin-top: 14px;
}

.statusDot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--a-green);
    box-shadow: 0 0 8px rgba(74, 222, 128, 0.55);
    animation: pulse 2.6s ease-in-out infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
}

.statusLabel {
    font-size: 10px;
    letter-spacing: 1.4px;
    text-transform: uppercase;
    color: var(--a-muted);
}

/* Services list */
.servicesList {
    flex: 1;
    padding: 18px 12px 12px;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.servicesLabel {
    font-size: 9px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--a-muted);
    padding: 0 8px 12px;
    opacity: 0.7;
}

.serviceBtn {
    display: flex;
    align-items: flex-start;
    gap: 13px;
    padding: 10px 10px;
    border-radius: 10px;
    border: 1px solid transparent;
    background: transparent;
    color: var(--a-fg);
    font-size: 12px;
    cursor: pointer;
    text-align: left;
    transition: background 0.13s ease, border-color 0.13s ease;
    width: 100%;
}

.serviceBtn:hover {
    background: rgba(255, 255, 255, 0.04);
    border-color: var(--a-border);
}

.svcSymbol {
    font-size: 12px;
    color: var(--a-gold);
    flex-shrink: 0;
    width: 14px;
    margin-top: 1px;
    opacity: 0.85;
}

.svcMeta {
    display: flex;
    flex-direction: column;
    gap: 3px;
}

.svcLabel {
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.15px;
    color: var(--a-fg);
}

.svcDesc {
    font-size: 11px;
    color: var(--a-muted);
    line-height: 1.4;
}

/* Side footer */
.sideBase {
    padding: 16px 22px;
    border-top: 1px solid var(--a-border);
}

.sideBaseLine {
    font-size: 10px;
    letter-spacing: 0.3px;
    color: var(--a-muted);
    line-height: 1.9;
}

.sideBaseLine.dim {
    opacity: 0.45;
}

/* ══════════════════════════════
   CHAT AREA
══════════════════════════════ */
.chatWrap {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--a-bg);
    /* very subtle vignette */
    background-image: radial-gradient(ellipse at 50% 0%, #14111a 0%, #09090b 60%);
}

/* Channel bar */
.channelBar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 11px 28px;
    border-bottom: 1px solid var(--a-border);
    background: var(--a-surface);
}

.channelTitle {
    font-size: 10px;
    letter-spacing: 2.5px;
    text-transform: uppercase;
    color: var(--a-muted);
}

.channelPills {
    display: flex;
    gap: 6px;
}

.cpill {
    font-size: 10px;
    padding: 3px 9px;
    border-radius: 999px;
    border: 1px solid var(--a-border);
    color: var(--a-muted);
    letter-spacing: 0.2px;
}

/* Messages */
.messages {
    flex: 1;
    overflow-y: auto;
    padding: 32px 36px 24px;
    display: flex;
    flex-direction: column;
    gap: 22px;
    /* custom scrollbar */
    scrollbar-width: thin;
    scrollbar-color: var(--a-border) transparent;
}

.messages::-webkit-scrollbar {
    width: 4px;
}
.messages::-webkit-scrollbar-track {
    background: transparent;
}
.messages::-webkit-scrollbar-thumb {
    background: var(--a-border);
    border-radius: 4px;
}

.msg {
    display: flex;
    max-width: 740px;
}

.msg.user {
    align-self: flex-end;
}

.msg.assistant {
    align-self: flex-start;
}

.msgBubble {
    padding: 16px 20px;
    border-radius: 16px;
    border: 1px solid var(--a-border);
    background: var(--a-card);
    max-width: 100%;
}

/* Alfred's messages get the gold accent */
.msgBubble.assistant {
    border-color: var(--a-gold-dim);
    background: #0f0c14;
    /* very subtle left glow */
    box-shadow: -2px 0 0 0 var(--a-gold-dim), 0 0 28px rgba(201, 168, 76, 0.04);
}

.msgBubble.user {
    background: #141119;
    border-color: rgba(255, 255, 255, 0.08);
}

.msgRole {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-bottom: 9px;
}

.msgBubble.assistant .msgRole {
    color: var(--a-gold);
}

.msgBubble.user .msgRole {
    color: var(--a-muted);
}

.msgText {
    font-size: 13px;
    line-height: 1.68;
    color: var(--a-fg);
}

.msgText :deep(strong) {
    font-weight: 600;
    color: #fff;
}

.msgText :deep(code) {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
    background: rgba(255, 255, 255, 0.07);
    padding: 2px 6px;
    border-radius: 4px;
    color: var(--a-gold);
}

.msgText :deep(.codeBlock) {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
    background: #080709;
    border: 1px solid var(--a-border);
    border-left: 2px solid var(--a-gold);
    border-radius: 10px;
    padding: 14px 16px;
    margin: 10px 0;
    overflow-x: auto;
    white-space: pre;
    display: block;
    line-height: 1.55;
    color: #c0b8b0;
}

.msgText :deep(.mdTable) {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0;
    font-size: 12px;
}

.msgText :deep(.mdTable td) {
    padding: 8px 12px;
    border-bottom: 1px solid var(--a-border);
}

.msgText :deep(.mdTable tr:first-child td) {
    font-weight: 700;
    color: var(--a-muted);
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    padding-bottom: 9px;
}

/* Thinking */
.thinkWrap {
    display: flex;
    align-items: baseline;
    gap: 5px;
}

.thinkLabel {
    font-size: 12px;
    color: var(--a-muted);
    font-style: italic;
    letter-spacing: 0.4px;
}

.thinkDots span {
    animation: alfBlink 1.6s ease-in-out infinite;
    color: var(--a-gold);
    font-size: 18px;
}

.td2 { animation-delay: 0.22s !important; }
.td3 { animation-delay: 0.44s !important; }

@keyframes alfBlink {
    0%, 60%, 100% { opacity: 0.12; }
    30% { opacity: 1; }
}

/* ── Input bar ── */
.inputBar {
    display: flex;
    gap: 10px;
    padding: 18px 36px 26px;
    border-top: 1px solid var(--a-border);
    background: var(--a-surface);
}

.chatInput {
    flex: 1;
    padding: 13px 18px;
    border-radius: 12px;
    border: 1px solid var(--a-border);
    outline: none;
    font-size: 13px;
    background: #0b0a0e;
    color: var(--a-fg);
    letter-spacing: 0.2px;
    transition: border-color 0.15s ease;
}

.chatInput::placeholder {
    color: #3f3c42;
    font-style: italic;
}

.chatInput:focus {
    border-color: var(--a-gold);
}

.dispatchBtn {
    border-radius: 12px;
    border: 1px solid var(--a-gold);
    background: transparent;
    color: var(--a-gold);
    padding: 13px 24px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    cursor: pointer;
    transition: background 0.13s ease, color 0.13s ease, box-shadow 0.13s ease;
    white-space: nowrap;
}

.dispatchBtn:hover {
    background: var(--a-gold);
    color: #09090b;
    box-shadow: 0 0 24px var(--a-gold-glow);
}

.dispatchBtn:disabled {
    opacity: 0.2;
    cursor: not-allowed;
}

/* ── Responsive ── */
@media (max-width: 700px) {
    .alfredRoot {
        grid-template-columns: 1fr;
    }
    .sidePanel {
        display: none;
    }
    .messages {
        padding: 20px 18px 16px;
    }
    .inputBar {
        padding: 14px 18px 20px;
    }
}
</style>
