<!-- src/views/Payments.vue -->
<template>
    <div class="wrap">
        <div class="layout">
            <div class="main">
                <div class="method-tabs">
                    <button class="method-tab" :class="{ active: paymentTab === 'crypto' }" @click="paymentTab = 'crypto'">Crypto (SOL)</button>
                    <button class="method-tab" :class="{ active: paymentTab === 'card' }" @click="paymentTab = 'card'">Credit Card</button>
                </div>

                <div v-if="paymentTab === 'crypto'" class="tab-body">
                    <section class="card">
                        <div class="card-head">
                            <h3>Wallet</h3>
                            <div class="card-head-right">
                                <span class="status-pill" :class="wallet.connected ? 'on' : ''">{{ wallet.connected ? 'Connected' : 'Disconnected' }}</span>
                                <button class="btn-sm ghost" :disabled="busy" @click="refreshAll">Refresh</button>
                            </div>
                        </div>
                        <div class="wallet-info" v-if="wallet.connected">
                            <div class="wallet-row"><span class="wk">Address</span><span class="wv mono">{{ wallet.short }}</span></div>
                            <div class="wallet-row"><span class="wk">Ledger PDA</span><span class="wv mono">{{ wallet.ledgerPdaShort }}</span></div>
                            <div class="wallet-row"><span class="wk">Vault PDA</span><span class="wv mono">{{ wallet.vaultPdaShort }}</span></div>
                            <div class="wallet-row"><span class="wk">Treasury</span><span class="wv mono">{{ config.treasuryShort }}</span></div>
                            <div class="wallet-row"><span class="wk">Service Signer</span><span class="wv mono">{{ config.serviceSignerShort }}</span></div>
                            <div class="wallet-row"><span class="wk">Initialized</span><span class="wv">{{ ledger.initialized ? 'Yes' : 'No' }}</span></div>
                        </div>
                        <div v-else class="wallet-disconnected"><p>Connect a Phantom wallet to manage crypto deposits.</p></div>
                        <div v-if="error" class="err-msg">{{ error }}</div>
                    </section>

                    <section class="card">
                        <h3>Deposit &amp; Withdraw</h3>
                        <div class="form-stack">
                            <div class="field">
                                <label>Amount (SOL)</label>
                                <input type="number" step="0.01" min="0" v-model="ui.amountSol" :disabled="busy || !wallet.connected" placeholder="e.g. 0.50" />
                            </div>
                            <div class="btnrow">
                                <button @click="deposit" :disabled="busy || !wallet.connected || !validAmount">Deposit</button>
                                <button class="secondary" @click="withdraw" :disabled="busy || !wallet.connected || !validAmount || ledger.balance <= 0">Withdraw</button>
                            </div>
                        </div>
                    </section>

                    <section class="card">
                        <div class="card-head">
                            <h3>Charging</h3>
                            <span class="status-pill" :class="ledger.chargingEnabled ? 'on' : ''">{{ ledger.chargingEnabled ? 'Enabled' : 'Disabled' }}</span>
                        </div>
                        <div class="form-stack">
                            <div class="field">
                                <label>Limits (SOL)</label>
                                <div class="btnrow">
                                    <input type="number" step="0.01" min="0" v-model="ui.maxPerChargeSol" :disabled="busy || !wallet.connected" placeholder="max per charge" />
                                    <input type="number" step="0.01" min="0" v-model="ui.maxTotalSol" :disabled="busy || !wallet.connected" placeholder="max total" />
                                </div>
                            </div>
                            <div class="btnrow">
                                <button class="secondary" @click="enableCharging" :disabled="busy || !wallet.connected || !validLimits">Enable Charging</button>
                                <button class="ghost" @click="stopCharging" :disabled="busy || !wallet.connected || !ledger.chargingEnabled">Stop Charging</button>
                            </div>
                            <div class="charge-pills" v-if="ledger.chargingEnabled">
                                <span class="cpill">Max/charge: <strong>{{ fmtSOL(ledger.maxPerCharge) }}</strong></span>
                                <span class="cpill">Max total: <strong>{{ fmtSOL(ledger.maxTotal) }}</strong></span>
                                <span class="cpill">Nonce: <strong class="mono">{{ ledger.nonce }}</strong></span>
                            </div>
                        </div>
                    </section>
                </div>

                <div v-if="paymentTab === 'card'" class="tab-body">
                    <section class="card" v-if="savedCards.length">
                        <h3>Your Cards</h3>
                        <div class="saved-cards">
                            <div v-for="(c, i) in savedCards" :key="i" class="saved-card-item">
                                <div class="sc-info">
                                    <strong>{{ c.brandLabel }} &bull;&bull;&bull;&bull; {{ c.last4 }}</strong>
                                    <span class="sc-exp">Expires {{ c.exp }}</span>
                                </div>
                                <div class="sc-actions">
                                    <span class="status-pill on" v-if="c.default">Default</span>
                                    <button class="btn-sm ghost" @click="removeCard(i)">Remove</button>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section class="card">
                        <div class="card-head" v-if="savedCards.length && !showCardForm">
                            <h3>Add Payment Method</h3>
                            <button class="btn-sm secondary" @click="showCardForm = true">+ Add Card</button>
                        </div>
                        <h3 v-if="!savedCards.length || showCardForm">{{ savedCards.length ? 'Add Another Card' : 'Add a Credit Card' }}</h3>
                        <div v-if="showCardForm || !savedCards.length" class="card-form">
                            <div class="field">
                                <label>Card number</label>
                                <input v-model="cardForm.number" placeholder="4242 4242 4242 4242" maxlength="19" @input="formatCardNumber" />
                            </div>
                            <div class="card-row">
                                <div class="field"><label>Expiry</label><input v-model="cardForm.exp" placeholder="MM / YY" maxlength="7" @input="formatExpiry" /></div>
                                <div class="field"><label>CVC</label><input v-model="cardForm.cvc" placeholder="123" maxlength="4" type="password" /></div>
                            </div>
                            <div class="field"><label>Name on card</label><input v-model="cardForm.name" placeholder="Jane Doe" /></div>
                            <div class="btnrow">
                                <button @click="addCard" :disabled="!cardFormValid || cardBusy">{{ cardBusy ? 'Saving...' : 'Add Card' }}</button>
                                <button v-if="savedCards.length" class="ghost" @click="showCardForm = false; resetCardForm()">Cancel</button>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            <aside class="sidebar">
                <div class="sidebar-card">
                    <h3>Account Balance</h3>
                    <div class="bal-item primary">
                        <div class="bal-label">Total (USD)</div>
                        <div class="bal-value">${{ totalUsd }}</div>
                    </div>
                    <div class="bal-sep"></div>
                    <div class="bal-item">
                        <div class="bal-label"><span class="bal-dot crypto"></span>Crypto (SOL)</div>
                        <div class="bal-value">{{ fmtSOL(ledger.balance) }}</div>
                        <div class="bal-usd">~${{ solToUsd(ledger.balance) }}</div>
                    </div>
                    <div class="bal-item">
                        <div class="bal-label"><span class="bal-dot vault"></span>Vault (on-chain)</div>
                        <div class="bal-value">{{ fmtSOL(vaultBalanceLamports) }}</div>
                        <div class="bal-usd">~${{ solToUsd(vaultBalanceLamports) }}</div>
                    </div>
                    <div class="bal-item">
                        <div class="bal-label"><span class="bal-dot card-dot"></span>Card Balance</div>
                        <div class="bal-value">${{ cardBalance.toFixed(2) }}</div>
                    </div>
                    <div class="bal-sep"></div>
                    <div class="bal-item">
                        <div class="bal-label">Total Charged</div>
                        <div class="bal-value sm">{{ fmtSOL(ledger.totalCharged) }}</div>
                    </div>
                </div>
                <div class="sidebar-card">
                    <h3>Quick Stats</h3>
                    <div class="qs-row"><span class="qs-k">Payment methods</span><span class="qs-v">{{ paymentMethodCount }}</span></div>
                    <div class="qs-row"><span class="qs-k">Charging</span><span class="qs-v" :class="ledger.chargingEnabled ? 'green' : 'red'">{{ ledger.chargingEnabled ? 'Active' : 'Off' }}</span></div>
                    <div class="qs-row"><span class="qs-k">Wallet</span><span class="qs-v" :class="wallet.connected ? 'green' : 'red'">{{ wallet.connected ? 'Connected' : 'None' }}</span></div>
                    <div class="qs-row"><span class="qs-k">Cards on file</span><span class="qs-v">{{ savedCards.length }}</span></div>
                    <div class="qs-row"><span class="qs-k">State</span><span class="qs-v">{{ busy ? 'Working...' : 'Idle' }}</span></div>
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
const PROGRAM_ID = new PublicKey(import.meta.env.VITE_PROGRAM_ID || "BUam43b33sLJvKqb3u7jSwUb3JisLDzAYDN4ECNmsGSU");
const LAMPORTS_PER_SOL = 1_000_000_000;
const SOL_USD_PRICE = 142.50;
const MOCK_WALLET_ADDRESS = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU";

