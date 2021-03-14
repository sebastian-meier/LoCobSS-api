import {Application} from "express";
import {all, publicAll, publicById, publicRelated} from "./controller";
import {isAuthenticated} from "../auth/authenticated";
import {isAuthorized} from "../auth/authorized";

export function routesConfig(app: Application) {
  app.get("/questions",
      isAuthenticated,
      isAuthorized({hasRole: ["admin", "manager"]}),
      all
  );

  app.get("/public/questions",
      publicAll
  );

  app.get("/public/questions/:page",
      publicAll
  );

  app.get("/public/question/:id",
      publicById
  );

  app.get("/public/related/questions/:id",
    publicRelated
  );

}
