import {Request, Response} from "express";
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as moment from "moment";
import fetch from "node-fetch";
import {v2} from "@google-cloud/translate";
import {
  createPool,
  processQuery,
  handleError,
  emailValidation,
  hasNumbersAndLetters} from "../utils";

const pool = createPool();
const translate = new v2.Translate({
  projectId: functions.config().bmbf_research_agenda.projectId,
  keyFilename: functions.config().bmbf_research_agenda.project_json,
});

export async function all(req: Request, res: Response) {
  try {
    const result = await processQuery(
        pool,
        "SELECT * FROM questions",
        []
    );
    return res.status(200).send({result});
  } catch (err) {
    return handleError(res, err);
  }
}

export async function userAll(req: Request, res: Response) {
  try {
    if (!("uid" in res.locals)) {
      return res.status(404).send({
        result: [],
        message: "No user credentials send.",
      });
    } else {
      const result = await processQuery(
          pool,
          `SELECT 
          questions.id, 
          question_de, 
          participant_synonym AS participantSynonym, 
          created, 
          has_reply,
          JSON_ARRAY(
            JSON_OBJECT(
              'id', taxonomies.id,
              'name', taxonomies.name
            )
          ) AS questionTaxonomies,
          ref_participants_questions.type AS relation
          FROM
            questions
          LEFT OUTER JOIN
            ref_questions_taxonomies
            ON ref_questions_taxonomies.question_id = questions.id
          LEFT OUTER JOIN
            taxonomies
            ON ref_questions_taxonomies.taxonomy_id = taxonomies.id
          JOIN
            ref_participants_questions
            ON questions.id = ref_participants_questions.question_id
          WHERE
            ref_participants_questions.participant_id = ?`,
          [res.locals.uid]
      );
      return res.status(200).send({
        results: result.map(cleanRelations),
      });
    }
  } catch (err) {
    return handleError(res, err);
  }
}

