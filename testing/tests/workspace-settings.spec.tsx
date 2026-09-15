import { FormHarness } from "../src/harness";
import {
  workspaceSettingsDefaults,
  workspaceSettingsLayout,
} from "../src/layouts/workspace-settings";
import { expect, test } from "./fixtures";

test("renders components, fields, and layouts from one tree", async ({ mount, registry }) => {
  const component = await mount(
    <FormHarness
      defaultValues={workspaceSettingsDefaults}
      node={workspaceSettingsLayout}
      onMissing="null"
      registry={registry}
    />,
  );

  await expect(component.getByRole("heading", { name: "Workspace settings" })).toBeVisible();
  await expect(component.locator("#plan-notice")).toHaveText("You are on a paid plan.");
  await expect(component.locator("#general").getByLabel("Plan")).toHaveText("Team");
  await expect(component.locator("#security").getByLabel("Require SSO")).not.toBeChecked();
  await expect(component.locator("#billing").getByLabel("Seats")).toHaveValue("5");
  await expect(component.locator("#billing").getByLabel("Billing email")).toHaveValue(
    "billing@example.com",
  );
});

test("skips nodes without a registered implementation", async ({ mount, registry }) => {
  const component = await mount(
    <FormHarness
      defaultValues={workspaceSettingsDefaults}
      node={workspaceSettingsLayout}
      onMissing="null"
      registry={registry}
    />,
  );

  await expect(component.locator("#usage-chart")).toHaveCount(0);
  await expect(component.locator("#access").getByLabel("Billing email")).toBeVisible();
});

test("resolves tagged fields to their tagged implementation", async ({ mount, registry }) => {
  const component = await mount(
    <FormHarness
      defaultValues={workspaceSettingsDefaults}
      node={workspaceSettingsLayout}
      onMissing="null"
      registry={registry}
    />,
  );

  await expect(component.getByLabel("API key")).toHaveAttribute("data-mdl-field", "secret");
  await expect(component.getByLabel("API key")).toHaveAttribute("type", "password");
  await expect(component.getByLabel("Workspace name")).toHaveAttribute("data-mdl-field", "string");
});

for (const { env, message } of [
  { env: { plan: "trial", trialDaysLeft: 10 }, message: "You are on a trial." },
  { env: { plan: "trial", trialDaysLeft: 2 }, message: "Your trial ends soon." },
]) {
  test(`shows "${message}" when env is ${JSON.stringify(env)}`, async ({ mount, registry }) => {
    const component = await mount(
      <FormHarness
        defaultValues={workspaceSettingsDefaults}
        env={env}
        node={workspaceSettingsLayout}
        onMissing="null"
        registry={registry}
      />,
    );

    await expect(component.locator("#plan-notice")).toHaveText(message);
  });
}

test("locks fields through env-driven rules", async ({ mount, registry }) => {
  const component = await mount(
    <FormHarness
      defaultValues={workspaceSettingsDefaults}
      env={{ permissions: { canRename: false } }}
      node={workspaceSettingsLayout}
      onMissing="null"
      registry={registry}
    />,
  );

  await expect(component.getByLabel("Slug")).not.toBeEditable();
  await expect(component.getByLabel("Workspace name")).toBeEditable();
});

test("locks every nested field when rendered read-only", async ({ mount, registry }) => {
  const component = await mount(
    <FormHarness
      defaultValues={workspaceSettingsDefaults}
      node={workspaceSettingsLayout}
      onMissing="null"
      readOnly
      registry={registry}
    />,
  );

  for (const label of ["Workspace name", "Slug", "API key", "Seats", "Billing email"]) {
    await expect(component.getByLabel(label)).not.toBeEditable();
  }
  await expect(component.getByLabel("Require SSO")).toBeDisabled();
  await expect(component.getByLabel("Default roles")).toBeDisabled();
});

test("submits values from every level of the tree", async ({ mount, page, registry }) => {
  const submissions: unknown[] = [];
  const component = await mount(
    <FormHarness
      defaultValues={workspaceSettingsDefaults}
      node={workspaceSettingsLayout}
      onMissing="null"
      onSubmit={(values) => submissions.push(values)}
      registry={registry}
    />,
  );

  await component.getByLabel("Workspace name").fill("Difference Engines");
  await component.getByLabel("Slug").fill("difference-engines");
  await component.getByLabel("Require SSO").check();
  await component.getByLabel("API key").fill("sk-test-123");
  await component.getByLabel("Seats").fill("12");
  await component.getByLabel("Billing email").fill("accounts@example.com");

  if (registry === "mantine") {
    await component.getByLabel("Default roles").press("ArrowDown");
    await page.getByRole("option", { name: "Administrator" }).click();
    await page.keyboard.press("Escape");
  } else {
    await component.getByLabel("Default roles").selectOption(["editor", "admin"]);
  }

  await component.getByRole("button", { name: "Submit" }).click();

  await expect.poll(() => submissions).toEqual([
    {
      workspaceName: "Difference Engines",
      slug: "difference-engines",
      sso: true,
      apiKey: "sk-test-123",
      roles: ["editor", "admin"],
      seats: 12,
      billingEmail: "accounts@example.com",
    },
  ]);
});
