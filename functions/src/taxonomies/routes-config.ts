import {Application} from "express";
import {
  publicAll,
  byId,
  updateTax,
  createTax,
  deleteTax,
  revokeTax,
  assignTax} from "./controller";
import {isAuthenticated} from "../auth/authenticated";
import {isAuthorized} from "../auth/authorized";

export function routesConfig(app: Application) {
  app.post("/taxonomy/update",
      isAuthenticated,
      isAuthorized({hasRole: ["admin", "manager"]}),
      updateTax
  );

  app.get("/taxonomy/create",
      isAuthenticated,
      isAuthorized({hasRole: ["admin", "manager"]}),
      createTax
  );

  app.get("/taxonomy/delete/:id",
      isAuthenticated,
      isAuthorized({hasRole: ["admin", "manager"]}),
      deleteTax
  );

  app.get("/taxonomy/assign",
      isAuthenticated,
      isAuthorized({hasRole: ["admin", "manager"]}),
      assignTax
  );

  app.get("/taxonomy/revoke",
      isAuthenticated,
      isAuthorized({hasRole: ["admin", "manager"]}),
      revokeTax
  );

  app.get("/public/taxonomies",
      publicAll
  );

  app.get("/taxonomy/:id",
      isAuthenticated,
      isAuthorized({hasRole: ["admin", "manager"]}),
      byId
  );
}
