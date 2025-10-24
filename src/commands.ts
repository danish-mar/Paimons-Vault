import { program } from 'commander';
import * as crypto from 'crypto';
import prompts from 'prompts';
import chalk from 'chalk';
import { authenticator } from 'otplib';
import * as qrcode from 'qrcode-terminal';
import Fuse from 'fuse.js';
import clipboard from 'clipboardy';

import { generateMasterKey, encrypt, decrypt } from './crypto';
import { saveConfig, loadConfig, saveVault, loadVault, configExists, vaultExists, getPwmgrDir, clearSession } from './storage.js';
import { generateTotpSecret, displayQrCode, ensureAuthenticated, createSession, validateTotp } from './auth';

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

let cachedMasterKey: Buffer | null = null;
let cachedTotpSecret: string | null = null;

async function getMasterKeyAndTotpSecret(): Promise<{ masterKey: Buffer, totpSecret: string } | null> {
    if (cachedMasterKey && cachedTotpSecret) {
        return { masterKey: cachedMasterKey, totpSecret: cachedTotpSecret };
    }

    // For initial load, we need a temporary key to decrypt the config that contains the actual master key
    // This is a simplification. In a real app, the user would provide a password to derive this key.
    // For this CLI, we'll assume a simple fixed key for the config file itself for demonstration.
    // The *vault* is encrypted with the generated masterKey.
    const tempConfigKey = crypto.pbkdf2Sync('super-secret-config-password', 'salt', 100000, 32, 'sha512');

    const config = await loadConfig(tempConfigKey);
    if (!config) {
        console.log(chalk.red('Configuration not found. Please run `pwmgr init` first.'));
        return null;
    }

    cachedMasterKey = Buffer.from(config.masterKey, 'hex');
    cachedTotpSecret = config.totpSecret;
    return { masterKey: cachedMasterKey, totpSecret: cachedTotpSecret };
}

export async function initCommand() {
    if (configExists()) {
        const response = await prompts({
            type: 'confirm',
            name: 'reinitialize',
            message: chalk.yellow('Configuration already exists. Re-initializing will overwrite existing data. Continue?'),
            initial: false,
        });
        if (!response.reinitialize) {
            console.log(chalk.cyan('Initialization cancelled.'));
            return;
        }
    }

    console.log(chalk.blue('Initializing Password Manager...'));

    const masterKey = generateMasterKey();
    const { secret: totpSecret, uri: totpUri } = generateTotpSecret();

    console.log(chalk.green('Master Key and TOTP Secret generated.'));
    console.log(chalk.yellow('Scan this QR code with your authenticator app:'));
    displayQrCode(totpUri);
    console.log(chalk.yellow(`Or manually enter this secret: ${chalk.bold(totpSecret)}`));
    console.log(chalk.red.bold('IMPORTANT: Store this secret safely! It is your only backup.'));

    // For demonstration, we use a fixed key to encrypt the config file itself.
    // In a real application, this would be derived from a user-provided password.
    const tempConfigKey = crypto.pbkdf2Sync('super-secret-config-password', 'salt', 100000, 32, 'sha512');

    await saveConfig({ masterKey: masterKey.toString('hex'), totpSecret }, tempConfigKey);
    await saveVault([], masterKey); // Create an empty encrypted vault
    await createSession(); // Create an initial session after setup

    console.log(chalk.green(`Password Manager initialized successfully in ${getPwmgrDir()}`));
    console.log(chalk.green('You are now authenticated for 4 hours.'));
}

export async function addCommand(label: string) {
    const auth = await getMasterKeyAndTotpSecret();
    if (!auth) return;

    if (!await ensureAuthenticated(auth.totpSecret)) {
        console.log(chalk.red('Authentication failed. Command aborted.'));
        return;
    }

    const response = await prompts([
        {
            type: 'text',
            name: 'username',
            message: 'Enter username:',
            validate: (value: string) => value.length > 0 ? true : 'Username cannot be empty'
        },
        {
            type: 'password',
            name: 'password',
            message: 'Enter password:',
            validate: (value: string) => value.length > 0 ? true : 'Password cannot be empty'
        },
        {
            type: 'text',
            name: 'notes',
            message: 'Enter optional notes:',
        }
    ]);

    if (!response.username || !response.password) {
        console.log(chalk.red('Operation cancelled.'));
        return;
    }

    const { encryptedData, iv } = encrypt(response.password, auth.masterKey);
    const now = Date.now();

    const vault = await loadVault(auth.masterKey);
    
    // Check if an entry with the same label already exists
    const existingEntryIndex = vault.findIndex(entry => entry.label === label);

    if (existingEntryIndex > -1) {
        const updateResponse = await prompts({
            type: 'confirm',
            name: 'update',
            message: chalk.yellow(`Entry with label '${label}' already exists. Do you want to update it?`),
            initial: true,
        });

        if (!updateResponse.update) {
            console.log(chalk.cyan('Operation cancelled.'));
            return;
        }
        vault[existingEntryIndex] = {
            ...vault[existingEntryIndex],
            username: response.username,
            encryptedPassword: encryptedData,
            iv,
            modifiedAt: now,
            notes: response.notes || vault[existingEntryIndex].notes, // Update notes or keep existing
        };
        console.log(chalk.green(`Entry '${label}' updated successfully.`));
    } else {
        const newEntry: VaultEntry = {
            label,
            username: response.username,
            encryptedPassword: encryptedData,
            iv,
            createdAt: now,
            modifiedAt: now,
            notes: response.notes || undefined,
        };
        vault.push(newEntry);
        console.log(chalk.green(`Entry '${label}' added successfully.`));
    }

    await saveVault(vault, auth.masterKey);
}

