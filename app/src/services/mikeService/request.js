const config = require("config");
const { create } = require("axios");

const BASE_URL = config.get("services.flow_levels.base_url");
const TIMEOUT = config.get("services.flow_levels.timeout");

exports.apiRequest = create({
  timeout: TIMEOUT,
  baseURL: BASE_URL,
});