export async function publicAll(req: Request, res: Response) {
  try {
    const result = await new Promise((resolve, reject) => {
      let page = 0;
      const publicLimit = 10;

      // PAGINATION
      if ("page" in req.params) {
        if (!isNaN(parseInt(req.params.page))) {
          page = Math.abs(parseInt(req.params.page));
        }
      }

      // SEARCH
      let hasSearch = false;
      let search: string[] = [];
      if ("query" in req.query && req.query.query !== undefined) {
        hasSearch = true;
        const searchStr = "%" + req.query.query.toString() + "%";
        search = new Array(4).fill(searchStr);
      }

      // TAXONOMY
      let hasTaxonomy = false;
      let taxonomies: string[] = [];
      if ("taxonomies" in req.query && req.query.taxonomies !== undefined) {
        hasTaxonomy = true;
        taxonomies = req.query.taxonomies.toString().split(",");
      }

      // HAS ANSWER
      let hasAnswer = false;
      let answer: boolean[] = [];
      if ("answer" in req.query && req.query.answer !== undefined) {
        hasAnswer = true;
        answer = [
          (req.query.answer.toString().toLowerCase() === "true") ?
          true :
          false,
        ];
      }

      // DATE
      let hasDate = false;
      let dates: moment.Moment[] = [];
      const minDate = moment("2000-01-01 00:00:00");
      const maxDate = moment();
      if ("dates" in req.query && req.query.dates !== undefined) {
        hasDate = true;
        const strDates = req.query.dates.toString().split(",");
        dates = strDates.map((d) => moment(d));

        dates.forEach((d) => {
          // first check, valid timestamps
          if (!d.isValid()) {
            hasDate = false;
          }
          // second check, timestamp in range
          if (d.isBefore(minDate) || d.isAfter(maxDate)) {
            hasDate = false;
          }
        });

        // third check, timestamp 1 < timestamp 2
        if (dates[0].isAfter(dates[1])) {
          hasDate = false;
        }
      }

      pool.getConnection((err, con) => {
        if (err) {
          throw err;
        }

        const params = [
          ...answer,
          ...dates.map((d) => d.format("YYYY-MM-DD HH:mm:ss")),
          ...search,
          ...taxonomies,
        ];

        const fromStr = `FROM
          questions
        LEFT OUTER JOIN
          ref_questions_taxonomies
          ON ref_questions_taxonomies.question_id = questions.id
        LEFT OUTER JOIN
          taxonomies
          ON ref_questions_taxonomies.taxonomy_id = taxonomies.id
        WHERE
          state = 'published'
          ${(hasAnswer) ? " AND has_reply = ? " : ""}
          ${(hasDate) ? " AND (created >= ? AND created <= ?) " : ""}
          ${(hasSearch) ? ` AND (
            question LIKE ? 
            OR description LIKE ? 
            OR question_en LIKE ? 
            OR description_en LIKE ?
          )` : "" }
        GROUP BY
          questions.id
        ${(hasTaxonomy) ? ` HAVING ${taxonomies.map(() => {
  return "JSON_CONTAINS(question_taxonomies, ?, '$[*].id')";
}).join(" AND ")} ` : "" }`;

        con.query(`SELECT
          COUNT(*) AS overall,
          MIN(t.created) AS min_created,
          MAX(t.created) AS max_created
          FROM (SELECT questions.id, questions.created  
        ${fromStr}) AS t`,
        params,
        (err, result) => {
          if (err) {
            throw reject(err);
          }

          const overall = (result.length > 0) ? result[0].overall : 0;
          const createdMin = (result.length > 0) ? result[0].min_created : null;
          const createdMax = (result.length > 0) ? result[0].max_created : null;

          con.query(
              `SELECT 
              questions.id, 
              question_de, 
              participant_synonym AS participantSynonym, 
              created, 
              has_reply,
              JSON_ARRAY(
                JSON_OBJECT(
                  'id', taxonomies.id,
                  'name', taxonomies.name
                )
              ) AS questionTaxonomies
              ${fromStr}
              LIMIT
                ${publicLimit}
              OFFSET
                ${publicLimit * page}`,
              params,
              (err, result) => {
                if (err) {
                  throw reject(err);
                }
                resolve({
                  maxPage: Math.ceil(overall / publicLimit),
                  count: overall,
                  dateRange: [createdMin, createdMax],
                  page,
                  hasSearch,
                  hasTaxonomy,
                  hasDate,
                  hasAnswer,
                  results: result.map(cleanRelations),
                });
              }
          );
        });
      });
    });
    return res.status(200).send(result);
  } catch (err) {
    return handleError(res, err);
  }
}

const cleanRelations = (r: {
  [key: string]: string
}): {
  [key: string]: string | {
    id: number,
    name: string
  }[]
} => {
  const re: {
    [key: string]: string | {
      id: number,
      name: string
    }[],
  } = {
    ...r,
    taxonomies: [],
    replies: [],
  };
  if ("questionTaxonomies" in r && r.questionTaxonomies) {
    re["taxonomies"] = JSON.parse(r.questionTaxonomies)
        .filter((r: {
        id: null | number
      }) => r.id !== null);
    delete re.questionTaxonomies;
  }
  if ("questionReplies" in r && r.questionReplies) {
    re["replies"] = JSON.parse(r.questionReplies)
        .filter((r: {
        id: null | number
      }) => r.id !== null);
    delete re.questionReplies;
  }
  return re;
};

export async function publicById(req: Request, res: Response) {
  try {
    if ("id" in req.params && !isNaN(parseInt(req.params.id))) {
      const result = await processQuery(
          pool,
          `SELECT 
          questions.id, 
          question_de, 
          description_de, 
          participant_synonym AS participantSynonym, 
          created, 
          has_reply,
          JSON_ARRAY(
            JSON_OBJECT(
              'id', taxonomies.id,
              'name', taxonomies.name
            )
          ) AS questionTaxonomies,
          JSON_ARRAY(
            JSON_OBJECT(
              'id', replies.id,
              'name', replies.title
            )
          ) AS questionReplies
        FROM
          questions
        LEFT OUTER JOIN
          ref_questions_taxonomies
          ON ref_questions_taxonomies.question_id = questions.id
        LEFT OUTER JOIN
          taxonomies
          ON ref_questions_taxonomies.taxonomy_id = taxonomies.id
        LEFT OUTER JOIN
          ref_questions_replies
          ON ref_questions_replies.question_id = questions.id
        LEFT OUTER JOIN
          replies
          ON ref_questions_replies.reply_id = replies.id
        WHERE
          questions.id = ? AND
          state = 'published'`,
          [parseInt(req.params.id)],
      );

      console.log(parseInt(req.params.id));

      if (result.length === 0) {
        return res.status(404).send({message: "Id not found"});
      } else {
        return res.status(200).send({
          result: cleanRelations(result[0]),
        });
      }
    } else {
      return res.status(400).send({message: "No valid id received"});
    }
  } catch (err) {
    return handleError(res, err);
  }
}