export async function getCommand(label: string) {
    const auth = await getMasterKeyAndTotpSecret();
    if (!auth) return;

    if (!await ensureAuthenticated(auth.totpSecret)) {
        console.log(chalk.red('Authentication failed. Command aborted.'));
        return;
    }

    const vault = await loadVault(auth.masterKey);
    const fuse = new Fuse(vault, { keys: ['label'], threshold: 0.3 });
    const result = fuse.search(label);

    if (result.length === 0) {
        console.log(chalk.red(`No entry found for label '${label}'.`));
        return;
    }

    const entry = result[0].item; // Take the best match
    const decryptedPassword = decrypt(entry.encryptedPassword, entry.iv, auth.masterKey);

    console.log(chalk.cyan('-- Entry Details --'));
    console.log(chalk.white(`Label: ${entry.label}`));
    console.log(chalk.white(`Username: ${entry.username}`));
    console.log(chalk.white(`Password: ${decryptedPassword}`));
    if (entry.notes) {
        console.log(chalk.white(`Notes: ${entry.notes}`));
    }
    console.log(chalk.cyan('-------------------'));

    const copyResponse = await prompts({
        type: 'confirm',
        name: 'copy',
        message: 'Copy password to clipboard?',
        initial: true,
    });

    if (copyResponse.copy) {
        await clipboard.write(decryptedPassword);
        console.log(chalk.green('Password copied to clipboard.'));
    }
}

export async function listCommand() {
    const auth = await getMasterKeyAndTotpSecret();
    if (!auth) return;

    if (!await ensureAuthenticated(auth.totpSecret)) {
        console.log(chalk.red('Authentication failed. Command aborted.'));
        return;
    }

    const vault = await loadVault(auth.masterKey);

    if (vault.length === 0) {
        console.log(chalk.yellow('Vault is empty. Add entries using `pwmgr add <label>`.'));
        return;
    }

    console.log(chalk.cyan('-- Vault Entries --'));
    vault.forEach(entry => {
        console.log(chalk.white(`Label: ${entry.label}`));
        console.log(chalk.white(`  Username: ${entry.username}`));
        if (entry.notes) {
            console.log(chalk.gray(`  Notes: Yes`));
        }
        console.log(chalk.gray(`  Created: ${new Date(entry.createdAt).toLocaleString()}`));
        console.log(chalk.gray(`  Modified: ${new Date(entry.modifiedAt).toLocaleString()}`));
        console.log('---');
    });
    console.log(chalk.cyan('-------------------'));
}

export async function deleteCommand(label: string) {
    const auth = await getMasterKeyAndTotpSecret();
    if (!auth) return;

    console.log(chalk.yellow('Re-authentication required for destructive operation.'));
    if (!await validateTotp(auth.totpSecret)) {
        console.log(chalk.red('Authentication failed. Command aborted.'));
        return;
    }

    const vault = await loadVault(auth.masterKey);
    const initialLength = vault.length;
    const newVault = vault.filter(entry => entry.label !== label);

    if (newVault.length === initialLength) {
        console.log(chalk.red(`No entry found with label '${label}'.`));
        return;
    }

    await saveVault(newVault, auth.masterKey);
    console.log(chalk.green(`Entry '${label}' deleted successfully.`));
}

export async function logoutCommand() {
    await clearSession();
    console.log(chalk.green('Session cleared. You are now logged out.'));
}

export async function generateCommand(length: number = 20, options: { numbers?: boolean, symbols?: boolean, uppercase?: boolean }) {
    const chars = {
        lowercase: 'abcdefghijklmnopqrstuvwxyz',
        uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        numbers: '0123456789',
        symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
    };

    let characterSet = chars.lowercase;
    if (options.uppercase) characterSet += chars.uppercase;
    if (options.numbers) characterSet += chars.numbers;
    if (options.symbols) characterSet += chars.symbols;

    if (characterSet.length === 0) {
        console.log(chalk.red('Error: No character set selected for password generation.'));
        return;
    }

    let password = '';
    const randomBytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
        password += characterSet[randomBytes[i] % characterSet.length];
    }

    console.log(chalk.green(`Generated Password: ${chalk.bold(password)}`));

    const copyResponse = await prompts({
        type: 'confirm',
        name: 'copy',
        message: 'Copy password to clipboard?',
        initial: true,
    });

    if (copyResponse.copy) {
        await clipboard.write(password);
        console.log(chalk.green('Password copied to clipboard.'));
    }
}
