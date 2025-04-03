import { FastifyInstance } from "fastify";
import { AppResponse } from "../utils/app-response";
import { HomeController } from "../controllers/home.controller";

export class HomeRoutes {
  constructor(private readonly homeController: HomeController) {}

  registerRoutes(app: FastifyInstance) {
    app.register(
      (instance, _opts, done) => {
        instance.get("/", async (req, reply) => {
          return AppResponse.sendSuccessNoDataResponse(
            req,
            reply,
            200,
            "Welcome to the Kisara API"
          );
        });

        instance.get(
          "/stats",
          this.homeController.getHandleStats.bind(this.homeController)
        );
        done();
      },
      { prefix: "/" }
    );
  }
}
