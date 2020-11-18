const Router = require("koa-router");
const ClimateChangeService = require("services/climateChangeService");

const router = new Router({
  prefix: "/climate-change",
});

class ClimateChangeRouter {
  static async getCities(ctx) {
    ctx.body = await ClimateChangeService.getCities();
  }
  static async getTavgTrend(ctx) {
    ctx.assert(ctx.params.geotype, 400, "region or location required");
    ctx.assert(ctx.params.id, 400, "id required");

    ctx.body = await ClimateChangeService.getTavgTrend(
      ctx.params.geotype,
      ctx.params.id
    );
  }

  static async getTavgCounts(ctx) {
    ctx.assert(ctx.params.geotype, 400, "region or location required");
    ctx.assert(ctx.params.id, 400, "id required");

    ctx.body = await ClimateChangeService.getTavgCounts(
      ctx.params.geotype,
      ctx.params.id
    );
  }
  static async getTmaxTrend(ctx) {
    ctx.assert(ctx.params.geotype, 400, "region or location required");
    ctx.assert(ctx.params.id, 400, "id required");

    ctx.body = await ClimateChangeService.getTmaxTrend(
      ctx.params.geotype,
      ctx.params.id
    );
  }
  static async getTminTrend(ctx) {
    ctx.assert(ctx.params.geotype, 400, "region or location required");
    ctx.assert(ctx.params.id, 400, "id required");

    ctx.body = await ClimateChangeService.getTminTrend(
      ctx.params.geotype,
      ctx.params.id
    );
  }
}

router.get("/cities", ClimateChangeRouter.getCities);
router.get("/tavg-trend/:geotype/:id", ClimateChangeRouter.getTavgTrend);
router.get("/tavg-counts/:geotype/:id", ClimateChangeRouter.getTavgCounts);
router.get("/tmax-trend/:geotype/:id", ClimateChangeRouter.getTmaxTrend);
router.get("/tmin-trend/:geotype/:id", ClimateChangeRouter.getTminTrend);

module.exports = router;
