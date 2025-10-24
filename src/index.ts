#!/usr/bin/env node

import { program } from 'commander';
import { initCommand, addCommand, getCommand, listCommand, deleteCommand, generateCommand, logoutCommand } from './commands';

program
    .name('pwmgr')
    .description('A secure command-line password manager with TOTP authentication.')
    .version('1.0.0');

program.command('init')
    .description('Initialize the password manager (generate master key, TOTP secret, and setup vault).')
    .action(initCommand);

program.command('add <label>')
    .description('Add a new password entry to the vault.')
    .action(addCommand);

program.command('get <label>')
    .description('Retrieve and display a password entry from the vault.')
    .action(getCommand);

program.command('list')
    .description('List all password entry labels in the vault.')
    .action(listCommand);

program.command('delete <label>')
    .description('Delete a password entry from the vault.')
    .action(deleteCommand);

program.command('logout')
    .description('Clear the current session and log out.')
    .action(logoutCommand);

program.command('generate')
    .description('Generate a cryptographically secure random password.')
    .option('-l, --length <number>', 'Length of the password', '20')
    .option('-n, --numbers', 'Include numbers in the password')
    .option('-s, --symbols', 'Include symbols in the password')
    .option('-u, --uppercase', 'Include uppercase letters in the password')
    .action((options) => {
        generateCommand(parseInt(options.length), { numbers: options.numbers, symbols: options.symbols, uppercase: options.uppercase });
    });

program.parse(process.argv);
