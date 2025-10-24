jest.mock('prompts', () => {
  let injectedValues = [];
  const mockPrompts = jest.fn((questions) => {
    const answers = {};
    const questionArray = Array.isArray(questions) ? questions : [questions];

    for (const q of questionArray) {
      if (injectedValues.length > 0) {
        answers[q.name] = injectedValues.shift();
      } else {
        answers[q.name] = undefined;
      }
    }
    return Promise.resolve(answers);
  });

  mockPrompts.inject = jest.fn((values) => {
    injectedValues = [...values];
  });

  mockPrompts.reset = jest.fn(() => {
    injectedValues = [];
  });

  return {
    __esModule: true,
    default: mockPrompts,
  };
});

jest.mock('qrcode-terminal', () => ({
  generate: jest.fn(),
}));

jest.mock('clipboardy', () => ({
  write: jest.fn(),
}));

jest.mock('chalk', () => {
  const mockColor = (text) => text;
  const mockChalk = {
    red: jest.fn(mockColor),
    green: jest.fn(mockColor),
    blue: jest.fn(mockColor),
    yellow: jest.fn(mockColor),
    cyan: jest.fn(mockColor),
    bold: jest.fn(mockColor),
  };

  // Make it chainable for common cases like chalk.red.bold
  Object.keys(mockChalk).forEach(color => {
    if (typeof mockChalk[color] === 'function') {
      mockChalk[color].bold = jest.fn(mockColor);
    }
  });

  // Handle default export for ESM
  return {
    __esModule: true,
    default: mockChalk,
    ...mockChalk, // Also export named exports for CommonJS
  };
});
