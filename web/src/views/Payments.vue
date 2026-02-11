<!-- src/views/Payments.vue -->
<template>
    <div class="wrap">
        <div class="row">
            <!-- LEFT: Overview -->
            <section class="card">
                <h2>Overview</h2>

                <div class="grid3">
                    <div class="stat">
                        <div class="k">Vault balance (PDA lamports)</div>
                        <div class="v">{{ fmtSOL(vaultBalanceLamports) }}</div>
                    </div>

                    <div class="stat">
                        <div class="k">Ledger balance</div>
                        <div class="v">{{ fmtSOL(ledger.balance) }}</div>
                    </div>

                    <div class="stat">
                        <div class="k">Total charged</div>
                        <div class="v">{{ fmtSOL(ledger.totalCharged) }}</div>
                    </div>
                </div>

                <div class="sep"></div>

                <div class="pillbar">
                    <span class="pill">
                        Charging:
                        <strong>{{
                            ledger.chargingEnabled ? "ENABLED" : "DISABLED"
                        }}</strong>
                    </span>
                    <span class="pill">
                        Max/charge:
                        <strong>{{ fmtSOL(ledger.maxPerCharge) }}</strong>
                    </span>
                    <span class="pill">
                        Max total:
                        <strong>{{ fmtSOL(ledger.maxTotal) }}</strong>
                    </span>
                    <span class="pill">
                        Nonce: <strong class="mono">{{ ledger.nonce }}</strong>
                    </span>
                </div>

                <div class="sep"></div>

                <div class="pillbar">
                    <span class="pill">
                        Treasury:
                        <strong class="mono">{{
                            config.treasuryShort ?? "—"
                        }}</strong>
                    </span>
                    <span class="pill">
                        Service signer:
                        <strong class="mono">{{
                            config.serviceSignerShort ?? "—"
                        }}</strong>
                    </span>
                </div>

                <div class="sep"></div>

                <div class="pillbar">
                    <span class="pill">
                        Owner:
                        <strong class="mono">{{ wallet.short ?? "—" }}</strong>
                    </span>
                    <span class="pill">
                        Initialized:
                        <strong>{{ ledger.initialized ? "YES" : "NO" }}</strong>
                    </span>
                </div>

                <div v-if="error" class="tiny err" style="margin-top: 10px">
                    {{ error }}
                </div>
            </section>

            <!-- RIGHT: Actions -->
            <aside class="card">
                <h2>Actions</h2>

                <div class="walletRow">
                    <span class="pill">
                        Wallet:
                        <strong class="mono">{{
                            wallet.short ?? "DISCONNECTED"
                        }}</strong>
                    </span>

                    <button
                        class="secondary"
                        :disabled="busy"
                        @click="refreshAll"
                    >
                        Refresh
                    </button>
                </div>

                <div class="sep"></div>

                <div class="actions">
                    <div class="field">
                        <label>Amount (SOL)</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            v-model="ui.amountSol"
                            :disabled="busy || !wallet.connected"
                            placeholder="e.g. 0.50"
                        />
                    </div>

                    <div class="btnrow">
                        <button
                            @click="deposit"
                            :disabled="
                                busy || !wallet.connected || !validAmount
                            "
                            title="deposit_sol(amount)"
                        >
                            Deposit
                        </button>

                        <button
                            class="secondary"
                            @click="withdraw"
                            :disabled="
                                busy ||
                                !wallet.connected ||
                                !validAmount ||
                                ledger.balance <= 0
                            "
                            title="withdraw_sol(amount)"
                        >
                            Withdraw
                        </button>
                    </div>

                    <div class="sep"></div>

                    <div class="field">
                        <label>Charging limits (SOL)</label>
                        <div class="btnrow">
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                v-model="ui.maxPerChargeSol"
                                :disabled="busy || !wallet.connected"
                                placeholder="max per charge"
                            />
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                v-model="ui.maxTotalSol"
                                :disabled="busy || !wallet.connected"
                                placeholder="max total"
                            />
                        </div>
                    </div>

                    <div class="btnrow">
                        <button
                            class="secondary"
                            @click="enableCharging"
                            :disabled="
                                busy || !wallet.connected || !validLimits
                            "
                            title="enable_charging(max_per_charge, max_total)"
                        >
                            Enable charging
                        </button>

                        <button
                            class="ghost"
                            @click="stopCharging"
                            :disabled="
                                busy ||
                                !wallet.connected ||
                                !ledger.chargingEnabled
                            "
                            title="disable_charging()"
                        >
                            Stop charging
                        </button>
                    </div>

                    <div class="sep"></div>

                    <div class="pillbar">
                        <span class="pill">
                            State:
                            <strong>{{
                                busy
                                    ? "WORKING"
                                    : wallet.connected
                                      ? "CONNECTED"
                                      : "DISCONNECTED"
                            }}</strong>
                        </span>
                    </div>
                </div>
            </aside>
        </div>
    </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { Buffer } from "buffer";
