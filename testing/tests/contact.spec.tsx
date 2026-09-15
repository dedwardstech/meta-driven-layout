import { FormHarness } from "../src/harness";
import { contactDefaults, contactLayout } from "../src/layouts/contact";
import { expect, test } from "./fixtures";

test("fills every field from the form defaults", async ({ mount, registry }) => {
  const component = await mount(
    <FormHarness defaultValues={contactDefaults} node={contactLayout} registry={registry} />,
  );

  await expect(component.getByLabel("Name")).toHaveValue("Ada Lovelace");
  await expect(component.getByLabel("Email")).toHaveValue("ada@example.com");
  await expect(component.getByLabel("Subscribe")).not.toBeChecked();
});

test("submits the values entered by the user", async ({ mount, registry }) => {
  const submissions: unknown[] = [];
  const component = await mount(
    <FormHarness
      defaultValues={contactDefaults}
      node={contactLayout}
      onSubmit={(values) => submissions.push(values)}
      registry={registry}
    />,
  );

  await component.getByLabel("Name").fill("Grace Hopper");
  await component.getByLabel("Email").fill("grace@example.com");
  await component.getByLabel("Subscribe").check();
  await component.getByRole("button", { name: "Submit" }).click();

  await expect
    .poll(() => submissions)
    .toEqual([{ name: "Grace Hopper", email: "grace@example.com", subscribed: true }]);
});

test("locks every field when rendered read-only", async ({ mount, registry }) => {
  const component = await mount(
    <FormHarness
      defaultValues={contactDefaults}
      node={contactLayout}
      readOnly
      registry={registry}
    />,
  );

  await expect(component.getByLabel("Name")).not.toBeEditable();
  await expect(component.getByLabel("Email")).not.toBeEditable();
  await expect(component.getByLabel("Subscribe")).toBeDisabled();
});
