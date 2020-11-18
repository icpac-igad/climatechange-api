const redis = require("redis");
const { promisify } = require("util");
const config = require("config");
const { readTemperatureFile, readCountsFile } = require("./request");

const regions = require("data/regions.json");
const cities = require("data/cities.json");

const CACHE_TTL = config.get("services.climate_change.cache_ttl");

const client = redis.createClient({
  url: config.get("redis.url"),
});

const redisGetAsync = promisify(client.get).bind(client);
const redisSetAsync = promisify(client.setex).bind(client);

class ClimateChangeService {
  static getFeatureDetail(id, type) {
    let details;
    if (type === "region") {
      details = regions[id];
    } else if (type === "local") {
      details = cities.features.find((f) => f.properties.id === id);
    }
    return details;
  }

  static getDataPath(id, t_type) {
    switch (t_type) {
      case "TAVG_TREND":
        return `TAVG/Text/${id}-TAVG-Trend.txt`;
      case "TAVG_COUNTS":
        return `TAVG/Text/${id}-TAVG-Counts.txt`;
      case "TMAX_TREND":
        return `TMAX/Text/${id}-TMAX-Trend.txt`;
      case "TMIN_TREND":
        return `TMIN/Text/${id}-TMIN-Trend.txt`;
      default:
        throw "Unknown data type";
    }
  }

  static getDataEndpoint = (t_type, url) => {
    if (t_type === "TAVG_COUNTS") {
      return readCountsFile(url);
    } else {
      return readTemperatureFile(url);
    }
  };

  static getData(geotype, id, t_type) {
    // if is region
    if (geotype === "region") {
      // if we have the region in our local database TODO: Use Mongodb ?
      if (regions[id]) {
        const region = regions[id].id;
        const data_path = this.getDataPath(region, t_type);
        const url = `/Regional/${data_path}`;
        return this.getDataEndpoint(t_type, url);
      } else {
        // region not in our local db
        throw { message: "Region not within East Africa" };
      }
    } else if (geotype === "local") {
      const data_path = this.getDataPath(id, t_type);
      const url = `/Local/${data_path}`;
      return this.getDataEndpoint(t_type, url);
    }
    // we have an unkown region type
    throw { message: "Unknown region type" };
  }

  static async getCities() {
    const key = `climatechange:cities`;

    let data = await redisGetAsync(key);

    if (data) {
      data = JSON.parse(data);
    } else {
      data = cities;
      if (data) {
        await redisSetAsync(key, CACHE_TTL, JSON.stringify(data));
      }
    }

    return data;
  }

  static async getTavgTrend(geotype, id) {
    const key = `climatechange:tavgtrend:${geotype}:${id}`;

    let data = await redisGetAsync(key);

    if (data) {
      data = JSON.parse(data);
    } else {
      data = await this.getData(geotype, id, "TAVG_TREND");

      if (data) {
        data.featureDetail = this.getFeatureDetail(id, geotype);
        await redisSetAsync(key, CACHE_TTL, JSON.stringify(data));
      }
    }
    return data;
  }

  static async getTavgCounts(geotype, id) {
    const key = `climatechange:tavgcounts:${geotype}:${id}`;

    let data = await redisGetAsync(key);

    if (data) {
      data = JSON.parse(data);
    } else {
      data = await this.getData(geotype, id, "TAVG_COUNTS");

      if (data) {
        data.featureDetail = this.getFeatureDetail(id, geotype);
        await redisSetAsync(key, CACHE_TTL, JSON.stringify(data));
      }
    }

    return data;
  }

  static async getTmaxTrend(geotype, id) {
    const key = `climatechange:tmaxtrend:${geotype}:${id}`;

    let data = await redisGetAsync(key);

    if (data) {
      data = JSON.parse(data);
    } else {
      data = await this.getData(geotype, id, "TMAX_TREND");

      if (data) {
        data.featureDetail = this.getFeatureDetail(id, geotype);
        await redisSetAsync(key, CACHE_TTL, JSON.stringify(data));
      }
    }

    return data;
  }

  static async getTminTrend(geotype, id) {
    const key = `climatechange:tmintrend:${geotype}:${id}`;

    let data = await redisGetAsync(key);

    if (data) {
      data = JSON.parse(data);
    } else {
      data = await this.getData(geotype, id, "TMIN_TREND");

      if (data) {
        data.featureDetail = this.getFeatureDetail(id, geotype);
        await redisSetAsync(key, CACHE_TTL, JSON.stringify(data));
      }
    }
    return data;
  }
}

module.exports = ClimateChangeService;
