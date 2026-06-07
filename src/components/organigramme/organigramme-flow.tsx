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
  useInternalNode,
  getStraightPath,
  BaseEdge,
  type Node,
  type Edge,
  type NodeProps,
  type EdgeProps,
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

// Palette pastel moderne — "ring" = anneau autour de l'avatar, "bg" = fond doux de carte,
// "text" = couleur lisible pour les libellés. Le vert Leaft reste la première couleur.
const DEPT_COLORS = [
  { bg: "#eef3ec", ring: "#a1b68d", border: "#cdd9c4", text: "#3f6b4a", pill: "#dde7d6" },
  { bg: "#eaf1f7", ring: "#9ec5e8", border: "#cfe0ef", text: "#3a6b97", pill: "#dbeaf6" },
  { bg: "#fbf2e6", ring: "#ecc79b", border: "#f0ddc2", text: "#9a6b32", pill: "#f6e8d4" },
  { bg: "#f1ecf7", ring: "#c2b0e0", border: "#ddd2ef", text: "#6f4f9e", pill: "#e7def4" },
  { bg: "#fbecef", ring: "#e6a3b6", border: "#f1cdd7", text: "#a9445f", pill: "#f6dde4" },
  { bg: "#e9f5f1", ring: "#94d2bd", border: "#cce9df", text: "#357f68", pill: "#d8ede6" },
  { bg: "#fbeef4", ring: "#eaa7c9", border: "#f3d3e3", text: "#a84a7c", pill: "#f6dfeb" },
  { bg: "#eef0f3", ring: "#bcc4d1", border: "#dbe0e7", text: "#566174", pill: "#e2e6ec" },
];

export type OrgVisualStyle = "radial" | "tree" | "flow";

const STYLE_OPTIONS: { id: OrgVisualStyle; label: string; hint: string }[] = [
  { id: "radial", label: "Rayonnant", hint: "Disposition circulaire autour du dirigeant" },
  { id: "tree", label: "Arbre", hint: "Hiérarchie verticale classique" },
  { id: "flow", label: "Horizontal", hint: "Branches latérales, lecture gauche → droite" },
];

const NODE_WIDTH = 168;
const NODE_HEIGHT = 150;

// Décalage vertical du centre du cercle (avatar) par rapport au haut du node.
// Sert à tracer les liens d'un cercle à l'autre (mode rayonnant).
const circleCenterOffsetY = (isRoot: boolean) => (isRoot ? 6 + 3 + 40 : 4 + 3 + 28);

type OrgNodeData = {
  firstName: string;
  lastName: string;
  jobTitle: string;
  avatarUrl: string | null;
  deptName: string | null;
  deptColor: (typeof DEPT_COLORS)[0] | null;
  salaryLabel: string | null;
  salaryVisible: boolean;
  isMe: boolean;
  isRoot: boolean;
  visualStyle: OrgVisualStyle;
};

