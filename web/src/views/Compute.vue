<template>
    <div class="wrap">
        <div class="pagehead">
            <div>
                <h2>Compute Network</h2>
                <p>Decentralized GPU cluster — live node status</p>
            </div>

            <div class="pillbar">
                <span class="pill">
                    Nodes:
                    <strong>{{ nodes.length }}</strong>
                </span>
                <span class="pill">
                    Total GPUs:
                    <strong>{{ totalGpus }}</strong>
                </span>
                <span class="pill">
                    Online:
                    <strong class="online">{{ onlineCount }}</strong>
                </span>
            </div>
        </div>

        <div class="subtabs">
            <button
                class="subtab"
                :class="{ active: activeTab === 'deploy' }"
                @click="activeTab = 'deploy'"
            >
                Deploy
            </button>
            <button
                class="subtab"
                :class="{ active: activeTab === 'command' }"
                @click="activeTab = 'command'"
            >
                Command
            </button>
        </div>

        <template v-if="activeTab === 'deploy'">
            <section class="card deployCard">
                <h3>Deploy Model</h3>
                <p class="desc">Select a model and GPU tier to spin up on dedicated compute.</p>

                <div class="deployForm">
                    <div class="fieldGroup">
                        <label class="fieldLabel">Model Source</label>
                        <div class="sourceToggle">
                            <button
                                class="srcBtn"
                                :class="{ active: modelSource === 'your' }"
                                @click="modelSource = 'your'"
                            >
                                Your Models
                            </button>
                            <button
                                class="srcBtn"
                                :class="{ active: modelSource === 'select' }"
                                @click="modelSource = 'select'"
                            >
                                Model Selection
                            </button>
                        </div>
                    </div>

                    <div class="fieldGroup">
                        <label class="fieldLabel" for="modelSelect">
                            {{ modelSource === 'your' ? 'Your Fine-Tuned Models' : 'Available Models' }}
                        </label>
                        <div class="selectWrap">
                            <select id="modelSelect" v-model="selectedModel" class="selectInput">
                                <option value="" disabled>Choose a model...</option>
                                <template v-if="modelSource === 'your'">
                                    <option v-for="m in yourModels" :key="m.id" :value="m.id">
                                        {{ m.name }} — {{ m.params }}
                                    </option>
                                </template>
                                <template v-else>
                                    <option v-for="m in availableModels" :key="m.id" :value="m.id">
                                        {{ m.name }} — {{ m.params }}
                                    </option>
                                </template>
                            </select>
                        </div>
                    </div>

                    <template v-if="selectedModelObj">
                        <div class="fieldGroup">
                            <label class="fieldLabel">Recommended GPU Tier</label>
                            <div class="gpuOptions">
                                <button
                                    v-for="gpu in recommendedGpus"
                                    :key="gpu.id"
                                    class="gpuCard"
                                    :class="{ selected: selectedGpu === gpu.id, recommended: gpu.recommended }"
                                    @click="selectedGpu = gpu.id"
                                >
                                    <div class="gpuName">{{ gpu.name }}</div>
                                    <div class="gpuMeta">{{ gpu.vram }} VRAM &middot; {{ gpu.throughput }}</div>
                                    <div class="gpuPrice">${{ gpu.price.toFixed(2) }}<span class="gpuPriceUnit">/hr</span></div>
                                    <span v-if="gpu.recommended" class="gpuBadge">Recommended</span>
                                </button>
                            </div>
                        </div>

                        <div class="fieldGroup">
                            <label class="fieldLabel" for="regionSelect">Region</label>
                            <div class="selectWrap">
                                <select id="regionSelect" v-model="selectedRegion" class="selectInput">
                                    <option value="auto">Auto (lowest latency)</option>
                                    <option value="us-west">US West</option>
                                    <option value="us-central">US Central</option>
                                    <option value="us-east">US East</option>
                                </select>
                            </div>
                        </div>

                        <div class="deploySummary">
                            <div class="summaryRow">
                                <span class="summaryK">Model</span>
                                <span class="summaryV mono">{{ selectedModelObj.name }}</span>
                            </div>
                            <div class="summaryRow">
                                <span class="summaryK">Parameters</span>
                                <span class="summaryV mono">{{ selectedModelObj.params }}</span>
                            </div>
                            <div class="summaryRow" v-if="selectedGpuObj">
                                <span class="summaryK">GPU</span>
                                <span class="summaryV mono">{{ selectedGpuObj.name }}</span>
                            </div>
                            <div class="summaryRow">
                                <span class="summaryK">Region</span>
                                <span class="summaryV mono">{{ selectedRegion === 'auto' ? 'Auto' : selectedRegion }}</span>
                            </div>
                        </div>

                        <button class="deployBtn" :disabled="!selectedGpu" @click="deployModel">
                            Deploy to Dedicated Compute
                        </button>
                    </template>
                </div>
            </section>
        </template>

        <template v-if="activeTab === 'command'">
            <section class="card deployedCard">
                <div class="head">
                    <h3>Active Deployments</h3>
                    <span class="pill" v-if="activeDeployments.filter(d => d.status === 'running').length">
                        {{ activeDeployments.filter(d => d.status === 'running').length }} running
                    </span>
                </div>

                <div v-if="activeDeployments.length > 0" class="costSummary">
                    <div class="costItem">
                        <span class="costLabel">Running cost</span>
                        <span class="costValue">${{ totalRunningCostPerHr }}<span class="costUnit">/hr</span></span>
                    </div>
                    <div class="costDivider"></div>
                    <div class="costItem">
                        <span class="costLabel">Total accrued</span>
                        <span class="costValue">${{ totalAccruedCost }}</span>
                    </div>
                </div>

                <div v-if="activeDeployments.length === 0" class="emptyDeployed">
                    <div class="emptyIcon">⬡</div>
                    <p>No models deployed yet</p>
                    <span class="emptyHint">Deploy a model above to see it here</span>
                </div>

                <div v-else class="deployedGrid">
                    <div
                        v-for="d in activeDeployments"
                        :key="d.id"
                        class="deployedItem"
                        :class="d.status"
                    >
                        <div class="deployedTop">
                            <span class="deployedDot" :class="d.status"></span>
                            <strong class="deployedName">{{ d.model }}</strong>
                            <span class="statusBadge" :class="d.status">{{ d.status }}</span>
                        </div>

                        <div class="deployedPricing">
                            <span class="dpRate">${{ (gpuPriceMap[d.gpu] || 0).toFixed(2) }}<span class="dpUnit">/hr</span></span>
                            <span class="dpAccrued" :class="{ stopped: d.status === 'stopped' }">
                                {{ d.status === 'stopped' ? 'Stopped' : 'Accrued' }}: ${{ calcAccrued(d) }}
                            </span>
                        </div>

                        <div class="deployedMeta">
                            <div class="deployedMetaRow">
                                <span class="deployedK">GPU</span>
                                <span class="deployedV mono">{{ d.gpu }}</span>
                            </div>
                            <div class="deployedMetaRow">
                                <span class="deployedK">Region</span>
                                <span class="deployedV">{{ d.region }}</span>
                            </div>
                            <div class="deployedMetaRow">
                                <span class="deployedK">Uptime</span>
                                <span class="deployedV mono">{{ d.uptime }}</span>
                            </div>
                            <div class="deployedMetaRow">
                                <span class="deployedK">Requests</span>
                                <span class="deployedV mono">{{ d.requests }}</span>
                            </div>
                        </div>

                        <div class="deployedActions">
                            <button class="depActBtn view" @click="viewDeployment(d)">View</button>
                            <button class="depActBtn edit" @click="editDeployment(d)">Edit</button>
                            <button
                                v-if="d.status === 'running' || d.status === 'provisioning'"
                                class="depActBtn stop"
                                @click="stopDeployment(d.id)"
                            >
                                Stop
                            </button>
                            <button
                                v-if="d.status === 'stopped'"
                                class="depActBtn start"
                                @click="startDeployment(d.id)"
                            >
                                Start
                            </button>
                            <button class="depActBtn destroy" @click="destroyDeployment(d.id)">Destroy</button>
                        </div>
                    </div>
                </div>
            </section>
        </template>

        <!-- MAP (always visible below) -->
        <section class="card mapCard">
            <div class="head">
                <h3>Global Node Distribution</h3>
                <div class="legend">
                    <div class="legendItem">
                        <span class="dot online" /> Online
                    </div>
                    <div class="legendItem">
                        <span class="dot provisioning" /> Provisioning
                    </div>
                    <div class="legendItem">
                        <span class="dot offline" /> Offline
                    </div>
                </div>
            </div>

            <div class="mapFrame">
                <img
                    class="mapImg"
                    :src="usOutline"
                    alt="United States outline map"
                />

                <div class="pins" aria-hidden="true">
                    <button
                        v-for="n in nodes"
                        :key="n.id"
                        class="pin"
                        :class="[n.status, { active: popoverNode?.id === n.id }]"
                        :style="{ left: n.x + '%', top: n.y + '%' }"
                        :title="`${n.label} — ${n.gpu} (${n.status})`"
                        type="button"
                        @click.stop="togglePopover(n, $event)"
                    />
                </div>

                <transition name="pop">
                    <div
                        v-if="popoverNode"
                        class="popover"
                        :style="popoverStyle"
                        @click.stop
                    >
                        <div class="popHead">
                            <span class="popDot" :class="popoverNode.status" />
                            <strong>{{ popoverNode.label }}</strong>
                            <span class="popStatus" :class="popoverNode.status">{{ popoverNode.status }}</span>
                        </div>
                        <div class="popGrid">
                            <div class="popRow">
                                <span class="popK">Data Center</span>
                                <span class="popV">{{ popoverNode.dc }}</span>
                            </div>
                            <div class="popRow">
                                <span class="popK">GPU</span>
                                <span class="popV mono">{{ popoverNode.gpu }}</span>
                            </div>
                            <div class="popRow">
                                <span class="popK">VRAM</span>
                                <span class="popV mono">{{ popoverNode.vram }}</span>
                            </div>
                            <div class="popRow">
                                <span class="popK">CUDA Cores</span>
                                <span class="popV mono">{{ popoverNode.cuda }}</span>
                            </div>
                            <div class="popRow">
                                <span class="popK">Network</span>
                                <span class="popV mono">{{ popoverNode.network }}</span>
                            </div>
                            <div class="popRow">
                                <span class="popK">Driver</span>
                                <span class="popV mono">{{ popoverNode.driver }}</span>
                            </div>
                            <div class="popRow">
                                <span class="popK">Utilization</span>
                                <span class="popV">
                                    <span class="popUtil">
                                        <span class="popUtilFill" :style="{ width: popoverNode.util + '%' }" />
                                    </span>
                                    {{ popoverNode.util }}%
                                </span>
                            </div>
                            <div class="popRow">
                                <span class="popK">Uptime</span>
                                <span class="popV mono">{{ popoverNode.uptime }}</span>
                            </div>
                        </div>
                    </div>
                </transition>
            </div>
        </section>

        <!-- NODE TABLE -->
        <section class="card">
            <h3>Cluster Nodes</h3>

            <div class="tableWrap">
                <table>
                    <thead>
                        <tr>
                            <th>Location</th>
                            <th>Data Center</th>
                            <th>GPU</th>
                            <th>VRAM</th>
                            <th>Status</th>
                            <th>Utilization</th>
                            <th>Uptime</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="n in nodes"
                            :key="n.id"
                            :class="{ selected: selectedNode?.id === n.id }"
                            @click="selectedNode = n"
                        >
                            <td class="mono">{{ n.label }}</td>
                            <td>{{ n.dc }}</td>
                            <td class="mono">{{ n.gpu }}</td>
                            <td class="mono">{{ n.vram }}</td>
                            <td>
                                <span class="statusBadge" :class="n.status">{{
                                    n.status
                                }}</span>
                            </td>
                            <td>
                                <div class="utilBar">
                                    <div
                                        class="utilFill"
                                        :style="{ width: n.util + '%' }"
                                    />
                                </div>
                                <span class="tiny">{{ n.util }}%</span>
                            </td>
                            <td class="mono tiny">{{ n.uptime }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>

        <!-- SELECTED NODE DETAIL -->
        <section class="card" v-if="selectedNode">
            <div class="head">
                <h3>{{ selectedNode.label }}</h3>
                <span class="statusBadge" :class="selectedNode.status">{{
                    selectedNode.status
                }}</span>
            </div>

            <div class="detailGrid">
                <div class="stat">
                    <div class="k">Data Center</div>
                    <div class="v">{{ selectedNode.dc }}</div>
                </div>
                <div class="stat">
                    <div class="k">GPU</div>
                    <div class="v mono">{{ selectedNode.gpu }}</div>
                </div>
                <div class="stat">
                    <div class="k">VRAM</div>
                    <div class="v mono">{{ selectedNode.vram }}</div>
                </div>
                <div class="stat">
                    <div class="k">CUDA Cores</div>
                    <div class="v mono">{{ selectedNode.cuda }}</div>
                </div>
                <div class="stat">
                    <div class="k">Utilization</div>
                    <div class="v">{{ selectedNode.util }}%</div>
                </div>
                <div class="stat">
                    <div class="k">Uptime</div>
                    <div class="v mono">{{ selectedNode.uptime }}</div>
                </div>
                <div class="stat">
                    <div class="k">Driver</div>
                    <div class="v mono">{{ selectedNode.driver }}</div>
                </div>
                <div class="stat">
                    <div class="k">Network</div>
                    <div class="v mono">{{ selectedNode.network }}</div>
                </div>
            </div>
        </section>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import usOutline from "@/assets/us.svg";

const activeTab = ref("deploy");
const selectedNode = ref(null);
const popoverNode = ref(null);
const popoverStyle = ref({});

const modelSource = ref("your");
const selectedModel = ref("");
const selectedGpu = ref("");
const selectedRegion = ref("auto");

watch([() => selectedModel.value, () => modelSource.value], () => {
    selectedGpu.value = "";
});

const yourModels = [
    { id: "ft-llama3-8b", name: "Llama 3 8B (fine-tuned)", params: "8B", size: "small" },
    { id: "ft-mistral-7b", name: "Mistral 7B (fine-tuned)", params: "7B", size: "small" },
    { id: "ft-llama3-70b", name: "Llama 3 70B (fine-tuned)", params: "70B", size: "large" },
    { id: "ft-codellama-34b", name: "Code Llama 34B (fine-tuned)", params: "34B", size: "medium" },
    { id: "ft-phi3-mini", name: "Phi-3 Mini (fine-tuned)", params: "3.8B", size: "small" },
];

const availableModels = [
    { id: "llama3-8b", name: "Llama 3 8B", params: "8B", size: "small" },
    { id: "llama3-70b", name: "Llama 3 70B", params: "70B", size: "large" },
    { id: "mistral-7b", name: "Mistral 7B", params: "7B", size: "small" },
    { id: "mixtral-8x7b", name: "Mixtral 8x7B", params: "46.7B", size: "medium" },
    { id: "codellama-34b", name: "Code Llama 34B", params: "34B", size: "medium" },
    { id: "llama3-405b", name: "Llama 3 405B", params: "405B", size: "xlarge" },
    { id: "deepseek-r1", name: "DeepSeek R1", params: "671B", size: "xlarge" },
    { id: "qwen2-72b", name: "Qwen2 72B", params: "72B", size: "large" },
];

const gpuTiers = {
    small: [
        { id: "rtx-4090", name: "NVIDIA RTX 4090", vram: "24 GB", throughput: "~35 tok/s", price: 0.74, recommended: true },
        { id: "l40s", name: "NVIDIA L40S", vram: "48 GB", throughput: "~50 tok/s", price: 0.89, recommended: false },
        { id: "a100-40", name: "NVIDIA A100 40GB", vram: "40 GB", throughput: "~60 tok/s", price: 1.19, recommended: false },
    ],
    medium: [
        { id: "a100-40", name: "NVIDIA A100 40GB", vram: "40 GB", throughput: "~40 tok/s", price: 1.19, recommended: false },
        { id: "a100-80", name: "NVIDIA A100 80GB", vram: "80 GB", throughput: "~55 tok/s", price: 1.79, recommended: true },
        { id: "h100", name: "NVIDIA H100 SXM", vram: "80 GB", throughput: "~80 tok/s", price: 2.49, recommended: false },
    ],
    large: [
        { id: "a100-80", name: "NVIDIA A100 80GB", vram: "80 GB", throughput: "~35 tok/s", price: 1.79, recommended: false },
        { id: "h100", name: "NVIDIA H100 SXM", vram: "80 GB", throughput: "~60 tok/s", price: 2.49, recommended: true },
        { id: "h100x2", name: "2x NVIDIA H100 SXM", vram: "160 GB", throughput: "~100 tok/s", price: 4.98, recommended: false },
    ],
    xlarge: [
        { id: "h100x4", name: "4x NVIDIA H100 SXM", vram: "320 GB", throughput: "~80 tok/s", price: 9.96, recommended: false },
        { id: "h100x8", name: "8x NVIDIA H100 SXM", vram: "640 GB", throughput: "~150 tok/s", price: 19.92, recommended: true },
    ],
};

const gpuPriceMap = {
    "RTX 4090": 0.74,
    "L40S": 0.89,
    "A100 40GB": 1.19,
    "A100 80GB": 1.79,
    "H100 SXM": 2.49,
    "2x H100 SXM": 4.98,
    "4x H100 SXM": 9.96,
    "8x H100 SXM": 19.92,
};

function parseUptime(uptime) {
    if (!uptime || uptime === "\u2014") return 0;
    const dMatch = uptime.match(/(\d+)d/);
    const hMatch = uptime.match(/(\d+)h/);
    return (dMatch ? parseInt(dMatch[1]) * 24 : 0) + (hMatch ? parseInt(hMatch[1]) : 0);
}

function calcAccrued(dep) {
    const rate = gpuPriceMap[dep.gpu] || 0;
    const hours = parseUptime(dep.uptime);
    return (rate * hours).toFixed(2);
}

const allModels = computed(() =>
    modelSource.value === "your" ? yourModels : availableModels
);

const selectedModelObj = computed(() =>
    allModels.value.find((m) => m.id === selectedModel.value) || null
);

const recommendedGpus = computed(() => {
    if (!selectedModelObj.value) return [];
    return gpuTiers[selectedModelObj.value.size] || gpuTiers.small;
});

const selectedGpuObj = computed(() =>
    recommendedGpus.value.find((g) => g.id === selectedGpu.value) || null
);

const activeDeployments = ref([
    { id: "dep-1", model: "Llama 3 8B (ft)", gpu: "RTX 4090", region: "US West", status: "running", uptime: "3d 14h", requests: "12,847" },
    { id: "dep-2", model: "Mistral 7B (ft)", gpu: "A100 80GB", region: "US East", status: "running", uptime: "7d 2h", requests: "45,201" },
    { id: "dep-3", model: "Code Llama 34B (ft)", gpu: "H100 SXM", region: "US Central", status: "stopped", uptime: "2d 8h", requests: "8,412" },
]);

const totalRunningCostPerHr = computed(() => {
    return activeDeployments.value
        .filter(d => d.status === "running")
        .reduce((sum, d) => sum + (gpuPriceMap[d.gpu] || 0), 0)
        .toFixed(2);
});

const totalAccruedCost = computed(() => {
    return activeDeployments.value
        .reduce((sum, d) => sum + parseFloat(calcAccrued(d)), 0)
        .toFixed(2);
});

const deploymentHistory = ref([
    { id: "hist-1", model: "Llama 3 70B", gpu: "2x H100 SXM", region: "US East", status: "completed", deployed: "Jan 28, 2026", duration: "12d 6h" },
    { id: "hist-2", model: "Phi-3 Mini (ft)", gpu: "RTX 4090", region: "US West", status: "completed", deployed: "Jan 15, 2026", duration: "5d 18h" },
    { id: "hist-3", model: "Mixtral 8x7B", gpu: "A100 80GB", region: "US Central", status: "failed", deployed: "Jan 10, 2026", duration: "0d 0h" },
]);

function deployModel() {
    if (!selectedModelObj.value || !selectedGpuObj.value) return;
    activeDeployments.value.unshift({
        id: "dep-" + Date.now(),
        model: selectedModelObj.value.name,
        gpu: selectedGpuObj.value.name.replace("NVIDIA ", ""),
        region: selectedRegion.value === "auto" ? "Auto" : selectedRegion.value.toUpperCase().replace("-", " "),
        status: "provisioning",
        uptime: "—",
        requests: "0",
    });
    activeTab.value = "command";
    selectedModel.value = "";
    selectedGpu.value = "";
}

function stopDeployment(id) {
    const dep = activeDeployments.value.find((d) => d.id === id);
    if (dep) {
        dep.status = "stopped";
        dep.uptime = "—";
    }
}

function startDeployment(id) {
    const dep = activeDeployments.value.find((d) => d.id === id);
    if (dep) {
        dep.status = "running";
        dep.uptime = "0d 0h";
    }
}

function destroyDeployment(id) {
    const idx = activeDeployments.value.findIndex((d) => d.id === id);
    if (idx !== -1) {
        const dep = activeDeployments.value[idx];
        deploymentHistory.value.unshift({
            id: dep.id,
            model: dep.model,
            gpu: dep.gpu,
            region: dep.region,
            status: "completed",
            deployed: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            duration: dep.uptime === "—" ? "0d 0h" : dep.uptime,
        });
        activeDeployments.value.splice(idx, 1);
    }
}

function viewDeployment(dep) {
    activeTab.value = "command";
}

function editDeployment(dep) {
    activeTab.value = "deploy";
    modelSource.value = "your";
    selectedModel.value = "";
}

function togglePopover(node, event) {
    if (popoverNode.value?.id === node.id) {
        popoverNode.value = null;
        return;
    }

    selectedNode.value = node;
    popoverNode.value = node;

    const pin = event.currentTarget;
    const frame = pin.closest(".mapFrame");
    const frameRect = frame.getBoundingClientRect();
    const pinRect = pin.getBoundingClientRect();

    let left = pinRect.left - frameRect.left + pinRect.width / 2 + 16;
    let top = pinRect.top - frameRect.top + pinRect.height / 2 - 20;

    const popWidth = 280;
    if (left + popWidth > frameRect.width - 14) {
        left = pinRect.left - frameRect.left - popWidth - 8;
    }

    if (top < 14) top = 14;
    if (top + 300 > frameRect.height - 14) {
        top = frameRect.height - 314;
    }

    popoverStyle.value = {
        left: left + "px",
        top: top + "px",
    };
}

function closePopover() {
    popoverNode.value = null;
}

onMounted(() => {
    document.addEventListener("click", closePopover);
});
onUnmounted(() => {
    document.removeEventListener("click", closePopover);
});

const nodes = [
    { id: "sfo-1", label: "San Francisco", dc: "Equinix SV5", gpu: "NVIDIA A100 80GB", vram: "80 GB", cuda: "6,912", status: "online", util: 73, uptime: "14d 6h", driver: "CUDA 12.4 / 550.54", network: "100 Gbps InfiniBand", x: 14, y: 46 },
    { id: "sfo-2", label: "San Jose", dc: "CoreSite SV2", gpu: "NVIDIA H100 SXM", vram: "80 GB", cuda: "16,896", status: "online", util: 91, uptime: "7d 18h", driver: "CUDA 12.4 / 550.54", network: "400 Gbps InfiniBand", x: 15, y: 50 },
    { id: "sea-1", label: "Seattle", dc: "Sabey Intergate", gpu: "NVIDIA L40S", vram: "48 GB", cuda: "18,176", status: "online", util: 42, uptime: "21d 3h", driver: "CUDA 12.3 / 545.23", network: "25 Gbps Ethernet", x: 16, y: 22 },
    { id: "pdx-1", label: "Portland", dc: "Flexential POR1", gpu: "NVIDIA A100 40GB", vram: "40 GB", cuda: "6,912", status: "provisioning", util: 0, uptime: "—", driver: "CUDA 12.4 / 550.54", network: "100 Gbps InfiniBand", x: 15, y: 28 },
    { id: "lax-1", label: "Los Angeles", dc: "CoreSite LA2", gpu: "NVIDIA A100 80GB", vram: "80 GB", cuda: "6,912", status: "online", util: 68, uptime: "30d 12h", driver: "CUDA 12.4 / 550.54", network: "100 Gbps InfiniBand", x: 17, y: 62 },
    { id: "phx-1", label: "Phoenix", dc: "CyrusOne PHX1", gpu: "NVIDIA RTX 4090", vram: "24 GB", cuda: "16,384", status: "online", util: 55, uptime: "9d 4h", driver: "CUDA 12.3 / 545.23", network: "25 Gbps Ethernet", x: 24, y: 60 },
    { id: "slc-1", label: "Salt Lake City", dc: "DataPipe SLC", gpu: "NVIDIA L40", vram: "48 GB", cuda: "18,176", status: "online", util: 34, uptime: "5d 9h", driver: "CUDA 12.3 / 545.23", network: "25 Gbps Ethernet", x: 27, y: 38 },
    { id: "den-1", label: "Denver", dc: "Equinix DE1", gpu: "NVIDIA H100 SXM", vram: "80 GB", cuda: "16,896", status: "online", util: 87, uptime: "12d 0h", driver: "CUDA 12.4 / 550.54", network: "400 Gbps InfiniBand", x: 33, y: 42 },
    { id: "dfw-1", label: "Dallas", dc: "Equinix DA1", gpu: "NVIDIA A100 80GB", vram: "80 GB", cuda: "6,912", status: "online", util: 62, uptime: "19d 7h", driver: "CUDA 12.4 / 550.54", network: "100 Gbps InfiniBand", x: 44, y: 68 },
    { id: "hou-1", label: "Houston", dc: "CyrusOne HOU2", gpu: "NVIDIA RTX 6000 Ada", vram: "48 GB", cuda: "18,176", status: "offline", util: 0, uptime: "—", driver: "CUDA 12.3 / 545.23", network: "25 Gbps Ethernet", x: 46, y: 76 },
    { id: "chi-1", label: "Chicago", dc: "Equinix CH1", gpu: "NVIDIA H100 SXM", vram: "80 GB", cuda: "16,896", status: "online", util: 78, uptime: "25d 14h", driver: "CUDA 12.4 / 550.54", network: "400 Gbps InfiniBand", x: 58, y: 36 },
    { id: "msp-1", label: "Minneapolis", dc: "Cologix MIN3", gpu: "NVIDIA A100 40GB", vram: "40 GB", cuda: "6,912", status: "online", util: 29, uptime: "3d 20h", driver: "CUDA 12.4 / 550.54", network: "100 Gbps InfiniBand", x: 52, y: 24 },
    { id: "kc-1", label: "Kansas City", dc: "QTS KC1", gpu: "NVIDIA L40S", vram: "48 GB", cuda: "18,176", status: "provisioning", util: 0, uptime: "—", driver: "CUDA 12.3 / 545.23", network: "25 Gbps Ethernet", x: 48, y: 48 },
    { id: "nyc-1", label: "New York", dc: "Equinix NY5", gpu: "NVIDIA H100 SXM", vram: "80 GB", cuda: "16,896", status: "online", util: 95, uptime: "31d 2h", driver: "CUDA 12.4 / 550.54", network: "400 Gbps InfiniBand", x: 80, y: 34 },
    { id: "iad-1", label: "Ashburn, VA", dc: "Equinix DC11", gpu: "NVIDIA A100 80GB", vram: "80 GB", cuda: "6,912", status: "online", util: 84, uptime: "28d 6h", driver: "CUDA 12.4 / 550.54", network: "100 Gbps InfiniBand", x: 78, y: 44 },
    { id: "iad-2", label: "Richmond, VA", dc: "QTS RIC1", gpu: "NVIDIA RTX 4090", vram: "24 GB", cuda: "16,384", status: "online", util: 47, uptime: "11d 15h", driver: "CUDA 12.3 / 545.23", network: "25 Gbps Ethernet", x: 76, y: 50 },
    { id: "atl-1", label: "Atlanta", dc: "Equinix AT1", gpu: "NVIDIA A100 80GB", vram: "80 GB", cuda: "6,912", status: "online", util: 71, uptime: "15d 22h", driver: "CUDA 12.4 / 550.54", network: "100 Gbps InfiniBand", x: 69, y: 62 },
    { id: "mia-1", label: "Miami", dc: "Equinix MI1", gpu: "NVIDIA L40S", vram: "48 GB", cuda: "18,176", status: "online", util: 38, uptime: "8d 1h", driver: "CUDA 12.3 / 545.23", network: "25 Gbps Ethernet", x: 76, y: 82 },
    { id: "bos-1", label: "Boston", dc: "CyrusOne BOS1", gpu: "NVIDIA H100 SXM", vram: "80 GB", cuda: "16,896", status: "online", util: 66, uptime: "20d 11h", driver: "CUDA 12.4 / 550.54", network: "400 Gbps InfiniBand", x: 85, y: 28 },
    { id: "rdu-1", label: "Raleigh", dc: "DataPipe RDU", gpu: "NVIDIA RTX 6000 Ada", vram: "48 GB", cuda: "18,176", status: "offline", util: 0, uptime: "—", driver: "CUDA 12.3 / 545.23", network: "25 Gbps Ethernet", x: 75, y: 54 },
];

const totalGpus = computed(() => nodes.length);
const onlineCount = computed(
    () => nodes.filter((n) => n.status === "online").length,
);
</script>

<style scoped>
.wrap {
    max-width: 1100px;
    margin: 0 auto;
    padding: 28px 18px 60px;
    display: grid;
    gap: 16px;
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
strong.online {
    color: #22c55e;
}

/* SUB-TABS */
.subtabs {
    display: flex;
    gap: 4px;
    background: var(--hover-bg);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 4px;
    width: fit-content;
}
.subtab {
    padding: 8px 20px;
    border-radius: 8px;
    border: none;
    background: transparent;
    color: var(--muted);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
    letter-spacing: 0.25px;
}
.subtab:hover {
    color: var(--fg);
}
.subtab.active {
    background: var(--fg);
    color: var(--btn-primary-fg);
}

/* CARDS */
.card {
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 18px;
    background: var(--card);
}

.head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    margin-bottom: 12px;
}

h3 {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.35px;
    text-transform: uppercase;
}

/* DEPLOY FORM */
.deployCard {
    display: grid;
    gap: 8px;
}
.deployCard h3 {
    margin-bottom: 0;
}
.desc {
    font-size: 12px;
    color: var(--muted);
    margin: 0 0 8px;
}

.deployForm {
    display: grid;
    gap: 18px;
}

.fieldGroup {
    display: grid;
    gap: 8px;
}
.fieldLabel {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.3px;
    text-transform: uppercase;
    color: var(--muted);
}

.sourceToggle {
    display: flex;
    gap: 4px;
    background: var(--hover-bg);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 3px;
    width: fit-content;
}
.srcBtn {
    padding: 6px 14px;
    border-radius: 7px;
    border: none;
    background: transparent;
    color: var(--muted);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
}
.srcBtn:hover {
    color: var(--fg);
}
.srcBtn.active {
    background: var(--fg);
    color: var(--btn-primary-fg);
}

.selectWrap {
    position: relative;
}
.selectInput {
    width: 100%;
    padding: 10px 14px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: var(--hover-bg);
    color: var(--fg);
    font-size: 13px;
    font-family: inherit;
    appearance: none;
    cursor: pointer;
    outline: none;
    transition: border-color 0.15s ease;
}
.selectInput:focus {
    border-color: var(--fg);
}
.selectWrap::after {
    content: "";
    position: absolute;
    right: 14px;
    top: 50%;
    transform: translateY(-50%);
    width: 0;
    height: 0;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-top: 5px solid var(--muted);
    pointer-events: none;
}

/* GPU OPTIONS */
.gpuOptions {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 8px;
}
.gpuCard {
    position: relative;
    padding: 14px;
    border-radius: 12px;
    border: 1px solid var(--border);
    background: var(--hover-bg);
    cursor: pointer;
    text-align: left;
    transition: all 0.15s ease;
    color: var(--fg);
}
.gpuCard:hover {
    border-color: var(--border);
}
.gpuCard.selected {
    border-color: #22c55e;
    background: rgba(34, 197, 94, 0.06);
}
.gpuCard.recommended {
    border-color: rgba(34, 197, 94, 0.3);
}
.gpuName {
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 6px;
}
.gpuMeta {
    font-size: 11px;
    color: var(--muted);
    line-height: 1.5;
}
.gpuPrice {
    font-size: 15px;
    font-weight: 700;
    margin-top: 4px;
    color: var(--fg);
}
.gpuPriceUnit {
    font-size: 11px;
    font-weight: 500;
    color: var(--muted);
}
.gpuBadge {
    position: absolute;
    top: 8px;
    right: 8px;
    font-size: 10px;
    padding: 2px 8px;
    border-radius: 999px;
    background: rgba(34, 197, 94, 0.15);
    color: #22c55e;
    font-weight: 600;
    letter-spacing: 0.3px;
    text-transform: uppercase;
}

/* DEPLOY SUMMARY */
.deploySummary {
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 14px;
    background: var(--hover-bg);
    display: grid;
    gap: 8px;
}
.summaryRow {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
}
.summaryK {
    color: var(--muted);
}
.summaryV {
    font-weight: 500;
}

.deployBtn {
    padding: 12px 24px;
    border-radius: 10px;
    border: none;
    background: #22c55e;
    color: var(--btn-primary-fg);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
    letter-spacing: 0.3px;
}
.deployBtn:hover {
    background: #16a34a;
}
.deployBtn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

/* COMMAND TAB */
.emptyState {
    text-align: center;
    padding: 32px 0;
    color: var(--muted);
    font-size: 13px;
}

.actionBtn {
    padding: 5px 12px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: transparent;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
    letter-spacing: 0.3px;
    text-transform: uppercase;
}
.actionBtn.stop {
    color: #ef4444;
    border-color: rgba(239, 68, 68, 0.3);
}
.actionBtn.stop:hover {
    background: rgba(239, 68, 68, 0.1);
}
.actionBtn.start {
    color: #22c55e;
    border-color: rgba(34, 197, 94, 0.3);
}
.actionBtn.start:hover {
    background: rgba(34, 197, 94, 0.1);
}

/* LEGEND */
.legend {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    font-size: 12px;
    color: var(--muted);
}
.legendItem {
    display: inline-flex;
    align-items: center;
    gap: 6px;
}
.dot {
    width: 10px;
    height: 10px;
    border-radius: 999px;
    border: 1px solid var(--border);
}
.dot.online {
    background: #22c55e;
    border-color: #22c55e66;
}
.dot.provisioning {
    background: #f59e0b;
    border-color: #f59e0b66;
}
.dot.offline {
    background: #ef4444;
    border-color: #ef444466;
}

/* MAP */
.mapCard {
    padding-bottom: 0;
}

.mapFrame {
    position: relative;
    border: 1px solid var(--border);
    border-radius: 14px 14px 0 0;
    background: var(--chip);
    overflow: hidden;
    padding: 14px;
    aspect-ratio: 1.7;
}

.mapImg {
    width: 100%;
    height: 100%;
    display: block;
    filter: brightness(1.05) contrast(1.05);
    opacity: 0.85;
    object-fit: contain;
}

.pins {
    position: absolute;
    inset: 14px;
}

.pin {
    position: absolute;
    transform: translate(-50%, -50%);
    width: 12px;
    height: 12px;
    border-radius: 999px;
    border: none;
    cursor: pointer;
    transition: transform 0.15s ease;
    padding: 0;
}
.pin:hover {
    transform: translate(-50%, -50%) scale(1.8);
    z-index: 10;
}

.pin.online {
    background: #22c55e;
    box-shadow:
        0 0 0 3px rgba(34, 197, 94, 0.15),
        0 0 14px rgba(34, 197, 94, 0.6);
    animation: pulse-green 2.5s ease-in-out infinite;
}
.pin.provisioning {
    background: #f59e0b;
    box-shadow:
        0 0 0 3px rgba(245, 158, 11, 0.15),
        0 0 14px rgba(245, 158, 11, 0.6);
    animation: pulse-amber 1.6s ease-in-out infinite;
}
.pin.offline {
    background: #ef4444;
    box-shadow:
        0 0 0 3px rgba(239, 68, 68, 0.12),
        0 0 8px rgba(239, 68, 68, 0.35);
}

@keyframes pulse-green {
    0%,
    100% {
        box-shadow:
            0 0 0 3px rgba(34, 197, 94, 0.15),
            0 0 14px rgba(34, 197, 94, 0.6);
    }
    50% {
        box-shadow:
            0 0 0 6px rgba(34, 197, 94, 0.08),
            0 0 22px rgba(34, 197, 94, 0.4);
    }
}
@keyframes pulse-amber {
    0%,
    100% {
        box-shadow:
            0 0 0 3px rgba(245, 158, 11, 0.15),
            0 0 14px rgba(245, 158, 11, 0.6);
    }
    50% {
        box-shadow:
            0 0 0 8px rgba(245, 158, 11, 0.06),
            0 0 24px rgba(245, 158, 11, 0.3);
    }
}

/* TABLE */
.tableWrap {
    overflow-x: auto;
    margin-top: 10px;
}

table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
}
th {
    text-align: left;
    padding: 6px 8px;
    font-weight: 600;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.4px;
    font-size: 11px;
    border-bottom: 1px solid var(--border);
}
td {
    padding: 8px;
    border-bottom: 1px solid var(--border);
}
tr:last-child td {
    border-bottom: none;
}
tr.selected td {
    background: var(--hover-bg);
}
tr {
    cursor: pointer;
}
tr:hover td {
    background: var(--hover-bg);
}

