<template>
    <div class="wrap">
        <div class="pagehead">
            <div>
                <h2>Wallet</h2>
                <p>Authenticate using Phantom.</p>
            </div>

            <button
                v-if="jwt && !isMockMode"
                class="createBtn"
                :disabled="busy"
                @click="checkLedgerStatusBackend"
            >
                Check Ledger (Backend)
            </button>

            <button
                v-if="jwt"
                :disabled="busy"
                @click="disconnect"
            >
                Disconnect
            </button>

            <div class="pillbar">
                <span class="pill">
                    Status:
                    <strong>
                        {{
                            busy
                                ? "WORKING"
                                : jwt
                                  ? "CONNECTED"
                                  : "DISCONNECTED"
                        }}
                    </strong>
                </span>
                <span class="pill" v-if="isMockMode" style="background: #ffa50020; border-color: #ffa500; color: #ffa500;">
                    <strong>DEMO MODE</strong>
                </span>
            </div>
        </div>

        <section class="grid">
            <article class="card">
                <div class="cardtop">
                    <div class="titleblock">
                        <h3 class="agentname">Wallet</h3>
                        <div class="subline">
                            <span
                                >Provider:
                                <span class="mono">Phantom</span></span
                            >
                            <span>•</span>
                            <span>Localnet</span>
                        </div>
                    </div>

                    <div class="tiny right">
                        <div class="mono">
                            {{ busy ? "Working…" : jwt ? "Ready" : "Idle" }}
                        </div>
                    </div>
                </div>

                <div class="sep"></div>

                <div class="actions">
                    <div class="leftActions">
                        <span class="tiny err" v-if="error">
                            {{ error }}
                        </span>
                    </div>

                    <div class="rightActions">
                        <!-- Connect -->
                        <button
                            v-if="!jwt"
                            class="createBtn"
                            :disabled="busy"
                            @click="connectWalletAndAuth"
                        >
                            Connect Wallet
                        </button>

                        <!-- Initialize -->
                        <button
                            v-if="jwt && !isInitialized"
                            class="createBtn"
                            :disabled="busy"
                            @click="initializeOnChainUser"
                        >
                            Initialize On-Chain Account
                        </button>
                    </div>
                </div>
            </article>
        </section>
    </div>
</template>

<script setup>
import { ref } from "vue";
import { Buffer } from "buffer";
import bs58 from "bs58";

window.Buffer = Buffer;

import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorProvider, Program } from "@coral-xyz/anchor";

import idl from "@/idl/covenant_vault.json";

/* =====================
   CONFIG
===================== */

const API_BASE = "";
const CREATE_USER_PATH = "/user";
const RPC_URL = import.meta.env.VITE_RPC_URL || "http://127.0.0.1:8899";

const PROGRAM_ID = new PublicKey(
    import.meta.env.VITE_PROGRAM_ID ||
        "BUam43b33sLJvKqb3u7jSwUb3JisLDzAYDN4ECNmsGSU",
);

/* =====================
   STATE
===================== */

const busy = ref(false);
const error = ref("");
const jwt = ref(localStorage.getItem("jwt") || "");
const isInitialized = ref(false);
// Detect if a previous session stored a mock token
const isMockMode = ref(jwt.value.startsWith("mock."));

/* =====================
   WALLET
===================== */

async function checkLedgerStatusBackend() {
    busy.value = true;
    error.value = "";

    try {
        const phantom = getProvider();
        if (!phantom.publicKey) {
            await phantom.connect();
        }

        const wallet = phantom.publicKey.toString();

        const res = await fetch(`/solana/${wallet}/ledger-status`, {
            headers: {
                Authorization: `Bearer ${jwt.value}`,
            },
        });

        if (!res.ok) {
            throw new Error(`Backend error: ${res.status}`);
        }

        const data = await res.json();
        console.log("Ledger status:", data);
    } catch (e) {
        error.value = e?.message || String(e);
    } finally {
        busy.value = false;
    }
}

function getProvider() {
    const provider = window?.phantom?.solana;
    if (!provider?.isPhantom) {
        throw new Error("Phantom wallet not found");
    }
    return provider;
}

/* =====================
   BACKEND
===================== */

async function createUser(wallet_key) {
    const token = localStorage.getItem("jwt");

    const res = await fetch(`${API_BASE}${CREATE_USER_PATH}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ wallet_key }),
    });

    if (!res.ok && res.status !== 409) {
        throw new Error("User creation failed");
    }
}

async function getChallenge(wallet_key) {
    const res = await fetch(`${API_BASE}/auth/challenge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet_key }),
    });

    if (!res.ok) throw new Error("Challenge failed");
    return await res.json();
}