function OrgNodeCustom({ data }: NodeProps) {
  const d = data as OrgNodeData;

  const dept = d.deptColor;
  const ring = d.isMe ? "var(--brand)" : dept?.ring ?? "#a1b68d";
  const isFlow = d.visualStyle === "flow";

  const handlePos = isFlow
    ? { target: Position.Left, source: Position.Right }
    : { target: Position.Top, source: Position.Bottom };

  const ringPad = d.isRoot ? 6 : 4;

  return (
    <>
      <Handle type="target" position={handlePos.target} className="!bg-transparent !border-0 !w-0 !h-0 !min-w-0 !min-h-0" />
      <div className="group flex flex-col items-center text-center" style={{ width: NODE_WIDTH }}>
        {/* Avatar entouré d'un anneau pastel (couleur du département) */}
        <span
          className="rounded-full transition-transform duration-200 group-hover:scale-[1.06]"
          style={{
            padding: ringPad,
            background: ring,
            boxShadow: d.isRoot
              ? "0 12px 30px rgba(17,27,24,0.16)"
              : "0 8px 20px rgba(17,27,24,0.10)",
          }}
        >
          <span className="block rounded-full bg-white p-[3px]">
            <Avatar
              firstName={d.firstName}
              lastName={d.lastName}
              avatarUrl={d.avatarUrl}
              size={d.isRoot ? "xl" : "lg"}
            />
          </span>
        </span>

        <div className="mt-2.5 flex flex-col items-center gap-1">
          <p className={`text-[13px] font-semibold leading-tight ${d.isMe ? "text-[var(--brand)]" : "text-[var(--text)]"}`}>
            {d.firstName} {d.lastName}
            {d.isMe && <span className="ml-1 text-[10px] font-medium text-[var(--brand)]">(vous)</span>}
          </p>
          <p className="text-[11px] leading-tight text-[color:rgba(11,11,11,0.5)]">
            {d.jobTitle || "\u2014"}
          </p>

          {d.deptName && dept && (
            <span
              className="mt-0.5 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
              style={{ background: dept.pill, color: dept.text }}
            >
              {d.deptName}
            </span>
          )}
          {d.salaryVisible && d.salaryLabel && (
            <p className="text-[11px] font-bold tabular-nums" style={{ color: dept?.text ?? "var(--brand)" }}>
              {d.salaryLabel}
            </p>
          )}
        </div>
      </div>
      <Handle type="source" position={handlePos.source} className="!bg-transparent !border-0 !w-0 !h-0 !min-w-0 !min-h-0" />
    </>
  );
}

const nodeTypes = { orgNode: OrgNodeCustom };

// Lien droit "flottant" reliant le centre des cercles (mode rayonnant).
function RadialEdge({ id, source, target, style }: EdgeProps) {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);
  if (!sourceNode || !targetNode) return null;

  const sw = sourceNode.measured?.width ?? NODE_WIDTH;
  const tw = targetNode.measured?.width ?? NODE_WIDTH;
  const sIsRoot = (sourceNode.data as OrgNodeData)?.isRoot ?? false;
  const tIsRoot = (targetNode.data as OrgNodeData)?.isRoot ?? false;

  const sourceX = sourceNode.internals.positionAbsolute.x + sw / 2;
  const sourceY = sourceNode.internals.positionAbsolute.y + circleCenterOffsetY(sIsRoot);
  const targetX = targetNode.internals.positionAbsolute.x + tw / 2;
  const targetY = targetNode.internals.positionAbsolute.y + circleCenterOffsetY(tIsRoot);

  const [path] = getStraightPath({ sourceX, sourceY, targetX, targetY });
  return <BaseEdge id={id} path={path} style={style} />;
}

const edgeTypes = { radial: RadialEdge };

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

