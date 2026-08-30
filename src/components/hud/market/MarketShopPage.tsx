import React, { useCallback, useState } from 'react'
import { ShoppingBag } from 'lucide-react'
import { AssetTransmutationModal } from '@/components/hud/AssetTransmutationModal'
import { HudTitlePanel } from '@/components/hud/HudTitlePanel'
import { useToast } from '@/components/ui/ToastProvider'
import { GemVaultPanel } from './GemVaultPanel'
import { MarketCurrencyBar } from './MarketCurrencyBar'
import { MarketShopTabs } from './MarketShopTabs'
import { MaterialExchangePanel } from './MaterialExchangePanel'
import { MoltCreditStorePanel } from './MoltCreditStorePanel'
import type {
  ExchangeListing,
  GemVaultItem,
  MaterialQuickShed,
  MarketTab,
  MoltCreditPack,
} from './market-data'

const INITIAL_MOLT_CREDITS = 1450
const INITIAL_CHITIN_GEMS = 250

export function MarketShopPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<MarketTab>('credits')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [moltCredits, setMoltCredits] = useState(INITIAL_MOLT_CREDITS)
  const [chitinGems, setChitinGems] = useState(INITIAL_CHITIN_GEMS)
  const [ownedVaultIds, setOwnedVaultIds] = useState<Set<string>>(() => new Set())

  const handleBuyPack = useCallback(
    (pack: MoltCreditPack) => {
      const total = pack.credits + (pack.bonusCredits ?? 0)
      setMoltCredits((prev) => prev + total)
      toast.success(`+${total.toLocaleString()} Molt Credits added to your vault.`, {
        title: `${pack.name} acquired`,
      })
    },
    [toast]
  )

  const handleTransmute = useCallback(
    (assetType: string, value: number, credits: number) => {
      setMoltCredits((prev) => prev + credits)
      toast.success(
        `${assetType} liquidated into +${credits.toLocaleString()} Molt Credits.`,
        { title: 'Transmutation complete' }
      )
    },
    [toast]
  )

  const handleQuickShed = useCallback(
    (material: MaterialQuickShed) => {
      setMoltCredits((prev) => prev + material.yieldCredits)
      toast.success(`+${material.yieldCredits.toLocaleString()} Molt Credits from ${material.name}.`, {
        title: 'Material shed',
      })
    },
    [toast]
  )

  const handleExchange = useCallback(
    (listing: ExchangeListing) => {
      if (moltCredits < listing.creditCost) {
        toast.warning('Not enough Molt Credits for this exchange.', { title: 'Insufficient balance' })
        return
      }
      setMoltCredits((prev) => prev - listing.creditCost)
      toast.success(`${listing.name} added to your catalog.`, { title: 'Exchange complete' })
    },
    [moltCredits, toast]
  )

  const handleUnlock = useCallback(
    (item: GemVaultItem) => {
      if (ownedVaultIds.has(item.id)) return
      if (chitinGems < item.gemCost) {
        toast.warning('Earn more Chitin Gems through shedding and community work.', {
          title: 'Insufficient gems',
        })
        return
      }
      setChitinGems((prev) => prev - item.gemCost)
      setOwnedVaultIds((prev) => new Set(prev).add(item.id))
      toast.hud(`${item.name} unlocked. Prestige cosmetics stay earned — never bought with credits.`, {
        title: 'Gem Vault unlock',
      })
    },
    [chitinGems, ownedVaultIds, toast]
  )

  return (
    <div className="space-y-3 sm:space-y-4 font-sans pb-2">
      <AssetTransmutationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTransmute={handleTransmute}
      />

      <HudTitlePanel
        accent="cyan"
        eyebrow={
          <>
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Benthic Market · Mockup</span>
          </>
        }
        title="Ascension Market"
        description="Buy Molt Credits, shed material into the vault, and spend earned Chitin Gems on the apex cosmetic catalog."
        actions={
          <MarketCurrencyBar
            moltCredits={moltCredits}
            chitinGems={chitinGems}
            onAddCredits={() => setActiveTab('credits')}
          />
        }
      />

      <div className="sticky top-0 z-20 -mx-0.5 px-0.5 pt-0.5 pb-1 bg-[#070b0b]">
        <MarketShopTabs activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {activeTab === 'credits' ? <MoltCreditStorePanel onPurchase={handleBuyPack} /> : null}
      {activeTab === 'exchange' ? (
        <MaterialExchangePanel
          moltCredits={moltCredits}
          onOpenTransmute={() => setIsModalOpen(true)}
          onQuickShed={handleQuickShed}
          onExchange={handleExchange}
        />
      ) : null}
      {activeTab === 'vault' ? (
        <GemVaultPanel
          chitinGems={chitinGems}
          ownedIds={ownedVaultIds}
          onUnlock={handleUnlock}
        />
      ) : null}

      <p className="text-center text-[9px] text-[#839493] uppercase tracking-widest pt-1">
        Chitin Gems are earned · Molt Credits are bought · Rank is never for sale
      </p>
    </div>
  )
}
