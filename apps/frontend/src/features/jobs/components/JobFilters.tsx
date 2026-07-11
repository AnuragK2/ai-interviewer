import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  defaultJobListFilters,
  hasActiveJobFilters,
  type JobListFilters,
  type WorkStyleFilter,
} from "../lib/job-filters";

type JobFiltersProps = {
  filters: JobListFilters;
  onChange: (filters: JobListFilters) => void;
  locations: string[];
  skills: string[];
};

export function JobFilters({ filters, onChange, locations, skills }: JobFiltersProps) {
  function update<K extends keyof JobListFilters>(key: K, value: JobListFilters[K]) {
    onChange({ ...filters, [key]: value });
  }

  function toggleSkill(skill: string) {
    const next = filters.skills.includes(skill)
      ? filters.skills.filter((item) => item !== skill)
      : [...filters.skills, skill];
    update("skills", next);
  }

  return (
    <div className="space-y-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Filters</p>
          <p className="text-xs text-muted-foreground">Search by role, location, skills, and work style.</p>
        </div>
        {hasActiveJobFilters(filters) ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => onChange(defaultJobListFilters)}
          >
            Clear filters
          </Button>
        ) : null}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="job-role-filter">Job role</Label>
          <Input
            id="job-role-filter"
            value={filters.role}
            onChange={(event) => update("role", event.target.value)}
            placeholder="e.g. Frontend Engineer"
            className="border-white/10 bg-white/5"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="job-location-filter">Location</Label>
          <div className="flex gap-2">
            <Select
              value={filters.location || "ALL"}
              onValueChange={(value) => update("location", value === "ALL" ? "" : value)}
            >
              <SelectTrigger id="job-location-filter" className="w-full border-white/10 bg-white/5">
                <SelectValue placeholder="All locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All locations</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Input
            value={filters.location}
            onChange={(event) => update("location", event.target.value)}
            placeholder="Or type a city or region"
            className="border-white/10 bg-white/5"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="job-work-style-filter">Work style</Label>
          <Select
            value={filters.workStyle}
            onValueChange={(value) => update("workStyle", value as WorkStyleFilter)}
          >
            <SelectTrigger id="job-work-style-filter" className="w-full border-white/10 bg-white/5">
              <SelectValue placeholder="All work styles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All work styles</SelectItem>
              <SelectItem value="REMOTE">Remote</SelectItem>
              <SelectItem value="HYBRID">Hybrid</SelectItem>
              <SelectItem value="ONSITE">Onsite</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="job-skill-filter">Skills</Label>
          <Input
            id="job-skill-filter"
            value={filters.skills.join(", ")}
            onChange={(event) => {
              const next = event.target.value
                .split(",")
                .map((skill) => skill.trim())
                .filter(Boolean);
              update("skills", next);
            }}
            placeholder="e.g. React, TypeScript"
            className="border-white/10 bg-white/5"
          />
        </div>
      </div>

      {skills.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Popular skills</p>
          <div className="flex flex-wrap gap-2">
            {skills.slice(0, 12).map((skill) => {
              const selected = filters.skills.includes(skill);
              return (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleSkill(skill)}
                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition-colors ${
                    selected
                      ? "border-indigo-500/40 bg-indigo-500/15 text-indigo-100"
                      : "border-white/10 bg-white/5 text-muted-foreground hover:border-white/20 hover:text-foreground"
                  }`}
                >
                  {skill}
                  {selected ? <X className="size-3" /> : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
