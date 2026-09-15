import { LayoutHarness } from "../src/harness";
import { dashboardLayout } from "../src/layouts/dashboard";
import { expect, test } from "./fixtures";

const oneColumn = /^\S+$/;
const threeColumns = /^\S+ \S+ \S+$/;

test("renders components inside layouts without a form", async ({ mount, page, registry }) => {
  const component = await mount(<LayoutHarness node={dashboardLayout} registry={registry} />);

  await expect(component.getByRole("heading", { name: "Usage" })).toBeVisible();

  const stats = component.locator("#stats");
  await expect(stats.getByRole("figure", { name: "Active users" })).toContainText("1,204");
  await expect(stats.getByRole("figure", { name: "Requests" })).toContainText("98,310");
  await expect(stats.getByRole("figure", { name: "Error rate" })).toContainText("2.4%");

  await expect(page.locator("form")).toHaveCount(0);
});

test("resolves tagged components to their tagged implementation", async ({ mount, registry }) => {
  const component = await mount(<LayoutHarness node={dashboardLayout} registry={registry} />);

  await expect(component.getByRole("status")).toHaveText("All systems operational.");
  await expect(component.getByRole("alert")).toHaveText("Requests are failing in us-east-1.");
});

test("re-evaluates component rules when env changes", async ({ mount, registry }) => {
  const component = await mount(
    <LayoutHarness env={{ incident: false }} node={dashboardLayout} registry={registry} />,
  );
  await expect(component.getByRole("status")).toHaveText("All systems operational.");

  await component.update(
    <LayoutHarness env={{ incident: true }} node={dashboardLayout} registry={registry} />,
  );
  await expect(component.getByRole("status")).toHaveText("Investigating elevated error rates.");
});

test("re-evaluates layout rules when env changes", async ({ mount, registry }) => {
  const component = await mount(<LayoutHarness node={dashboardLayout} registry={registry} />);
  await expect(component.locator("#stats")).toHaveCSS("grid-template-columns", threeColumns);

  await component.update(
    <LayoutHarness env={{ viewport: "narrow" }} node={dashboardLayout} registry={registry} />,
  );
  await expect(component.locator("#stats")).toHaveCSS("grid-template-columns", oneColumn);
});

test("applies layout rules to values passed straight to the renderer", async ({ mount, page, registry }) => {
  const component = await mount(
    <LayoutHarness node={dashboardLayout} registry={registry} values={{ errorRate: 2.4 }} />,
  );
  await expect(page.locator("#dashboard")).toHaveCSS("row-gap", "32px");

  await component.update(
    <LayoutHarness node={dashboardLayout} registry={registry} values={{ errorRate: 0.3 }} />,
  );
  await expect(page.locator("#dashboard")).toHaveCSS("row-gap", "16px");
});
