import { MantineProvider, Paper, type MantineThemeOverride } from "@mantine/core";
import Editor from "@monaco-editor/react";
import { defaultMantineRegistry } from "@mdl/mantine";
import { MDLRenderer, type MDLNode } from "@mdl/react";
import { MDLForm, useMDLFormContext } from "@mdl/react/form";
import { parse as parseExpression } from "@mdl/exp";
import { useEffect, useRef, useState } from "react";

interface PlaygroundData {
  firstName: string;
  email: string;
  age: number;
  active: boolean;
  roles: string[];
  status: string;
}

type PlaygroundNode = MDLNode<PlaygroundData, Record<string, unknown>>;
type PlaygroundFileName = "tree.mdl.json" | "environment.json";

const PREVIEW_PARSE_DELAY_MS = 350;

interface PlaygroundEnvironment {
  featureFlags?: Record<string, unknown>;
  form?: {
    defaultValues?: Partial<PlaygroundData>;
  };
  renderer?: {
    readOnly?: boolean;
    onMissing?: "throw" | "null";
  };
  mantineProvider?: {
    defaultColorScheme?: "light" | "dark" | "auto";
    theme?: MantineThemeOverride;
  };
}

const initialDocument = `{
  "kind": "layout",
  "id": "profile-form",
  "layout": "vertical",
  "props": { "gap": "md" },
  "rules": [
    {
      "when": "env.featureFlags.spaciousLayout is true",
      "then": { "props": { "gap": "xl" } }
    }
  ],
  "children": [
    {
      "kind": "layout",
      "id": "identity",
      "layout": "grid",
      "props": { "columns": 2, "gap": "md" },
      "children": [
        {
          "kind": "field",
          "id": "first-name",
          "field": "firstName",
          "type": "string",
          "props": {
            "label": "First name",
            "placeholder": "First name"
          },
          "rules": [
            {
              "when": "value is 'Ada'",
              "then": { "props": { "disabled": true, "description": "Disabled because this field value is Ada." } }
            }
          ]
        },
        {
          "kind": "field",
          "id": "email",
          "field": "email",
          "type": "string",
          "props": {
            "label": "Email address",
            "placeholder": "Email address"
          },
          "rules": [
            {
              "when": "value endsWith '@example.com'",
              "then": { "props": { "description": "Example-domain addresses are allowed in the playground." } }
            }
          ]
        }
      ]
    },
    {
      "kind": "layout",
      "id": "details",
      "layout": "horizontal",
      "props": { "gap": "md", "wrap": true },
      "rules": [
        {
          "when": "age >= 18",
          "then": { "props": { "gap": "xl" } }
        }
      ],
      "children": [
        {
          "kind": "field",
          "id": "age",
          "field": "age",
          "type": "number",
          "props": { "label": "Age", "min": 0 }
        },
        {
          "kind": "field",
          "id": "active",
          "field": "active",
          "type": "boolean",
          "props": { "label": "Active profile" }
        }
      ]
    },
    {
      "kind": "field",
      "id": "roles",
      "field": "roles",
      "type": "one-to-many",
      "props": {
        "label": "Roles",
        "placeholder": "Select roles",
        "options": [
          { "label": "Editor", "value": "editor" },
          { "label": "Reviewer", "value": "reviewer" },
          { "label": "Administrator", "value": "admin" }
        ]
      }
    },
    {
      "kind": "field",
      "id": "status",
      "field": "status",
      "type": "readonly",
      "props": { "size": "sm", "c": "dimmed" },
      "rules": [
        {
          "when": "value contains 'publish' and env.featureFlags.statusColor is true",
          "then": { "props": { "c": "green", "fw": 700 } }
        }
      ]
    }
  ]
}`;

const initialEnvironment = `{
  "featureFlags": {
    "spaciousLayout": true,
    "statusColor": true
  },
  "mantineProvider": {
    "defaultColorScheme": "light",
    "theme": {
      "primaryColor": "lime",
      "defaultRadius": "md"
    }
  },
  "form": {
    "defaultValues": {
      "firstName": "Ada",
      "email": "ada@example.com",
      "age": 36,
      "active": true,
      "roles": ["editor", "reviewer"],
      "status": "Ready to publish"
    }
  },
  "renderer": {
    "readOnly": false,
    "onMissing": "null"
  }
}`;

const initialFiles: Record<PlaygroundFileName, string> = {
  "tree.mdl.json": initialDocument,
  "environment.json": initialEnvironment,
};

function BrandMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 32 32">
      <path d="M7 9.5 16 4l9 5.5v13L16 28l-9-5.5v-13Z" />
      <path d="m11 18 5 3 5-3M16 21v5M11 13l5 3 5-3M11 13v5M21 13v5M16 6v10" />
    </svg>
  );
}

export default function App() {
  const [activeFile, setActiveFile] = useState<PlaygroundFileName>("tree.mdl.json");
  const [files, setFiles] = useState(initialFiles);
  const preview = useStablePreview(files);

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <BrandMark />
          <span>MDL</span>
          <span className="brand-divider" />
          <span className="brand-subtitle">Mantine Playground</span>
        </div>
        <div className="status">
          <span
            className={`status-dot${preview.checking ? " status-dot-loading" : preview.error ? " status-dot-error" : ""}`}
          />
          {preview.checking
            ? "Checking document"
            : preview.error
              ? "Document error"
              : "Renderer live"}
        </div>
      </header>

      <div className="workspace">
        <section className="pane editor-pane" aria-labelledby="editor-heading">
          <div className="pane-header">
            <div>
              <p className="eyebrow">Source</p>
              <h1 id="editor-heading">MDL workspace</h1>
            </div>
            <span className="file-name">{activeFile}</span>
          </div>
          <div className="file-tabs" role="tablist" aria-label="Playground files">
            {(Object.keys(files) as PlaygroundFileName[]).map((fileName) => (
              <button
                aria-selected={activeFile === fileName}
                className={`file-tab${activeFile === fileName ? " file-tab-active" : ""}`}
                key={fileName}
                onClick={() => setActiveFile(fileName)}
                role="tab"
                type="button"
              >
                {fileName}
              </button>
            ))}
          </div>
          <div className="editor-frame">
            <Editor
              defaultLanguage="json"
              height="100%"
              onChange={(value) =>
                setFiles((currentFiles) => ({
                  ...currentFiles,
                  [activeFile]: value ?? "",
                }))
              }
              options={{
                automaticLayout: true,
                fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", monospace',
                fontSize: 14,
                lineHeight: 23,
                minimap: { enabled: false },
                padding: { top: 20, bottom: 20 },
                renderLineHighlight: "line",
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                tabSize: 2,
                wordWrap: "on",
              }}
              path={activeFile}
              theme="vs-dark"
              value={files[activeFile]}
            />
          </div>
        </section>

        <section className="pane preview-pane" aria-labelledby="preview-heading">
          <div className="pane-header">
            <div>
              <p className="eyebrow">Output</p>
              <h2 id="preview-heading">Preview</h2>
            </div>
            <span className="preview-badge">Mantine</span>
          </div>
          <div className="preview-canvas">
            {preview.node && preview.environment ? (
              <>
                <div className="mantine-preview">
                  <MantineProvider
                    defaultColorScheme={
                      preview.environment.mantineProvider?.defaultColorScheme ?? "light"
                    }
                    theme={preview.environment.mantineProvider?.theme}
                  >
                    <Paper p="xl" shadow="md" withBorder>
                      <MDLForm<PlaygroundData>
                        defaultValues={preview.environment.form?.defaultValues}
                      >
                        <PlaygroundMDLRenderer
                          environment={preview.environment}
                          node={preview.node}
                        />
                      </MDLForm>
                    </Paper>
                  </MantineProvider>
                </div>
                {preview.checking ? (
                  <div className="preview-status-card" role="status">
                    <span className="preview-spinner" />
                    Checking changes…
                  </div>
                ) : null}
                {preview.error ? (
                  <div className="preview-error-card" role="alert">
                    <strong>Could not apply latest changes</strong>
                    <span>{preview.error}</span>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="empty-state" role="alert">
                <p className="empty-kicker">Invalid workspace</p>
                <h3>No renderable state yet</h3>
                <p>{preview.error}</p>
              </div>
            )}
            <div className="canvas-meta" aria-hidden="true">
              <span>Live</span>
              <span>Mantine</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

interface PlaygroundPreviewState {
  node?: PlaygroundNode;
  environment?: PlaygroundEnvironment;
  error?: string;
  checking: boolean;
}

function useStablePreview(
  files: Record<PlaygroundFileName, string>,
): PlaygroundPreviewState {
  const hasMounted = useRef(false);
  const [preview, setPreview] = useState<PlaygroundPreviewState>(() => ({
    ...parsePreview(files["tree.mdl.json"], files["environment.json"]),
    checking: false,
  }));

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }

    setPreview((currentPreview) => ({
      ...currentPreview,
      checking: true,
      error: undefined,
    }));

    const timeoutId = window.setTimeout(() => {
      const nextPreview = parsePreview(
        files["tree.mdl.json"],
        files["environment.json"],
      );

      setPreview((currentPreview) => {
        if (nextPreview.node && nextPreview.environment) {
          return { ...nextPreview, checking: false };
        }

        return {
          ...currentPreview,
          checking: false,
          error: nextPreview.error ?? "Unknown preview error.",
        };
      });
    }, PREVIEW_PARSE_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [files]);

  return preview;
}

interface PlaygroundMDLRendererProps {
  environment: PlaygroundEnvironment;
  node: PlaygroundNode;
}

function PlaygroundMDLRenderer({
  environment,
  node,
}: PlaygroundMDLRendererProps) {
  const methods = useMDLFormContext<PlaygroundData>();
  const [values, setValues] = useState<Partial<PlaygroundData>>(() =>
    methods.getValues(),
  );

  useEffect(() => {
    const subscription = methods.watch((nextValues) => {
      setValues(nextValues as Partial<PlaygroundData>);
    });

    return () => subscription.unsubscribe();
  }, [methods]);

  return (
    <MDLRenderer
      env={environment}
      node={node}
      onMissing={environment.renderer?.onMissing ?? "null"}
      readOnly={environment.renderer?.readOnly}
      registry={defaultMantineRegistry}
      values={values}
    />
  );
}

function parsePreview(
  documentSource: string,
  environmentSource: string,
): {
  node?: PlaygroundNode;
  environment?: PlaygroundEnvironment;
  error?: string;
} {
  const documentResult = parseJson(documentSource, "tree.mdl.json");
  if (documentResult.error) return { error: documentResult.error };
  if (!isMDLNode(documentResult.value)) {
    return { error: "tree.mdl.json does not contain a valid MDL node." };
  }

  const rulesError = validateRules(documentResult.value);
  if (rulesError) return { error: rulesError };

  const environmentResult = parseJson(environmentSource, "environment.json");
  if (environmentResult.error) return { error: environmentResult.error };
  if (!isRecord(environmentResult.value)) {
    return { error: "environment.json must contain a JSON object." };
  }

  return {
    node: documentResult.value as PlaygroundNode,
    environment: normalizeEnvironment(environmentResult.value),
  };
}

function parseJson(source: string, fileName: string): { value?: unknown; error?: string } {
  try {
    return { value: JSON.parse(source) };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid JSON";
    return { error: `${fileName}: ${message}` };
  }
}

function validateRules(node: unknown): string | undefined {
  if (!isRecord(node)) return undefined;

  if (node.rules !== undefined) {
    if (!Array.isArray(node.rules)) {
      return `tree.mdl.json: rules on node "${formatNodeId(node)}" must be an array.`;
    }

    for (const [index, rule] of node.rules.entries()) {
      if (!isRecord(rule)) {
        return `tree.mdl.json: rule ${index + 1} on node "${formatNodeId(node)}" must be an object.`;
      }

      if (typeof rule.when !== "string") {
        return `tree.mdl.json: rule ${index + 1} on node "${formatNodeId(node)}" must have a string condition.`;
      }

      try {
        parseExpression(rule.when);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Invalid expression";
        return `tree.mdl.json: rule ${index + 1} on node "${formatNodeId(node)}" has an invalid condition: ${message}`;
      }
    }
  }

  if (node.kind === "layout" && Array.isArray(node.children)) {
    for (const child of node.children) {
      const childError = validateRules(child);
      if (childError) return childError;
    }
  }

  return undefined;
}

function formatNodeId(node: Record<string, unknown>): string {
  return typeof node.id === "string" ? node.id : "unknown";
}

function normalizeEnvironment(value: Record<string, unknown>): PlaygroundEnvironment {
  const environment = value as PlaygroundEnvironment;
  const colorScheme = environment.mantineProvider?.defaultColorScheme;
  const onMissing = environment.renderer?.onMissing;

  return {
    ...environment,
    mantineProvider: {
      ...environment.mantineProvider,
      defaultColorScheme:
        colorScheme === "dark" || colorScheme === "auto" ? colorScheme : "light",
    },
    renderer: {
      ...environment.renderer,
      onMissing: onMissing === "throw" ? "throw" : "null",
    },
  };
}

function isMDLNode(value: unknown): boolean {
  if (!isRecord(value) || typeof value.id !== "string") return false;

  if (value.kind === "layout") {
    return (
      typeof value.layout === "string" &&
      Array.isArray(value.children) &&
      value.children.every(isMDLNode)
    );
  }

  if (value.kind === "field") {
    return typeof value.field === "string" && typeof value.type === "string";
  }

  return value.kind === "component" && typeof value.type === "string";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
