"use client";

import { useMemo, useCallback, useRef, useState, useEffect } from "react";
import Image from "next/image";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeProps,
  Handle,
  Position,
  ReactFlowProvider,
  useReactFlow,
  getNodesBounds,
  getViewportForBounds,
  Panel,
} from "@xyflow/react";
import dagre from "@dagrejs/dagre";
import { Avatar } from "@/components/ui/avatar";
import type { DepartmentSalaryAverage, SalaryDisclosureMode } from "@/lib/organization/salary-transparency-shared";
import { getDepartmentAverageForEmployee } from "@/lib/organization/department-salary-averages";
import "@xyflow/react/dist/style.css";

export type OrgEmployee = {
  id: string;
  first_name: string;
  last_name: string;
  current_job_title: string;
  current_department_id: string | null;
  manager_id: string | null;
  avatar_url: string | null;
  annual_salary_brut?: number | null;
};
export type OrgDept = { id: string; name: string };

const DEPT_COLORS = [
  { bg: "rgba(9,82,40,0.12)", border: "#095228", text: "#095228", accent: "#a1b68d" },
  { bg: "rgba(59,130,246,0.12)", border: "#2563eb", text: "#1d4ed8", accent: "#93c5fd" },
  { bg: "rgba(245,158,11,0.14)", border: "#d97706", text: "#b45309", accent: "#fcd34d" },
  { bg: "rgba(139,92,246,0.12)", border: "#7c3aed", text: "#6d28d9", accent: "#c4b5fd" },
  { bg: "rgba(239,68,68,0.12)", border: "#dc2626", text: "#b91c1c", accent: "#fca5a5" },
  { bg: "rgba(16,185,129,0.12)", border: "#059669", text: "#047857", accent: "#6ee7b7" },
  { bg: "rgba(236,72,153,0.12)", border: "#db2777", text: "#be185d", accent: "#f9a8d4" },
  { bg: "rgba(107,114,128,0.12)", border: "#6b7280", text: "#4b5563", accent: "#d1d5db" },
];

export type OrgVisualStyle = "tree" | "flow" | "modern";

const STYLE_OPTIONS: { id: OrgVisualStyle; label: string; hint: string }[] = [
  { id: "tree", label: "Arbre", hint: "Hiérarchie verticale classique" },
  { id: "flow", label: "Horizontal", hint: "Branches latérales, lecture gauche → droite" },
  { id: "modern", label: "Coloré", hint: "Cartes par département, bordures accentuées" },
];

const NODE_WIDTH = 200;
const NODE_HEIGHT = 120;

