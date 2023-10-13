import express from "express";
import db from "../db/conn.mjs";
import { ObjectId } from "mongodb";

const router = express.Router();

router.get("/", async(req, res) => {
    let collection = await db.collection("posts");
    let results = await collection.find({}).limit(10).toArray();

    res.send(results).status(200);
})

export default router;