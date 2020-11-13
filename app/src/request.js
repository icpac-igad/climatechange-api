const { create } = require("axios");

const BASE_URL = process.env.MIKE_API_URL;

const TIMEOUT = process.env.TIMEOUT || 30 * 1000;

exports.apiRequest = create({
  timeout: TIMEOUT,
  baseURL: BASE_URL,
});
