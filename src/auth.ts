import { authenticator } from 'otplib';
import * as qrcode from 'qrcode-terminal';
import * as crypto from 'crypto';
import prompts from 'prompts';
import { loadSession, saveSession, clearSession } from './storage';
import chalk from 'chalk';

const SESSION_DURATION = 4 * 60 * 60 * 1000; // 4 hours in milliseconds

export function generateTotpSecret(): { secret: string; uri: string } {
    const secret = authenticator.generateSecret();
    const uri = authenticator.keyuri('CLI-PM', 'PasswordManager', secret);
    return { secret, uri };
}

export function displayQrCode(uri: string): void {
    qrcode.generate(uri, { small: true });
}

export async function validateTotp(totpSecret: string): Promise<boolean> {
    let attempts = 0;
    const MAX_ATTEMPTS = 3;
    const LOCKOUT_TIME = 5 * 60 * 1000; // 5 minutes

    while (attempts < MAX_ATTEMPTS) {
        const response = await prompts({
            type: 'text',
            name: 'token',
            message: 'Enter TOTP code:',
        });

        const token = response.token;
        if (!token) {
            console.log(chalk.red('TOTP code cannot be empty.'));
            attempts++;
            continue;
        }

        const isValid = authenticator.check(token, totpSecret);
        if (isValid) {
            return true;
        } else {
            attempts++;
            console.log(chalk.red(`Invalid TOTP code. ${MAX_ATTEMPTS - attempts} attempts remaining.`));
        }
    }

    console.log(chalk.red(`Too many invalid attempts. Locking out for ${LOCKOUT_TIME / 1000 / 60} minutes.`));
    await new Promise(resolve => setTimeout(resolve, LOCKOUT_TIME));
    return false;
}

export async function createSession(): Promise<void> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + SESSION_DURATION;
    await saveSession({ token, expiresAt });
    console.log(chalk.green('Session created successfully.'));
}

export async function isValidSession(): Promise<boolean> {
    const session = await loadSession();
    if (!session) {
        return false;
    }
    if (Date.now() < session.expiresAt) {
        return true;
    }
    await clearSession();
    return false;
}

export async function ensureAuthenticated(totpSecret: string): Promise<boolean> {
    if (await isValidSession()) {
        return true;
    }
    console.log(chalk.yellow('Session expired or not found. Please authenticate.'));
    const authenticated = await validateTotp(totpSecret);
    if (authenticated) {
        await createSession();
        return true;
    }
    return false;
}
