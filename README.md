# Paimon's Vault

![Paimon's Vault Logo (Placeholder)](https://via.placeholder.com/150?text=Paimon%27s+Vault)

A secure command-line password manager inspired by the world of Teyvat. Paimon's Vault helps you store and manage your precious passwords and secrets with the reliability of a trusty companion and the security of the strongest elemental shields.

## Features

*   **TOTP Authentication:** Secure your vault with Time-based One-Time Passwords, just like protecting your Primogems!
*   **AES-256-CBC Encryption:** All your entries are encrypted with a master key, ensuring your secrets are safe from hilichurls and abyss mages.
*   **Local Encrypted Storage:** Your vault is stored in an encrypted JSON file on your local system, under `~/.pwmgr/`.
*   **Session Management:** A token-based session keeps you authenticated for 4 hours, so you don't have to re-enter your TOTP code constantly.
*   **Password Generation:** Generate strong, unique passwords for all your accounts.
*   **Clipboard Integration:** Easily copy passwords to your clipboard.

## Installation

To install Paimon's Vault globally on your Linux system, follow these steps:

1.  **Clone the repository (if you haven't already):**
    ```bash
    git clone <repository_url>
    cd paimons-vault
    ```
    (Replace `<repository_url>` with the actual URL of this repository.)

2.  **Build the project:**
    ```bash
    npm install
    npm run build
    ```

3.  **Install globally:**
    ```bash
    npm install -g .
    ```
    *   **Note:** You might need `sudo` if your npm global installation directory requires root privileges:
        ```bash
        sudo npm install -g .
        ```

## Usage

Once installed, you can use the `pwmgr` command from any directory.

### `pwmgr init`
Initialize Paimon's Vault. This will generate your master encryption key and a TOTP secret. You'll be prompted to scan a QR code with your authenticator app.

```bash
pwmgr init
```

### `pwmgr add <label>`
Add a new password entry to your vault. You'll be prompted for a username and password.

```bash
pwmgr add my_genshin_account
```

### `pwmgr get <label>`
Retrieve and display a password entry from your vault. If your session has expired, you'll be prompted for your TOTP code.

```bash
pwmgr get my_genshin_account
```

### `pwmgr list`
List all labels and usernames stored in your vault.

```bash
pwmgr list
```

### `pwmgr delete <label>`
Delete a password entry from your vault. This operation requires re-authentication with your TOTP code.

```bash
pwmgr delete old_account
```

### `pwmgr generate [options]`
Generate a cryptographically secure random password.

```bash
pwmgr generate --length 20 --numbers --symbols --uppercase
```

**Options:**
*   `-l, --length <number>`: Length of the password (default: 20)
*   `-n, --numbers`: Include numbers in the password
*   `-s, --symbols`: Include symbols in the password
*   `-u, --uppercase`: Include uppercase letters in the password

### `pwmgr logout`
Clear your current session. You will need to re-authenticate for the next command that requires it.

```bash
pwmgr logout
```

## File Structure

Paimon's Vault stores its encrypted files in your home directory:

```
~/.pwmgr/
├── config.enc          # Encrypted master key + TOTP secret
├── vault.enc           # Encrypted password entries
└── .session            # Temporary session token (4h TTL)
```

## Security Notes

*   **Master Key:** Your master encryption key is crucial. It's encrypted and stored locally. **Never lose your TOTP secret**, as it's essential for accessing your vault.
*   **TOTP Secret:** The base32 TOTP secret displayed during `init` is your backup. Store it securely, preferably offline.
*   **Session Timeout:** Sessions automatically expire after 4 hours for your security.

## Contributing

Feel free to contribute to Paimon's Vault! Report bugs, suggest features, or submit pull requests.

## License

This project is licensed under the ISC License.