export async function byId(req: Request, res: Response) {
  try {
    if ("id" in req.params && !isNaN(parseInt(req.params.id))) {
      const result = await processQuery(
          pool,
          `SELECT 
          questions.*, 
          JSON_ARRAY(
            JSON_OBJECT(
              'id', taxonomies.id,
              'name', taxonomies.name
            )
          ) AS questionTaxonomies,
          JSON_ARRAY(
            JSON_OBJECT(
              'id', replies.id,
              'name', replies.title
            )
          ) AS questionReplies
        FROM
          questions
        LEFT OUTER JOIN
          ref_questions_taxonomies
          ON ref_questions_taxonomies.question_id = questions.id
        LEFT OUTER JOIN
          taxonomies
          ON ref_questions_taxonomies.taxonomy_id = taxonomies.id
        LEFT OUTER JOIN
          ref_questions_replies
          ON ref_questions_replies.question_id = questions.id
        LEFT OUTER JOIN
          replies
          ON ref_questions_replies.reply_id = replies.id
        WHERE
          questions.id = ?`,
          [parseInt(req.params.id)]
      );
      if (result.length === 0) {
        return res.status(404).send({message: "Id not found"});
      } else {
        return res.status(200).send({
          result: cleanRelations(result[0]),
        });
      }
    } else {
      return res.status(400).send({message: "No valid id received"});
    }
  } catch (err) {
    return handleError(res, err);
  }
}

export async function publicRelated(req: Request, res: Response) {
  if ("id" in req.params && !isNaN(parseInt(req.params.id))) {
    // For exact recommendations change "similar_random" to "similar"
    const response = await fetch(
        functions.config().bmbf_research_agenda.services.similarity +
      "/similar_random/" +
      req.params.id
    );
    const json = await response.json();

    if (json.ids.length > 0) {
      const results = await questionsFromIds(json.ids);
      return res.status(200).send(results);
    } else {
      return res.status(200).send({results: []});
    }
  } else {
    return res.status(400).send({message: "No valid id received"});
  }
}

function questionsFromIds(ids: string[]): Promise<{}[]> {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, con) => {
      if (err) {
        throw err;
      }

      con.query(
          `SELECT 
        questions.id, 
        question_de, 
        participant_synonym AS participantSynonym, 
        tsne_x,
        tsne_y,
        created, 
        has_reply,
        JSON_ARRAY(
          JSON_OBJECT(
            'id', taxonomies.id,
            'name', taxonomies.name
          )
        ) AS questionTaxonomies
      FROM
        questions
      LEFT OUTER JOIN
        ref_questions_taxonomies
        ON ref_questions_taxonomies.question_id = questions.id
      LEFT OUTER JOIN
        taxonomies
        ON ref_questions_taxonomies.taxonomy_id = taxonomies.id
      WHERE questions.id IN (${ids.join(",")})`,
          (err, result) => {
            if (err) {
              throw reject(err);
            }
            resolve(result.map(cleanRelations));
          });
    });
  });
}

export async function relatedFromIds(req: Request, res: Response) {
  try {
    if ("ids" in req.query && req.query.ids) {
      const ids = req.query.ids.toString().split(",");
      if (ids.length >= 1) {
        let limit = null;
        if ("limit" in req.query && req.query.limit) {
          limit = req.query.limit;
        }

        // For exact recommendations change "similar_random" to "similar"
        const response = await fetch(
            functions.config().bmbf_research_agenda.services.similarity +
          "/similar/list?ids=" +
          req.query.ids +
          ((limit) ? "&limit=" + limit : "")
        );
        const json = await response.json();

        if (json.ids.length > 0) {
          const results: {}[] = await questionsFromIds(json.ids);
          return res.status(200).send(results);
        } else {
          return res.status(200).send({results: []});
        }
      }
    }
    return res.status(400).send({message: "No valid id received"});
  } catch (err) {
    return handleError(res, err);
  }
}

