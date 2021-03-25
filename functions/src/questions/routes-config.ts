import {Application} from "express";
import {
  all,
  publicAll,
  userAll,
  publicById,
  publicRelated,
  byId,
  relatedFromIds,
  rebuild,
  create,
} from "./controller";
import {isAuthenticated} from "../auth/authenticated";
import {isAuthorized} from "../auth/authorized";

export function routesConfig(app: Application) {
  app.get("/questions",
      isAuthenticated,
      isAuthorized({hasRole: ["admin", "manager"]}),
      all
  );

  app.get("/question/:id",
      isAuthenticated,
      isAuthorized({hasRole: ["admin", "manager"]}),
      byId
  );

  app.get("/related/questions/cluster",
      isAuthenticated,
      isAuthorized({hasRole: ["admin", "manager"]}),
      relatedFromIds
  );

  app.get("/system/rebuild",
      isAuthenticated,
      isAuthorized({hasRole: ["admin", "manager"]}),
      rebuild
  );

  app.get("/public/questions",
      publicAll
  );

  app.get("/user/questions",
      isAuthenticated,
      isAuthorized({hasRole: ["admin", "manager", "user"]}),
      userAll
  );

  app.post("/public/question/create",
      create
  );

  app.post("/question/create",
      isAuthenticated,
      isAuthorized({hasRole: ["admin", "manager", "user"]}),
      create
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