const busy = ref(false);
const error = ref("");
const simMode = ref(false);
const paymentTab = ref("crypto");

const wallet = reactive({ connected: false, pubkey: null, short: null, ledgerPda: null, vaultPda: null, ledgerPdaShort: null, vaultPdaShort: null });
const config = reactive({ treasury: null, serviceSigner: null, treasuryShort: null, serviceSignerShort: null });
const ledger = reactive({ initialized: false, balance: 0, chargingEnabled: false, maxPerCharge: 0, maxTotal: 0, totalCharged: 0, nonce: 0 });
const vaultBalanceLamports = ref(0);
const ui = reactive({ amountSol: "0.25", maxPerChargeSol: "0.05", maxTotalSol: "1.00" });

const validAmount = computed(() => { const n = Number(ui.amountSol); return Number.isFinite(n) && n > 0; });
const validLimits = computed(() => { const a = Number(ui.maxPerChargeSol); const b = Number(ui.maxTotalSol); return Number.isFinite(a) && Number.isFinite(b) && a > 0 && b > 0; });

const cardBalance = ref(0);
function solToUsd(lamports) { return ((Number(lamports) / LAMPORTS_PER_SOL) * SOL_USD_PRICE).toFixed(2); }
const totalUsd = computed(() => { const solUsd = (Number(ledger.balance) / LAMPORTS_PER_SOL) * SOL_USD_PRICE; return (solUsd + cardBalance.value).toFixed(2); });
const paymentMethodCount = computed(() => { let c = 0; if (wallet.connected) c++; c += savedCards.length; return c; });