function OrgNodeCustom({ data }: NodeProps) {
  const d = data as {
    firstName: string;
    lastName: string;
    jobTitle: string;
    avatarUrl: string | null;
    deptName: string | null;
    deptColor: (typeof DEPT_COLORS)[0] | null;
    salaryLabel: string | null;
    salaryVisible: boolean;
    isMe: boolean;
    visualStyle: OrgVisualStyle;
  };

  const dept = d.deptColor;
  const isModern = d.visualStyle === "modern";
  const isFlow = d.visualStyle === "flow";

  const borderStyle = isModern && dept
    ? { borderColor: dept.border, borderWidth: 3, background: dept.bg }
    : isFlow && dept
      ? { borderLeftColor: dept.border, borderLeftWidth: 4, background: "white" }
      : dept
        ? { borderLeftColor: dept.border, borderLeftWidth: 3, background: "white" }
        : undefined;

  const handlePos = isFlow
    ? { target: Position.Left, source: Position.Right }
    : { target: Position.Top, source: Position.Bottom };

  return (
    <>
      <Handle type="target" position={handlePos.target} className="!bg-transparent !border-0 !w-0 !h-0" />
      <div
        className={`flex flex-col items-center rounded-2xl border-2 bg-white px-3 py-3 shadow-sm transition-shadow hover:shadow-lg ${
          d.isMe ? "ring-2 ring-[var(--brand)]/30" : "border-[#e2e7e2]"
        } ${isModern ? "border-[3px]" : ""}`}
        style={{ width: NODE_WIDTH, minHeight: 90, ...borderStyle }}
      >
        {isModern && dept && (
          <span
            className="mb-2 w-full rounded-lg py-1 text-center text-[10px] font-bold uppercase tracking-wide"
            style={{ background: dept.border, color: "#fff" }}
          >
            {d.deptName ?? "—"}
          </span>
        )}
        <Avatar firstName={d.firstName} lastName={d.lastName} avatarUrl={d.avatarUrl} size="lg" />
        <p className={`mt-2 text-center text-sm font-semibold leading-tight ${d.isMe ? "text-[var(--brand)]" : "text-[var(--text)]"}`}>
          {d.firstName} {d.lastName}
          {d.isMe && <span className="ml-1 text-[10px] font-medium text-[var(--brand)]">(vous)</span>}
        </p>
        <p className="mt-0.5 text-center text-[11px] leading-tight text-[color:rgba(11,11,11,0.55)]">
          {d.jobTitle || "\u2014"}
        </p>
        {d.deptName && dept && !isModern && (
          <span
            className="mt-1.5 inline-block rounded-lg px-2.5 py-0.5 text-[10px] font-semibold"
            style={{ background: dept.bg, color: dept.text, border: `1px solid ${dept.border}40` }}
          >
            {d.deptName}
          </span>
        )}
        {d.salaryVisible && d.salaryLabel && (
          <p className="mt-1 text-xs font-semibold" style={{ color: dept?.text ?? "var(--brand)" }}>
            {d.salaryLabel}
          </p>
        )}
      </div>
      <Handle type="source" position={handlePos.source} className="!bg-transparent !border-0 !w-0 !h-0" />
    </>
  );
}

const nodeTypes = { orgNode: OrgNodeCustom };

function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  direction: "TB" | "LR" = "TB",
): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: direction,
    nodesep: direction === "LR" ? 80 : 60,
    ranksep: direction === "LR" ? 120 : 100,
    marginx: 40,
    marginy: 40,
  });

  nodes.forEach((node) => {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });
  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const layoutedNodes = nodes.map((node) => {
    const pos = g.node(node.id);
    return {
      ...node,
      position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
    };
  });

  return { nodes: layoutedNodes, edges };
}

type OrgScope = "full" | "team" | "chain";

function collectSubtreeIds(employees: OrgEmployee[], rootId: string): Set<string> {
  const children = new Map<string, string[]>();
  for (const e of employees) {
    if (!e.manager_id) continue;
    if (!children.has(e.manager_id)) children.set(e.manager_id, []);
    children.get(e.manager_id)!.push(e.id);
  }
  const out = new Set<string>([rootId]);
  const stack = [...(children.get(rootId) ?? [])];
  while (stack.length) {
    const id = stack.pop()!;
    if (out.has(id)) continue;
    out.add(id);
    for (const c of children.get(id) ?? []) stack.push(c);
  }
  return out;
}

function collectChainIds(employees: OrgEmployee[], leafId: string): Set<string> {
  const byId = new Map(employees.map((e) => [e.id, e]));
  const out = new Set<string>();
  let cur: string | null = leafId;
  while (cur) {
    out.add(cur);
    cur = byId.get(cur)?.manager_id ?? null;
  }
  return out;
}

function salaryLabelForNode(
  emp: OrgEmployee,
  salaryVisible: boolean,
  disclosureMode: SalaryDisclosureMode,
  departmentAverages: DepartmentSalaryAverage[],
  currentEmployeeId: string | null,
): string | null {
  if (!salaryVisible) return null;

  if (currentEmployeeId && emp.id === currentEmployeeId) {
    const sal = emp.annual_salary_brut != null ? Number(emp.annual_salary_brut) : null;
    if (sal == null || sal <= 0) return null;
    return `${Math.round(sal).toLocaleString("fr-FR")} €`;
  }

  if (disclosureMode === "exact") {
    const sal = emp.annual_salary_brut != null ? Number(emp.annual_salary_brut) : null;
    if (sal == null || sal <= 0) return null;
    return `${Math.round(sal).toLocaleString("fr-FR")} €`;
  }

  const avg = getDepartmentAverageForEmployee(emp.current_department_id, departmentAverages);
  if (!avg) return null;
  return `${avg.average_annual_brut.toLocaleString("fr-FR")} €`;
}

