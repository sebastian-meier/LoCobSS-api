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
 *     tags:
 *       - "questions__auth"
 *     operationId: authQuestions
 *     description: Load all questions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of questions.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Questions'
 */
  app.get("/questions",
      isAuthenticated,
      isAuthorized({hasRole: ["admin", "manager"]}),
      all
  );

  /**
 * @openapi
 * /question/like/{id}:
 *   get:
 *     tags:
 *       - "questions__user"
 *     operationId: userQuestionsLike
 *     description: Like a question
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         schema:
 *           type: integer
 *         in: path
 *         required: true
 *     responses:
 *       400:
 *         description: ID missing
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       200:
 *         description: New state of like for question.
 *         content:
 *           application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   result:
 *                     type: boolean
 */
  app.get("/question/like/:id",
      isAuthenticated,
      isAuthorized({hasRole: ["admin", "manager", "user"]}),
      like
  );

  /**
 * @openapi
 * /question/delete/{id}:
 *   get:
 *     tags:
 *       - "questions__auth"
 *     operationId: authQuestionsDelete
 *     description: Delete a question
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         schema:
 *           type: integer
 *         in: path
 *         required: true
 *     responses:
 *       400:
 *         description: ID missing
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       200:
 *         description: New state of like for question.
 *         content:
 *           application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   message:
 *                     type: string
 */
  app.get("/question/delete/:id",
      isAuthenticated,
      isAuthorized({hasRole: ["admin", "manager"]}),
      deleteQuestion
  );

  /**
 * @openapi
 * /question/update/{id}:
 *   post:
 *     tags:
 *       - "questions__auth"
 *     operationId: authQuestionsUpdate
 *     description: Update a question
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     requestBody:
 *       description: data for updating the question
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               state:
 *                 type: string
 *               question:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       400:
 *         description: ID missing
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       200:
 *         description: Id of updated question.
 *         content:
 *           application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 */
  app.post("/question/update/:id",
      isAuthenticated,
      isAuthorized({hasRole: ["admin", "manager"]}),
      update
  );

  /**
 * @openapi
 * /question/{id}:
 *   get:
 *     tags:
 *       - "questions__auth"
 *     operationId: authQuestion
 *     description: Load question by id
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         schema:
 *           type: integer
 *         in: path
 *         required: true
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
 *         description: Requested question data.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Question'
 */
  app.get("/question/:id",
      isAuthenticated,
      isAuthorized({hasRole: ["admin", "manager"]}),
      byId
  );

  /**
 * @openapi
 * /related/questions/cluster:
 *   get:
 *     tags:
 *       - "questions__auth"
 *     operationId: authQuestionsRelated
 *     description: Related question for a list of question ids
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: ids
 *         description: comma separated id (integer) list
 *         schema:
 *           type: string
 *         in: query
 *         required: true
 *     responses:
 *       400:
 *         description: IDs missing or not valid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       200:
 *         description: List of related ids.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                      type: integer
 */
  app.get("/related/questions/cluster",
      isAuthenticated,
      isAuthorized({hasRole: ["admin", "manager"]}),
      relatedFromIds
  );

  /**
 * @openapi
 * /system/rebuild:
 *   get:
 *     tags:
 *       - "system"
 *     operationId: authQuestionsRebuild
 *     description: Rebuild embeddings
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of questions.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
  app.get("/system/rebuild",
      isAuthenticated,
      isAuthorized({hasRole: ["admin", "manager"]}),
      rebuild
  );

  /**
 * @openapi
 * /public/questions/{page}:
 *   get:
 *     tags:
 *       - "questions__public"
 *     operationId: publicQuestions
 *     description: Load all public questions
 *     parameters:
 *       - in: path
 *         name: page
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *       - in: query
 *         name: taxonomies
 *         schema:
 *           description: comma-separated list of ids
 *           type: string
 *       - in: query
 *         name: answer
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: dates
 *         schema:
 *           description: comma-separated list of min/max date
 *           type: string
 *     responses:
 *       200:
 *         description: Array of questions.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResult'
 */
  app.get("/public/questions",
      setLocals,
      publicAll
  );

  /**
 * @openapi
 * /user/questions:
 *   get:
 *     tags:
 *       - "questions__user"
 *     operationId: userQuestions
 *     description: Load questions related to a user (like, ask)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of questions.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SimpleResult'
 */
  app.get("/user/questions",
      isAuthenticated,
      isAuthorized({hasRole: ["admin", "manager", "user"]}),
      userAll
  );

  /**
 * @openapi
 * /question/create:
 *   post:
 *     tags:
 *       - "questions__public"
 *     operationId: publicQuestionsCreate
 *     description: Asking a question
 *     requestBody:
 *       description: data for creating a questions
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               grecaptcha:
 *                 description: security
 *                 required: true
 *                 type: string
 *               question:
 *                 required: true
 *                 type: string
 *               description:
 *                 type: string
 *               age:
 *                 type: string
 *               gender:
 *                 type: string
 *               state:
 *                 type: string
 *               regiostar:
 *                 type: string
 *               register:
 *                 type: boolean
 *               password:
 *                 type: string
 *               mail:
 *                 type: string
 *               name:
 *                 type: string
 *     responses:
 *       400:
 *         description: See error message and code
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       200:
 *         description: Success message.
 *         content:
 *           application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   message:
 *                     type: string
 *                   question:
 *                     description: insert id
 *                     type: integer
 *                   token:
 *                     description: see question/link
 *                     type: string
 *                   text:
 *                     description: question
 *                     type: string
 *                   results:
 *                     schema:
 *                       $ref: '#/components/schemas/SimpleResult'
 */
  app.post("/public/question/create",
      create
  );

  /* docs see above */
  app.post("/question/create",
      isAuthenticated,
      isAuthorized({hasRole: ["admin", "manager", "user"]}),
      create
  );

  /**
 * @openapi
 * /question/link:
 *   post:
 *     tags:
 *       - "questions__public"
 *     operationId: publicQuestionsLink
 *     description: After asking a question the user can link questions
 *     requestBody:
 *       description: data for linking two questions
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 description: security
 *                 type: string
 *               source:
 *                 description: question id
 *                 type: integer
 *               target:
 *                 description: question id
 *                 type: integer
 *               strenght:
 *                 type: string
 *     responses:
 *       400:
 *         description: Invalid or not allowed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       200:
 *         description: Success message.
 *         content:
 *           application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   message:
 *                     type: string
 */
  app.post("/questions/link",
      link
  );

  /* docs see above */
  app.get("/public/questions/:page",
      setLocals,
      publicAll
  );

  /**
 * @openapi
 * /public/question/{id}:
 *   get:
 *     tags:
 *       - "questions__public"
 *     operationId: publicQuestion
 *     description: Load public questions by id
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
 *         description: Question.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PublicQuestion'
 */
  app.get("/public/question/:id",
      setLocals,
      publicById
  );

  /**
 * @openapi
 * /public/related/questions/{id}:
 *   get:
 *     tags:
 *       - "questions__public"
 *     operationId: publicQuestionsRelated
 *     description: Load related public questions by id
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
 *       200:
 *         description: Question.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SimpleResult'
 */
  app.get("/public/related/questions/:id",
      setLocals,
      publicRelated
  );
}
