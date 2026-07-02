import express from "express";
import { preInterviewBody } from "./types";
import axios from "axios";

const app = express();

app.use(express.json());

app.post("/api/v1/pre-interview", async(req, res) => {
    const {success, data, error} = preInterviewBody.safeParse(req.body);
    if(!success){
        return res.status(400).json({ error: error.message });
    }

    //TODO: URL can be malformed, probably use an SLM here
    const githubUrl = data.githubUrl.endsWith("/") ? data.githubUrl.slice(0, -1) : data.githubUrl;
    const linkedinUrl = data.linkedinUrl.endsWith("/") ? data.linkedinUrl.slice(0, -1) : data.linkedinUrl;

    const githubUserName= githubUrl.split("/").pop();
    const linkedinUserName= linkedinUrl.split("/").pop();

    const userRepos = await axios.get(`https://api.github.com/${githubUserName}/repos`);
    const filteredUserRepos=userRepos.data.map((x:any)=>({
      description: x.description,
      name: x.name,
      fullName: x.full_name,
      starCount: x.stargazers_count,
    }));
});

app.listen(process.env.PORT, () => {
    console.log(`Backend running on port ${process.env.PORT}`);
});

