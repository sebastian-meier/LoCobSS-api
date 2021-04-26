import {Application} from "express";
import {
  publicAll,
  byId,
  updateReply,
  createReply,
  revokeReply,
  deleteReply,
  assignReply} from "./controller";
import {isAuthenticated} from "../auth/authenticated";
import {isAuthorized} from "../auth/authorized";

export function routesConfig(app: Application) {
  app.post("/reply/update",
      isAuthenticated,
      isAuthorized({hasRole: ["admin", "manager"]}),
      updateReply
  );

  app.get("/reply/create",
      isAuthenticated,
      isAuthorized({hasRole: ["admin", "manager"]}),
      createReply
  );

  app.get("/reply/delete/:id",
      isAuthenticated,
      isAuthorized({hasRole: ["admin", "manager"]}),
      deleteReply
  );

  app.get("/reply/assign",
      isAuthenticated,
      isAuthorized({hasRole: ["admin", "manager"]}),
      assignReply
  );

  app.get("/reply/revoke",
      isAuthenticated,
      isAuthorized({hasRole: ["admin", "manager"]}),
      revokeReply
  );

  app.get("/public/replies",
      publicAll
  );

  app.get("/reply/:id",
      isAuthenticated,
      isAuthorized({hasRole: ["admin", "manager"]}),
      byId
  );
}
