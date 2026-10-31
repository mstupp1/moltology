import React, { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowDown, ArrowUpRight, Check, LockKeyhole } from "lucide-react";
import { useHiddenPageAccess } from "@/hooks/useHiddenPageAccess";
import { getAssetUrl } from "@/lib/assets";
import {
  ORACLE_FREE_LIMITS,
  ORACLE_PREMIUM_LIMITS,
} from "@/lib/ai/usage-limits";
import { HudTitlePanel } from "@/components/hud/HudTitlePanel";
import { HudButton } from "@/components/ui/HudButton";
import { HudWorkspaceGhost } from "@/components/hud/HudGhostSkeletons";
import { useOptionalToast } from "@/components/ui/ToastProvider";
import { getAuthJWTToken } from "@/lib/jwt";
import {
  PREMIUM_PAGE_COPY,
  parsePremiumCheckoutSearch,
  premiumStatusMessage,
  type PremiumOffer,
} from "@/lib/premium-membership";
import {
  createPremiumCheckoutFn,
  createPremiumPortalFn,
  getPremiumOfferFn,
  setPremiumAccessFn,
} from "@/lib/server/premium-api";

export function PremiumOfferPanel({
  offer,
  checkout,
  busy,
  onSubscribe,
  onManage,
  onActivate,
  onCancel,
  preview = false,
}: {
  preview?: boolean;
  offer: PremiumOffer;
  checkout?: "success" | "cancel";
  busy: "checkout" | "portal" | "grant" | "cancel" | null;
  onSubscribe: () => void;
  onManage: () => void;
  onActivate: () => void;
  onCancel: () => void;
}) {
  const rows = [
    ["Model", "Oracle Current", "Oracle Abyss + Current"],
    [
      "Messages per 5 hours",
      String(ORACLE_FREE_LIMITS.perFiveHours),
      String(ORACLE_PREMIUM_LIMITS.perFiveHours),
    ],
    [
      "Messages per 7 days",
      String(ORACLE_FREE_LIMITS.perWeek),
      ORACLE_PREMIUM_LIMITS.perWeek.toLocaleString("en-US"),
    ],
  ];
  return (
    <div
      data-testid="premium-page"
      className="oracle-max-page space-y-5 font-sans relative"
    >
      <HudTitlePanel
        title="Oracle MAX"
        eyebrow="Oracle membership"
        description="A deeper conversation. More room to think."
      />
      <section className="oracle-max-hero relative isolate overflow-hidden rounded-panel bg-surface-1 border border-line-subtle">
        <img
          className="oracle-max-art absolute right-0 bottom-0 h-full w-full object-contain object-right opacity-50 sm:w-3/5 sm:opacity-90"
          src={getAssetUrl(
            "images/characters/char_lobster_oracle_attendant_adult_v2.webp",
          )}
          alt="The Oracle attendant holding a glowing sea-glass orb"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-surface-0 via-surface-0/90 to-transparent" />
        <div className="home-hero-rise relative z-10 p-6 sm:p-10 lg:p-14 max-w-xl">
          <p className="text-xs font-mono tracking-widest text-cyan-glow mb-5">
            Meet your deeper-thinking Oracle
          </p>
          <h2 className="font-grotesk text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-ink leading-none">
            Oracle <span className="text-cyan-glow">MAX</span>
          </h2>
          <p className="text-xl sm:text-2xl text-ink mt-6 font-grotesk">
            For the thought that needs another turn.
          </p>
          <p className="text-sm text-ink-body leading-relaxed mt-3 max-w-sm">
            Work through complex questions with Oracle Abyss, our advanced
            model, and 10× the message allowance.
          </p>
          <a
            href="#oracle-max-compare"
            className="inline-flex min-h-11 items-center gap-2 mt-7 text-sm text-cyan-glow hover:text-cyan-bright transition-colors"
          >
            Compare the models{" "}
            <ArrowDown className="w-4 h-4" aria-hidden="true" />
          </a>
        </div>
      </section>

      <section id="oracle-max-compare" className="scroll-mt-6 py-5 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
          <div>
            <p className="text-xs text-cyan-glow mb-2">
              Two models. One Oracle.
            </p>
            <h2 className="text-2xl font-grotesk font-bold text-ink">
              Choose how deep to go.
            </h2>
          </div>
          <p className="text-xs text-ink-muted max-w-xs">
            The free allowance starts when you sign in. Guests can explore a
            demo.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-6 sm:gap-10 mb-8">
          <div className="border-t border-line-subtle pt-5">
            <p className="text-xs text-ink-muted mb-2">
              Included with your free account
            </p>
            <h3 className="text-xl font-grotesk font-bold text-ink">
              Oracle Current
            </h3>
            <p className="mt-2 text-sm text-ink-body">
              Everyday guidance for a routine, a distraction, or your next small
              step.
            </p>
          </div>
          <div className="border-t border-cyan-glow pt-5">
            <p className="text-xs text-cyan-glow mb-2">
              Included with Oracle MAX
            </p>
            <h3 className="text-xl font-grotesk font-bold text-ink">
              Oracle Abyss
            </h3>
            <p className="mt-2 text-sm text-ink-body">
              Our advanced model for complex questions, careful reasoning, and
              plans with more moving parts.
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">
              Free and Oracle MAX model access and rolling message allowances
            </caption>
            <thead>
              <tr className="border-b border-line-subtle">
                <th scope="col" className="py-3 font-medium text-ink-muted">
                  Included
                </th>
                <th scope="col" className="py-3 px-3 font-medium text-ink">
                  Free
                </th>
                <th
                  scope="col"
                  className="py-3 pl-3 font-medium text-cyan-glow"
                >
                  Oracle MAX
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, free, max]) => (
                <tr key={label} className="border-b border-line-subtle">
                  <th scope="row" className="py-4 font-normal text-ink-body">
                    {label}
                  </th>
                  <td className="py-4 px-3 text-ink-muted">{free}</td>
                  <td className="py-4 pl-3 text-ink font-medium">{max}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-ink-muted">
          Both rolling limits apply across all your conversations. Messages
          return as earlier messages age out. Short-term sending limits also
          apply.
        </p>
      </section>

      <section className="rounded-card border border-line-subtle bg-surface-1 p-5 sm:p-7 space-y-4">
        <div className="flex items-start gap-3">
          <span className="text-cyan-glow pt-1">
            {preview ? (
              <LockKeyhole size={20} aria-hidden="true" />
            ) : (
              <Check size={20} aria-hidden="true" />
            )}
          </span>
          <div>
            <h2 className="font-grotesk text-xl font-bold text-ink">
              {preview
                ? "Oracle MAX is in early access."
                : "Your Oracle MAX membership"}
            </h2>
            <p className="text-sm text-ink-muted mt-2">
              {preview
                ? "Explore the models now. Subscriptions are not open to everyone yet."
                : premiumStatusMessage(offer)}
            </p>
          </div>
        </div>
        {preview ? (
          <Link
            to="/oracle"
            className="inline-flex items-center gap-2 min-h-11 text-sm text-cyan-glow hover:text-cyan-bright transition-colors"
          >
            Try Oracle Current{" "}
            <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        ) : (
          <>
            {checkout === "success" && (
              <p
                data-testid="premium-checkout-success"
                className="text-sm text-ink"
              >
                {PREMIUM_PAGE_COPY.checkoutSuccess}
              </p>
            )}
            {checkout === "cancel" && (
              <p
                data-testid="premium-checkout-cancel"
                className="text-sm text-ink"
              >
                {PREMIUM_PAGE_COPY.checkoutCancel}
              </p>
            )}
            <p className="text-sm text-ink">
              {offer.priceLabel ?? PREMIUM_PAGE_COPY.pricePending}
            </p>
            {offer.configMessage && (
              <p
                data-testid="premium-config-message"
                className="text-sm text-crimson-text"
              >
                {offer.configMessage}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {!offer.isPremium && (
                <HudButton
                  type="button"
                  onClick={onSubscribe}
                  disabled={!offer.configured || busy !== null}
                >
                  {busy === "checkout"
                    ? "Starting checkout"
                    : PREMIUM_PAGE_COPY.subscribe}
                </HudButton>
              )}
              {!offer.isPremium ? (
                <HudButton
                  type="button"
                  variant="dark"
                  onClick={onActivate}
                  disabled={busy !== null}
                >
                  {busy === "grant" ? "Activating" : PREMIUM_PAGE_COPY.activate}
                </HudButton>
              ) : (
                <HudButton
                  type="button"
                  variant="danger"
                  onClick={onCancel}
                  disabled={busy !== null}
                >
                  {busy === "cancel" ? "Canceling" : PREMIUM_PAGE_COPY.cancel}
                </HudButton>
              )}
              {offer.canManage && (
                <HudButton
                  type="button"
                  variant="ghost"
                  onClick={onManage}
                  disabled={busy !== null}
                >
                  {busy === "portal"
                    ? "Opening membership"
                    : PREMIUM_PAGE_COPY.manage}
                </HudButton>
              )}
            </div>
            {!offer.isPremium && (
              <p className="text-xs text-ink-muted">
                {PREMIUM_PAGE_COPY.activateHint}
              </p>
            )}
          </>
        )}
        <p className="text-xs text-ink-muted border-t border-line-subtle pt-4">
          Oracle MAX does not change your rank, clearance, stage, or forum
          authority. Signup stays free.
        </p>
      </section>
    </div>
  );
}

const previewOffer: PremiumOffer = {
  hasPurchasedPremium: false,
  isPremium: false,
  priceLabel: null,
  canManage: false,
  configured: false,
  configMessage: null,
};
const noop = () => {};

export default function PremiumView(props: {
  checkout?: "success" | "cancel";
  redirectTo?: (url: string) => void;
}) {
  const access = useHiddenPageAccess("premium");
  if (access.pending) return <HudWorkspaceGhost />;
  if (!access.canView)
    return (
      <PremiumOfferPanel
        offer={previewOffer}
        busy={null}
        preview
        onSubscribe={noop}
        onManage={noop}
        onActivate={noop}
        onCancel={noop}
      />
    );
  return <OperatorPremiumView {...props} />;
}

function OperatorPremiumView({
  checkout: checkoutProp,
  redirectTo = (url: string) => {
    window.location.assign(url);
  },
}: {
  checkout?: "success" | "cancel";
  redirectTo?: (url: string) => void;
}) {
  const [checkout, setCheckout] = useState<"success" | "cancel" | undefined>(
    checkoutProp,
  );
  const toast = useOptionalToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;
  const [offer, setOffer] = useState<PremiumOffer | null>(null);
  const [pending, setPending] = useState(true);
  const [busy, setBusy] = useState<
    "checkout" | "portal" | "grant" | "cancel" | null
  >(null);

  useEffect(() => {
    if (checkoutProp) {
      setCheckout(checkoutProp);
      return;
    }
    const params = new URLSearchParams(window.location.search);
    setCheckout(parsePremiumCheckoutSearch(params.get("checkout")));
  }, [checkoutProp]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const token = await getAuthJWTToken().catch(() => null);
        const next = await getPremiumOfferFn({
          data: { token: token ?? undefined },
        });
        if (!cancelled) setOffer(next);
      } catch (error) {
        if (!cancelled) {
          toastRef.current?.toast.error(
            error instanceof Error
              ? error.message
              : "Could not load Oracle MAX. Try again.",
          );
        }
      } finally {
        if (!cancelled) setPending(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function activate(action: "grant" | "cancel") {
    setBusy(action);
    try {
      const token = await getAuthJWTToken().catch(() => null);
      const next = await setPremiumAccessFn({
        data: { token: token ?? undefined, action },
      });
      setOffer((current) => (current ? { ...current, ...next } : current));
      toast?.toast.success(
        action === "grant"
          ? PREMIUM_PAGE_COPY.activated
          : PREMIUM_PAGE_COPY.canceled,
      );
    } catch (error) {
      toast?.toast.error(
        error instanceof Error
          ? error.message
          : action === "grant"
            ? "Could not activate Oracle MAX. Try again."
            : "Could not cancel Oracle MAX. Try again.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function start(kind: "checkout" | "portal") {
    setBusy(kind);
    try {
      const token = await getAuthJWTToken().catch(() => null);
      const fn =
        kind === "checkout" ? createPremiumCheckoutFn : createPremiumPortalFn;
      const result = await fn({ data: { token: token ?? undefined } });
      redirectTo(result.url);
    } catch (error) {
      toast?.toast.error(
        error instanceof Error
          ? error.message
          : kind === "checkout"
            ? "Could not start checkout. Try again."
            : "Could not open membership management. Try again.",
      );
      setBusy(null);
    }
  }

  if (pending || !offer) return <HudWorkspaceGhost />;

  return (
    <PremiumOfferPanel
      offer={offer}
      checkout={checkout}
      busy={busy}
      onSubscribe={() => void start("checkout")}
      onManage={() => void start("portal")}
      onActivate={() => void activate("grant")}
      onCancel={() => void activate("cancel")}
    />
  );
}