import BN from "bn.js";
import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorProvider, Program } from "@coral-xyz/anchor";

import idl from "@/idl/covenant_vault.json";

window.Buffer = Buffer;

const RPC_URL = import.meta.env.VITE_RPC_URL || "http://127.0.0.1:8899";
const PROGRAM_ID = new PublicKey(
    import.meta.env.VITE_PROGRAM_ID ||
        "BUam43b33sLJvKqb3u7jSwUb3JisLDzAYDN4ECNmsGSU",
);

const LAMPORTS_PER_SOL = 1_000_000_000;

const busy = ref(false);
const error = ref("");

const wallet = reactive({
    connected: false,
    pubkey: /** @type {PublicKey | null} */ (null),
    short: /** @type {string | null} */ (null),
    ledgerPda: /** @type {PublicKey | null} */ (null),
    vaultPda: /** @type {PublicKey | null} */ (null),
    ledgerPdaShort: /** @type {string | null} */ (null),
    vaultPdaShort: /** @type {string | null} */ (null),
});

const config = reactive({
    treasury: /** @type {PublicKey | null} */ (null),
    serviceSigner: /** @type {PublicKey | null} */ (null),
    treasuryShort: /** @type {string | null} */ (null),
    serviceSignerShort: /** @type {string | null} */ (null),
});

const ledger = reactive({
    initialized: false,

    // These are in YOUR program's Ledger account
    balance: 0, // lamports
    chargingEnabled: false,
    maxPerCharge: 0, // lamports
    maxTotal: 0, // lamports
    totalCharged: 0, // lamports
    nonce: 0,
});

const vaultBalanceLamports = ref(0);

const ui = reactive({
    amountSol: "0.25",
    maxPerChargeSol: "0.05",
    maxTotalSol: "1.00",
});

const validAmount = computed(() => {
    const n = Number(ui.amountSol);
    return Number.isFinite(n) && n > 0;
});

const validLimits = computed(() => {
    const a = Number(ui.maxPerChargeSol);
    const b = Number(ui.maxTotalSol);
    return Number.isFinite(a) && Number.isFinite(b) && a > 0 && b > 0;
});

function shortPk(pk) {
    const s = typeof pk === "string" ? pk : pk?.toString?.();
    if (!s) return null;
    return s.slice(0, 4) + "…" + s.slice(-4);
}

function fmtSOL(lamportsOrSol) {
    // We store ledger values in lamports. If you accidentally pass SOL, it will look wrong.
    const v = Number(lamportsOrSol);
    if (!Number.isFinite(v)) return "—";
    const sol = v / LAMPORTS_PER_SOL;
    return `${sol.toFixed(3)} SOL`;
}

function solToLamportsBn(solString) {
    // Avoid floating rounding surprises for UI amounts:
    // interpret as SOL with up to 9 decimals -> integer lamports
    const raw = String(solString ?? "").trim();
    if (!raw) return new BN(0);

    const [whole, frac = ""] = raw.split(".");
    const fracPadded = (frac + "000000000").slice(0, 9);
    const lamportsStr = `${whole}${fracPadded}`.replace(/^0+(?=\d)/, ""); // keep "0" if zero
    return new BN(lamportsStr || "0");
}

function getProvider() {
    const provider = window?.phantom?.solana;
    if (!provider?.isPhantom) throw new Error("Phantom wallet not found");
    return provider;
}

function getConnection() {
    return new Connection(RPC_URL, "confirmed");
}

function getAnchorProvider() {
    return new AnchorProvider(getConnection(), getProvider(), {
        commitment: "confirmed",
    });
}

function getProgram(provider) {
    // This form is the most compatible across Anchor versions:
    return new Program(idl, provider);
}

function derivePdas(userPk) {
    const [ledgerPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("ledger"), userPk.toBuffer()],
        PROGRAM_ID,
    );
    const [vaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), userPk.toBuffer()],
        PROGRAM_ID,
    );
    const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        PROGRAM_ID,
    );

    return { ledgerPda, vaultPda, configPda };
}

