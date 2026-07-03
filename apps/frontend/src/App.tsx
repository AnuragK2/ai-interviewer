import "../styles/globals.css";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { Toaster } from "sonner";
import { Form } from "./components/Form";
import { Interview } from "./components/Interview";
import { Result } from "./components/Result";

export function App() {
  return (
    <BrowserRouter>
      <div className="dark min-h-screen bg-background text-foreground">
        <Routes>
          <Route path="/" element={<Form />} />
          <Route path="/interview/:id" element={<Interview />} />
          <Route path="/results/:id" element={<Result />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster theme="dark" richColors />
      </div>
    </BrowserRouter>
  );
}

export default App;
