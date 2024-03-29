import {Request, Response} from "express";
import {handleError, createPool, processQuery, parseIdString} from "../utils";

const pool = createPool();

export async function publicAll(req: Request, res: Response) {
  try {
    const result = await processQuery(
        pool,
        "SELECT id, name, parent FROM taxonomies",
        []);
    return res.status(200).send(result);
  } catch (err) {
    return handleError(res, err);
  }
}

export async function byId(req: Request, res: Response) {
  try {
    if ("id" in req.params && !isNaN(parseInt(req.params.id))) {
      const result = await processQuery(
          pool,
          "SELECT * FROM taxonomies WHERE id = ?",
          [req.params.id]);
      if (result.length === 0) {
        return res.status(404).send({message: "Id not found"});
      } else {
        return res.status(200).send(result);
      }
    } else {
      return res.status(400).send({message: "No valid id received"});
    }
  } catch (err) {
    return handleError(res, err);
  }
}

export async function createTax(req: Request, res: Response) {
  try {
    if ("name" in req.query && req.query.name) {
      const result = await processQuery(
          pool,
          "INSERT INTO taxonomies (name, parent) VALUES (?, ?)",
          [
            req.query.name.toString(),
            ((req.query.parent) ? parseInt(req.query.parent.toString()) : null),
          ]
      );
      const results = {insertId: null, ...result};
      return res.status(200).send({id: results.insertId});
    } else {
      return res.status(400).send({message: "No name received"});
    }
  } catch (err) {
    return handleError(res, err);
  }
}

export async function updateTax(req: Request, res: Response) {
  try {
    if (
      "id" in req.params &&
      req.params.id &&
      !isNaN(parseInt(req.params.id.toString())) &&
      "name" in req.body && req.body.name
    ) {
      const id = parseInt(req.params.id.toString());
      await processQuery(
          pool,
          "UPDATE taxonomies SET name = ?, parent = ? WHERE id = ?",
          [
            req.body.name.toString(),
          (
            "parent" in req.query &&
            req.query.parent &&
            !isNaN(parseInt(req.query.parent.toString()))) ?
              parseInt(req.query.parent.toString()) :
              null,
          id]
      );
      return res.status(200).send(id);
    } else {
      return res.status(400).send({message: "No valid id or name received"});
    }
  } catch (err) {
    return handleError(res, err);
  }
}

export async function deleteTax(req: Request, res: Response) {
  try {
    if ("id" in req.params && !isNaN(parseInt(req.params.id))) {
      await processQuery(
          pool,
          "DELETE FROM taxonomies WHERE id = ?",
          [parseInt(req.params.id)]
      );
      return res.status(200).send(req.params.id);
    } else {
      return res.status(400).send({message: "No valid id received"});
    }
  } catch (err) {
    return handleError(res, err);
  }
}

export async function assignTax(req: Request, res: Response) {
  try {
    if ("questions" in req.query && req.query.questions &&
    "taxonomies" in req.query && req.query.taxonomies) {
      const questions = parseIdString(req.query.questions.toString());
      const taxonomies = parseIdString(req.query.taxonomies.toString());

      if (questions.length >= 1 && taxonomies.length >= 1) {
        const params: number[] = [];
        questions.forEach((q) => {
          taxonomies.forEach((t) => {
            params.push(q, t);
          });
        });

        await processQuery(
            pool,
            `INSERT IGNORE INTO 
            ref_questions_taxonomies (question_id, taxonomy_id) 
          VALUES 
            ${(new Array(questions.length * taxonomies.length))
      .fill(0)
      .map(() => {
        return "(?, ?)";
      }).join(",")}`,
            params
        );

        return res.status(200).send({
          questions,
          taxonomies,
        });
      }
    }
    return res.status(400).send({
      message: "Missing question ids or taxonomy id",
    });
  } catch (err) {
    return handleError(res, err);
  }
}

export async function revokeTax(req: Request, res: Response) {
  try {
    if ("questions" in req.query && req.query.questions &&
    "taxonomies" in req.query && req.query.taxonomies) {
      const questions = parseIdString(req.query.questions.toString());
      const taxonomies = parseIdString(req.query.taxonomies.toString());

      if (questions.length >= 1 && taxonomies.length >= 1) {
        const params: number[] = [];
        questions.forEach((q) => {
          taxonomies.forEach((t) => {
            params.push(q, t);
          });
        });

        await processQuery(
            pool,
            `DELETE FROM 
            ref_questions_taxonomies
            WHERE 
            ${(new Array(questions.length * taxonomies.length))
      .fill(0)
      .map(() => {
        return " (question_id = ? AND taxonomy_id = ?) ";
      }).join(" OR ")}`,
            params
        );

        return res.status(200).send({
          questions,
          taxonomies,
        });
      }
    }
    return res.status(400).send({
      message: "Missing question ids or reply id",
    });
  } catch (err) {
    return handleError(res, err);
  }
}

