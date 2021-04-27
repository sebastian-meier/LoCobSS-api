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
/**
 * @openapi
 * /taxonomy/update:
 *   post:
 *     tags:
 *       - "taxonomies__auth"
 *     operationId: authTaxonomyUpdate
 *     description: Update taxonomy
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
 *               name:
 *                 type: string
 *               parent:
 *                 type: integer
 *     responses:
 *       400:
 *         description: ID missing or not valid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       200:
 *         description: Taxonomy id.
 */
  app.post("/taxonomy/update",
      isAuthenticated,
      isAuthorized({hasRole: ["admin", "manager"]}),
      updateTax
  );

  /**
 * @openapi
 * /taxonomy/create:
 *   get:
 *     tags:
 *       - "taxonomies__auth"
 *     operationId: authTaxonomyCreate
 *     description: Create taxonomy
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         type: string
 *       - name: parent
 *         in: query
 *         type: integer
 *     responses:
 *       200:
 *         description: New taxonomy id.
 */
  app.get("/taxonomy/create",
      isAuthenticated,
      isAuthorized({hasRole: ["admin", "manager"]}),
      createTax
  );

  /**
 * @openapi
 * /taxonomy/delete/{id}:
 *   get:
 *     tags:
 *       - "taxonomies__auth"
 *     operationId: authTaxonomyDelete
 *     description: Delete taxonomy
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
  app.get("/taxonomy/delete/:id",
      isAuthenticated,
      isAuthorized({hasRole: ["admin", "manager"]}),
      deleteTax
  );

  /**
 * @openapi
 * /taxonomy/assign:
 *   get:
 *     tags:
 *       - "replies__auth"
 *     operationId: authTaxonomyAssign
 *     description: Connect taxonomies and question
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         description: comma-separated list of question ids
 *         name: questions
 *         type: string
 *       - name: taxonomies
 *         description: comma-separated list of taxonomy ids
 *         in: query
 *         type: string
 *     responses:
 *       200:
 *         description: Taxonomies and Questions
 */
  app.get("/taxonomy/assign",
      isAuthenticated,
      isAuthorized({hasRole: ["admin", "manager"]}),
      assignTax
  );

  /**
 * @openapi
 * /taxonomy/revoke:
 *   get:
 *     tags:
 *       - "taxonomies__auth"
 *     operationId: authTaxonomyRevoke
 *     description: Disconnect taxonomies and questions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         description: comma-separated list of question ids
 *         name: questions
 *         type: string
 *       - name: taxonomies
 *         description: comma-separated list of taxonomy ids
 *         in: query
 *         type: string
 *     responses:
 *       200:
 *         description: Taxonomies and Questions
 */
  app.get("/taxonomy/revoke",
      isAuthenticated,
      isAuthorized({hasRole: ["admin", "manager"]}),
      revokeTax
  );

  /**
 * @openapi
 * /public/taxonomies:
 *   get:
 *     tags:
 *       - "taxonomies__public"
 *     operationId: publicTaxonomies
 *     description: Load all taxonomies
 *     responses:
 *       200:
 *         description: Taxonomies.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Taxonomies'
 */
  app.get("/public/taxonomies",
      publicAll
  );

  /**
 * @openapi
 * /taxonomy/{id}:
 *   get:
 *     tags:
 *       - "taxonomies__auth"
 *     operationId: authTaxonomy
 *     description: Load taxonomy by id
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
 *         description: Taxonomy.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Taxonomy'
 */
  app.get("/taxonomy/:id",
      isAuthenticated,
      isAuthorized({hasRole: ["admin", "manager"]}),
      byId
  );
}
