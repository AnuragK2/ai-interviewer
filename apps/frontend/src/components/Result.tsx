import { PageShell } from "./PageShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Trophy } from "lucide-react";

export function Result() {
  return (
    <PageShell>
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-md border-border/60 bg-card/70 backdrop-blur-xl">
          <CardHeader className="border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-teal-500/25 bg-teal-500/10">
                <Trophy className="h-5 w-5 text-amber-300" />
              </div>
              <div>
                <CardTitle>Interview results</CardTitle>
                <CardDescription>Your performance summary will show up here.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Complete an interview session to see your results.</p>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

export default Result;
