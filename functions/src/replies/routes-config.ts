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
/**
 * @openapi
 * /reply/update:
 *   post:
 *     tags:
 *       - "replies__auth"
 *     operationId: authReplyUpdate
 *     description: Update reply
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *               body:
 *                 type: string
 *               url:
 *                 type: string
 *               name:
 *                 type: string
 *     responses:
 *       400:
 *         description: ID missing or not valid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       200:
 *         description: Reply id.
 */
  app.post("/reply/update",
      isAuthenticated,
      isAuthorized({hasRole: ["admin", "manager"]}),
      updateReply
  );

  /**
 * @openapi
 * /reply/create:
 *   get:
 *     tags:
 *       - "replies__auth"
 *     operationId: authReplyCreate
 *     description: Create reply
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: body
 *         type: string
 *       - name: url
 *         in: query
 *         type: string
 *       - name: name
 *         in: query
 *         type: string
 *     responses:
 *       200:
 *         description: New reply id.
 */
  app.get("/reply/create",
      isAuthenticated,
      isAuthorized({hasRole: ["admin", "manager"]}),
      createReply
  );

  /**
 * @openapi
 * /reply/delete/{id}:
 *   get:
 *     tags:
 *       - "replies__auth"
 *     operationId: authReplyDelete
 *     description: Delete reply
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         type: integer
 *     responses:
 *       200:
 *         description: Deleted id
 */
  app.get("/reply/delete/:id",
      isAuthenticated,
      isAuthorized({hasRole: ["admin", "manager"]}),
      deleteReply
  );

  /**
 * @openapi
 * /reply/assign:
 *   get:
 *     tags:
 *       - "replies__auth"
 *     operationId: authReplyAssign
 *     description: Connect reply and question
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         description: comma-separated list of question ids
 *         name: questions
 *         type: string
 *       - name: replies
 *         description: comma-separated list of reply ids
 *         in: query
 *         type: string
 *     responses:
 *       200:
 *         description: Replies and Questions
 */
  app.get("/reply/assign",
      isAuthenticated,
      isAuthorized({hasRole: ["admin", "manager"]}),
      assignReply
  );

  /**
 * @openapi
 * /reply/revoke:
 *   get:
 *     tags:
 *       - "replies__auth"
 *     operationId: authReplyRevoke
 *     description: Disconnect reply and question
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         description: comma-separated list of question ids
 *         name: questions
 *         type: string
 *       - name: replies
 *         description: comma-separated list of reply ids
 *         in: query
 *         type: string
 *     responses:
 *       200:
 *         description: Replies and Questions
 */
  app.get("/reply/revoke",
      isAuthenticated,
      isAuthorized({hasRole: ["admin", "manager"]}),
      revokeReply
  );

  /**
 * @openapi
 * /public/replies:
 *   get:
 *     tags:
 *       - "replies__public"
 *     operationId: publicReplies
 *     description: Load all replies
 *     responses:
 *       200:
 *         description: Reply.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Replies'
 */
  app.get("/public/replies",
      publicAll
  );

  /**
 * @openapi
 * /reply/{id}:
 *   get:
 *     tags:
 *       - "replies__auth"
 *     operationId: authReply
 *     description: Load reply by id
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       400:
 *         description: ID missing or not valid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       404:
 *         description: ID not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       200:
 *         description: Reply.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Reply'
 */
  app.get("/reply/:id",
      isAuthenticated,
      isAuthorized({hasRole: ["admin", "manager"]}),
      byId
  );
}
