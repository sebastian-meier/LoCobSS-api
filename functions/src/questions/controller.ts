import {Request, Response} from "express";
import * as functions from "firebase-functions";
import * as mysql from "mysql";
import * as moment from "moment";
import fetch from "node-fetch";

const pool = mysql.createPool({
  host: functions.config().bmbf_research_agenda.mysql.host,
  user: functions.config().bmbf_research_agenda.mysql.user,
  password: functions.config().bmbf_research_agenda.mysql.password,
  database: functions.config().bmbf_research_agenda.mysql.database,
  connectionLimit: 10,
});

export async function all(req: Request, res: Response) {
  try {
    const table = functions.config().bmbf_research_agenda.mysql.question_table;
    const result = await new Promise((resolve, reject) => {
      pool.getConnection(function(err, con) {
        if (err) {
          throw err;
        }
        con.query(
            `SELECT * FROM ${table}`,
            (err, result) => {
              if (err) {
                throw reject(err);
              }
              resolve(result);
            }
        );
      });
    });
    return res.status(200).send({result});
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
              participant_synonym, 
              created, 
              has_reply,
              JSON_ARRAY(
                JSON_OBJECT(
                  'id', taxonomies.id,
                  'name', taxonomies.name
                )
              ) AS question_taxonomies
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
                  results: result.map(filterTaxonomies),
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

const filterTaxonomies = (r: {
  taxonomies: {
    id: number,
    name: string
  }[],
  // eslint-disable-next-line camelcase
  question_taxonomies?: string
}): {
  taxonomies: {
    id: number,
    name: string
  }[],
  // eslint-disable-next-line camelcase
  question_taxonomies?: string
} => {
  if ("question_taxonomies" in r && r.question_taxonomies) {
    r["taxonomies"] = JSON.parse(r.question_taxonomies)
        .filter((r: {
        id: null | number
      }) => r.id !== null);
    delete r.question_taxonomies;
  } else {
    r["taxonomies"] = [];
  }
  return r;
};

export async function publicById(req: Request, res: Response) {
  try {
    if ("id" in req.params && !isNaN(parseInt(req.params.id))) {
      const result: {}[] = await new Promise((resolve, reject) => {
        pool.getConnection((err, con) => {
          if (err) {
            throw err;
          }
          con.query(
            `SELECT 
              questions.id, 
              question_de, 
              description_de, 
              participant_synonym, 
              created, 
              has_reply,
              JSON_ARRAY(
                JSON_OBJECT(
                  'id', taxonomies.id,
                  'name', taxonomies.name
                )
              ) AS question_taxonomies,
              JSON_ARRAY(
                JSON_OBJECT(
                  'id', replies.id,
                  'name', replies.name
                )
              ) AS question_replies
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
              id = ? AND
              state = 'published'`,
              [parseInt(req.params.id)],
              (err, result) => {
                if (err) {
                  throw reject(err);
                }
                resolve(result);
              });
        });
      });
      if (result.length === 0) {
        return res.status(404).send({message: `Id not found`}); 
      } else {
        return res.status(200).send(result);
      }
    } else {
      return res.status(400).send({message: `No valid id received`}); 
    }
  } catch (err) {
    return handleError(res, err);
  }
}

export async function publicRelated(req: Request, res: Response) {
  if ('id' in req.params && !isNaN(parseInt(req.params.id))) {
    console.log(req.params.id);
    const response = await fetch(functions.config().bmbf_research_agenda.services.similarity + '/similar/' + req.params.id);
    const json = await response.json();

    if (json.ids.length > 0) {
      const result: {results:{}[]} = await new Promise((resolve, reject) => {
        pool.getConnection((err, con) => {
          if (err) {
            throw err;
          }

          con.query(
            `SELECT 
              questions.id, 
              question_de, 
              participant_synonym, 
              created, 
              has_reply,
              JSON_ARRAY(
                JSON_OBJECT(
                  'id', taxonomies.id,
                  'name', taxonomies.name
                )
              ) AS question_taxonomies
            FROM
              questions
            LEFT OUTER JOIN
              ref_questions_taxonomies
              ON ref_questions_taxonomies.question_id = questions.id
            LEFT OUTER JOIN
              taxonomies
              ON ref_questions_taxonomies.taxonomy_id = taxonomies.id
            WHERE questions.id IN (${json.ids.join(',')})`,
            (err, result) => {
              if (err) {
                throw reject(err);
              }
              resolve({
                results: result.map(filterTaxonomies),
              });
            });
          });
        });
        return res.status(200).send(result);
    } else {
      return res.status(200).send({results:[]});
    }
  } else {
    return res.status(400).send({message: `No valid id received`}); 
  }
}

function handleError(res: Response, err: any) {
  return res.status(500).send({message: `${err.code} - ${err.message}`});
}
