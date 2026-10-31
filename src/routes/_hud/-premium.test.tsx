import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Route } from "./premium";
import { authClient } from "@/lib/auth-client";
import { clearCachedUser } from "@/lib/auth-session";
import { getUserProfileFn } from "@/lib/server/api";
import { getPremiumOfferFn } from "@/lib/server/premium-api";

vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-router")>()),
  Link: ({
    to,
    children,
    ...props
  }: React.PropsWithChildren<{ to: string }>) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: vi.fn(),
  },
}));

vi.mock("@/lib/jwt", () => ({
  getAuthJWTToken: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/server/api", () => ({
  getUserProfileFn: vi.fn().mockResolvedValue({ role: "user" }),
}));

vi.mock("@/lib/server/premium-api", () => ({
  getPremiumOfferFn: vi.fn(),
  createPremiumCheckoutFn: vi.fn(),
  createPremiumPortalFn: vi.fn(),
  setPremiumAccessFn: vi.fn(),
}));

const LAZY_TIMEOUT = 5000;

const freeOffer = {
  hasPurchasedPremium: false,
  isPremium: false,
  priceLabel: "$5.99 per month",
  canManage: false,
  configured: true,
  configMessage: null,
};

describe("Premium HUD route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearCachedUser();
    vi.mocked(getUserProfileFn).mockResolvedValue({ role: "user" } as never);
    vi.mocked(getPremiumOfferFn).mockResolvedValue(freeOffer);
  });

  it("shows a marketing preview to guests", async () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: null,
      isPending: false,
    } as never);
    const Component = Route.options.component!;
    render(<Component />);

    expect(
      await screen.findByText(
        "Oracle MAX is in early access.",
        {},
        { timeout: LAZY_TIMEOUT },
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Subscribe|Activate/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("premium-page")).toBeInTheDocument();
    expect(getPremiumOfferFn).not.toHaveBeenCalled();
  });

  it("shows a marketing preview to signed-in members", async () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: {
        user: {
          id: "user-1",
          name: "Member",
          email: "member@example.com",
          role: "user",
        },
      },
      isPending: false,
    } as never);
    const Component = Route.options.component!;
    render(<Component />);

    expect(
      await screen.findByText(
        "Oracle MAX is in early access.",
        {},
        { timeout: LAZY_TIMEOUT },
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Subscribe|Activate/ }),
    ).not.toBeInTheDocument();
    expect(getPremiumOfferFn).not.toHaveBeenCalled();
  });

  it("shows a marketing preview to admins with the experiment off", async () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: "admin-1", role: "admin" } },
      isPending: false,
    } as never);
    vi.mocked(getUserProfileFn).mockResolvedValue({
      role: "admin",
      experiments: [],
    } as never);
    const Component = Route.options.component!;
    render(<Component />);
    expect(
      await screen.findByText(
        "Oracle MAX is in early access.",
        {},
        { timeout: LAZY_TIMEOUT },
      ),
    ).toBeInTheDocument();
    expect(getPremiumOfferFn).not.toHaveBeenCalled();
  });

  it("renders the membership page for opted-in admins", async () => {
    vi.mocked(getUserProfileFn).mockResolvedValue({
      role: "admin",
      experiments: ["premium"],
    } as never);
    vi.mocked(authClient.useSession).mockReturnValue({
      data: {
        user: {
          id: "admin-1",
          name: "Admin",
          email: "ops@example.com",
          role: "admin",
        },
      },
      isPending: false,
    } as never);
    const Component = Route.options.component!;
    render(<Component />);

    expect(
      await screen.findByRole(
        "heading",
        { name: /Oracle MAX/i, level: 1 },
        { timeout: LAZY_TIMEOUT },
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Oracle Abyss" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Subscribe to Oracle MAX/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Activate Oracle MAX/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("hidden-page-unavailable"),
    ).not.toBeInTheDocument();
  });
});
