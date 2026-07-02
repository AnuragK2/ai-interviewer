import "../styles/globals.css";
import { Form } from "./components/Form";
import { Interview } from "./components/Interview";
import { Result } from "./components/Result";
import { useState } from "react";
import { Toaster } from "sonner";

export function App() {
  const [page, setPage] = useState<"form" | "loading" | "results" | "error" | "success" | "interview">("form");

  return (
    <> 
    {page === "form" && <Form />}
    {page === "results" && <Result />}
    {page === "interview" && <Interview />}
    {/* {page === "loading" && <div>Loading...</div>}
    {page === "error" && <div>Error</div>}
    {page === "success" && <div>Success</div>} */}
    <Toaster />
    </>
  );
}

export default App;
