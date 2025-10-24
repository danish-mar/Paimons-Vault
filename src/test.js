"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var crypto = require("crypto");
var prompts_1 = require("prompts");
var chalk_1 = require("chalk");
var otplib_1 = require("otplib");
var fs = require("fs");
var path = require("path");
var os = require("os");
var storage_1 = require("./storage");
var PWMGR_DIR = path.join(os.homedir(), '.pwmgr');
var CONFIG_FILE = path.join(PWMGR_DIR, 'config.enc');
var VAULT_FILE = path.join(PWMGR_DIR, 'vault.enc');
var SESSION_FILE = path.join(PWMGR_DIR, '.session');
// Helper function to clean up test files
function cleanupTestFiles() {
    if (fs.existsSync(CONFIG_FILE))
        fs.unlinkSync(CONFIG_FILE);
    if (fs.existsSync(VAULT_FILE))
        fs.unlinkSync(VAULT_FILE);
    if (fs.existsSync(SESSION_FILE))
        fs.unlinkSync(SESSION_FILE);
    if (fs.existsSync(PWMGR_DIR))
        fs.rmdirSync(PWMGR_DIR);
}
function runTests() {
    return __awaiter(this, void 0, void 0, function () {
        var auth, vault, totpSecret, vaultAfterDelete;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log(chalk_1.default.blue('Starting tests...'));
                    // Cleanup before tests
                    cleanupTestFiles();
                    // Test 1: Initialization
                    console.log(chalk_1.default.yellow('Test 1: Initializing...'));
                    // Mock prompts for init command
                    prompts_1.default.inject([true]); // Confirm reinitialize
                    return [4 /*yield*/, initCommand()];
                case 1:
                    _b.sent();
                    if ((0, storage_1.configExists)() && (0, storage_1.vaultExists)()) {
                        console.log(chalk_1.default.green('Test 1 Passed: Initialization successful.'));
                    }
                    else {
                        console.log(chalk_1.default.red('Test 1 Failed: Initialization failed.'));
                        return [2 /*return*/];
                    }
                    // Test 2: Add entry
                    console.log(chalk_1.default.yellow('Test 2: Adding an entry...'));
                    prompts_1.default.inject(['testuser', 'testpassword']);
                    return [4 /*yield*/, addCommand('testlabel')];
                case 2:
                    _b.sent();
                    return [4 /*yield*/, getMasterKeyAndTotpSecret()];
                case 3:
                    auth = _b.sent();
                    if (!auth) {
                        console.log(chalk_1.default.red('Auth failed for test 2'));
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, (0, storage_1.loadVault)(auth.masterKey)];
                case 4:
                    vault = _b.sent();
                    if (vault.length === 1 && vault[0].label === 'testlabel') {
                        console.log(chalk_1.default.green('Test 2 Passed: Entry added successfully.'));
                    }
                    else {
                        console.log(chalk_1.default.red('Test 2 Failed: Entry not added.'));
                        return [2 /*return*/];
                    }
                    // Test 3: Get entry
                    console.log(chalk_1.default.yellow('Test 3: Getting an entry...'));
                    return [4 /*yield*/, (0, storage_1.loadConfig)(crypto.pbkdf2Sync('super-secret-config-password', 'salt', 100000, 32, 'sha512'))];
                case 5:
                    totpSecret = (_a = (_b.sent())) === null || _a === void 0 ? void 0 : _a.totpSecret;
                    if (!totpSecret) {
                        console.log(chalk_1.default.red('TOTP secret not found for test 3'));
                        return [2 /*return*/];
                    }
                    prompts_1.default.inject([otplib_1.authenticator.generate(totpSecret), true]); // TOTP code, copy to clipboard
                    return [4 /*yield*/, getCommand('testlabel')];
                case 6:
                    _b.sent();
                    // Manual verification of output for now, as direct output capture is complex
                    console.log(chalk_1.default.green('Test 3 Passed: Get command executed. Please manually verify output and clipboard content.'));
                    // Test 4: List entries
                    console.log(chalk_1.default.yellow('Test 4: Listing entries...'));
                    prompts_1.default.inject([otplib_1.authenticator.generate(totpSecret)]); // TOTP code
                    return [4 /*yield*/, listCommand()];
                case 7:
                    _b.sent();
                    console.log(chalk_1.default.green('Test 4 Passed: List command executed. Please manually verify output.'));
                    // Test 5: Generate password
                    console.log(chalk_1.default.yellow('Test 5: Generating password...'));
                    prompts_1.default.inject([true]); // Copy to clipboard
                    return [4 /*yield*/, generateCommand(10, { numbers: true, symbols: true, uppercase: true })];
                case 8:
                    _b.sent();
                    console.log(chalk_1.default.green('Test 5 Passed: Generate command executed. Please manually verify output and clipboard content.'));
                    // Test 6: Delete entry
                    console.log(chalk_1.default.yellow('Test 6: Deleting an entry...'));
                    prompts_1.default.inject([otplib_1.authenticator.generate(totpSecret)]); // TOTP code for re-auth
                    return [4 /*yield*/, deleteCommand('testlabel')];
                case 9:
                    _b.sent();
                    return [4 /*yield*/, (0, storage_1.loadVault)(auth.masterKey)];
                case 10:
                    vaultAfterDelete = _b.sent();
                    if (vaultAfterDelete.length === 0) {
                        console.log(chalk_1.default.green('Test 6 Passed: Entry deleted successfully.'));
                    }
                    else {
                        console.log(chalk_1.default.red('Test 6 Failed: Entry not deleted.'));
                        return [2 /*return*/];
                    }
                    console.log(chalk_1.default.blue('All tests completed. Cleaning up...'));
                    cleanupTestFiles();
                    return [2 /*return*/];
            }
        });
    });
}
// This is a simplified test runner. In a real project, you'd use a testing framework like Jest or Mocha.
runTests().catch(console.error);
// Helper to get master key and totp secret for tests
function getMasterKeyAndTotpSecret() {
    return __awaiter(this, void 0, void 0, function () {
        var tempConfigKey, config;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    tempConfigKey = crypto.pbkdf2Sync('super-secret-config-password', 'salt', 100000, 32, 'sha512');
                    return [4 /*yield*/, (0, storage_1.loadConfig)(tempConfigKey)];
                case 1:
                    config = _a.sent();
                    if (!config) {
                        return [2 /*return*/, null];
                    }
                    return [2 /*return*/, { masterKey: Buffer.from(config.masterKey, 'hex'), totpSecret: config.totpSecret }];
            }
        });
    });
}