function shortPk(pk) { const s = typeof pk === "string" ? pk : pk?.toString?.(); if (!s) return null; return s.slice(0, 4) + "\u2026" + s.slice(-4); }
function fmtSOL(v) { const n = Number(v); if (!Number.isFinite(n)) return "\u2014"; return (n / LAMPORTS_PER_SOL).toFixed(3) + " SOL"; }

function solToLamportsBn(solString) {
    const raw = String(solString ?? "").trim();
    if (!raw) return new BN(0);
    const [whole, frac = ""] = raw.split(".");
    const fracPadded = (frac + "000000000").slice(0, 9);
    const lamportsStr = (whole + fracPadded).replace(/^0+(?=\d)/, "");
    return new BN(lamportsStr || "0");
}

function hasRealPhantom() { return !!window?.phantom?.solana?.isPhantom; }
function getProvider() { if (hasRealPhantom()) return window.phantom.solana; return null; }
function getConnection() { return new Connection(RPC_URL, "confirmed"); }
function getAnchorProvider() { return new AnchorProvider(getConnection(), getProvider(), { commitment: "confirmed" }); }
function getProgram(provider) { return new Program(idl, provider); }

function derivePdas(userPk) {
    const [ledgerPda] = PublicKey.findProgramAddressSync([Buffer.from("ledger"), userPk.toBuffer()], PROGRAM_ID);
    const [vaultPda] = PublicKey.findProgramAddressSync([Buffer.from("vault"), userPk.toBuffer()], PROGRAM_ID);
    const [configPda] = PublicKey.findProgramAddressSync([Buffer.from("config")], PROGRAM_ID);
    return { ledgerPda, vaultPda, configPda };
}

