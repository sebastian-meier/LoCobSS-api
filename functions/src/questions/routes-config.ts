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
  link,
  like,
  deleteQuestion,
  update,
  create,
} from "./controller";
import {isAuthenticated, setLocals} from "../auth/authenticated";
import {isAuthorized} from "../auth/authorized";

export function routesConfig(app: Application) {
/**
 * @openapi
 * /questions:
 *   get:
 *     description: Load all questions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns a mysterious string.
 */
  app.get("/questions",
      isAuthenticated,
      isAuthorized({hasRole: ["admin", "manager"]}),
      all
  );

  app.get("/question/like/:id",
      isAuthenticated,
      isAuthorized({hasRole: ["admin", "manager", "user"]}),
      like
  );

  app.get("/question/delete/:id",
      isAuthenticated,
      isAuthorized({hasRole: ["admin", "manager"]}),
      deleteQuestion
  );

  app.post("/question/update/:id",
      isAuthenticated,
      isAuthorized({hasRole: ["admin", "manager"]}),
      update
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
      setLocals,
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

  app.post("/questions/link",
      link
  );

  app.get("/public/questions/:page",
      setLocals,
      publicAll
  );

  app.get("/public/question/:id",
      setLocals,
      publicById
  );

  app.get("/public/related/questions/:id",
      setLocals,
      publicRelated
  );
}
