import type { MDLLayout } from "@mdl/react";

export interface Contact {
  name: string;
  email: string;
  subscribed: boolean;
}

export const contactDefaults: Contact = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  subscribed: false,
};

export const contactLayout: MDLLayout<Contact> = {
  kind: "layout",
  id: "contact",
  layout: "vertical",
  props: { gap: 12 },
  children: [
    {
      kind: "field",
      id: "name",
      field: "name",
      type: "string",
      props: { "aria-label": "Name" },
    },
    {
      kind: "field",
      id: "email",
      field: "email",
      type: "string",
      props: { "aria-label": "Email" },
    },
    {
      kind: "field",
      id: "subscribed",
      field: "subscribed",
      type: "boolean",
      props: { "aria-label": "Subscribe" },
    },
  ],
};