function loadMockData() {
    const addr = localStorage.getItem("mock_wallet") || MOCK_WALLET_ADDRESS;
    wallet.connected = true; wallet.pubkey = addr; wallet.short = shortPk(addr);
    wallet.ledgerPdaShort = "Ldgr\u20268xQ2"; wallet.vaultPdaShort = "Vlt\u20264mKe";
    config.treasuryShort = "Trsy\u20269wPq"; config.serviceSignerShort = "Svc\u20263nRj";
    ledger.initialized = true; ledger.balance = 2_750_000_000; ledger.chargingEnabled = true;
    ledger.maxPerCharge = 50_000_000; ledger.maxTotal = 1_000_000_000;
    ledger.totalCharged = 187_500_000; ledger.nonce = 14;
    vaultBalanceLamports.value = 2_750_000_000;
}

async function ensureWalletConnected() {
    if (simMode.value) return;
    const phantom = getProvider();
    if (!phantom) { simMode.value = true; loadMockData(); return; }
    if (!phantom.publicKey) await phantom.connect();
    wallet.connected = true; wallet.pubkey = phantom.publicKey; wallet.short = shortPk(phantom.publicKey);
    const { ledgerPda, vaultPda } = derivePdas(phantom.publicKey);
    wallet.ledgerPda = ledgerPda; wallet.vaultPda = vaultPda;
    wallet.ledgerPdaShort = shortPk(ledgerPda); wallet.vaultPdaShort = shortPk(vaultPda);
}

async function fetchConfig(program, configPda) {
    try { const cfg = await program.account.config.fetch(configPda); config.treasury = cfg.treasury; config.serviceSigner = cfg.serviceSigner; config.treasuryShort = shortPk(cfg.treasury); config.serviceSignerShort = shortPk(cfg.serviceSigner); }
    catch { config.treasury = null; config.serviceSigner = null; config.treasuryShort = null; config.serviceSignerShort = null; }
}

async function fetchLedger(program, lPda) {
    try { const acc = await program.account.ledger.fetch(lPda); ledger.initialized = true; ledger.balance = Number(acc.balance); ledger.chargingEnabled = Boolean(acc.chargingEnabled); ledger.maxPerCharge = Number(acc.maxPerCharge); ledger.maxTotal = Number(acc.maxTotal); ledger.totalCharged = Number(acc.totalCharged); ledger.nonce = Number(acc.nonce); }
    catch { ledger.initialized = false; ledger.balance = 0; ledger.chargingEnabled = false; ledger.maxPerCharge = 0; ledger.maxTotal = 0; ledger.totalCharged = 0; ledger.nonce = 0; }
}

async function fetchVaultLamports(connection, vaultPda) { vaultBalanceLamports.value = await connection.getBalance(vaultPda, "confirmed"); }

async function refreshAll() {
    busy.value = true; error.value = "";
    try {
        await ensureWalletConnected();
        if (simMode.value) { loadMockData(); return; }
        const provider = getAnchorProvider(); const program = getProgram(provider);
        const { ledgerPda, vaultPda, configPda } = derivePdas(wallet.pubkey);
        await fetchConfig(program, configPda); await fetchLedger(program, ledgerPda);
        await fetchVaultLamports(provider.connection, vaultPda);
    } catch (e) {
        if (!simMode.value) { simMode.value = true; loadMockData(); }
        else { error.value = e?.message || String(e); }
    } finally { busy.value = false; }
}

