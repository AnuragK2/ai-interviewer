import "../styles/globals.css";
import { Form } from "./components/Form";
import { Interview } from "./components/Interview";
import { Result } from "./components/Result";
import { useState } from "react";
import { Toaster } from "sonner";
import type { PreInterviewResponse } from "@/lib/types";

export function App() {
  const [page, setPage] = useState<"form" | "loading" | "results" | "error" | "success" | "interview">("form");
  const [profile, setProfile] = useState<PreInterviewResponse | null>(null);

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      {page === "form" && (
        <Form
          onSuccess={(data) => {
            setProfile(data);
            setPage("interview");
          }}
        />
      )}
      {page === "results" && <Result />}
      {page === "interview" && <Interview profile={profile} />}
      <Toaster theme="dark" richColors />
    </div>
  );
}

export default App;
