import React, { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Check } from "lucide-react";
import { useHiddenPageAccess } from "@/hooks/useHiddenPageAccess";
import {
  ORACLE_FREE_LIMITS,
  ORACLE_GUEST_LIMITS,
  ORACLE_PREMIUM_LIMITS,
  PREMIUM_LIMIT_MULTIPLIER,
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

/** Splits "$5.99 per month" into the amount and its billing period. */
export function splitPriceLabel(label: string | null): {
  amount: string;
  period: string | null;
} | null {
  if (!label) return null;
  const at = label.indexOf(" per ");
  if (at < 0) return { amount: label, period: null };
  return { amount: label.slice(0, at), period: label.slice(at + 1) };
}

const linkButtonClass =
  "inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-control border border-line-subtle bg-surface-2/70 px-4 text-ui font-medium text-ink transition-colors hover:border-line hover:bg-surface-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow";

function PlanFeatures({
  lead,
  items,
}: {
  lead?: string;
  items: string[];
}) {
  return (
    <div className="border-t border-line-subtle pt-4">
      {lead ? <p className="mb-3 text-ui font-medium text-ink">{lead}</p> : null}
      <ul className="space-y-2.5">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-sm text-ink-body">
            <Check
              className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted"
              aria-hidden="true"
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CurrentPlanBadge() {
  return (
    <span className="rounded-chip bg-cyan-soft px-1.5 py-0.5 text-2xs font-semibold text-cyan-glow">
      Your plan
    </span>
  );
}

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
  const fmt = (n: number) => n.toLocaleString("en-US");
  const rows: Array<[string, string, string]> = [
    ["Model", "Oracle Lite", "Oracle MAX"],
    [
      "Messages per 5 hours",
      fmt(ORACLE_FREE_LIMITS.perFiveHours),
      fmt(ORACLE_PREMIUM_LIMITS.perFiveHours),
    ],
    [
      "Messages per 7 days",
      fmt(ORACLE_FREE_LIMITS.perWeek),
      fmt(ORACLE_PREMIUM_LIMITS.perWeek),
    ],
    [
      "Messages per minute",
      fmt(ORACLE_FREE_LIMITS.perMinute),
      fmt(ORACLE_PREMIUM_LIMITS.perMinute),
    ],
  ];
  const price = splitPriceLabel(offer.priceLabel);
  const onMax = !preview && offer.isPremium;
  const onLite = !preview && !offer.isPremium;

  return (
    <div
      data-testid="premium-page"
      className="space-y-3 sm:space-y-4 lg:space-y-5 font-sans relative"
    >
      <HudTitlePanel
        treatment="band"
        title="Oracle MAX"
        description={`Our advanced model for complex questions, with ${PREMIUM_LIMIT_MULTIPLIER}× the free message allowance.`}
      />

      {!preview &&
      (checkout ||
        offer.configMessage ||
        (offer.hasPurchasedPremium && !offer.isPremium)) ? (
        <div
          role="status"
          className="space-y-1 rounded-card border border-line-subtle bg-surface-1 p-3 sm:p-4 text-sm"
        >
          {checkout === "success" && (
            <p data-testid="premium-checkout-success" className="text-ink">
              {PREMIUM_PAGE_COPY.checkoutSuccess}
            </p>
          )}
          {checkout === "cancel" && (
            <p data-testid="premium-checkout-cancel" className="text-ink">
              {PREMIUM_PAGE_COPY.checkoutCancel}
            </p>
          )}
          {offer.hasPurchasedPremium && !offer.isPremium && (
            <p className="text-ink-muted">{premiumStatusMessage(offer)}</p>
          )}
          {offer.configMessage && (
            <p
              data-testid="premium-config-message"
              className="text-crimson-text"
            >
              {offer.configMessage}
            </p>
          )}
        </div>
      ) : null}

      <div className="grid items-stretch gap-3 sm:gap-4 lg:gap-5 md:grid-cols-2">
        <section
          aria-labelledby="oracle-plan-lite"
          className="flex flex-col gap-5 rounded-card border border-line-subtle bg-surface-1 p-4 sm:p-5 lg:p-6"
        >
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <h2
                id="oracle-plan-lite"
                className="font-grotesk text-lg font-semibold text-ink"
              >
                Oracle Lite
              </h2>
              {onLite && <CurrentPlanBadge />}
            </div>
            <p className="text-sm text-ink-muted">For everyday guidance</p>
          </div>
          <div className="flex min-h-14 items-baseline gap-2">
            <span className="font-grotesk text-2xl font-semibold tracking-tight text-ink">
              Free
            </span>
            <span className="text-sm text-ink-muted">with an account</span>
          </div>
          <Link to="/oracle" className={linkButtonClass}>
            {preview ? "Try Oracle Lite" : "Open the Oracle"}
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <PlanFeatures
            items={[
              "Help with a routine, a distraction, or your next small step",
              `${fmt(ORACLE_FREE_LIMITS.perFiveHours)} messages every 5 hours`,
              `${fmt(ORACLE_FREE_LIMITS.perWeek)} messages every 7 days`,
            ]}
          />
        </section>

        <section
          aria-labelledby="oracle-plan-max"
          className="flex flex-col gap-5 rounded-card border border-line-strong bg-surface-1 p-4 sm:p-5 lg:p-6"
        >
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <h2
                id="oracle-plan-max"
                className="font-grotesk text-lg font-semibold text-ink"
              >
                Oracle MAX
              </h2>
              {onMax && <CurrentPlanBadge />}
            </div>
            <p className="text-sm text-ink-muted">
              For complex questions and bigger plans
            </p>
          </div>
          <div className="flex min-h-14 flex-col justify-center">
            {preview ? (
              <>
                <span className="font-grotesk text-2xl font-semibold tracking-tight text-ink">
                  Early access
                </span>
                <span className="text-sm text-ink-muted">
                  Subscriptions aren't open to everyone yet.
                </span>
              </>
            ) : price ? (
              <div className="flex items-baseline gap-2">
                <span className="font-grotesk text-2xl font-semibold tracking-tight text-ink">
                  {price.amount}
                </span>
                {price.period && (
                  <span className="text-sm text-ink-muted">{price.period}</span>
                )}
              </div>
            ) : (
              <span className="text-sm text-ink-muted">
                {PREMIUM_PAGE_COPY.pricePending}
              </span>
            )}
          </div>
          {preview ? (
            <HudButton type="button" variant="secondary" fullWidth disabled>
              Opening soon
            </HudButton>
          ) : offer.isPremium ? (
            <HudButton
              type="button"
              variant="secondary"
              fullWidth
              onClick={onManage}
              disabled={!offer.canManage || busy !== null}
            >
              {busy === "portal"
                ? "Opening membership"
                : PREMIUM_PAGE_COPY.manage}
            </HudButton>
          ) : (
            <HudButton
              type="button"
              fullWidth
              onClick={onSubscribe}
              disabled={!offer.configured || busy !== null}
            >
              {busy === "checkout"
                ? "Starting checkout"
                : PREMIUM_PAGE_COPY.subscribe}
            </HudButton>
          )}
          <PlanFeatures
            lead="Everything in Lite, plus:"
            items={[
              "Our advanced model for careful reasoning and plans with more moving parts",
              `${fmt(ORACLE_PREMIUM_LIMITS.perFiveHours)} messages every 5 hours`,
              `${fmt(ORACLE_PREMIUM_LIMITS.perWeek)} messages every 7 days`,
            ]}
          />
        </section>
      </div>

      <section
        id="oracle-max-compare"
        aria-labelledby="oracle-max-compare-title"
        className="rounded-card border border-line-subtle bg-surface-1 p-4 sm:p-5 lg:p-6"
      >
        <h2
          id="oracle-max-compare-title"
          className="font-grotesk text-lg font-semibold text-ink"
        >
          Compare plans
        </h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">
              Oracle Lite and Oracle MAX model access and message allowances
            </caption>
            <thead>
              <tr className="border-b border-line-subtle">
                <th scope="col" className="w-2/5 py-3 font-medium text-ink-muted">
                  Models and usage
                </th>
                <th scope="col" className="w-[30%] px-3 py-3 text-right font-medium text-ink">
                  Lite
                </th>
                <th scope="col" className="w-[30%] py-3 pl-3 text-right font-medium text-ink">
                  MAX
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, lite, max]) => (
                <tr key={label} className="border-b border-line-subtle last:border-b-0">
                  <th scope="row" className="py-3 font-normal text-ink-body">
                    {label}
                  </th>
                  <td className="px-3 py-3 text-right tabular-nums text-ink-body">
                    {lite}
                  </td>
                  <td className="py-3 pl-3 text-right font-medium tabular-nums text-ink">
                    {max}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="mt-4 space-y-1.5 border-t border-line-subtle pt-4 text-xs text-ink-muted">
          <li>
            Limits roll across all your conversations. Messages come back as
            earlier ones age out.
          </li>
          <li>
            Guests can try {ORACLE_GUEST_LIMITS.perDay} messages a day before
            signing in.
          </li>
          <li>
            Oracle MAX does not change your rank, clearance, stage, or forum
            authority. Signup stays free.
          </li>
        </ul>
      </section>

      {!preview && (
        <section
          aria-label="Membership tools"
          className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-card border border-line-subtle bg-surface-1 p-3 sm:p-4"
        >
          <p className="mr-auto text-xs text-ink-muted">
            {offer.isPremium
              ? PREMIUM_PAGE_COPY.active
              : `Admin testing. ${PREMIUM_PAGE_COPY.activateHint}`}
          </p>
          {!offer.isPremium && offer.canManage && (
            <HudButton
              type="button"
              variant="ghost"
              size="sm"
              onClick={onManage}
              disabled={busy !== null}
            >
              {busy === "portal" ? "Opening membership" : PREMIUM_PAGE_COPY.manage}
            </HudButton>
          )}
          {offer.isPremium ? (
            <HudButton
              type="button"
              variant="danger"
              size="sm"
              onClick={onCancel}
              disabled={busy !== null}
            >
              {busy === "cancel" ? "Canceling" : PREMIUM_PAGE_COPY.cancel}
            </HudButton>
          ) : (
            <HudButton
              type="button"
              variant="secondary"
              size="sm"
              onClick={onActivate}
              disabled={busy !== null}
            >
              {busy === "grant" ? "Activating" : PREMIUM_PAGE_COPY.activate}
            </HudButton>
          )}
        </section>
      )}
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