async function simulateDelay() { await new Promise((r) => setTimeout(r, 500 + Math.random() * 800)); }

async function deposit() {
    busy.value = true; error.value = "";
    try {
        if (simMode.value) { await simulateDelay(); const amt = solToLamportsBn(ui.amountSol); ledger.balance += amt.toNumber(); vaultBalanceLamports.value = ledger.balance; return; }
        await ensureWalletConnected(); const provider = getAnchorProvider(); const program = getProgram(provider);
        const user = wallet.pubkey; const { ledgerPda, vaultPda } = derivePdas(user);
        const amountLamports = solToLamportsBn(ui.amountSol);
        if (amountLamports.lte(new BN(0))) throw new Error("Invalid amount");
        await program.methods.depositSol(amountLamports).accounts({ user, ledger: ledgerPda, vault: vaultPda, systemProgram: new PublicKey("11111111111111111111111111111111") }).rpc();
        await refreshAll();
    } catch (e) { error.value = e?.message || String(e); } finally { busy.value = false; }
}

async function withdraw() {
    busy.value = true; error.value = "";
    try {
        if (simMode.value) { await simulateDelay(); const amt = solToLamportsBn(ui.amountSol); ledger.balance = Math.max(0, ledger.balance - amt.toNumber()); vaultBalanceLamports.value = ledger.balance; return; }
        await ensureWalletConnected(); const provider = getAnchorProvider(); const program = getProgram(provider);
        const user = wallet.pubkey; const { ledgerPda, vaultPda } = derivePdas(user);
        const amountLamports = solToLamportsBn(ui.amountSol);
        if (amountLamports.lte(new BN(0))) throw new Error("Invalid amount");
        await program.methods.withdrawSol(amountLamports).accounts({ user, ledger: ledgerPda, vault: vaultPda, systemProgram: new PublicKey("11111111111111111111111111111111") }).rpc();
        await refreshAll();
    } catch (e) { error.value = e?.message || String(e); } finally { busy.value = false; }
}

async function enableCharging() {
    busy.value = true; error.value = "";
    try {
        if (simMode.value) { await simulateDelay(); ledger.chargingEnabled = true; ledger.maxPerCharge = solToLamportsBn(ui.maxPerChargeSol).toNumber(); ledger.maxTotal = solToLamportsBn(ui.maxTotalSol).toNumber(); return; }
        await ensureWalletConnected(); const provider = getAnchorProvider(); const program = getProgram(provider);
        const user = wallet.pubkey; const { ledgerPda } = derivePdas(user);
        const maxPer = solToLamportsBn(ui.maxPerChargeSol); const maxTot = solToLamportsBn(ui.maxTotalSol);
        if (maxPer.lte(new BN(0)) || maxTot.lte(new BN(0))) throw new Error("Invalid limits");
        await program.methods.enableCharging(maxPer, maxTot).accounts({ user, ledger: ledgerPda }).rpc();
        await refreshAll();
    } catch (e) { error.value = e?.message || String(e); } finally { busy.value = false; }
}

async function stopCharging() {
    busy.value = true; error.value = "";
    try {
        if (simMode.value) { await simulateDelay(); ledger.chargingEnabled = false; return; }
        await ensureWalletConnected(); const provider = getAnchorProvider(); const program = getProgram(provider);
        const user = wallet.pubkey; const { ledgerPda } = derivePdas(user);
        await program.methods.disableCharging().accounts({ user, ledger: ledgerPda }).rpc();
        await refreshAll();
    } catch (e) { error.value = e?.message || String(e); } finally { busy.value = false; }
}

const showCardForm = ref(false);
const cardBusy = ref(false);
const savedCards = reactive([]);
const cardForm = reactive({ number: "", exp: "", cvc: "", name: "" });
const cardFormValid = computed(() => cardForm.number.replace(/\s/g, "").length >= 15 && cardForm.exp.length >= 5 && cardForm.cvc.length >= 3 && cardForm.name.trim().length >= 2);

