import type { MDLLayout } from "@mdl/react";

export const dashboardLayout: MDLLayout = {
  kind: "layout",
  id: "dashboard",
  layout: "vertical",
  props: { gap: 16 },
  rules: [{ when: "errorRate > 2", then: { props: { gap: 32 } } }],
  children: [
    {
      kind: "component",
      id: "title",
      type: "heading",
      props: { text: "Usage" },
    },
    {
      kind: "component",
      id: "system-status",
      type: "notice",
      props: { message: "All systems operational." },
      rules: [
        {
          when: "env.incident is true",
          then: { props: { message: "Investigating elevated error rates." } },
        },
      ],
    },
    {
      kind: "component",
      id: "outage",
      type: "notice",
      tags: ["urgent"],
      props: { message: "Requests are failing in us-east-1." },
    },
    {
      kind: "layout",
      id: "stats",
      layout: "grid",
      props: { columns: 3, gap: 16 },
      rules: [
        { when: "env.viewport is 'narrow'", then: { props: { columns: 1 } } },
      ],
      children: [
        {
          kind: "component",
          id: "active-users",
          type: "stat",
          props: { label: "Active users", value: "1,204" },
        },
        {
          kind: "component",
          id: "requests",
          type: "stat",
          props: { label: "Requests", value: "98,310" },
        },
        {
          kind: "component",
          id: "error-rate",
          type: "stat",
          props: { label: "Error rate", value: "2.4%" },
        },
      ],
    },
  ],
};
