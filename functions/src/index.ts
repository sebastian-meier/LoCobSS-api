import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as express from "express";
import * as compression from "compression";
import * as cors from "cors";
import {json as bpJson} from "body-parser";
import {routesConfig as userConfig} from "./users/routes-config";
import {routesConfig as taxonomyConfig} from "./taxonomies/routes-config";
import {routesConfig as questionConfig} from "./questions/routes-config";
import {routesConfig as replyConfig} from "./replies/routes-config";

admin.initializeApp();

const app = express();
app.use(cors()); // {origin: true}
app.use(bpJson());
app.use(compression());

userConfig(app);
questionConfig(app);
taxonomyConfig(app);
replyConfig(app);

export const api = functions
    .region("europe-west3")
    .https.onRequest(app);
