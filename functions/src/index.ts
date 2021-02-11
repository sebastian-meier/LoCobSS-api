import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as express from "express";
import * as cors from "cors";
import * as bodyParser from "body-parser";
import {routesConfig as userConfig} from "./users/routes-config";
import {routesConfig as questionConfig} from "./questions/routes-config";

admin.initializeApp();

const app = express();
app.use(bodyParser.json());
app.use(cors({origin: true}));

userConfig(app);
questionConfig(app);

export const api = functions
    .region("europe-west3")
    .https.onRequest(app);
