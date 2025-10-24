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
exports.generateTotpSecret = generateTotpSecret;
exports.displayQrCode = displayQrCode;
exports.validateTotp = validateTotp;
exports.createSession = createSession;
exports.isValidSession = isValidSession;
exports.ensureAuthenticated = ensureAuthenticated;
var otplib_1 = require("otplib");
var qrcode = require("qrcode-terminal");
var crypto = require("crypto");
var prompts_1 = require("prompts");
var storage_1 = require("./storage");
var chalk_1 = require("chalk");
var SESSION_DURATION = 4 * 60 * 60 * 1000; // 4 hours in milliseconds
function generateTotpSecret() {
    var secret = otplib_1.authenticator.generateSecret();
    var uri = otplib_1.authenticator.keyuri('CLI-PM', 'PasswordManager', secret);
    return { secret: secret, uri: uri };
}
function displayQrCode(uri) {
    qrcode.generate(uri, { small: true });
}
function validateTotp(totpSecret) {
    return __awaiter(this, void 0, void 0, function () {
        var attempts, MAX_ATTEMPTS, LOCKOUT_TIME, response, token, isValid;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    attempts = 0;
                    MAX_ATTEMPTS = 3;
                    LOCKOUT_TIME = 5 * 60 * 1000;
                    _a.label = 1;
                case 1:
                    if (!(attempts < MAX_ATTEMPTS)) return [3 /*break*/, 3];
                    return [4 /*yield*/, (0, prompts_1.default)({
                            type: 'text',
                            name: 'token',
                            message: 'Enter TOTP code:',
                        })];
                case 2:
                    response = _a.sent();
                    token = response.token;
                    if (!token) {
                        console.log(chalk_1.default.red('TOTP code cannot be empty.'));
                        attempts++;
                        return [3 /*break*/, 1];
                    }
                    isValid = otplib_1.authenticator.check(token, totpSecret);
                    if (isValid) {
                        return [2 /*return*/, true];
                    }
                    else {
                        attempts++;
                        console.log(chalk_1.default.red("Invalid TOTP code. ".concat(MAX_ATTEMPTS - attempts, " attempts remaining.")));
                    }
                    return [3 /*break*/, 1];
                case 3:
                    console.log(chalk_1.default.red("Too many invalid attempts. Locking out for ".concat(LOCKOUT_TIME / 1000 / 60, " minutes.")));
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, LOCKOUT_TIME); })];
                case 4:
                    _a.sent();
                    return [2 /*return*/, false];
            }
        });
    });
}
function createSession() {
    return __awaiter(this, void 0, void 0, function () {
        var token, expiresAt;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    token = crypto.randomBytes(32).toString('hex');
                    expiresAt = Date.now() + SESSION_DURATION;
                    return [4 /*yield*/, (0, storage_1.saveSession)({ token: token, expiresAt: expiresAt })];
                case 1:
                    _a.sent();
                    console.log(chalk_1.default.green('Session created successfully.'));
                    return [2 /*return*/];
            }
        });
    });
}
function isValidSession() {
    return __awaiter(this, void 0, void 0, function () {
        var session;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, storage_1.loadSession)()];
                case 1:
                    session = _a.sent();
                    if (!session) {
                        return [2 /*return*/, false];
                    }
                    if (Date.now() < session.expiresAt) {
                        return [2 /*return*/, true];
                    }
                    return [4 /*yield*/, (0, storage_1.clearSession)()];
                case 2:
                    _a.sent();
                    return [2 /*return*/, false];
            }
        });
    });
}
function ensureAuthenticated(totpSecret) {
    return __awaiter(this, void 0, void 0, function () {
        var authenticated;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, isValidSession()];
                case 1:
                    if (_a.sent()) {
                        return [2 /*return*/, true];
                    }
                    console.log(chalk_1.default.yellow('Session expired or not found. Please authenticate.'));
                    return [4 /*yield*/, validateTotp(totpSecret)];
                case 2:
                    authenticated = _a.sent();
                    if (!authenticated) return [3 /*break*/, 4];
                    return [4 /*yield*/, createSession()];
                case 3:
                    _a.sent();
                    return [2 /*return*/, true];
                case 4: return [2 /*return*/, false];
            }
        });
    });
}
