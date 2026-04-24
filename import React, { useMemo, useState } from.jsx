import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  AlertTriangle,
  Database,
  Search,
  Filter,
  FileText,
  Activity,
  ChevronRight,
  Clock3,
  Globe,
  Lock,
  CheckCircle2,
  XCircle,
  BarChart3,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const mockSources = [
  {
    id: "DOC-1001",
    title: "Hospital Safety Procedure v4",
    sourceType: "Policy Document",
    sourceName: "Internal Knowledge Base",
    origin: "Verified Enterprise Repository",
    lastUpdated: "2026-03-08 10:24",
    region: "AU",
    provenanceScore: 92,
    integrityScore: 95,
    freshnessScore: 87,
    fidelityScore: 91,
    riskLevel: "Low",
    status: "Approved",
    tags: ["medical", "policy", "verified"],
    notes:
      "Source matches approved repository metadata and passed checksum validation.",
  },
  {
    id: "DOC-1002",
    title: "Freight Delay Update Summary",
    sourceType: "External Feed",
    sourceName: "Third-Party Logistics Feed",
    origin: "Partner API",
    lastUpdated: "2026-03-09 07:10",
    region: "SG",
    provenanceScore: 74,
    integrityScore: 80,
    freshnessScore: 90,
    fidelityScore: 78,
    riskLevel: "Medium",
    status: "Review",
    tags: ["logistics", "api", "external"],
    notes:
      "Data is recent, but provenance chain is incomplete because one upstream transformation step is undocumented.",
  },
  {
    id: "DOC-1003",
    title: "Legal Clause Interpretation Notes",
    sourceType: "User Upload",
    sourceName: "Manual Upload",
    origin: "Unverified User Submission",
    lastUpdated: "2026-03-03 16:41",
    region: "US",
    provenanceScore: 43,
    integrityScore: 55,
    freshnessScore: 61,
    fidelityScore: 49,
    riskLevel: "High",
    status: "Rejected",
    tags: ["legal", "uploaded", "unverified"],
    notes:
      "No reliable provenance metadata found. Several quoted references could not be verified automatically.",
  },
  {
    id: "DOC-1004",
    title: "Clinical Trial Findings Snapshot",
    sourceType: "Research Paper",
    sourceName: "Indexed Research Archive",
    origin: "Peer-Reviewed Journal",
    lastUpdated: "2026-02-28 12:02",
    region: "EU",
    provenanceScore: 89,
    integrityScore: 90,
    freshnessScore: 68,
    fidelityScore: 85,
    riskLevel: "Low",
    status: "Approved",
    tags: ["research", "healthcare", "peer-reviewed"],
    notes:
      "Highly credible source, though freshness score is slightly reduced due to publication age.",
  },
  {
    id: "DOC-1005",
    title: "Anonymous Market Rumour Thread",
    sourceType: "Forum Post",
    sourceName: "Public Forum",
    origin: "Unknown",
    lastUpdated: "2026-03-09 22:13",
    region: "Global",
    provenanceScore: 21,
    integrityScore: 33,
    freshnessScore: 94,
    fidelityScore: 28,
    riskLevel: "Critical",
    status: "Rejected",
    tags: ["rumour", "social", "unverified"],
    notes:
      "Fresh but highly unreliable. Source identity and evidence chain are missing.",
  },
  {
    id: "DOC-1006",
    title: "Supplier Compliance Audit Results",
    sourceType: "Audit Report",
    sourceName: "Governance Portal",
    origin: "Certified Auditor",
    lastUpdated: "2026-03-01 09:05",
    region: "AU",
    provenanceScore: 84,
    integrityScore: 88,
    freshnessScore: 72,
    fidelityScore: 83,
    riskLevel: "Low",
    status: "Approved",
    tags: ["audit", "compliance", "governance"],
    notes:
      "Trusted governance source with good metadata completeness and strong evidence trail.",
  },
];

const scoreBreakdown = [
  { name: "Provenance", value: 81 },
  { name: "Integrity", value: 86 },
  { name: "Freshness", value: 79 },
  { name: "Fidelity", value: 76 },
];

