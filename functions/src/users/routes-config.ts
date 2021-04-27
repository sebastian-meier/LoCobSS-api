import {Application} from "express";
import {create, all, get, patch, remove} from "./controller";
import {isAuthenticated} from "../auth/authenticated";
import {isAuthorized} from "../auth/authorized";

export function routesConfig(app: Application) {
/**
 * @openapi
 * /users:
 *   post:
 *     tags:
 *       - "users__auth"
 *     operationId: authUsersCreate
 *     description: Create User
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               displayName:
 *                 type: string
 *               password:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       400:
 *         description: Missing data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       201:
 *         description: New user id
 */
  app.post("/users",
      isAuthenticated,
      isAuthorized({hasRole: ["admin", "manager"]}),
      create
  );
  /**
 * @openapi
 * /users:
 *   get:
 *     tags:
 *       - "users__auth"
 *     operationId: authUsersList
 *     description: List users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of users
 */
  app.get("/users", [
    isAuthenticated,
    isAuthorized({hasRole: ["admin", "manager"]}),
    all,
  ]);
  /**
 * @openapi
 * /users/{id}:
 *   get:
 *     tags:
 *       - "users__auth"
 *     operationId: authUsersDetail
 *     description: Get user by id
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: User object
 */
  app.get("/users/:id", [
    isAuthenticated,
    isAuthorized({hasRole: ["admin", "manager"], allowSameUser: true}),
    get,
  ]);

  /**
 * @openapi
 * /users/{id}:
 *   patch:
 *     tags:
 *       - "users__auth"
 *     operationId: authUsersUpdate
 *     description: Update user by id
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               displayName:
 *                 type: string
 *               password:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       200:
 *         description: User object
 */
  app.patch("/users/:id", [
    isAuthenticated,
    isAuthorized({hasRole: ["admin", "manager"], allowSameUser: true}),
    patch,
  ]);
  /**
 * @openapi
 * /users/{id}:
 *   delete:
 *     tags:
 *       - "users__auth"
 *     operationId: authUsersDelete
 *     description: Delete user by id
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: User id
 */
  app.delete("/users/:id", [
    isAuthenticated,
    isAuthorized({hasRole: ["admin", "manager"], allowSameUser: true}),
    remove,
  ]);
}
