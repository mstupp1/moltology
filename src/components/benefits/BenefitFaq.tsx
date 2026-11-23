import React from 'react'
import type { FaqItem } from '@/lib/seo'

/**
 * The page's questions, as plain question and answer pairs (the same text as the FAQPage
 * JSON-LD). Kits style `.bf-*`; the markup stays semantic for search and answer engines.
 */
export function BenefitFaq({ faqs, title, id = 'faq' }: { faqs: FaqItem[]; title: string; id?: string }) {
  return (
    <section className="bf" id={id} aria-labelledby={`${id}-title`}>
      <div className="bf-inner">
        <h2 id={`${id}-title`} className="bf-title">
          {title}
        </h2>
        <div className="bf-list">
          {faqs.map((faq, index) => (
            <details key={faq.question} className="bf-item" open={index === 0}>
              <summary className="bf-q">
                <span>{faq.question}</span>
                <span className="bf-icon" aria-hidden="true" />
              </summary>
              <p className="bf-a">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
