import {Request, Response} from "express";
import {handleError, createPool, processQuery, parseIdString} from "../utils";

const pool = createPool();

export async function publicAll(req: Request, res: Response) {
  try {
    const result = await processQuery(
        pool,
        "SELECT id, body, name, url FROM replies",
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
          "SELECT * FROM replies WHERE id = ?",
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

export async function createReply(req: Request, res: Response) {
  try {
    if ("name" in req.query && req.query.name) {
      const result = await processQuery(
          pool,
          "INSERT INTO replies (name, body, url) VALUES (?, ?)",
          [
            req.query.name.toString(),
            (req.query.body) ? req.query.body.toString() : "",
            (req.query.url) ? req.query.url.toString() : "",
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

export async function updateReply(req: Request, res: Response) {
  try {
    if (
      "id" in req.params &&
      req.params.id &&
      !isNaN(parseInt(req.params.id.toString()))
    ) {
      const id = parseInt(req.params.id.toString());
      await processQuery(
          pool,
          "UPDATE replies SET name = ?, body = ?, url = ? WHERE id = ?",
          [
            (req.body.name) ? req.body.name.toString() : "",
            (req.body.body) ? req.body.body.toString() : "",
            (req.body.url) ? req.body.url.toString() : "",
            id,
          ]
      );
      return res.status(200).send(id);
    } else {
      return res.status(400).send({message: "No valid id or name received"});
    }
  } catch (err) {
    return handleError(res, err);
  }
}

export async function deleteReply(req: Request, res: Response) {
  try {
    if ("id" in req.params && !isNaN(parseInt(req.params.id))) {
      await processQuery(
          pool,
          "DELETE FROM replies WHERE id = ?",
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

export async function assignReply(req: Request, res: Response) {
  try {
    if ("questions" in req.query && req.query.questions &&
    "replies" in req.query && req.query.replies) {
      const questions = parseIdString(req.query.questions.toString());
      const replies = parseIdString(req.query.replies.toString());

      if (questions.length >= 1 && replies.length >= 1) {
        const params: number[] = [];
        questions.forEach((q) => {
          replies.forEach((t) => {
            params.push(q, t);
          });
        });

        await processQuery(
            pool,
            `INSERT IGNORE INTO 
            ref_questions_replies (question_id, reply_id) 
          VALUES 
            ${(new Array(questions.length * replies.length))
      .fill(0)
      .map(() => {
        return "(?, ?)";
      }).join(",")}`,
            params
        );

        return res.status(200).send({
          questions,
          replies,
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

export async function revokeReply(req: Request, res: Response) {
  try {
    if ("questions" in req.query && req.query.questions &&
    "replies" in req.query && req.query.replies) {
      const questions = parseIdString(req.query.questions.toString());
      const replies = parseIdString(req.query.replies.toString());

      if (questions.length >= 1 && replies.length >= 1) {
        const params: number[] = [];
        questions.forEach((q) => {
          replies.forEach((t) => {
            params.push(q, t);
          });
        });

        await processQuery(
            pool,
            `DELETE FROM 
            ref_questions_replies
            WHERE 
            ${(new Array(questions.length * replies.length))
      .fill(0)
      .map(() => {
        return " (question_id = ? AND reply_id = ?) ";
      }).join(" OR ")}`,
            params
        );

        return res.status(200).send({
          questions,
          replies,
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
