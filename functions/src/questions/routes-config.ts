import {Application} from "express";
import {all} from "./controller";
import {isAuthenticated} from "../auth/authenticated";
import {isAuthorized} from "../auth/authorized";

export function routesConfig(app: Application) {
  app.get("/questions",
      isAuthenticated,
      isAuthorized({hasRole: ["admin", "manager"]}),
      all
  );
}