async function ensureWalletConnected() {
    const phantom = getProvider();
    if (!phantom.publicKey) await phantom.connect();

    wallet.connected = true;
    wallet.pubkey = phantom.publicKey;
    wallet.short = shortPk(phantom.publicKey);

    const { ledgerPda, vaultPda } = derivePdas(phantom.publicKey);
    wallet.ledgerPda = ledgerPda;
    wallet.vaultPda = vaultPda;
    wallet.ledgerPdaShort = shortPk(ledgerPda);
    wallet.vaultPdaShort = shortPk(vaultPda);
}

async function fetchConfig(program, configPda) {
    // If config isn't initialized yet, this will throw; we handle it gracefully.
    try {
        const cfg = await program.account.config.fetch(configPda);
        config.treasury = cfg.treasury;
        config.serviceSigner = cfg.serviceSigner;
        config.treasuryShort = shortPk(cfg.treasury);
        config.serviceSignerShort = shortPk(cfg.serviceSigner);
    } catch {
        config.treasury = null;
        config.serviceSigner = null;
        config.treasuryShort = null;
        config.serviceSignerShort = null;
    }
}

async function fetchLedger(program, ledgerPda) {
    try {
        const acc = await program.account.ledger.fetch(ledgerPda);

        ledger.initialized = true;
        ledger.balance = Number(acc.balance);
        ledger.chargingEnabled = Boolean(acc.chargingEnabled);
        ledger.maxPerCharge = Number(acc.maxPerCharge);
        ledger.maxTotal = Number(acc.maxTotal);
        ledger.totalCharged = Number(acc.totalCharged);
        ledger.nonce = Number(acc.nonce);
    } catch {
        // You said "assume initialize_user was called before", but if not:
        ledger.initialized = false;
        ledger.balance = 0;
        ledger.chargingEnabled = false;
        ledger.maxPerCharge = 0;
        ledger.maxTotal = 0;
        ledger.totalCharged = 0;
        ledger.nonce = 0;
    }
}

async function fetchVaultLamports(connection, vaultPda) {
    vaultBalanceLamports.value = await connection.getBalance(
        vaultPda,
        "confirmed",
    );
}

async function refreshAll() {
    busy.value = true;
    error.value = "";
    try {
        await ensureWalletConnected();

        const provider = getAnchorProvider();
        const program = getProgram(provider);

        const { ledgerPda, vaultPda, configPda } = derivePdas(wallet.pubkey);

        await fetchConfig(program, configPda);
        await fetchLedger(program, ledgerPda);
        await fetchVaultLamports(provider.connection, vaultPda);
    } catch (e) {
        error.value = e?.message || String(e);
    } finally {
        busy.value = false;
    }
}

/* ============
   RPC CALLS
=========== */

async function deposit() {
    busy.value = true;
    error.value = "";
    try {
        await ensureWalletConnected();

        const provider = getAnchorProvider();
        const program = getProgram(provider);
        const user = wallet.pubkey;

        const { ledgerPda, vaultPda } = derivePdas(user);
        const amountLamports = solToLamportsBn(ui.amountSol);
        if (amountLamports.lte(new BN(0))) throw new Error("Invalid amount");

        await program.methods
            .depositSol(amountLamports)
            .accounts({
                user,
                ledger: ledgerPda,
                vault: vaultPda,
                systemProgram: new PublicKey(
                    "11111111111111111111111111111111",
                ),
            })
            .rpc();

        await refreshAll();
    } catch (e) {
        error.value = e?.message || String(e);
    } finally {
        busy.value = false;
    }
}

async function withdraw() {
    busy.value = true;
    error.value = "";
    try {
        await ensureWalletConnected();

        const provider = getAnchorProvider();
        const program = getProgram(provider);
        const user = wallet.pubkey;

        const { ledgerPda, vaultPda } = derivePdas(user);
        const amountLamports = solToLamportsBn(ui.amountSol);
        if (amountLamports.lte(new BN(0))) throw new Error("Invalid amount");

        await program.methods
            .withdrawSol(amountLamports)
            .accounts({
                user,
                ledger: ledgerPda,
                vault: vaultPda,
                systemProgram: new PublicKey(
                    "11111111111111111111111111111111",
                ),
            })
            .rpc();

        await refreshAll();
    } catch (e) {
        error.value = e?.message || String(e);
    } finally {
        busy.value = false;
    }
}