// This is the most dangerous endpoint.
// All other endpoints are either read-only
// or potected by authentication.
// Therefore, a lot of checks are performed

export async function create(req: Request, res: Response) {
  try {
    // 1. check for valid google recaptcha (i am human)

    const captchaResponse = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      // eslint-disable-next-line max-len
      body: `response=${req.body.grecaptcha}&secret=${functions.config().bmbf_research_agenda.grecaptcha}`,
      headers: {
        "Content-type": "application/x-www-form-urlencoded",
      },
    })
        .then((response) => response.json());

    if (
      "success" in captchaResponse &&
      captchaResponse.success === true
    ) {
      let questionId: number | null = null;
      let questionEn: string | null = null;

      // Minimum length for question and description
      const minLength = 10;

      if (
        "question" in req.body &&
        req.body.question &&
        req.body.question.length > minLength
      ) {
        let name = req.body.name;
        if (!name || name.length === 0) {
          name = "anonym";
        }

        const translations: {
          [key in string | "de" | "en"]: {
            [key in "question" | "description"]?: string
          }
        } = {"de": {}, "en": {}};

        const langs = Object.keys(translations);
        for (let l = 0; l < langs.length; l += 1) {
          const lang = langs[l];
          const transQuestion =
            await translate.translate(req.body.question, lang);
          translations[lang].question = transQuestion[0];
          if (
            "description" in req.body &&
            req.body.description &&
            req.body.description.length > minLength
          ) {
            const transDescription =
              await translate.translate(req.body.question, lang);
            translations[lang].description = transDescription[0];
          }
        }

        const questions = await processQuery(pool, `INSERT INTO questions 
          (
            question,
            description,
            participant_synonym,
            question_de,
            description_de,
            question_en,
            description_en
          ) 
        VALUES 
          (?, ?, ?, ?, ?, ?, ?)`,
        [
          req.body.question,
          req.body.description,
          name,
            (translations.de.question) ? translations.de.question : "",
            (translations.de.description) ? translations.de.description : "",
            (translations.en.question) ? translations.en.question : "",
            (translations.en.description) ? translations.en.description : "",
        ]
        );
        const question = {insertId: null, ...questions};
        questionId = question.insertId;
        questionEn = (translations.en.question) ?
          translations.en.question :
          null;

        if (
          req.body.age ||
          req.body.gender ||
          req.body.state ||
          req.body.regiostar
        ) {
          await processQuery(pool, `INSERT INTO stats 
            (age_group, gender, state, region_type) 
          VALUES 
            (?, ?, ?, ?)`,
          [
              (req.body.age) ? req.body.age : -1,
              (req.body.gender) ? req.body.gender : -1,
              (req.body.state) ? req.body.state : -1,
              (req.body.regiostar) ? req.body.regiostar : -1,
          ]
          );
        }
      } else {
        return res.status(400).send({
          message: "No valid question",
          errorCode: 2,
        });
      }

      // 3. People are allowed to register while asking a question.
      // Therefore, we need to check if the registrees email is not
      // already taken. If so, the interfaces will ask the user to
      // login, before sending the question.

      if (
        "register" in req.body &&
        req.body.register &&
        req.body.register === "yes"
      ) {
        // 3.1 Check if email and password are valid
        if (!("uid" in res.locals) &&
          "mail" in req.body &&
          req.body.mail && emailValidation(req.body.mail) &&
          "password" in req.body &&
          // each account does not contain anything personal
          // so being pedantic about a super secure password
          // is a bit over the top...
          req.body.password && req.body.password.length >= 8 &&
          hasNumbersAndLetters(req.body.password)) {
          try {
            const newUser = await admin.auth().createUser({
              displayName: req.body.name,
              password: req.body.password,
              email: req.body.mail,
            });

            await admin.auth().setCustomUserClaims(newUser.uid, {role: "user"});
            await processQuery(
                pool,
                `INSERT INTO
                  ref_participants_questions
                  (participant_id, question_id, type)
                VALUES
                  (?, ?, 'ask')`,
                [newUser.uid, questionId]);
          } catch (error) {
            if (error.errorInfo.code === "auth/email-already-exists") {
              return res.status(400).send({
                message: "Email already exists",
                errorCode: 4,
              });
            } else {
              throw error;
            }
          }
        }
      }

      if (
        "register" in req.body &&
        req.body.register &&
        req.body.register === "registered"
      ) {
        if ("uid" in res.locals) {
          await processQuery(
              pool,
              `INSERT INTO 
                ref_participants_questions
                (participant_id, question_id, type)
              VALUES
                (?, ?, 'ask')`,
              [res.locals.uid, questionId]);
        }
        if (emailValidation(req.body.mail)) {
          return res.status(400).send({
            message: "Question entered, but Email not validated.",
            errorCode: 5,
          });
        }
      }

      if (questionId) {
        let relatedQuestions: {}[] = [];
        if (questionEn) {
          await Promise.all([
            fetch(functions.config().bmbf_research_agenda.services.sentiment +
            "/predict",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                text: questionEn,
              }),
            })
                .then((response) => response.json())
                .then((response: {
                  [key: string]: number,
                }[]) => {
                  const summaryArray: {[key: string]: number[]} = {
                    neg: [],
                    pos: [],
                    neu: [],
                    compound: [],
                  };
                  const summary: {[key: string]: {
                    mean: number,
                    max: number,
                    min: number,
                  }} = {};

                  Object.keys(summaryArray).forEach((key) => {
                    response.forEach((r) => {
                      summaryArray[key].push(r[key]);
                    });
                    summary[key] = {
                      mean: summaryArray[key].reduce((p, c) => p + c, 0) / 
                        summaryArray[key].length,
                      max: Math.max(...summaryArray[key]),
                      min: Math.min(...summaryArray[key]),
                    };
                  });

                  return processQuery(
                      pool,
                      `UPDATE
                        questions
                      SET
                        sentiment_summary = ?,
                        sentiment_all = ?
                      WHERE
                        id = ?`,
                      [
                        JSON.stringify(summary),
                        JSON.stringify(response),
                        questionId,
                      ]);
                }),
            fetch(functions.config().bmbf_research_agenda.services.profanity +
            "/predict",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                text: questionEn,
              }),
            })
                .then((response) => response.json())
                .then((response) => {
                  return processQuery(
                      pool,
                      `UPDATE
                        questions
                      SET
                        profanityfilter = ?,
                        sonar_top = ?,
                        sonar_all = ?
                      WHERE
                        id = ?`,
                      [
                        response.profanityfilter,
                        response.sonar.top_class,
                        JSON.stringify(response.sonar.classes),
                        questionId,
                      ]);
                }),
          ]);
          const response = await fetch(
              functions.config().bmbf_research_agenda.services.similarity +
              "/embed",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  text: questionEn,
                  includeSimilar: true,
                }),
              }
          );
          const jResponse = await response.json();
          if ("similar" in jResponse && jResponse.similar.length > 0) {
            relatedQuestions = await questionsFromIds(jResponse.similar);
          }

          await processQuery(
              pool,
              `INSERT INTO 
              question_vectors
              (
                question_id, 
                ${Array(512).fill(0).map((a, i) => `vec_${i + 1}`).join(", ")}
              )
            VALUES
              (
                ${Array(513).fill(0).map(() => "?").join(", ")}
              )`,
              [questionId, ...jResponse.vectors[0]]);
        }
        return res.status(200).send({
          message: "Success",
          question: questionId,
          text: req.body.question,
          results: relatedQuestions,
        });
      } else {
        return res.status(400).send({
          message: "Could not create question",
          errorCode: 3,
        });
      }
    } else {
      return res.status(400).send({
        message: "No valid captcha",
        errorCode: 1,
      });
    }
  } catch (err) {
    return handleError(res, err);
  }
}

export async function rebuild(req: Request, res: Response) {
  try {
    await fetch(
        functions.config().bmbf_research_agenda.services.embeds
    );
  } catch (err) {
    return handleError(res, err);
  }

  return res.status(200).send({
    message: "success",
  });
}
