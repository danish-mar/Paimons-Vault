import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { encrypt, decrypt } from './crypto';

const PWMGR_DIR = path.join(os.homedir(), '.pwmgr');
const CONFIG_FILE = path.join(PWMGR_DIR, 'config.enc');
const VAULT_FILE = path.join(PWMGR_DIR, 'vault.enc');
const SESSION_FILE = path.join(PWMGR_DIR, '.session');

interface Config {
    masterKey: string; // Stored as hex string
    totpSecret: string;
}

interface VaultEntry {
    label: string;
    username: string;
    encryptedPassword: string;
    iv: string;
    createdAt: number;
    modifiedAt: number;
}

interface Session {
    token: string;
    expiresAt: number;
}

function ensurePwmgrDir() {
    if (!fs.existsSync(PWMGR_DIR)) {
        fs.mkdirSync(PWMGR_DIR, { recursive: true });
    }
}

export async function saveConfig(config: Config, encryptionKey: Buffer): Promise<void> {
    ensurePwmgrDir();
    const configString = JSON.stringify(config);
    const { iv, encryptedData } = encrypt(configString, encryptionKey);
    fs.writeFileSync(CONFIG_FILE, JSON.stringify({ iv, encryptedData }));
}

export async function loadConfig(encryptionKey: Buffer): Promise<Config | null> {
    if (!fs.existsSync(CONFIG_FILE)) {
        return null;
    }
    const encryptedConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    const decryptedConfigString = decrypt(encryptedConfig.encryptedData, encryptedConfig.iv, encryptionKey);
    return JSON.parse(decryptedConfigString);
}

export async function saveVault(vault: VaultEntry[], encryptionKey: Buffer): Promise<void> {
    ensurePwmgrDir();
    const vaultString = JSON.stringify(vault);
    const { iv, encryptedData } = encrypt(vaultString, encryptionKey);
    fs.writeFileSync(VAULT_FILE, JSON.stringify({ iv, encryptedData }));
}

export async function loadVault(encryptionKey: Buffer): Promise<VaultEntry[]> {
    if (!fs.existsSync(VAULT_FILE)) {
        return [];
    }
    const encryptedVault = JSON.parse(fs.readFileSync(VAULT_FILE, 'utf8'));
    const decryptedVaultString = decrypt(encryptedVault.encryptedData, encryptedVault.iv, encryptionKey);
    return JSON.parse(decryptedVaultString);
}

export async function saveSession(session: Session): Promise<void> {
    ensurePwmgrDir();
    fs.writeFileSync(SESSION_FILE, JSON.stringify(session));
}

export async function loadSession(): Promise<Session | null> {
    if (!fs.existsSync(SESSION_FILE)) {
        return null;
    }
    return JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8'));
}

export async function clearSession(): Promise<void> {
    if (fs.existsSync(SESSION_FILE)) {
        fs.unlinkSync(SESSION_FILE);
    }
}

export function getPwmgrDir(): string {
    return PWMGR_DIR;
}

export function configExists(): boolean {
    return fs.existsSync(CONFIG_FILE);
}

export function vaultExists(): boolean {
    return fs.existsSync(VAULT_FILE);
}
