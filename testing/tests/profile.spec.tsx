import { FormHarness } from "../src/harness";
import { profileDefaults, profileLayout } from "../src/layouts/profile";
import { expect, test } from "./fixtures";

const oneColumn = /^\S+$/;
const twoColumns = /^\S+ \S+$/;

test("renders fields inside their nested layouts", async ({ mount, registry }) => {
  const component = await mount(
    <FormHarness defaultValues={profileDefaults} node={profileLayout} registry={registry} />,
  );

  const identity = component.locator("#identity");
  await expect(identity.getByLabel("First name")).toHaveValue("Ada");
  await expect(identity.getByLabel("Last name")).toHaveValue("Lovelace");

  const details = component.locator("#details");
  await expect(details.getByLabel("Age")).toHaveValue("36");
  await expect(details.getByLabel("Newsletter")).not.toBeChecked();
});

test("applies layout rules that read env", async ({ mount, registry }) => {
  const component = await mount(
    <FormHarness
      defaultValues={profileDefaults}
      env={{ featureFlags: { compact: true, spacious: true } }}
      node={profileLayout}
      registry={registry}
    />,
  );

  await expect(component.locator("#profile")).toHaveCSS("row-gap", "32px");
  await expect(component.locator("#identity")).toHaveCSS("grid-template-columns", oneColumn);
});

test("keeps layout defaults when env rules do not match", async ({ mount, registry }) => {
  const component = await mount(
    <FormHarness
      defaultValues={profileDefaults}
      env={{ featureFlags: { compact: false } }}
      node={profileLayout}
      registry={registry}
    />,
  );

  await expect(component.locator("#profile")).toHaveCSS("row-gap", "16px");
  await expect(component.locator("#identity")).toHaveCSS("grid-template-columns", twoColumns);
});

test("re-evaluates layout rules as form values change", async ({ mount, registry }) => {
  const component = await mount(
    <FormHarness defaultValues={profileDefaults} node={profileLayout} registry={registry} />,
  );
  const details = component.locator("#details");

  await expect(details).toHaveCSS("grid-template-columns", twoColumns);

  await component.getByLabel("Age").fill("16");
  await expect(details).toHaveCSS("grid-template-columns", oneColumn);

  await component.getByLabel("Age").fill("30");
  await expect(details).toHaveCSS("grid-template-columns", twoColumns);
});

test("re-evaluates field rules against the field's own value", async ({ mount, registry }) => {
  const component = await mount(
    <FormHarness defaultValues={profileDefaults} node={profileLayout} registry={registry} />,
  );
  const inviteCode = component.getByLabel("Invite code");

  await inviteCode.fill("MDL-2025");
  await expect(inviteCode).toBeEditable();

  await inviteCode.fill("MDL-2026");
  await expect(inviteCode).not.toBeEditable();
});

test("mirrors a value into every node bound to the same field", async ({ mount, registry }) => {
  const component = await mount(
    <FormHarness defaultValues={profileDefaults} node={profileLayout} registry={registry} />,
  );

  await expect(component.getByLabel("Greeting")).toHaveText("Ada");

  await component.getByLabel("First name").fill("Grace");
  await expect(component.getByLabel("Greeting")).toHaveText("Grace");
});

test("submits values from every nested layout", async ({ mount, registry }) => {
  const submissions: unknown[] = [];
  const component = await mount(
    <FormHarness
      defaultValues={profileDefaults}
      node={profileLayout}
      onSubmit={(values) => submissions.push(values)}
      registry={registry}
    />,
  );

  await component.getByLabel("First name").fill("Grace");
  await component.getByLabel("Last name").fill("Hopper");
  await component.getByLabel("Age").fill("85");
  await component.getByLabel("Newsletter").check();
  await component.getByLabel("Invite code").fill("MDL-2026");
  await component.getByRole("button", { name: "Submit" }).click();

  await expect.poll(() => submissions).toEqual([
    {
      firstName: "Grace",
      lastName: "Hopper",
      age: 85,
      newsletter: true,
      inviteCode: "MDL-2026",
    },
  ]);
});