.statusBadge {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 600;
    text-transform: capitalize;
    letter-spacing: 0.3px;
}
.statusBadge.online,
.statusBadge.running {
    background: rgba(34, 197, 94, 0.12);
    color: #22c55e;
}
.statusBadge.provisioning {
    background: rgba(245, 158, 11, 0.12);
    color: #f59e0b;
}
.statusBadge.offline,
.statusBadge.stopped {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
}
.statusBadge.completed {
    background: rgba(100, 116, 139, 0.12);
    color: #94a3b8;
}
.statusBadge.failed {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
}

.utilBar {
    height: 5px;
    border-radius: 999px;
    background: var(--hover-bg);
    overflow: hidden;
    min-width: 60px;
}
.utilFill {
    height: 100%;
    border-radius: 999px;
    background: #22c55e;
}

.mono {
    font-family: "SF Mono", "Fira Code", monospace;
}
.tiny {
    font-size: 11px;
    color: var(--muted);
}

/* DETAIL PANEL */
.detailGrid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 12px;
    margin-top: 8px;
}
.stat {
    padding: 10px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: var(--hover-bg);
}
.k {
    font-size: 11px;
    text-transform: uppercase;
    color: var(--muted);
    letter-spacing: 0.4px;
    margin-bottom: 4px;
}
.v {
    font-size: 14px;
    font-weight: 500;
}

