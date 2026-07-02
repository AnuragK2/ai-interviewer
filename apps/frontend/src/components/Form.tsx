import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { useState, useEffect } from "react";
import {toast} from "sonner";
import { BACKEND_URL } from "../lib/config";
import axios from "axios";

export function Form() {
    const [linkedinUrl, setLinkedinUrl] = useState("");
    const [githubUrl, setGithubUrl] = useState("");

    // useEffect(() => {
    //     const linkedinUrl = localStorage.getItem("linkedinUrl");
    //     const githubUrl = localStorage.getItem("githubUrl");
    //     if (linkedinUrl) {
    //         setLinkedinUrl(linkedinUrl);
    //     }
    // }, []);

    // useEffect(() => {
    //     localStorage.setItem("linkedinUrl", linkedinUrl);
    //     localStorage.setItem("githubUrl", githubUrl);
    // }, [linkedinUrl, githubUrl]);

    async function onSubmit() {
        if (!linkedinUrl || !githubUrl) {
            toast.error("Please enter both LinkedIn and GitHub URLs");
            return;
        }

        try {
            await axios.post(`${BACKEND_URL}/api/v1/pre-interview`, { linkedinUrl, githubUrl });
            toast.success("Interview started");
        } catch {
            toast.error("Could not reach the server. Is the backend running on port 3001?");
        }
    }

    return (
        <div className="h-screen w-screen flex justify-center items-center">
      <div>
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">AI Interview Kickstart</h2>
        <div className="p-4">
          <Input  placeholder="LinkedIn Profile URL" onChange={(e) => setLinkedinUrl(e.target.value)}/>
        </div>
        <div className="p-4">
            <Input  placeholder="GitHub Profile URL" onChange={(e) => setGithubUrl(e.target.value)}/>
        </div>
        <div className="flex justify-center p-4">
            <Button onClick={onSubmit}>Start Interview</Button>
        </div>
    </div>
    </div>
    )
}

export default Form;