function OrganigrammeFlowInner({
  employees,
  departments,
  currentEmployeeId = null,
  salaryVisible = false,
  salaryDisclosureMode = "department_average",
  departmentAverages = [],
  companyLogoUrl = null,
}: {
  employees: OrgEmployee[];
  departments: OrgDept[];
  currentEmployeeId?: string | null;
  salaryVisible?: boolean;
  salaryDisclosureMode?: SalaryDisclosureMode;
  departmentAverages?: DepartmentSalaryAverage[];
  companyLogoUrl?: string | null;
}) {
  const { fitView } = useReactFlow();
  const flowRef = useRef<HTMLDivElement>(null);
  const [scope, setScope] = useState<OrgScope>("full");
  const [visualStyle, setVisualStyle] = useState<OrgVisualStyle>("tree");
  const scopeFilterable = !!currentEmployeeId && employees.length > 1;

  const displayEmployees = useMemo(() => {
    if (!scopeFilterable || scope === "full") return employees;
    if (!currentEmployeeId) return employees;
    if (scope === "team") {
      const ids = collectSubtreeIds(employees, currentEmployeeId);
      return employees.filter((e) => ids.has(e.id));
    }
    const ids = collectChainIds(employees, currentEmployeeId);
    return employees.filter((e) => ids.has(e.id));
  }, [employees, scope, currentEmployeeId, scopeFilterable]);

  const deptMap = useMemo(() => new Map(departments.map((d) => [d.id, d.name])), [departments]);
  const deptColorMap = useMemo(() => {
    const map = new Map<string, (typeof DEPT_COLORS)[0]>();
    let idx = 0;
    departments.forEach((d) => {
      map.set(d.id, DEPT_COLORS[idx % DEPT_COLORS.length]);
      idx++;
    });
    return map;
  }, [departments]);

  const { initialNodes, initialEdges } = useMemo(() => {
    const layoutDir: "TB" | "LR" = visualStyle === "flow" ? "LR" : "TB";
    const edgeType = visualStyle === "flow" ? "default" : "smoothstep";

    const nodes: Node[] = displayEmployees.map((emp) => ({
      id: emp.id,
      type: "orgNode",
      position: { x: 0, y: 0 },
      data: {
        firstName: emp.first_name,
        lastName: emp.last_name,
        jobTitle: emp.current_job_title,
        avatarUrl: emp.avatar_url,
        deptName: emp.current_department_id ? deptMap.get(emp.current_department_id) ?? null : null,
        deptColor: emp.current_department_id ? deptColorMap.get(emp.current_department_id) ?? null : null,
        salaryLabel: salaryLabelForNode(emp, salaryVisible, salaryDisclosureMode, departmentAverages, currentEmployeeId),
        salaryVisible,
        isMe: emp.id === currentEmployeeId,
        visualStyle,
      },
    }));

    const employeeIdSet = new Set(displayEmployees.map((e) => e.id));
    const edges: Edge[] = displayEmployees
      .filter((emp) => emp.manager_id && employeeIdSet.has(emp.manager_id))
      .map((emp) => {
        const deptColor = emp.current_department_id ? deptColorMap.get(emp.current_department_id) : null;
        const stroke = visualStyle !== "tree" && deptColor ? deptColor.border : "#CFCFCF";
        return {
          id: `${emp.manager_id}-${emp.id}`,
          source: emp.manager_id!,
          target: emp.id,
          type: edgeType,
          style: { stroke, strokeWidth: visualStyle === "modern" ? 2.5 : 2 },
          animated: visualStyle === "flow",
        };
      });

    const laid = getLayoutedElements(nodes, edges, layoutDir);
    return { initialNodes: laid.nodes, initialEdges: laid.edges };
  }, [displayEmployees, deptMap, deptColorMap, salaryVisible, salaryDisclosureMode, departmentAverages, currentEmployeeId, visualStyle]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    const t = requestAnimationFrame(() => {
      fitView({ padding: 0.15, duration: 350 });
    });
    return () => cancelAnimationFrame(t);
  }, [initialNodes, initialEdges, setNodes, setEdges, fitView]);

  const handleFitView = useCallback(() => fitView({ padding: 0.15, duration: 400 }), [fitView]);

  const handleFocusMe = useCallback(() => {
    if (!currentEmployeeId) return;
    const meNode = nodes.find((n) => n.id === currentEmployeeId);
    if (meNode) {
      fitView({ nodes: [meNode], padding: 0.5, duration: 500 });
    }
  }, [currentEmployeeId, nodes, fitView]);

  const handleExportPng = useCallback(async () => {
    if (!flowRef.current) return;
    const bounds = getNodesBounds(nodes);
    const pad = 120;
    const w = bounds.width + pad * 2;
    const h = bounds.height + pad * 2;
    const vp = getViewportForBounds(bounds, w, h, 0.5, 2, 0.1);

    const { toPng } = await import("html-to-image");
    const flowEl = flowRef.current.querySelector(".react-flow__viewport") as HTMLElement;
    if (!flowEl) return;

    const dataUrl = await toPng(flowEl, {
      width: w,
      height: h,
      style: {
        width: `${w}px`,
        height: `${h}px`,
        transform: `translate(${vp.x}px, ${vp.y}px) scale(${vp.zoom})`,
      },
    });

    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = async () => {
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;

      ctx.fillStyle = "#f8faf8";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0);

      const drawLogo = (src: string, x: number, y: number, maxW: number, maxH: number): Promise<void> =>
        new Promise((resolve) => {
          const logo = new window.Image();
          logo.crossOrigin = "anonymous";
          logo.onload = () => {
            const ratio = Math.min(maxW / logo.width, maxH / logo.height, 1);
            const lw = logo.width * ratio;
            const lh = logo.height * ratio;
            ctx.drawImage(logo, x, y, lw, lh);
            resolve();
          };
          logo.onerror = () => resolve();
          logo.src = src;
        });

      const promises: Promise<void>[] = [];
      if (companyLogoUrl) {
        promises.push(drawLogo(companyLogoUrl, 16, 16, 120, 48));
      }
      promises.push(drawLogo("/brand/logo-dark.png", w - 136, h - 40, 120, 28));

      await Promise.all(promises);

      const link = document.createElement("a");
      link.download = `organigramme-${visualStyle}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = dataUrl;
  }, [nodes, companyLogoUrl, visualStyle]);

  const deptLegend = useMemo(() => {
    const seen = new Set<string>();
    return displayEmployees
      .map((e) => e.current_department_id)
      .filter((id): id is string => !!id && !seen.has(id) && (seen.add(id), true))
      .map((id) => ({
        name: deptMap.get(id) ?? "\u2014",
        color: deptColorMap.get(id) ?? DEPT_COLORS[0],
      }));
  }, [displayEmployees, deptMap, deptColorMap]);

  if (employees.length === 0) {
    return (
      <div className="rounded-3xl border border-[#e2e7e2] bg-white p-12 text-center shadow-[0_24px_60px_rgba(17,27,24,0.06)]">
        <p className="text-[color:rgba(11,11,11,0.65)]">Aucun talent dans l&apos;organisation.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap items-center gap-1 rounded-xl border border-[#e2e7e2] bg-[#f8faf8] p-1">
          <span className="px-2 text-[10px] font-semibold uppercase tracking-wide text-[color:rgba(11,11,11,0.45)]">
            Style
          </span>
          {STYLE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              title={opt.hint}
              onClick={() => setVisualStyle(opt.id)}
              className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                visualStyle === opt.id
                  ? "bg-white text-[var(--brand)] shadow-sm ring-1 ring-[var(--brand)]/20"
                  : "text-[color:rgba(11,11,11,0.65)] hover:bg-white/70"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <button type="button" onClick={handleFitView} className="cursor-pointer rounded-full border border-[#e2e7e2] bg-white px-3 py-1.5 text-xs font-medium text-[var(--text)] transition hover:bg-[#f8faf8]">
          Voir tout
        </button>
        {currentEmployeeId && (
          <button type="button" onClick={handleFocusMe} className="cursor-pointer rounded-full border border-[var(--brand)]/30 bg-[var(--brand)]/5 px-3 py-1.5 text-xs font-medium text-[var(--brand)] transition hover:bg-[var(--brand)]/10">
            Mon poste
          </button>
        )}
        <button type="button" onClick={handleExportPng} className="cursor-pointer rounded-full border border-[#e2e7e2] bg-white px-3 py-1.5 text-xs font-medium text-[var(--text)] transition hover:bg-[#f8faf8]">
          Export PNG
        </button>
        {scopeFilterable && (
          <div className="flex flex-wrap items-center gap-1.5 border-l border-[#e2e7e2] pl-2">
            {(["full", "team", "chain"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setScope(s)}
                className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  scope === s
                    ? "bg-[var(--brand)] text-white"
                    : "border border-[#e2e7e2] bg-white text-[var(--text)] hover:bg-[#f8faf8]"
                }`}
              >
                {s === "full" ? "Toute l’org." : s === "team" ? "Mon équipe" : "Ma chaîne"}
              </button>
            ))}
          </div>
        )}
        <span className="text-xs text-[color:rgba(11,11,11,0.5)]">
          {scopeFilterable && scope !== "full"
            ? `${displayEmployees.length} / ${employees.length} collaborateur${employees.length > 1 ? "s" : ""}`
            : `${employees.length} collaborateur${employees.length > 1 ? "s" : ""}`}
        </span>
      </div>

      {deptLegend.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {deptLegend.map((d) => (
            <span
              key={d.name}
              className="rounded-lg px-2.5 py-1 text-[11px] font-semibold"
              style={{ background: d.color.bg, color: d.color.text, border: `1px solid ${d.color.border}` }}
            >
              {d.name}
            </span>
          ))}
        </div>
      )}

      <div
        ref={flowRef}
        className="rounded-3xl border border-[#e2e7e2] bg-[#f8faf8] shadow-[0_24px_60px_rgba(17,27,24,0.06)]"
        style={{ height: "70vh", minHeight: 400 }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.1}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
        >
          <Background
            gap={visualStyle === "modern" ? 32 : 24}
            size={1}
            color={visualStyle === "modern" ? "rgba(0,0,0,0.03)" : "rgba(0,0,0,0.04)"}
          />
          <Controls showInteractive={false} className="!rounded-xl !border-[#e2e7e2] !shadow-sm" />
          <MiniMap
            nodeStrokeWidth={3}
            pannable
            zoomable
            className="!rounded-xl !border-[#e2e7e2]"
            maskColor="rgba(248,250,248,0.8)"
          />

          {companyLogoUrl && (
            <Panel position="top-left" className="!m-3">
              <div className="relative h-10 w-24 overflow-hidden">
                <Image src={companyLogoUrl} alt="Logo entreprise" fill className="object-contain object-left" unoptimized />
              </div>
            </Panel>
          )}

          <Panel position="bottom-right" className="!m-3">
            <div className="flex items-center gap-1.5 rounded-lg bg-white/80 px-2 py-1 backdrop-blur">
              <Image src="/brand/logo-dark.png" alt="Leaft" width={60} height={20} className="h-4 w-auto opacity-50" unoptimized />
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}

export function OrganigrammeFlow({
  employees,
  departments,
  currentEmployeeId,
  salaryVisible,
  salaryDisclosureMode,
  departmentAverages,
  companyLogoUrl,
}: {
  employees: OrgEmployee[];
  departments: OrgDept[];
  currentEmployeeId?: string | null;
  salaryVisible?: boolean;
  salaryDisclosureMode?: SalaryDisclosureMode;
  departmentAverages?: DepartmentSalaryAverage[];
  companyLogoUrl?: string | null;
}) {
  return (
    <ReactFlowProvider>
      <OrganigrammeFlowInner
        employees={employees}
        departments={departments}
        currentEmployeeId={currentEmployeeId}
        salaryVisible={salaryVisible}
        salaryDisclosureMode={salaryDisclosureMode}
        departmentAverages={departmentAverages}
        companyLogoUrl={companyLogoUrl}
      />
    </ReactFlowProvider>
  );
}