/* POPOVER */
.popover {
    position: absolute;
    z-index: 20;
    width: 280px;
    background: var(--card, #1a1a1e);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 14px;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.55);
}
.popHead {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
}
.popDot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    flex-shrink: 0;
}
.popDot.online {
    background: #22c55e;
}
.popDot.provisioning {
    background: #f59e0b;
}
.popDot.offline {
    background: #ef4444;
}
.popStatus {
    margin-left: auto;
    font-size: 11px;
    font-weight: 600;
    text-transform: capitalize;
    letter-spacing: 0.3px;
}
.popStatus.online {
    color: #22c55e;
}
.popStatus.provisioning {
    color: #f59e0b;
}
.popStatus.offline {
    color: #ef4444;
}

.popGrid {
    display: grid;
    gap: 6px;
}
.popRow {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
}
.popK {
    color: var(--muted);
}
.popV {
    text-align: right;
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    gap: 6px;
}

.popUtil {
    display: inline-block;
    width: 48px;
    height: 4px;
    border-radius: 999px;
    background: var(--chip);
    overflow: hidden;
    vertical-align: middle;
}
.popUtilFill {
    display: block;
    height: 100%;
    border-radius: 999px;
    background: #22c55e;
}

.pin.active {
    transform: translate(-50%, -50%) scale(1.5);
    z-index: 10;
    box-shadow:
        0 0 0 4px var(--hover-bg),
        0 0 20px var(--hover-bg);
}

