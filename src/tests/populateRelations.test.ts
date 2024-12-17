import { describe, it, expect, beforeAll } from "vitest";
import PouchDB from "pouchdb-core";
import "pouchdb-adapter-memory";
import { UserModel } from "../models/user.model";
import { PostModel } from "../models/PostModel";
import { TagModel } from "../models/TagModel";

// Configuración inicial
PouchDB.plugin(require("pouchdb-adapter-memory"));

describe("Relaciones 1:1, 1:N y N:N", () => {
    let db: PouchDB.Database;

    beforeAll(async () => {
        db = new PouchDB("test_db");
        UserModel.setDatabase(db);
        PostModel.setDatabase(db);
        TagModel.setDatabase(db);
    });

    it("Debería resolver una relación 1:1 (User -> Post)", async () => {
        const user = await UserModel.save({ name: "John Doe" });
        const post = await PostModel.save({ title: "Primer Post", author: user._id });

        const populatedPost = await PostModel.populate(post);

        expect(populatedPost.author).toHaveProperty("name", "John Doe");
    });

    it("Debería resolver una relación 1:N (User -> Posts)", async () => {
        const user = await UserModel.save({ name: "John Doe", posts: [] });

        const post1 = await PostModel.save({ title: "Post 1", author: user._id });
        const post2 = await PostModel.save({ title: "Post 2", author: user._id });

        user.posts = [post1._id, post2._id];
        await UserModel.save(user);

        const populatedUser = await UserModel.populate(user);

        expect(populatedUser.posts).toHaveLength(2);
        expect(populatedUser.posts[0]).toHaveProperty("title", "Post 1");
        expect(populatedUser.posts[1]).toHaveProperty("title", "Post 2");
    });

    it("Debería resolver una relación N:N (Post -> Tags)", async () => {
        const tag1 = await TagModel.save({ name: "JavaScript" });
        const tag2 = await TagModel.save({ name: "Node.js" });

        const post = await PostModel.save({
            title: "Aprendiendo Node.js",
            tags: [tag1._id, tag2._id],
        });

        const populatedPost = await PostModel.populate(post);

        expect(populatedPost.tags).toHaveLength(2);
        expect(populatedPost.tags[0]).toHaveProperty("name", "JavaScript");
        expect(populatedPost.tags[1]).toHaveProperty("name", "Node.js");
    });
});