function formatCardNumber() { let v = cardForm.number.replace(/\D/g, "").slice(0, 16); cardForm.number = v.replace(/(\d{4})(?=\d)/g, "$1 "); }
function formatExpiry() { let v = cardForm.exp.replace(/\D/g, "").slice(0, 4); cardForm.exp = v.length >= 3 ? v.slice(0, 2) + " / " + v.slice(2) : v; }
function detectBrand(num) { const n = num.replace(/\s/g, ""); if (n.startsWith("4")) return { brand: "visa", brandLabel: "Visa" }; if (n.startsWith("5") || n.startsWith("2")) return { brand: "mastercard", brandLabel: "Mastercard" }; if (n.startsWith("3")) return { brand: "amex", brandLabel: "Amex" }; return { brand: "card", brandLabel: "Card" }; }
function resetCardForm() { cardForm.number = ""; cardForm.exp = ""; cardForm.cvc = ""; cardForm.name = ""; }

async function addCard() {
    cardBusy.value = true;
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 600));
    const digits = cardForm.number.replace(/\s/g, "");
    const { brand, brandLabel } = detectBrand(digits);
    savedCards.push({ brand, brandLabel, last4: digits.slice(-4), exp: cardForm.exp, name: cardForm.name, default: savedCards.length === 0 });
    resetCardForm(); showCardForm.value = false; cardBusy.value = false;
}

function removeCard(index) {
    const wasDefault = savedCards[index]?.default;
    savedCards.splice(index, 1);
    if (wasDefault && savedCards.length > 0) savedCards[0].default = true;
}

onMounted(async () => { await refreshAll(); });
</script>

<style scoped>
.wrap { max-width: 1060px; margin: 0 auto; padding: 24px 18px 60px; }
.layout { display: grid; grid-template-columns: 1fr 280px; gap: 16px; align-items: start; }
@media (max-width: 880px) { .layout { grid-template-columns: 1fr; } .sidebar { order: -1; } }

.method-tabs { display: flex; gap: 4px; padding: 4px; background: var(--chip); border: 1px solid var(--border); border-radius: 12px; margin-bottom: 14px; }
.method-tab { flex: 1; padding: 10px 14px; border-radius: 10px; border: none; background: transparent; color: var(--muted); font-size: 13px; font-weight: 600; cursor: pointer; transition: all .15s ease; letter-spacing: .2px; }
.method-tab:hover { color: var(--fg); }
.method-tab.active { background: var(--card); color: var(--fg); border: 1px solid var(--border); box-shadow: 0 1px 4px rgba(0,0,0,.15); }

.tab-body { display: flex; flex-direction: column; gap: 14px; }

.card { border: 1px solid var(--border); border-radius: 14px; padding: 16px; background: var(--card); }
.card h3 { margin: 0 0 12px; font-size: 12px; font-weight: 600; letter-spacing: .4px; text-transform: uppercase; color: var(--muted); }
.card-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 12px; }
.card-head h3 { margin: 0; }
.card-head-right { display: flex; align-items: center; gap: 8px; }