.pop-enter-active {
    transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
}
.pop-leave-active {
    transition: all 0.12s ease-in;
}
.pop-enter-from {
    opacity: 0;
    transform: scale(0.92) translateY(4px);
}
.pop-leave-to {
    opacity: 0;
    transform: scale(0.95);
}

/* ── YOUR DEPLOYED MODELS ── */
.deployedCard {
    /* inherits .card */
}

.emptyDeployed {
    text-align: center;
    padding: 32px 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
}

.emptyIcon {
    font-size: 32px;
    color: var(--muted);
    opacity: 0.4;
    margin-bottom: 4px;
}

.emptyDeployed p {
    margin: 0;
    font-size: 13px;
    color: var(--fg);
    font-weight: 500;
}

.emptyHint {
    font-size: 12px;
    color: var(--muted);
}

.deployedGrid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 10px;
    margin-top: 4px;
}

.deployedItem {
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 14px;
    background: var(--hover-bg);
    display: flex;
    flex-direction: column;
    gap: 10px;
    transition: border-color 0.15s ease;
}

.deployedItem.running {
    border-color: rgba(34, 197, 94, 0.25);
}

.deployedItem.provisioning {
    border-color: rgba(245, 158, 11, 0.25);
}

.deployedItem.stopped {
    border-color: rgba(239, 68, 68, 0.15);
    opacity: 0.75;
}

