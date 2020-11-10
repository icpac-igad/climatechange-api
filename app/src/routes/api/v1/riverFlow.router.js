const Router = require("koa-router");
const MikeService = require("services/mikeService");
const logger = require("logger");

const router = new Router({
  prefix: "/river-flow",
});

class RiverFlowRouter {
  static async getCatchmentsIds(ctx) {
    const featureTypes = await MikeService.getCatchmentIds();

    ctx.body = featureTypes;
  }
  static async getCatchmentsDetails(ctx) {
    ctx.assert(ctx.query.id, 400, "id query not found");

    logger.info(
      "[RiverFlowRouter - getCatchmentsDetails] Getting details by ids %s",
      ctx.query.id
    );

    const details = await MikeService.getCatchmentsDetails(
      ctx.query.id.split(",")
    );

    ctx.body = details;
  }
  static async getCatchmentStations(ctx) {
    ctx.assert(ctx.params.id, 400, "id query not found");

    const stations = await MikeService.getCatchmentStations(ctx.params.id);

    ctx.body = stations;
  }
  static async getStationData(ctx) {
    ctx.assert(ctx.params.id, 400, "id param not found");
    ctx.assert(ctx.params.station, 400, "station param not found");

    const data = await MikeService.getStationData(
      `${ctx.params.id}/${ctx.params.station}`
    );

    ctx.body = data;
  }

  static async getCatchmentData(ctx) {
    ctx.assert(ctx.params.id, 400, "id param not found");

    const data = await MikeService.getCatchmentData(ctx.params.id);

    ctx.body = data;
  }
}

router.get("/catchments", RiverFlowRouter.getCatchmentsIds);
router.get("/catchments/details", RiverFlowRouter.getCatchmentsDetails);
router.get("/catchments/:id/stations", RiverFlowRouter.getCatchmentStations);
router.get("/catchments/:id/stations/:station", RiverFlowRouter.getStationData);
router.get("/catchments/:id/recent", RiverFlowRouter.getCatchmentData);

module.exports = router;
