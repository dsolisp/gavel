function createModelClient(config = {}) {
  if (!config.provider || config.provider === 'disabled') {
    return {
      async review() {
        return {
          available: false,
          reason: 'Corporate AI provider and data handling are not approved.',
        };
      },
    };
  }
  if (config.provider === 'fixture') {
    return {
      async review() {
        const response = typeof config.response === 'string' ? JSON.parse(config.response) : config.response;
        return { available: true, response };
      },
    };
  }
  throw new Error(`Unsupported model provider: ${config.provider}`);
}

module.exports = { createModelClient };