const riskData = [
  { name: "Low", value: 3, color: "#22c55e" },
  { name: "Medium", value: 1, color: "#f59e0b" },
  { name: "High", value: 1, color: "#ef4444" },
  { name: "Critical", value: 1, color: "#7f1d1d" },
];

const pipelineSteps = [
  {
    title: "Source Ingestion",
    description: "Collect documents, APIs, and uploaded files.",
    icon: Database,
  },
  {
    title: "Integrity Validation",
    description: "Check metadata consistency, signatures, and evidence chains.",
    icon: ShieldCheck,
  },
  {
    title: "Trust Scoring",
    description: "Compute provenance, integrity, freshness, and fidelity metrics.",
    icon: Activity,
  },
  {
    title: "AI Gateway Decision",
    description: "Approve, flag for review, or reject before LLM usage.",
    icon: CheckCircle2,
  },
];

function scoreColor(score) {
  if (score >= 85) return "text-emerald-600";
  if (score >= 65) return "text-amber-600";
  return "text-red-600";
}

function badgeClasses(level) {
  switch (level) {
    case "Low":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "Medium":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "High":
      return "bg-red-100 text-red-700 border-red-200";
    case "Critical":
      return "bg-red-900 text-white border-red-900";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function statusClasses(status) {
  switch (status) {
    case "Approved":
      return "bg-emerald-100 text-emerald-700";
    case "Review":
      return "bg-amber-100 text-amber-700";
    case "Rejected":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function MetricCard({ title, value, hint, icon: Icon }) {
  return (
    <Card className="rounded-2xl border-slate-200 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-500">{title}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
            <p className="mt-1 text-sm text-slate-500">{hint}</p>
          </div>
          <div className="rounded-2xl bg-slate-100 p-3">
            <Icon className="h-5 w-5 text-slate-700" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DetailRow({ label, value, icon: Icon }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3">
      <div className="flex items-center gap-3 text-slate-600">
        {Icon ? <Icon className="h-4 w-4" /> : null}
        <span className="text-sm">{label}</span>
      </div>
      <span className="text-sm font-medium text-slate-900">{value}</span>
    </div>
  );
}

export default function App() {
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(mockSources[0].id);
  const [validationMode, setValidationMode] = useState("url");
  const [inputValue, setInputValue] = useState("");
  const [validationResult, setValidationResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleRunValidation = () => {
    setIsRunning(true);

    window.setTimeout(() => {
      const suspiciousTerms = ["anonymous", "forum", "rumour", "unverified", "random"];
      const lower = inputValue.toLowerCase();
      const suspiciousHits = suspiciousTerms.filter((term) => lower.includes(term)).length;

      const provenance = Math.max(20, 88 - suspiciousHits * 18 - (validationMode === "file" ? 4 : 0));
      const integrity = Math.max(25, 90 - suspiciousHits * 15);
      const freshness = validationMode === "url" ? 84 : 76;
      const fidelity = Math.round((provenance + integrity + freshness) / 3);

      let decision = "Approved";
      let risk = "Low";
      let summary = "The source appears suitable for downstream AI usage with low validation risk.";

      if (fidelity < 80) {
        decision = "Review";
        risk = "Medium";
        summary = "The source can be used only after manual review because some provenance evidence is incomplete.";
      }

      if (fidelity < 60) {
        decision = "Rejected";
        risk = "High";
        summary = "The source should be blocked from the AI pipeline because provenance and integrity signals are too weak.";
      }

      setValidationResult({
        sourceLabel: inputValue || "Demo Input",
        mode: validationMode,
        provenance,
        integrity,
        freshness,
        fidelity,
        decision,
        risk,
        summary,
      });
      setIsRunning(false);
    }, 1100);
  };

  const filteredSources = useMemo(() => {
    return mockSources.filter((item) => {
      const query = search.toLowerCase();
      const matchesSearch =
        item.title.toLowerCase().includes(query) ||
        item.id.toLowerCase().includes(query) ||
        item.sourceName.toLowerCase().includes(query) ||
        item.tags.join(" ").toLowerCase().includes(query);

      const matchesRisk = riskFilter === "all" ? true : item.riskLevel.toLowerCase() === riskFilter;
      return matchesSearch && matchesRisk;
    });
  }, [search, riskFilter]);

  const selectedSource =
    filteredSources.find((item) => item.id === selectedId) || filteredSources[0] || mockSources[0];

  const approvedCount = mockSources.filter((s) => s.status === "Approved").length;
  const flaggedCount = mockSources.filter((s) => s.status === "Review").length;
  const rejectedCount = mockSources.filter((s) => s.status === "Rejected").length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-6"
        >
          <div className="overflow-hidden rounded-[28px] bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900 p-6 text-white shadow-lg">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-3xl">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-slate-100">
                  <ShieldCheck className="h-4 w-4" />
                  PA-DFI Gateway Frontend Demo
                </div>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  Provenance-Aware Data Fidelity &amp; Integrity Dashboard
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200 sm:text-base">
                  Frontend-only prototype for monitoring source provenance, integrity, freshness,
                  and fidelity before external data is passed into an AI or RAG pipeline.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                  <p className="text-xs text-slate-200">Sources Scanned</p>
                  <p className="mt-1 text-2xl font-semibold">{mockSources.length}</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                  <p className="text-xs text-slate-200">Approved</p>
                  <p className="mt-1 text-2xl font-semibold">{approvedCount}</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                  <p className="text-xs text-slate-200">Flagged</p>
                  <p className="mt-1 text-2xl font-semibold">{flaggedCount}</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                  <p className="text-xs text-slate-200">Rejected</p>
                  <p className="mt-1 text-2xl font-semibold">{rejectedCount}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Average Fidelity Score"
            value="76%"
            hint="Across current sample batch"
            icon={BarChart3}
          />
          <MetricCard
            title="Integrity Alerts"
            value="04"
            hint="Requiring manual review"
            icon={AlertTriangle}
          />
          <MetricCard
            title="Active Data Sources"
            value="12"
            hint="Connected ingestion channels"
            icon={Database}
          />
          <MetricCard
            title="Last Pipeline Refresh"
            value="2m ago"
            hint="Latest scoring cycle"
            icon={RefreshCw}
          />
        </div>

        <div className="mb-6 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Validation Input Module</CardTitle>
              <p className="text-sm text-slate-500">
                Simulate how the PA-DFI Gateway receives a source, validates it, and decides
                whether it can enter the AI pipeline.
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  variant={validationMode === "url" ? "default" : "outline"}
                  className="justify-start rounded-xl"
                  onClick={() => setValidationMode("url")}
                >
                  <Globe className="mr-2 h-4 w-4" />
                  Validate URL / API Source
                </Button>
                <Button
                  variant={validationMode === "file" ? "default" : "outline"}
                  className="justify-start rounded-xl"
                  onClick={() => setValidationMode("file")}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Validate Uploaded File
                </Button>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="mb-2 text-sm font-medium text-slate-700">
                  {validationMode === "url"
                    ? "Enter source URL or endpoint"
                    : "Enter uploaded filename or source description"}
                </p>
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={
                    validationMode === "url"
                      ? "Example: https://trusted-research.org/report/2026"
                      : "Example: clinical_report_v2.pdf"
                  }
                  className="rounded-xl bg-white"
                />
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  Demo tip: try words like <span className="font-medium">anonymous</span>,{" "}
                  <span className="font-medium">forum</span>, or{" "}
                  <span className="font-medium">unverified</span> to simulate risky inputs.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="text-xs text-slate-500">Step 1</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">Ingest Source</p>
                </div>
                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="text-xs text-slate-500">Step 2</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">Check Metadata</p>
                </div>
                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="text-xs text-slate-500">Step 3</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">Compute Scores</p>
                </div>
                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="text-xs text-slate-500">Step 4</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">Gateway Decision</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handleRunValidation}
                  className="rounded-xl"
                  disabled={isRunning || !inputValue.trim()}
                >
                  {isRunning ? "Validating..." : "Run Validation"}
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => {
                    setInputValue("");
                    setValidationResult(null);
                    setIsRunning(false);
                  }}
                >
                  Reset
                </Button>
              </div>

              {isRunning ? (
                <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-indigo-700">Validation pipeline running</span>
                    <span className="font-medium text-indigo-700">Processing...</span>
                  </div>
                  <Progress value={68} className="h-3" />
                  <p className="mt-3 text-sm text-indigo-700">
                    Checking provenance chain, metadata completeness, and source reliability
                    before AI access.
                  </p>
                </div>
              ) : null}

              {validationResult ? (
                <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">
                      {validationResult.mode === "url" ? "URL Source" : "Uploaded File"}
                    </Badge>
                    <Badge
                      className={statusClasses(
                        validationResult.decision === "Approved"
                          ? "Approved"
                          : validationResult.decision === "Review"
                            ? "Review"
                            : "Rejected",
                      )}
                    >
                      {validationResult.decision}
                    </Badge>
                    <Badge variant="outline" className={badgeClasses(validationResult.risk)}>
                      {validationResult.risk} Risk
                    </Badge>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">Validated Input</p>
                    <p className="mt-1 break-all text-sm font-medium text-slate-900">
                      {validationResult.sourceLabel}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-xl border border-slate-200 p-3">
                      <p className="text-xs text-slate-500">Provenance</p>
                      <p
                        className={`mt-1 text-2xl font-semibold ${scoreColor(
                          validationResult.provenance,
                        )}`}
                      >
                        {validationResult.provenance}%
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-3">
                      <p className="text-xs text-slate-500">Integrity</p>
                      <p
                        className={`mt-1 text-2xl font-semibold ${scoreColor(
                          validationResult.integrity,
                        )}`}
                      >
                        {validationResult.integrity}%
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-3">
                      <p className="text-xs text-slate-500">Freshness</p>
                      <p
                        className={`mt-1 text-2xl font-semibold ${scoreColor(
                          validationResult.freshness,
                        )}`}
                      >
                        {validationResult.freshness}%
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-3">
                      <p className="text-xs text-slate-500">Fidelity</p>
                      <p
                        className={`mt-1 text-2xl font-semibold ${scoreColor(
                          validationResult.fidelity,
                        )}`}
                      >
                        {validationResult.fidelity}%
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">
                      Gateway Decision Summary
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {validationResult.summary}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      This decision determines whether the source can be passed into the
                      downstream AI or RAG system.
                    </p>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <Card className="rounded-2xl border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Validation Pipeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {pipelineSteps.map((step, index) => {
                    const Icon = step.icon;
                    return (
                      <div
                        key={step.title}
                        className="relative rounded-2xl border border-slate-200 bg-white p-4"
                      >
                        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100">
                          <Icon className="h-5 w-5 text-slate-700" />
                        </div>
                        <p className="text-sm font-semibold text-slate-900">{step.title}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          {step.description}
                        </p>
                        {index !== pipelineSteps.length - 1 ? (
                          <ChevronRight className="absolute -right-2 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-slate-300 xl:block" />
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Score Distribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {scoreBreakdown.map((item) => (
                  <div key={item.name}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-slate-600">{item.name}</span>
                      <span className={`font-semibold ${scoreColor(item.value)}`}>
                        {item.value}%
                      </span>
                    </div>
                    <Progress value={item.value} className="h-3" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mb-6 grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-lg">Source Registry</CardTitle>
                <p className="mt-1 text-sm text-slate-500">
                  Browse documents and data items currently evaluated by the gateway.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative min-w-[240px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search ID, source, title, tag..."
                    className="pl-9"
                  />
                </div>
                <div className="min-w-[170px]">
                  <Select value={riskFilter} onValueChange={setRiskFilter}>
                    <SelectTrigger>
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-slate-500" />
                        <SelectValue placeholder="Filter risk" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All risk levels</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Fidelity</TableHead>
                      <TableHead>Risk</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSources.map((item) => (
                      <TableRow
                        key={item.id}
                        onClick={() => setSelectedId(item.id)}
                        className={`cursor-pointer transition-colors hover:bg-slate-50 ${
                          selectedSource?.id === item.id ? "bg-slate-50" : ""
                        }`}
                      >
                        <TableCell className="font-medium">{item.id}</TableCell>
                        <TableCell className="max-w-[250px] truncate">{item.title}</TableCell>
                        <TableCell>{item.sourceType}</TableCell>
                        <TableCell>
                          <span className={`font-semibold ${scoreColor(item.fidelityScore)}`}>
                            {item.fidelityScore}%
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={badgeClasses(item.riskLevel)}>
                            {item.riskLevel}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusClasses(item.status)}>{item.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Risk Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                    >
                      {riskData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {riskData.map((item) => (
                  <div key={item.name} className="rounded-xl border border-slate-200 p-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-slate-600">{item.name}</span>
                    </div>
                    <p className="mt-2 text-xl font-semibold text-slate-900">{item.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Selected Source Detail</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{selectedSource.id}</Badge>
                  <Badge className={statusClasses(selectedSource.status)}>
                    {selectedSource.status}
                  </Badge>
                  <Badge variant="outline" className={badgeClasses(selectedSource.riskLevel)}>
                    {selectedSource.riskLevel} Risk
                  </Badge>
                </div>
                <h3 className="text-xl font-semibold text-slate-900">{selectedSource.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{selectedSource.notes}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedSource.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-700"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid gap-3">
                <DetailRow label="Source Name" value={selectedSource.sourceName} icon={FileText} />
                <DetailRow label="Origin" value={selectedSource.origin} icon={Globe} />
                <DetailRow label="Last Updated" value={selectedSource.lastUpdated} icon={Clock3} />
                <DetailRow label="Region" value={selectedSource.region} icon={Globe} />
                <DetailRow label="Security State" value="Metadata encrypted at rest" icon={Lock} />
              </div>

              <div className="space-y-4 rounded-2xl border border-slate-200 p-4">
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span>Provenance Score</span>
                    <span className={`font-semibold ${scoreColor(selectedSource.provenanceScore)}`}>
                      {selectedSource.provenanceScore}%
                    </span>
                  </div>
                  <Progress value={selectedSource.provenanceScore} className="h-3" />
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span>Integrity Score</span>
                    <span className={`font-semibold ${scoreColor(selectedSource.integrityScore)}`}>
                      {selectedSource.integrityScore}%
                    </span>
                  </div>
                  <Progress value={selectedSource.integrityScore} className="h-3" />
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span>Freshness Score</span>
                    <span className={`font-semibold ${scoreColor(selectedSource.freshnessScore)}`}>
                      {selectedSource.freshnessScore}%
                    </span>
                  </div>
                  <Progress value={selectedSource.freshnessScore} className="h-3" />
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span>Fidelity Score</span>
                    <span className={`font-semibold ${scoreColor(selectedSource.fidelityScore)}`}>
                      {selectedSource.fidelityScore}%
                    </span>
                  </div>
                  <Progress value={selectedSource.fidelityScore} className="h-3" />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <Card className="rounded-2xl border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Gateway Decision Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={scoreBreakdown}>
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Recommended Action</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    </div>
                    <p className="font-semibold text-emerald-800">Approve</p>
                    <p className="mt-1 text-sm leading-6 text-emerald-700">
                      Use trusted content directly in the AI retrieval stage.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white">
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                    </div>
                    <p className="font-semibold text-amber-800">Manual Review</p>
                    <p className="mt-1 text-sm leading-6 text-amber-700">
                      Human validation required before the source enters production.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white">
                      <XCircle className="h-5 w-5 text-red-600" />
                    </div>
                    <p className="font-semibold text-red-800">Reject</p>
                    <p className="mt-1 text-sm leading-6 text-red-700">
                      Block unreliable or poisoned data from reaching the model.
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Button className="rounded-xl">Run Validation</Button>
                  <Button variant="outline" className="rounded-xl">
                    Export Report
                  </Button>
                  <Button variant="secondary" className="rounded-xl">
                    Send for Review
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