.status-pill { font-size: 10px; padding: 3px 10px; border-radius: 999px; border: 1px solid var(--border); color: var(--muted); font-weight: 600; text-transform: uppercase; letter-spacing: .5px; }
.status-pill.on { border-color: #4ade8040; color: #4ade80; background: #4ade8010; }

.wallet-info { display: flex; flex-direction: column; }
.wallet-row { display: flex; justify-content: space-between; align-items: center; font-size: 12px; padding: 7px 0; border-bottom: 1px solid var(--border); }
.wallet-row:last-child { border-bottom: none; }
.wk { color: var(--muted); }
.wv { font-weight: 500; }
.wallet-disconnected { text-align: center; padding: 20px 0; }
.wallet-disconnected p { margin: 0; font-size: 12px; color: var(--muted); }
.err-msg { margin-top: 10px; font-size: 12px; color: #ff6b6b; padding: 8px 12px; border-radius: 8px; background: #ff6b6b10; border: 1px solid #ff6b6b20; }

.form-stack { display: flex; flex-direction: column; gap: 12px; }
.field { display: flex; flex-direction: column; gap: 6px; }
label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: .4px; font-weight: 600; }
input { width: 100%; padding: 10px 12px; border-radius: 10px; border: 1px solid var(--border); outline: none; font-size: 13px; background: var(--input-bg, var(--chip)); color: var(--fg); font-family: inherit; transition: border-color .15s ease; box-sizing: border-box; }
input:focus { border-color: var(--muted); }
input::placeholder { color: var(--muted); opacity: .6; }
input:disabled { opacity: .4; }
.btnrow { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }

button { border-radius: 10px; border: 1px solid var(--btn-primary-bg, var(--fg)); background: var(--btn-primary-bg, var(--fg)); color: var(--btn-primary-fg, #000); padding: 10px 14px; font-size: 12px; font-weight: 600; cursor: pointer; letter-spacing: .2px; transition: all .15s ease; white-space: nowrap; }
button:hover { filter: brightness(1.1); }
button.secondary { background: transparent; color: var(--fg); border: 1px solid var(--border); }
button.secondary:hover { border-color: var(--fg); }
button.ghost { background: transparent; color: var(--muted); border: 1px solid var(--border); }
button.ghost:hover { color: var(--fg); border-color: var(--fg); }
button:disabled { opacity: .3; cursor: not-allowed; }
.btn-sm { padding: 5px 10px; font-size: 11px; border-radius: 8px; }

.charge-pills { display: flex; flex-wrap: wrap; gap: 6px; }
.cpill { font-size: 11px; padding: 4px 10px; border-radius: 999px; border: 1px solid var(--border); background: var(--chip); color: var(--muted); }
.cpill strong { color: var(--fg); font-weight: 600; }

.saved-cards { display: flex; flex-direction: column; gap: 8px; }
.saved-card-item { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border: 1px solid var(--border); border-radius: 10px; background: var(--chip); }
.sc-info { flex: 1; min-width: 0; }
.sc-info strong { font-size: 13px; display: block; }
.sc-exp { font-size: 11px; color: var(--muted); }
.sc-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.card-form { display: flex; flex-direction: column; gap: 12px; }
.card-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

.sidebar { display: flex; flex-direction: column; gap: 14px; position: sticky; top: 80px; }
.sidebar-card { border: 1px solid var(--border); border-radius: 14px; padding: 16px; background: var(--card); }
.sidebar-card h3 { margin: 0 0 14px; font-size: 11px; font-weight: 600; letter-spacing: .5px; text-transform: uppercase; color: var(--muted); }

.bal-item { padding: 8px 0; }
.bal-item.primary { padding: 14px; border-radius: 10px; background: var(--chip); border: 1px solid var(--border); margin-bottom: 4px; }
.bal-label { font-size: 11px; color: var(--muted); display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
.bal-value { font-size: 20px; font-weight: 700; letter-spacing: -.3px; }
.bal-item.primary .bal-value { font-size: 24px; }
.bal-value.sm { font-size: 14px; font-weight: 600; }
.bal-usd { font-size: 11px; color: var(--muted); margin-top: 1px; }
.bal-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.bal-dot.crypto { background: #9945FF; box-shadow: 0 0 6px #9945FF60; }
.bal-dot.vault { background: #14F195; box-shadow: 0 0 6px #14F19560; }
.bal-dot.card-dot { background: #3b82f6; box-shadow: 0 0 6px #3b82f660; }
.bal-sep { height: 1px; background: var(--border); margin: 6px 0; }

.qs-row { display: flex; justify-content: space-between; align-items: center; font-size: 12px; padding: 6px 0; border-bottom: 1px solid var(--border); }
.qs-row:last-child { border-bottom: none; }
.qs-k { color: var(--muted); }
.qs-v { font-weight: 600; }
.qs-v.green { color: #4ade80; }
.qs-v.red { color: #ef4444; }
.mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
</style>
