import {Response} from "express";
import * as functions from "firebase-functions";
import * as mysql from "mysql";

export const handleError = (res: Response, err: any) => {
  return res.status(500).send({message: `${err.code} - ${err.message}`});
};

export const createPool = (): mysql.Pool => {
  return mysql.createPool({
    host: functions.config().bmbf_research_agenda.mysql.host,
    user: functions.config().bmbf_research_agenda.mysql.user,
    password: functions.config().bmbf_research_agenda.mysql.password,
    database: functions.config().bmbf_research_agenda.mysql.database,
    connectionLimit: 10,
  });
};

export const parseIdString = (str: string): number[] => {
  return str.split(",").map((id) => {
    return parseInt(id);
  }).filter((id) => {
    return !isNaN(id);
  });
};

export const processQuery = (
    pool: mysql.Pool,
    query: string,
    params: (string | number | null | boolean)[]
): Promise<{ [key: string]: any}[]> => {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, con) => {
      if (err) {
        reject(err);
      }
      con.query(
          query,
          params,
          (err, result) => {
            if (err) {
              reject(err);
            }
            resolve(result);
          }
      );
    });
  });
};

// Thanks to https://github.com/manishsaraan/email-validator
export const emailValidation = (email: string): boolean => {
  // eslint-disable-next-line max-len
  const tester = /^[-!#$%&'*+/0-9=?A-Z^_a-z`{|}~](\.?[-!#$%&'*+/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-*\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/;

  if (!email) return false;

  const emailParts = email.split("@");

  if (emailParts.length !== 2) return false;

  const account = emailParts[0];
  const address = emailParts[1];

  if (account.length > 64) return false;

  else if (address.length > 255) return false;

  const domainParts = address.split(".");
  if (domainParts.some(function(part) {
    return part.length > 63;
  })) return false;


  if (!tester.test(email)) return false;

  return true;
};

export const hasNumbersAndLetters = (str: string): boolean => {
  const regex = /(?:[A-Za-z].*?\d|\d.*?[A-Za-z])/;
  return !!str.match(regex);
};
