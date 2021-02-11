import {Request, Response} from "express";
import * as functions from "firebase-functions";
import * as mysql from "mysql";

const con = mysql.createConnection({
  host: functions.config().bmbf_research_agenda.mysql.host,
  user: functions.config().bmbf_research_agenda.mysql.user,
  password: functions.config().bmbf_research_agenda.mysql.password,
  database: functions.config().bmbf_research_agenda.mysql.database,
});

con.connect((err) => {
  if (err) throw err;
});

export async function all(req: Request, res: Response) {
  try {
    const table = functions.config().bmbf_research_agenda.mysql.question_table;
    const result = await new Promise((resolve, reject) => {
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
    return res.status(200).send({result});
  } catch (err) {
    return handleError(res, err);
  }
}

function handleError(res: Response, err: any) {
  return res.status(500).send({message: `${err.code} - ${err.message}`});
}
