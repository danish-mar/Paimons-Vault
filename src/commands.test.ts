import * as crypto from 'crypto';
import prompts from 'prompts';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { authenticator } from 'otplib';
import clipboard from 'clipboardy';

// Import commands dynamically to allow jest.resetModules()
let commands: typeof import('./commands');
let storage: typeof import('./storage');

const PWMGR_DIR = path.join(os.homedir(), '.pwmgr');
const CONFIG_FILE = path.join(PWMGR_DIR, 'config.enc');
const VAULT_FILE = path.join(PWMGR_DIR, 'vault.enc');
const SESSION_FILE = path.join(PWMGR_DIR, '.session');

// Helper to get master key and totp secret for tests
async function getMasterKeyAndTotpSecret(): Promise<{ masterKey: Buffer, totpSecret: string } | null> {
    const tempConfigKey = crypto.pbkdf2Sync('super-secret-config-password', 'salt', 100000, 32, 'sha512');
    const config = await storage.loadConfig(tempConfigKey);
    if (!config) {
        return null;
    }
    return { masterKey: Buffer.from(config.masterKey, 'hex'), totpSecret: config.totpSecret };
}

describe('Password Manager CLI', () => {
    // Cleanup function
    const cleanupTestFiles = () => {
        if (fs.existsSync(CONFIG_FILE)) fs.unlinkSync(CONFIG_FILE);
        if (fs.existsSync(VAULT_FILE)) fs.unlinkSync(VAULT_FILE);
        if (fs.existsSync(SESSION_FILE)) fs.unlinkSync(SESSION_FILE);
        if (fs.existsSync(PWMGR_DIR)) fs.rmdirSync(PWMGR_DIR, { recursive: true });
    };

    beforeEach(async () => {
        jest.resetModules(); // Clear module cache
        commands = await import('./commands'); // Re-import commands
        storage = await import('./storage'); // Re-import storage
        cleanupTestFiles();
        // Reset prompts injected values before each test
        (prompts as any).reset();
    });

    afterEach(() => {
        cleanupTestFiles();
    });

    it('should initialize the password manager', async () => {
        (prompts as any).inject([true]); // Confirm reinitialize
        await commands.initCommand();
        expect(storage.configExists()).toBe(true);
        expect(storage.vaultExists()).toBe(true);
    });

    it('should add a new password entry', async () => {
        (prompts as any).inject([true]); // Confirm reinitialize for initCommand
        await commands.initCommand();

        // Inject values for addCommand prompts
        (prompts as any).inject(['testuser', 'testpassword']);
        await commands.addCommand('testlabel');

        const auth = await getMasterKeyAndTotpSecret();
        expect(auth).not.toBeNull();
        if (auth) {
            const vault = await storage.loadVault(auth.masterKey);
            expect(vault.length).toBe(1);
            expect(vault[0].label).toBe('testlabel');
            expect(vault[0].username).toBe('testuser');
        }
    });

    it('should retrieve a password entry', async () => {
        (prompts as any).inject([true]); // Confirm reinitialize for initCommand
        await commands.initCommand();

        // Inject values for addCommand prompts
        (prompts as any).inject(['testuser', 'testpassword']);
        await commands.addCommand('testlabel');

        const auth = await getMasterKeyAndTotpSecret();
        expect(auth).not.toBeNull();
        if (auth) {
            const totpSecret = (await storage.loadConfig(crypto.pbkdf2Sync('super-secret-config-password', 'salt', 100000, 32, 'sha512')))?.totpSecret;
            expect(totpSecret).not.toBeNull();
            if (totpSecret) {
                // Inject values for getCommand prompts (TOTP and copy to clipboard)
                (prompts as any).inject([authenticator.generate(totpSecret), true]);
                const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
                await commands.getCommand('testlabel');
                expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Password: testpassword'));
                expect(clipboard.write).toHaveBeenCalledWith('testpassword');
                consoleSpy.mockRestore();
            }
        }
    });

    it('should list all password entries', async () => {
        (prompts as any).inject([true]); // Confirm reinitialize for initCommand
        await commands.initCommand();

        // Inject values for addCommand prompts
        (prompts as any).inject(['user1', 'pass1']);
        await commands.addCommand('label1');
        (prompts as any).inject(['user2', 'pass2']);
        await commands.addCommand('label2');

        const auth = await getMasterKeyAndTotpSecret();
        expect(auth).not.toBeNull();
        if (auth) {
            const totpSecret = (await storage.loadConfig(crypto.pbkdf2Sync('super-secret-config-password', 'salt', 100000, 32, 'sha512')))?.totpSecret;
            expect(totpSecret).not.toBeNull();
            if (totpSecret) {
                // Inject values for listCommand prompts (TOTP)
                (prompts as any).inject([authenticator.generate(totpSecret)]);
                const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
                await commands.listCommand();
                expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Label: label1'));
                expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Label: label2'));
                consoleSpy.mockRestore();
            }
        }
    });

    it('should generate a secure password', async () => {
        // Inject values for generateCommand prompts (copy to clipboard)
        (prompts as any).inject([true]);
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        await commands.generateCommand(10, { numbers: true, symbols: true, uppercase: true });
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Generated Password:'));
        expect(clipboard.write).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });

    it('should delete a password entry', async () => {
        (prompts as any).inject([true]); // Confirm reinitialize for initCommand
        await commands.initCommand();

        // Inject values for addCommand prompts
        (prompts as any).inject(['testuser', 'testpassword']);
        await commands.addCommand('testlabel');

        const auth = await getMasterKeyAndTotpSecret();
        expect(auth).not.toBeNull();
        if (auth) {
            const totpSecret = (await storage.loadConfig(crypto.pbkdf2Sync('super-secret-config-password', 'salt', 100000, 32, 'sha512')))?.totpSecret;
            expect(totpSecret).not.toBeNull();
            if (totpSecret) {
                // Inject values for deleteCommand prompts (TOTP)
                (prompts as any).inject([authenticator.generate(totpSecret)]);
                await commands.deleteCommand('testlabel');
                const vaultAfterDelete = await storage.loadVault(auth.masterKey);
                expect(vaultAfterDelete.length).toBe(0);
            }
        }
    });
});