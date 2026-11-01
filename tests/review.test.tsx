// @vitest-environment jsdom
import { it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
  act,
} from "@testing-library/react";
import { AppProvider } from "../src/state";
import {
  EducatorReview,
  ReviewSync,
  CONTENT_CHANGED,
} from "../src/components/EducatorReview";
import { request } from "../src/api";
vi.mock("../src/api", () => ({ API_ENABLED: true, request: vi.fn() }));
const initial = {
  fields: { title_en: "Velocity", title_ta: "வேகம்" },
  version: "v1",
  history: [],
};
beforeEach(() => {
  localStorage.setItem("iyal-language", '"en"');
  HTMLDialogElement.prototype.showModal = vi.fn(function (
    this: HTMLDialogElement,
  ) {
    this.open = true;
  });
  vi.mocked(request).mockImplementation(async (path) =>
    path.startsWith("review/content")
      ? initial
      : { items: [], pages: 1, total: 0 },
  );
});
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
  vi.useRealTimers();
});
function mount(educator = true) {
  return render(
    <AppProvider account={{ id: 1, username: "teacher", educator }}>
      <EducatorReview target="block:1" />
    </AppProvider>,
  );
}
it("does not expose editing controls to students", () => {
  mount(false);
  expect(screen.queryByRole("button")).toBeNull();
});
it("publishes only changed wording with a conflict token and refresh signal", async () => {
  const changed = vi.fn();
  window.addEventListener(CONTENT_CHANGED, changed);
  mount();
  fireEvent.click(screen.getByRole("button"));
  const field = await screen.findByLabelText("Title / தலைப்பு · English");
  fireEvent.change(field, { target: { value: "Corrected velocity" } });
  fireEvent.change(screen.getByLabelText("Reason for correction"), {
    target: { value: "Terminology" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Publish correction now" }),
  );
  await screen.findByRole("status");
  expect(request).toHaveBeenCalledWith("review/content", "POST", {
    target: "block:1",
    version: "v1",
    fields: { title_en: "Corrected velocity" },
    reason: "Terminology",
  });
  expect(changed).toHaveBeenCalledOnce();
  window.removeEventListener(CONTENT_CHANGED, changed);
});
it("keeps unsaved corrections when the server rejects a stale edit", async () => {
  vi.mocked(request).mockImplementation(async (path, method) => {
    if (method === "POST") throw new Error("Someone changed this content.");
    return path.startsWith("review/content")
      ? initial
      : { items: [], pages: 1, total: 0 };
  });
  mount();
  fireEvent.click(screen.getByRole("button"));
  const field = await screen.findByLabelText("Title / தலைப்பு · English");
  fireEvent.change(field, { target: { value: "My correction" } });
  fireEvent.change(screen.getByLabelText("Reason for correction"), {
    target: { value: "Terminology" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Publish correction now" }),
  );
  await screen.findByRole("alert");
  expect((field as HTMLTextAreaElement).value).toBe("My correction");
});
it("signals new published revisions for student views without a page reload", async () => {
  vi.useFakeTimers();
  let revision = 1;
  vi.mocked(request).mockImplementation(async () => ({ revision }));
  const changed = vi.fn();
  window.addEventListener(CONTENT_CHANGED, changed);
  render(<ReviewSync />);
  await act(async () => {
    await Promise.resolve();
  });
  revision = 2;
  await act(async () => {
    await vi.advanceTimersByTimeAsync(5000);
  });
  expect(changed).toHaveBeenCalledOnce();
  window.removeEventListener(CONTENT_CHANGED, changed);
});