.deployedTop {
    display: flex;
    align-items: center;
    gap: 8px;
}

.deployedDot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
}

.deployedDot.running {
    background: #22c55e;
    box-shadow: 0 0 6px rgba(34, 197, 94, 0.5);
}

.deployedDot.provisioning {
    background: #f59e0b;
    box-shadow: 0 0 6px rgba(245, 158, 11, 0.5);
}

.deployedDot.stopped {
    background: #ef4444;
}

.deployedName {
    font-size: 13px;
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.costSummary {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 10px 14px;
    border-radius: 10px;
    background: var(--chip);
    border: 1px solid var(--border);
    margin-bottom: 12px;
}

.costItem {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.costLabel {
    font-size: 10px;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.4px;
    font-weight: 600;
}

.costValue {
    font-size: 18px;
    font-weight: 700;
    letter-spacing: -0.3px;
}

.costUnit {
    font-size: 11px;
    font-weight: 500;
    color: var(--muted);
}

.costDivider {
    width: 1px;
    height: 32px;
    background: var(--border);
}

.deployedPricing {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    padding: 6px 10px;
    border-radius: 8px;
    background: var(--chip);
    border: 1px solid var(--border);
}

.dpRate {
    font-size: 16px;
    font-weight: 700;
    letter-spacing: -0.2px;
    color: var(--fg);
}

.dpUnit {
    font-size: 11px;
    font-weight: 500;
    color: var(--muted);
}

.dpAccrued {
    font-size: 11px;
    font-weight: 600;
    color: var(--muted);
}

.dpAccrued.stopped {
    color: #ef4444;
}

.deployedMeta {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px 12px;
}

.deployedMetaRow {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
}

.deployedK {
    color: var(--muted);
}

.deployedV {
    font-weight: 500;
}

.deployedActions {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    padding-top: 4px;
    border-top: 1px solid var(--border);
}

.depActBtn {
    padding: 5px 12px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: transparent;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.12s ease;
    letter-spacing: 0.2px;
    color: var(--fg);
}

.depActBtn:hover {
    border-color: var(--fg);
    background: var(--hover-bg);
}

.depActBtn.view {
    color: #3b82f6;
    border-color: rgba(59, 130, 246, 0.3);
}

.depActBtn.view:hover {
    background: rgba(59, 130, 246, 0.08);
}

.depActBtn.edit {
    color: #a78bfa;
    border-color: rgba(167, 139, 250, 0.3);
}

.depActBtn.edit:hover {
    background: rgba(167, 139, 250, 0.08);
}

.depActBtn.stop {
    color: #ef4444;
    border-color: rgba(239, 68, 68, 0.3);
}

.depActBtn.stop:hover {
    background: rgba(239, 68, 68, 0.08);
}

.depActBtn.start {
    color: #22c55e;
    border-color: rgba(34, 197, 94, 0.3);
}

.depActBtn.start:hover {
    background: rgba(34, 197, 94, 0.08);
}

.depActBtn.destroy {
    color: var(--muted);
    border-color: var(--border);
    margin-left: auto;
}

.depActBtn.destroy:hover {
    color: #ef4444;
    border-color: rgba(239, 68, 68, 0.3);
    background: rgba(239, 68, 68, 0.08);
}
</style>