// Disposition rayonnante (radiale) : le dirigeant au centre, les branches
// rayonnent vers l'extérieur par anneaux successifs. L'angle alloué à chaque
// sous-arbre est proportionnel à son nombre de feuilles → pas de chevauchement.
function getRadialLayout(nodes: Node[], edges: Edge[]): { nodes: Node[]; edges: Edge[] } {
  const childrenMap = new Map<string, string[]>();
  const parentOf = new Map<string, string>();
  nodes.forEach((n) => childrenMap.set(n.id, []));
  edges.forEach((e) => {
    childrenMap.get(e.source)?.push(e.target);
    parentOf.set(e.target, e.source);
  });

  const roots = nodes.filter((n) => !parentOf.has(n.id)).map((n) => n.id);

  const leaves = new Map<string, number>();
  const countLeaves = (id: string): number => {
    const kids = childrenMap.get(id) ?? [];
    if (kids.length === 0) {
      leaves.set(id, 1);
      return 1;
    }
    let sum = 0;
    for (const k of kids) sum += countLeaves(k);
    leaves.set(id, sum);
    return sum;
  };
  roots.forEach(countLeaves);

  const depthOf = new Map<string, number>();
  const angleOf = new Map<string, number>();
  let maxDepth = 0;

  const assign = (id: string, depth: number, start: number, end: number) => {
    depthOf.set(id, depth);
    angleOf.set(id, (start + end) / 2);
    if (depth > maxDepth) maxDepth = depth;
    const kids = childrenMap.get(id) ?? [];
    const total = leaves.get(id) ?? 1;
    let a = start;
    for (const k of kids) {
      const span = (end - start) * ((leaves.get(k) ?? 1) / total);
      assign(k, depth + 1, a, a + span);
      a += span;
    }
  };

  const totalLeaves = roots.reduce((s, r) => s + (leaves.get(r) ?? 1), 0) || 1;
  if (roots.length === 1) {
    assign(roots[0], 0, 0, Math.PI * 2);
  } else {
    let a = 0;
    for (const r of roots) {
      const span = Math.PI * 2 * ((leaves.get(r) ?? 1) / totalLeaves);
      assign(r, 1, a, a + span);
      a += span;
    }
  }

  // Rayon entre anneaux : assez grand pour que l'anneau extérieur accueille
  // toutes les feuilles sans collision.
  const ringGap = Math.max(280, (totalLeaves * 150) / (2 * Math.PI * Math.max(1, maxDepth)));

  const layoutedNodes = nodes.map((node) => {
    const depth = depthOf.get(node.id) ?? 0;
    const angle = angleOf.get(node.id) ?? 0;
    const r = depth * ringGap;
    return {
      ...node,
      position: {
        x: r * Math.cos(angle) - NODE_WIDTH / 2,
        y: r * Math.sin(angle) - circleCenterOffsetY((node.data as OrgNodeData)?.isRoot ?? false),
      },
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
  const [visualStyle, setVisualStyle] = useState<OrgVisualStyle>("radial");
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
    const employeeIdSet = new Set(displayEmployees.map((e) => e.id));
    const edgeType = visualStyle === "radial" ? "radial" : visualStyle === "flow" ? "default" : "smoothstep";

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
        isRoot: !emp.manager_id || !employeeIdSet.has(emp.manager_id),
        visualStyle,
      },
    }));

    const edges: Edge[] = displayEmployees
      .filter((emp) => emp.manager_id && employeeIdSet.has(emp.manager_id))
      .map((emp) => {
        const deptColor = emp.current_department_id ? deptColorMap.get(emp.current_department_id) : null;
        const stroke = deptColor ? deptColor.ring : "#cdd5c8";
        return {
          id: `${emp.manager_id}-${emp.id}`,
          source: emp.manager_id!,
          target: emp.id,
          type: edgeType,
          style: { stroke, strokeWidth: 2 },
          animated: visualStyle === "flow",
        };
      });

    const laid =
      visualStyle === "radial"
        ? getRadialLayout(nodes, edges)
        : getLayoutedElements(nodes, edges, visualStyle === "flow" ? "LR" : "TB");
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

      ctx.fillStyle = "#f7faf6";
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
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold"
              style={{ background: d.color.pill, color: d.color.text }}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color.ring }} />
              {d.name}
            </span>
          ))}
        </div>
      )}

      <div
        ref={flowRef}
        className="overflow-hidden rounded-3xl border border-[#e8ebe6] bg-gradient-to-br from-[#fbfcfa] via-[#f7faf6] to-[#f3f6f1] shadow-[0_24px_60px_rgba(17,27,24,0.06)]"
        style={{ height: "70vh", minHeight: 400 }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.1}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
        >
          <Background gap={28} size={1} color="rgba(0,0,0,0.035)" />
          <Controls showInteractive={false} className="!rounded-xl !border-[#e2e7e2] !shadow-sm" />
          <MiniMap
            nodeStrokeWidth={3}
            pannable
            zoomable
            className="!rounded-xl !border-[#e2e7e2]"
            maskColor="rgba(247,250,246,0.85)"
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