async function verifySignature(payload) {
    const res = await fetch(`${API_BASE}/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error("Verify failed");
    return await res.json();
}

/* =====================
   MOCK MODE (for demos without backend)
===================== */

function createMockJWT(wallet_key) {
    // Create a simple mock JWT-like token for demo purposes
    // Format: mock.{base64(wallet_key)}.{timestamp}
    const payload = {
        wallet_key,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 86400, // 24 hours
    };
    const encoded = btoa(JSON.stringify(payload));
    return `mock.${encoded}.${Date.now()}`;
}

function isBackendError(err) {
    // Detect any failure that indicates the backend is unreachable:
    // - True network errors (TypeError / "Failed to fetch")
    // - Vite proxy errors (returns 500/502 → our code throws "Challenge failed")
    // - Connection refused passed through in any form
    const msg = (err?.message || "").toLowerCase();
    return (
        msg.includes("failed to fetch") ||
        msg.includes("networkerror") ||
        msg.includes("econnrefused") ||
        msg.includes("challenge failed") ||
        msg.includes("verify failed") ||
        err?.name === "TypeError"
    );
}

/* =====================
   DISCONNECT
===================== */

function disconnect() {
    jwt.value = "";
    isMockMode.value = false;
    isInitialized.value = false;
    error.value = "";
    localStorage.removeItem("jwt");

    try {
        const phantom = getProvider();
        phantom.disconnect();
    } catch {
        // Phantom not available — that's fine
    }
}

/* =====================
   AUTH FLOW
===================== */

async function connectWalletAndAuth() {
    busy.value = true;
    error.value = "";
    isMockMode.value = false;

    try {
        const phantom = getProvider();
        await phantom.connect();

        const wallet_key = phantom.publicKey.toString();

        // Try real backend auth first
        try {
            const ch = await getChallenge(wallet_key);

            const msgBytes = new TextEncoder().encode(ch.message);
            const signed = await phantom.signMessage(msgBytes, "utf8");

            const data = await verifySignature({
                wallet_key,
                nonce: ch.nonce,
                message: ch.message,
                signature: bs58.encode(signed.signature),
            });

            jwt.value = data.token;
            localStorage.setItem("jwt", data.token);

            // Try to create user (ignore if backend unavailable)
            try {
                await createUser(wallet_key);
            } catch (e) {
                console.warn("User creation skipped:", e?.message);
            }

            isInitialized.value = await checkInitialized(phantom.publicKey);
        } catch (backendError) {
            // If backend is unavailable, fall back to mock mode for demo
            if (isBackendError(backendError)) {
                console.warn(
                    "Backend unavailable — falling back to demo mode.",
                    backendError?.message,
                );
                isMockMode.value = true;

                const mockToken = createMockJWT(wallet_key);
                jwt.value = mockToken;
                localStorage.setItem("jwt", mockToken);

                // On-chain check still works via Solana RPC (no backend needed)
                try {
                    isInitialized.value = await checkInitialized(
                        phantom.publicKey,
                    );
                } catch {
                    isInitialized.value = false;
                }
            } else {
                // Real error (e.g. user rejected Phantom prompt), re-throw
                throw backendError;
            }
        }
    } catch (e) {
        error.value = e?.message || String(e);
    } finally {
        busy.value = false;
    }
}

/* =====================
   ANCHOR
===================== */

function getAnchorProvider() {
    return new AnchorProvider(
        new Connection(RPC_URL, "confirmed"),
        getProvider(),
        { commitment: "confirmed" },
    );
}

function getProgram(provider) {
    return new Program(idl, provider);
}

async function checkInitialized(userPubkey) {
    try {
        const program = getProgram(getAnchorProvider());
        const [ledgerPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("ledger"), userPubkey.toBuffer()],
            PROGRAM_ID,
        );

        await program.account.Ledger.fetch(ledgerPda);
        return true;
    } catch {
        return false;
    }
}

/* =====================
   ON-CHAIN INIT
===================== */

async function initializeOnChainUser() {
    busy.value = true;
    error.value = "";

    try {
        if (!jwt.value) throw new Error("Authenticate first");

        const phantom = getProvider();
        if (!phantom.publicKey) await phantom.connect();

        const provider = getAnchorProvider();
        const program = getProgram(provider);
        const user = phantom.publicKey;

        const [ledgerPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("ledger"), user.toBuffer()],
            PROGRAM_ID,
        );

        const [vaultPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("vault"), user.toBuffer()],
            PROGRAM_ID,
        );

        await program.methods
            .initializeUser()
            .accounts({
                user,
                ledger: ledgerPda,
                vault: vaultPda,
                systemProgram: new PublicKey(
                    "11111111111111111111111111111111",
                ),
            })
            .rpc();

        isInitialized.value = true;
    } catch (e) {
        error.value = e?.message || String(e);
    } finally {
        busy.value = false;
    }
}
</script>

<style scoped>
/* Minimal set to match the Agents page look */
/* Assumes your app defines these CSS vars somewhere:
   --fg, --muted, --border, --chip, --card, --danger
*/

.wrap {
    max-width: 980px;
    margin: 0 auto;
    padding: 28px 18px 60px;
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

.grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 14px;
    margin-top: 14px;
}

.card {
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 18px;
    background: var(--card);
}

.cardtop {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
}

.titleblock {
    display: grid;
    gap: 6px;
}

.agentname {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    letter-spacing: 0.2px;
}

.subline {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    font-size: 12px;
    color: var(--muted);
}

.sep {
    height: 1px;
    background: var(--border);
    margin: 14px 0;
}

.actions {
    display: flex;
    gap: 10px;
    justify-content: space-between;
    align-items: center;
}

.leftActions,
.rightActions {
    display: flex;
    gap: 10px;
    align-items: center;
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
        background 0.15s ease,
        color 0.15s ease,
        border 0.15s ease,
        opacity 0.15s ease;
    white-space: nowrap;
}
button:hover {
    border-color: var(--fg);
}
button:disabled {
    opacity: 0.35;
    cursor: not-allowed;
}

.createBtn {
    border: 1px solid var(--fg);
    background: var(--fg);
    color: #000;
}
.createBtn:hover {
    background: #fff;
    border-color: #fff;
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
.right {
    text-align: right;
}

.err {
    color: var(--danger);
}
</style>
