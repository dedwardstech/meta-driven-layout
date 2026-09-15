import type { MDLLayout } from "@mdl/react";

export interface Profile {
  firstName: string;
  lastName: string;
  age: number;
  newsletter: boolean;
  inviteCode: string;
}

export const profileDefaults: Profile = {
  firstName: "Ada",
  lastName: "Lovelace",
  age: 36,
  newsletter: false,
  inviteCode: "",
};

export const profileLayout: MDLLayout<Profile> = {
  kind: "layout",
  id: "profile",
  layout: "vertical",
  props: { gap: 16 },
  rules: [
    { when: "env.featureFlags.spacious is true", then: { props: { gap: 32 } } },
  ],
  children: [
    {
      kind: "layout",
      id: "identity",
      layout: "grid",
      props: { columns: 2, gap: 16 },
      rules: [
        { when: "env.featureFlags.compact is true", then: { props: { columns: 1 } } },
      ],
      children: [
        {
          kind: "field",
          id: "first-name",
          field: "firstName",
          type: "string",
          props: { "aria-label": "First name" },
        },
        {
          kind: "field",
          id: "last-name",
          field: "lastName",
          type: "string",
          props: { "aria-label": "Last name" },
        },
      ],
    },
    {
      kind: "layout",
      id: "details",
      layout: "grid",
      props: { columns: 2, gap: 16 },
      rules: [{ when: "age < 18", then: { props: { columns: 1 } } }],
      children: [
        {
          kind: "field",
          id: "age",
          field: "age",
          type: "number",
          props: { "aria-label": "Age" },
        },
        {
          kind: "field",
          id: "newsletter",
          field: "newsletter",
          type: "boolean",
          props: { "aria-label": "Newsletter" },
        },
      ],
    },
    {
      kind: "field",
      id: "invite-code",
      field: "inviteCode",
      type: "string",
      props: { "aria-label": "Invite code" },
      rules: [{ when: "value is 'MDL-2026'", then: { props: { readOnly: true } } }],
    },
    {
      kind: "field",
      id: "greeting",
      field: "firstName",
      type: "readonly",
      props: { "aria-label": "Greeting" },
    },
  ],
};
