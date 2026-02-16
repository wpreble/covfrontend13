<!-- src/components/DeploymentMapUS.vue -->
<template>
    <section class="card">
        <div class="head">
            <h2>Deployments</h2>

            <div class="legend">
                <div class="legendItem">
                    <span class="dot conduit" /> Conduit
                </div>
                <div class="legendItem"><span class="dot gpu" /> GPU</div>
                <div class="legendItem"><span class="dot vpn" /> VPN</div>
            </div>
        </div>

        <div class="mapFrame">
            <!-- The map image (real outline svg) -->
            <img
                class="mapImg"
                :src="usOutline"
                alt="United States outline map"
            />

            <!-- Overlay dots -->
            <div class="pins" aria-hidden="true">
                <button
                    v-for="d in deployments"
                    :key="d.id"
                    class="pin"
                    :class="d.type"
                    :style="{ left: d.x + '%', top: d.y + '%' }"
                    :title="`${d.label} · ${typeLabel(d.type)}`"
                    type="button"
                />
            </div>
        </div>
    </section>
</template>

<script setup>
import usOutline from "@/assets/us.svg";

/**
 * Coordinates are PERCENTAGES relative to the image box:
 * x=0..100 (left->right), y=0..100 (top->bottom)
 *
 * These sample points assume a typical US lower-48 outline SVG.
 * You can tweak x/y after you drop in your chosen SVG.
 */
const deployments = [
    // West
    { id: "sf-conduit", type: "conduit", x: 16, y: 46, label: "San Francisco" },
    { id: "sea-vpn", type: "vpn", x: 18, y: 33, label: "Seattle" },
    { id: "la-gpu", type: "gpu", x: 18, y: 62, label: "Los Angeles" },

    // Central
    { id: "tx-gpu", type: "gpu", x: 40, y: 70, label: "Texas" },
    { id: "chi-conduit", type: "conduit", x: 55, y: 42, label: "Chicago" },

    // East
    { id: "ny-conduit", type: "conduit", x: 78, y: 36, label: "New York" },
    { id: "va-vpn", type: "vpn", x: 73, y: 48, label: "Virginia" },
    { id: "fl-gpu", type: "gpu", x: 75, y: 78, label: "Florida" },
];

function typeLabel(t) {
    if (t === "conduit") return "Conduit";
    if (t === "gpu") return "GPU";
    return "VPN";
}
</script>

<style scoped>
/* Same theme language: outline borders, muted text, cards */

.card {
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 18px;
    background: var(--card);
}

.head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 14px;
    margin-bottom: 12px;
}

h2 {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.35px;
    text-transform: uppercase;
}

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
.dot.conduit {
    background: #4aa3ff; /* blue */
    border-color: color-mix(in oklab, #4aa3ff 60%, var(--border));
}
.dot.gpu {
    background: #22c55e; /* green */
    border-color: color-mix(in oklab, #22c55e 60%, var(--border));
}
.dot.vpn {
    background: #f5f5f5; /* white */
    border-color: color-mix(in oklab, #f5f5f5 60%, var(--border));
}

.mapFrame {
    position: relative;
    border: 1px solid var(--border);
    border-radius: 14px;
    background: var(--chip);
    overflow: hidden;
    height: 100vh;
    /* keeps it nice + consistent */
    padding: 14px;
}

.mapImg {
    width: 100%;
    height: 800px;
    display: block;
    /* Make outline match your UI */
    filter: brightness(1.05) contrast(1.05);
    opacity: 0.95;
}

/* Dot overlay layer */
.pins {
    position: absolute;
    inset: 14px; /* matches mapFrame padding so pins align on image */
    pointer-events: none; /* dots are decorative for now */
}

.pin {
    position: absolute;
    transform: translate(-50%, -50%);
    width: 10px;
    height: 10px;
    border-radius: 999px;
    border: 1px solid var(--border);
    pointer-events: none;
    box-shadow: 0 0 0 3px var(--hover-bg);
}

.pin.conduit {
    background: #4aa3ff;
    box-shadow:
        0 0 0 3px rgba(74, 163, 255, 0.1),
        0 0 12px rgba(74, 163, 255, 0.55);
}
.pin.gpu {
    background: #22c55e;
    box-shadow:
        0 0 0 3px rgba(34, 197, 94, 0.1),
        0 0 12px rgba(34, 197, 94, 0.55);
}
.pin.vpn {
    background: #f5f5f5;
    box-shadow:
        0 0 0 3px rgba(245, 245, 245, 0.08),
        0 0 12px rgba(245, 245, 245, 0.45);
}

.tiny {
    font-size: 12px;
    color: var(--muted);
}
</style>
