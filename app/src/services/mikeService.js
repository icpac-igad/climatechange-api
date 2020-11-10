const { apiRequest } = require("request");
const { all, spread } = require("axios");
const redis = require("redis");
const { promisify } = require("util");

const client = redis.createClient(process.env.REDIS_URL || 6379, {
  db: process.env.REDIS_DB_NO || 2,
});

const redisGetAsync = promisify(client.get).bind(client);
const redisSetAsync = promisify(client.set).bind(client);

const configBase =
  "ConfigurationName=Water Monitoring;ThemeId=;ObservationPeriod=OBS1;ObservationPeriodOffset=;";

class MikeService {
  static async getCatchmentIds() {
    const key = `mike:catchmentids`;

    let data = await redisGetAsync(key);

    if (data) {
      data = JSON.parse(data);
    } else {
      data = await apiRequest
        .get("/timestep/mo-timestep/items")
        .then((response) => response.data);

      if (data) {
        await redisSetAsync(key, JSON.stringify(data));
      }
    }

    return data;
  }

  static async getCatchmentsDetails(ids) {
    const featureTypes = ids.join("$");

    const key = `mike:catchmentdetails:${featureTypes}`;

    // check if we have in cache
    let data = await redisGetAsync(key);

    if (data) {
      data = JSON.parse(data);
    } else {
      const configString = `${configBase}Type=FeatureTypeInfo;Id=${featureTypes}/data/2000-01-01T000000`;
      data = await apiRequest
        .get(`/timestep/mo-timestep/${configString}`)
        .then((response) => response.data);

      if (data) {
        // set cache
        await redisSetAsync(key, JSON.stringify(data));
      }
    }

    return data;
  }
  static async getCatchmentStations(catchmentId) {
    const key = `mike:catchmentstations:${catchmentId}`;

    let data = await redisGetAsync(key);

    if (data) {
      data = JSON.parse(data);
    } else {
      const configString = `${configBase}Id=${catchmentId}`;

      data = await apiRequest
        .post("/featurecollection/mo-gis/list", [configString])
        .then((response) => response.data[configString]);

      if (data) {
        await redisSetAsync(key, JSON.stringify(data));
      }
    }
    return data;
  }
  static async getStationData(id) {
    const key = `mike:stationsdata:${id}`;

    let data = await redisGetAsync(key);

    if (data) {
      data = JSON.parse(data);
    } else {
      const configString = `${configBase}Id=${id}`;
      data = await apiRequest
        .post("/timeseries/mo-timeseries/list", [configString])
        .then((response) => response.data[0] || {});

      if (data) {
        await redisSetAsync(key, JSON.stringify(data));
      }
    }

    return data;
  }

  static async getCatchmentData(catchmentId) {
    const key = `mike:catchmentdata:${catchmentId}`;

    let data = await redisGetAsync(key);

    if (data) {
      data = JSON.parse(data);
    } else {
      const stations = await MikeService.getCatchmentStations(catchmentId);

      const dataRequests =
        stations &&
        stations.features.map((station) =>
          MikeService.getStationData(
            `${catchmentId}/${station.properties.spreadsheetitemid}`
          )
        );

      data =
        dataRequests &&
        (await all(dataRequests).then(
          spread((...timeseriesDataResponses) => {
            //responses - all time series data
            return timeseriesDataResponses.reduce(
              (all, response) => {
                // if we have data
                if (response && response.Data && !!response.Data.length) {
                  // filter data dates is > than today
                  const data = response.Data.filter(
                    (d) => Date.parse(d[0]) > new Date().getTime()
                  ).map((d) => ({ time: d[0], value: d[1] }));

                  if (data && !!data.length) {
                    // find matching station
                    const station = stations.features.find(
                      (s) => s.properties.spreadsheetitemid === response.Name
                    );

                    // construct new station data, with timeseries data added
                    const newStation = {
                      ...station,
                      properties: {
                        ...station.properties,
                        data: data,
                        metadata: response.Metadata,
                      },
                    };

                    all.features.push(newStation);
                  }
                }

                return all;
              },
              {
                type: "FeatureCollection",
                features: [],
              }
            );
          })
        ));

      if (data) {
        await redisSetAsync(key, JSON.stringify(data));
      }
    }

    return data;
  }
}

module.exports = MikeService;