async function enableCharging() {
    busy.value = true;
    error.value = "";
    console.log("stgarting");
    try {
        await ensureWalletConnected();

        const provider = getAnchorProvider();
        const program = getProgram(provider);
        const user = wallet.pubkey;

        const { ledgerPda } = derivePdas(user);
        const maxPer = solToLamportsBn(ui.maxPerChargeSol);
        const maxTot = solToLamportsBn(ui.maxTotalSol);
        if (maxPer.lte(new BN(0)) || maxTot.lte(new BN(0)))
            throw new Error("Invalid limits");

        await program.methods
            .enableCharging(maxPer, maxTot)
            .accounts({
                user,
                ledger: ledgerPda,
            })
            .rpc();

        await refreshAll();
        console.log("finsihed");
    } catch (e) {
        console.log("error", e?.message);
        error.value = e?.message || String(e);
    } finally {
        busy.value = false;
    }
}

async function stopCharging() {
    busy.value = true;
    error.value = "";
    try {
        await ensureWalletConnected();

        const provider = getAnchorProvider();
        const program = getProgram(provider);
        const user = wallet.pubkey;

        const { ledgerPda } = derivePdas(user);

        await program.methods
            .disableCharging()
            .accounts({
                user,
                ledger: ledgerPda,
            })
            .rpc();

        await refreshAll();
    } catch (e) {
        error.value = e?.message || String(e);
    } finally {
        busy.value = false;
    }
}

onMounted(async () => {
    await refreshAll();
});
</script>

<style scoped>
/* Only styles used by elements in THIS component */

.wrap {
    max-width: 980px;
    margin: 0 auto;
    padding: 28px 18px 60px;
}

.row {
    display: grid;
    grid-template-columns: 1.3fr 0.7fr;
    gap: 16px;
    margin-top: 18px;
}
@media (max-width: 880px) {
    .row {
        grid-template-columns: 1fr;
    }
}

.card {
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 18px;
    background: var(--card);
}

.card h2 {
    margin: 0 0 12px;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.35px;
    text-transform: uppercase;
    color: var(--fg);
}

.grid3 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
}
@media (max-width: 880px) {
    .grid3 {
        grid-template-columns: 1fr;
    }
}

.stat {
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 14px;
    background: #0f0f12;
    min-height: 84px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 10px;
}
.stat .k {
    font-size: 12px;
    color: var(--muted);
}
.stat .v {
    font-size: 22px;
    font-weight: 600;
    letter-spacing: 0.2px;
    color: var(--fg);
}

.actions {
    display: grid;
    gap: 10px;
}

.walletRow {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
}

.field {
    display: grid;
    gap: 8px;
}

label {
    font-size: 12px;
    color: var(--muted);
}

input {
    width: 100%;
    padding: 12px 12px;
    border-radius: 12px;
    border: 1px solid var(--border);
    outline: none;
    font-size: 14px;
    background: #0e0e11;
    color: var(--fg);
}
input::placeholder {
    color: #666;
}
input:disabled {
    background: #0a0a0c;
    color: #666;
}

.btnrow {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
}

button {
    border-radius: 999px;
    border: 1px solid var(--fg);
    background: var(--fg);
    color: #000;
    padding: 11px 14px;
    font-size: 13px;
    cursor: pointer;
    letter-spacing: 0.2px;
    transition:
        background 0.15s ease,
        color 0.15s ease,
        border 0.15s ease;
    white-space: nowrap;
}
button:hover {
    background: #ffffff;
}
button.secondary {
    background: transparent;
    color: var(--fg);
    border: 1px solid var(--fg);
}
button.secondary:hover {
    background: #ffffff;
    color: #000;
}
button.ghost {
    background: transparent;
    color: var(--fg);
    border: 1px solid var(--border);
}
button.ghost:hover {
    border-color: var(--fg);
}
button:disabled {
    opacity: 0.35;
    cursor: not-allowed;
}

.pillbar {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 10px;
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

.sep {
    height: 1px;
    background: var(--border);
    margin: 14px 0;
}

.list {
    margin-top: 10px;
    display: grid;
    gap: 8px;
    font-size: 12px;
    color: var(--muted);
}

.listitem {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 10px;
    align-items: center;
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: 12px;
    background: #0f0f12;
}

.mono {
    font-family:
        ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
        "Liberation Mono", "Courier New", monospace;
}

.right {
    text-align: right;
}
.tiny {
    font-size: 12px;
    color: var(--muted);
}

.err {
    color: #ff6b6b;
}
</style>
