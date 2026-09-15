import type { MDLLayout } from "@mdl/react";

export interface WorkspaceSettings {
  workspaceName: string;
  slug: string;
  plan: string;
  sso: boolean;
  apiKey: string;
  roles: string[];
  seats: number;
  billingEmail: string;
}

export const workspaceSettingsDefaults: WorkspaceSettings = {
  workspaceName: "Analytical Engines",
  slug: "analytical-engines",
  plan: "Team",
  sso: false,
  apiKey: "",
  roles: ["editor"],
  seats: 5,
  billingEmail: "billing@example.com",
};

export const workspaceSettingsLayout: MDLLayout<WorkspaceSettings> = {
  kind: "layout",
  id: "workspace-settings",
  layout: "vertical",
  props: { gap: 24 },
  children: [
    {
      kind: "component",
      id: "title",
      type: "heading",
      props: { text: "Workspace settings" },
    },
    {
      kind: "component",
      id: "plan-notice",
      type: "notice",
      props: { message: "You are on a paid plan." },
      rules: [
        {
          when: "env.plan is 'trial'",
          then: { props: { message: "You are on a trial." } },
        },
        {
          when: "env.plan is 'trial' and env.trialDaysLeft < 3",
          then: { props: { message: "Your trial ends soon." } },
        },
      ],
    },
    {
      kind: "layout",
      id: "general",
      layout: "grid",
      props: { columns: 3, gap: 16 },
      children: [
        {
          kind: "field",
          id: "workspace-name",
          field: "workspaceName",
          type: "string",
          props: { "aria-label": "Workspace name" },
        },
        {
          kind: "field",
          id: "slug",
          field: "slug",
          type: "string",
          props: { "aria-label": "Slug" },
          rules: [
            {
              when: "env.permissions.canRename is false",
              then: { props: { readOnly: true } },
            },
          ],
        },
        {
          kind: "field",
          id: "plan",
          field: "plan",
          type: "readonly",
          props: { "aria-label": "Plan" },
        },
      ],
    },
    {
      kind: "layout",
      id: "access",
      layout: "vertical",
      props: { gap: 16 },
      children: [
        {
          kind: "layout",
          id: "security",
          layout: "horizontal",
          props: { gap: 16 },
          children: [
            {
              kind: "field",
              id: "sso",
              field: "sso",
              type: "boolean",
              props: { "aria-label": "Require SSO" },
            },
            {
              kind: "field",
              id: "api-key",
              field: "apiKey",
              type: "string",
              tags: ["secret"],
              props: { "aria-label": "API key" },
            },
          ],
        },
        {
          kind: "field",
          id: "roles",
          field: "roles",
          type: "one-to-many",
          props: {
            "aria-label": "Default roles",
            options: [
              { label: "Editor", value: "editor" },
              { label: "Reviewer", value: "reviewer" },
              { label: "Administrator", value: "admin" },
            ],
          },
        },
        {
          kind: "layout",
          id: "billing",
          layout: "grid",
          props: { columns: 2, gap: 16 },
          children: [
            {
              kind: "field",
              id: "seats",
              field: "seats",
              type: "number",
              props: { "aria-label": "Seats" },
            },
            {
              kind: "field",
              id: "billing-email",
              field: "billingEmail",
              type: "string",
              props: { "aria-label": "Billing email" },
            },
          ],
        },
        {
          kind: "component",
          id: "usage-chart",
          type: "chart",
        },
      ],
    },
  ],
};
